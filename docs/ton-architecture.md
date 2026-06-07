# TON Architecture for 3REAL

**Phase 4.5 — Architecture Research**  
**Date:** 2026-06-07  
**Scope:** TON Connect wallet linking, REAL Jetton integration, deposit/withdrawal flows, custody models, security risks, and MVP recommendation  
**Status:** Design document — no TON code implemented yet

---

## Overview

TON (The Open Network) is a Layer-1 blockchain with sharding, asynchronous message passing, and a unique account/contract model. Several properties distinguish it from Ethereum/Solana and require 3REAL-specific design decisions:

| Property | Implication for 3REAL |
|---|---|
| Asynchronous messages | Transactions are not instant; "transfer_notification" arrives as a separate message after the transfer |
| Per-user Jetton wallets | REAL tokens don't live at the Jetton master — each owner has a derived contract address |
| Address encoding | Same address can be encoded as bounceable (for contracts) or non-bounceable (for wallets) — both are valid |
| No global mempool | Transactions are per-account; monitoring requires watching individual addresses, not a global feed |
| Bounce messages | Failed Jetton transfers return the tokens via a "bounce" message — must be handled |

---

## 1. TON Connect — Wallet Linking

### 1.1 What TON Connect Is

TON Connect 2.0 is an open protocol for connecting TON wallets (Tonkeeper, MyTonWallet, Tonhub, OpenMask, etc.) to web applications. It is **not** a custody mechanism — it is a signing interface.

The protocol uses an HTTP bridge server that relays messages between the dApp and the wallet app. Both parties communicate through an encrypted channel established over the bridge.

**Connection flow:**

```
3REAL Frontend                    Bridge Server                 User Wallet
      │                                │                              │
      │── generate session keypair ──▶ │                              │
      │── POST /push (connection) ──▶  │                              │
      │── encode QR code ────────────────────────────────────────────▶│
      │                                │◀─ wallet scans QR code ──────│
      │                                │◀─ wallet sends encrypted msg ─│
      │◀─ SSE (connection response) ── │                              │
      │── verify ton_proof ──────────  │                              │
      │── store wallet address ──────  │                              │
```

### 1.2 App Manifest

TON Connect requires a publicly accessible manifest at a stable URL:

```json
// public/tonconnect-manifest.json
{
  "url": "https://3real.no",
  "name": "3REAL",
  "iconUrl": "https://3real.no/icon-192.png",
  "termsOfUseUrl": "https://3real.no/terms",
  "privacyPolicyUrl": "https://3real.no/privacy"
}
```

The manifest URL is passed when initialising the SDK. Wallets display this information on the connection approval screen.

### 1.3 TonProof — Server-Side Verification

**Critical:** Without server-side proof verification, any attacker can claim to own a TON address by replaying a connection request. The wallet produces a cryptographic proof that must be verified on the 3REAL backend.

The proof payload:

```
ton_proof = {
  timestamp:  Unix time (must be within 5 minutes)
  domain:     { lengthBytes, value: "3real.no" }
  payload:    server-generated random nonce (stored in session)
  signature:  Ed25519 signature over the canonical message
}
```

Canonical message to verify:

```
"ton-proof-item-v2/"
+ workchain + ":" + address_hash (raw bytes)
+ domain_length (LE uint32) + domain
+ timestamp (LE uint64)
+ payload
```

The public key to verify against comes from `getWalletPublicKey(address)` — fetched via TonAPI, not trusted from the client.

**Verification must happen on the server.** Client-side verification of signatures using attacker-provided public keys is a critical vulnerability.

### 1.4 What 3REAL Does With a Connected Wallet

Wallet connection in 3REAL v1 serves three purposes:

| Purpose | Phase |
|---|---|
| Prove ownership of a TON address (link wallet to account) | Phase 5 |
| Display on-chain balances alongside ledger balances | Phase 5 |
| Sign withdrawal authorisation (semi-custodial mode) | Phase 6 |

Linking a wallet does **not** transfer custody. The user's private keys never leave their wallet app.

### 1.5 Libraries and Dependencies

```
@tonconnect/sdk          — core SDK, framework-agnostic
@tonconnect/react-ui     — pre-built React button + modal
@ton/ton                 — TON client, address handling, Jetton calls
@ton/crypto              — key derivation, signature verification
tonweb-mnemonic          — mnemonic generation for hot wallets
```

---

## 2. REAL Jetton Integration

### 2.1 Jetton Standard (TEP-74 / TEP-89)

Jettons are TON's fungible token standard. Unlike ERC-20, where balances live in one contract, Jettons use a two-contract model:

```
┌──────────────────────────────┐
│   REAL Jetton Master         │
│   (one global contract)      │
│   - total supply             │
│   - mint/burn authority      │
│   - getWalletAddress(owner)  │
└──────────┬───────────────────┘
           │ derives
    ┌──────┴──────┐
    │             │
┌───▼──────┐  ┌───▼──────┐
│ Jetton   │  │ Jetton   │
│ Wallet   │  │ Wallet   │
│ (Alice)  │  │ (3REAL)  │
│          │  │ hot wlt  │
└──────────┘  └──────────┘
```

**Each owner address has a unique Jetton wallet contract** whose address is deterministically derived from the Jetton master address and the owner address. You cannot monitor the Jetton master to see transfers — you must monitor the specific Jetton wallet address.

### 2.2 Fetching 3REAL's REAL Balance

```typescript
// The 3REAL hot wallet's REAL balance lives in its Jetton wallet contract.
// Step 1: derive the hot wallet's Jetton wallet address
const jettonMasterAddress = Address.parse(process.env.REAL_JETTON_MASTER_ADDRESS!);
const hotWalletAddress     = Address.parse(process.env.TON_HOT_WALLET_ADDRESS!);

const client         = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });
const jettonMaster   = client.open(JettonMaster.create(jettonMasterAddress));
const ourJettonWallet = await jettonMaster.getWalletAddress(hotWalletAddress);

// Step 2: query its balance
const wallet  = client.open(JettonWallet.create(ourJettonWallet));
const balance = await wallet.getBalance();
```

### 2.3 Op-codes to Know

| Message Type | Op-code | Direction | Meaning |
|---|---|---|---|
| `transfer` | `0xf8a7ea5` | sender → their Jetton wallet | Initiate transfer |
| `internal_transfer` | `0x178d4519` | sender wallet → recipient wallet | Routed by system |
| `transfer_notification` | `0x7362d09c` | recipient wallet → recipient owner | **Deposit detected here** |
| `excess` | `0xd53276db` | various → original sender | Leftover TON gas refund |
| `burn` | `0x595f07bc` | owner → Jetton wallet | Destroy tokens |
| `bounce` | varies | failed contract → sender | Transfer rejected; tokens returned |

**For deposits: 3REAL must listen for `transfer_notification` messages arriving at the Jetton wallet it controls for each user's deposit address.**

### 2.4 Jetton Master Address Management

REAL token master contract address will be set by SETAEI. Rules:

1. Store the canonical REAL Jetton master address in environment config (`REAL_JETTON_MASTER_ADDRESS`).
2. **Never credit a deposit based on token name or symbol.** Always verify the Jetton wallet's master address matches the whitelisted address.
3. Maintain a `jetton_whitelist` table or environment config with approved master addresses per network (mainnet / testnet).
4. Any Jetton arriving from a non-whitelisted master must be silently ignored (not credited, not rejected — to avoid confusion with the legitimate token).

### 2.5 Forward Payload and Comment

When sending a Jetton `transfer`, the sender can include a `forward_payload` — arbitrary data forwarded to the recipient via the `transfer_notification`. This is commonly used for order IDs, memos, and attribution.

For 3REAL deposits:
- Users sending from an exchange: include their 3REAL user ID as the comment
- Users sending from their own wallet: per-user deposit address makes the comment unnecessary
- The system should store the raw comment alongside the transaction for audit purposes

---

## 3. Deposit Flow

### 3.1 Architecture Decision: How to Attribute Deposits

Three strategies exist:

#### Strategy A — Single Hot Wallet + Unique Memo

All users deposit to one 3REAL TON address. Each user is assigned a unique numeric tag (e.g. `#38291`). The TON transfer comment field must contain that tag.

```
User             3REAL Hot Wallet
  │──── 100 REAL ─────────────▶│
  │  comment: "#38291"         │
  │                            │
  ▼                            │
System reads comment → attribute to user 38291
```

**Pros:** Simple infrastructure, one address to monitor.  
**Cons:** Users frequently forget or mistype the memo. Lost deposits are common. Customer support burden is high.

#### Strategy B — Per-User Deposit Addresses (HD Wallet)

Each user gets a unique TON address derived deterministically from a master seed using BIP-44 HD derivation. No memo needed.

```
Master Seed
     │
     ├── m/44'/607'/0'/0'/1'  →  Alice's deposit address
     ├── m/44'/607'/0'/0'/2'  →  Bob's deposit address
     └── m/44'/607'/0'/0'/3'  →  Carol's deposit address
```

Derivation path for TON: `m/44'/607'/0'/0'/n'` (coin type 607 per SLIP-44).

The `deposit_addresses` table already has `derivationPath` field to store this.

**Pros:** No memo required. Zero attribution errors. Better UX.  
**Cons:** Need to monitor N addresses. Must derive and persist the address at registration time. HD master seed must be securely stored and backed up.

#### Strategy C — Jetton Transfer with Forward Payload

User sends REAL Jettons to 3REAL's main Jetton wallet, embedding user ID in the `forward_payload`.

**Pros:** Single wallet address.  
**Cons:** Requires user's wallet app to support custom payload (most do). Complex fallback logic for payload-less transfers.

**Recommendation: Strategy B (per-user HD-derived deposit addresses)** for v2/v3. Strategy A for early v1 with clear UI warnings.

### 3.2 Deposit Flow — Full Sequence

```
User                  3REAL Frontend         3REAL API          TonAPI Webhook         Database
  │                        │                      │                    │                   │
  │── request deposit ────▶│                      │                    │                   │
  │                        │── GET /deposit-addr ▶│                    │                   │
  │                        │                      │── query ──────────────────────────────▶│
  │                        │                      │◀── deposit_address record ─────────────│
  │                        │                      │── if not exists: derive address ───────▶│
  │                        │◀── deposit address ──│                    │                   │
  │◀── show address + QR ──│                      │                    │                   │
  │                        │                      │                    │                   │
  │── send 100 REAL ───────────────────────────────────────────────────────────────────────▶
  │   (TON transaction)    │                      │                    │                   │
  │                        │                      │                    │                   │
  │                        │         [2–10 seconds later]             │                   │
  │                        │                      │                    │                   │
  │                        │              TonAPI detects tx ──────────▶│                   │
  │                        │                      │◀── webhook POST ───│                   │
  │                        │                      │                    │                   │
  │                        │                      │── validate: ───────────────────────────│
  │                        │                      │  1. Jetton master = REAL whitelist     │
  │                        │                      │  2. Amount >= min deposit              │
  │                        │                      │  3. chainTxHash not already processed  │
  │                        │                      │                    │                   │
  │                        │                      │── create Transaction (pending) ───────▶│
  │                        │                      │── write LedgerTransaction: ───────────▶│
  │                        │                      │     DR deposits-pending  −100          │
  │                        │                      │     CR user:alice:REAL   +100          │
  │                        │                      │── mark Transaction completed ─────────▶│
  │                        │                      │── emit notification ───────────────────▶│
  │                        │                      │                    │                   │
  │◀── balance updated ────│◀── SSE / poll ───────│                    │                   │
```

### 3.3 Idempotency Guard

The `LedgerTransaction.chainTxHash` field has a `@unique` constraint. The TON transaction hash (logical time + hash, encoded as `{lt}:{hash}`) is stored here. Any duplicate webhook firing for the same transaction hits a unique constraint violation and is safely discarded.

```typescript
const txKey = `${lt}:${txHash}`;
// Prisma will throw P2002 (unique constraint) on duplicate — catch and ignore
```

### 3.4 Confirmation Threshold

TON does not have probabilistic finality like Bitcoin PoW. A committed block on TON is final after a short masterchain confirmation (typically 1–5 seconds). However, for safety:

| Asset | Confirmations Required | Rationale |
|---|---|---|
| TON | 1 block | TON BFT consensus; effectively final |
| REAL Jetton | 1 block (after `transfer_notification`) | Notification only arrives after settlement |
| USDT (TRC-20) | 20 blocks | Different chain; TRON has different security |

### 3.5 Webhook Infrastructure

**TonAPI webhooks** (`https://tonapi.io`) support webhook subscriptions for:
- Specific address activity
- Jetton transfers
- Transaction confirmation

Registration:
```
POST https://tonapi.io/v2/webhooks/subscriptions
{
  "endpoint": "https://3real.no/api/webhooks/tonapi",
  "accounts": ["EQ<3REAL_HOT_WALLET>"],
  "jetton_accounts": ["EQ<3REAL_JETTON_WALLET>"]
}
```

Fallback reconciliation: run a periodic job (every 5 minutes) querying TonAPI for recent transactions on deposit addresses and reconcile against the database. This catches any webhook failures.

---

## 4. Withdrawal Flow

### 4.1 Architecture Overview

Withdrawals require 3REAL to hold REAL Jettons in a hot wallet. The system constructs and signs a `transfer` message from the hot wallet's Jetton wallet to the user's destination address.

```
User                  3REAL API             Hot Wallet Signer        TON Network
  │                       │                        │                      │
  │── POST /withdraw ────▶│                        │                      │
  │  { amount, address }  │                        │                      │
  │                       │── validate: ───────────────────────────────── │
  │                       │  - KYC tier sufficient                        │
  │                       │  - Balance covers amount                      │
  │                       │  - Address is valid TON                       │
  │                       │  - Daily limit not exceeded                   │
  │                       │── create Transaction (pending) ───────────────│
  │                       │── reserve balance: ────────────────────────── │
  │                       │     DR user:alice:REAL  −100                  │
  │                       │     CR withdrawals-pending:REAL  +100         │
  │◀── "submitted" ───────│                        │                      │
  │                       │                        │                      │
  │             [admin review / automated approval]│                      │
  │                       │                        │                      │
  │                       │── approve: ────────────│                      │
  │                       │     Transaction → processing                  │
  │                       │── queue withdrawal job ─▶│                    │
  │                       │                        │── build transfer msg │
  │                       │                        │── sign with hot key  │
  │                       │                        │── broadcast ────────▶│
  │                       │                        │                      │
  │                       │◀── webhook: tx confirmed ──────────────────── │
  │                       │── settle ledger: ──────────────────────────── │
  │                       │     DR withdrawals-pending:REAL  −100         │
  │                       │     CR platform:float:REAL  +100 (outflow rec)│
  │                       │     (net: user −100, platform float −100)     │
  │                       │── Transaction → completed ─────────────────── │
  │◀── notification ──────│                        │                      │
```

### 4.2 Withdrawal Transaction Construction

Using `@ton/ton`:

```typescript
// Build a Jetton transfer message
const transferBody = beginCell()
  .storeUint(0xf8a7ea5, 32)           // op: transfer
  .storeUint(queryId, 64)             // query_id (for matching excess/bounce)
  .storeCoins(toNano(amount))         // Jetton amount (9 decimals for REAL)
  .storeAddress(destinationAddress)   // recipient
  .storeAddress(hotWalletAddress)     // response_destination (for excess TON)
  .storeBit(0)                        // no custom payload
  .storeCoins(toNano("0.01"))         // forward_ton_amount (for transfer_notification gas)
  .storeBit(0)                        // no forward_payload
  .endCell();

// Send from hot wallet's Jetton wallet to recipient
await hotWallet.sendTransfer(provider, {
  seqno,
  secretKey,
  messages: [
    internal({
      to: hotWalletJettonAddress,
      value: toNano("0.05"),         // gas for the Jetton transfer
      body: transferBody,
    }),
  ],
});
```

### 4.3 Withdrawal State Machine

```
pending
  │  (admin reviews)
  ▼
approved
  │  (signer queues tx)
  ▼
processing
  │  (blockchain broadcast)
  ▼
completed  ←── webhook confirms on-chain
  │
  OR
  ▼
failed  ←── bounce received / timeout
  │
  ▼
withdrawal_reversal ledger entry
(returns balance to user account)
```

### 4.4 Seqno Management

TON wallets use a sequential nonce (`seqno`) to prevent replay attacks. The hot wallet's seqno must be:
1. Fetched fresh before each transaction
2. Never reused (concurrent withdrawals must be serialised)
3. Tracked locally if broadcasting without confirmation waiting

For v1, serialise all outbound transactions through a single queue worker. Do not attempt parallel broadcast from one hot wallet address.

---

## 5. Custody Model Options

### 5.1 Comparison

| | Non-Custodial | Semi-Custodial | Fully Custodial |
|---|---|---|---|
| **Definition** | User holds all keys. 3REAL never touches assets. | 3REAL holds hot wallet; user can also link own wallet. | 3REAL holds all user assets in pooled wallets. |
| **User experience** | Requires user to have a wallet app. Complex. | Best of both worlds: simple UI, retain wallet option. | Simplest for user: just a username + password. |
| **Balance tracking** | On-chain only; ledger is informational. | Internal ledger is authoritative; on-chain is the settlement layer. | Internal ledger only; no on-chain per-user balances. |
| **Regulatory posture** | Minimal (not holding funds). | Moderate (holding hot wallet). | Highest (full custody = money transmitter). |
| **Implementation complexity** | High (all UX in wallet app). | Medium (webhook + ledger). | Low (internal only). |
| **Withdrawal UX** | User signs every tx in wallet app. | Admin/automated approval; user just requests. | Admin/automated approval. |
| **Key risk** | User loses key = funds gone (not 3REAL's liability). | Hot wallet compromise = theft. | Hot wallet + DB compromise = all user funds at risk. |
| **Relevant for 3REAL v1** | Not suitable — REAL ecosystem requires internal accounting. | ✅ **Recommended** | Possible but high regulatory exposure. |

### 5.2 The Semi-Custodial Model in Detail

3REAL holds a hot wallet with a portion of REAL Jettons sufficient for expected daily withdrawals. The rest sits in cold storage (hardware wallet, multi-sig).

```
                    Cold Storage (multi-sig)
                    ┌──────────────────────┐
                    │  90% of REAL reserve │
                    └────────────┬─────────┘
                                 │  periodic topup
                                 ▼
                    Hot Wallet (automated)
                    ┌──────────────────────┐
                    │  ~10% of REAL        │
                    │  Handles daily flows │
                    └────────────┬─────────┘
                                 │  deposits in / withdrawals out
                         3REAL Internal Ledger
                         (authoritative balance)
```

Cold-to-hot topup rule: when hot wallet balance drops below a threshold (e.g. 10,000 REAL), trigger an alert. Manual transfer from cold to hot restores the float.

---

## 6. Security Risks

### 6.1 Fake Jetton Attack

**Risk:** An attacker deploys a Jetton contract with symbol "REAL" and sends tokens to 3REAL deposit addresses. A naive system credits REAL balances for worthless tokens.

**Mitigation:**
- Never credit based on token name, symbol, or decimals
- Maintain an allowlist of Jetton master contract addresses in environment config
- On receiving a `transfer_notification`, extract the `sender` (the Jetton wallet) and call `get_wallet_data()` to retrieve its `jetton_master`
- Reject any deposit where `jetton_master !== REAL_JETTON_MASTER_ADDRESS`
- Log rejected deposits for audit

```typescript
// Verification pseudocode
const senderJettonWallet = Address.parse(notification.sender);
const walletData = await client.runMethod(senderJettonWallet, "get_wallet_data");
const actualMaster = walletData.stack.readAddress();

if (!actualMaster.equals(Address.parse(process.env.REAL_JETTON_MASTER_ADDRESS!))) {
  // Fake jetton — do not credit. Log and discard.
  return;
}
```

### 6.2 Wrong Memo / Missing Comment

**Risk:** User sends to shared deposit address but forgets or mistypes the comment. Deposit cannot be attributed.

**Mitigations:**
- Use per-user deposit addresses (Strategy B) to eliminate memo requirement
- For any Strategy A (memo-based) deposits: hold in a "pending attribution" state and allow customer support to manually attribute
- Never permanently lose a deposit — always credit eventually once ownership is proven
- Show the memo prominently in the deposit UI with copy-button

### 6.3 Replay / Double Credit

**Risk:** Webhook fires twice for the same transaction. Two ledger credits are written for one on-chain event.

**Mitigation:**
- `LedgerTransaction.chainTxHash` has a `@unique` database constraint (already in schema)
- Use TON's logical time + hash as the composite key: `${lt}:${hash}`
- Webhook handler checks existence before writing: `prisma.ledgerTransaction.create()` throws `P2002` on duplicate, which is caught and discarded
- Periodic reconciliation job compares on-chain state against ledger — any double-credited amount shows as discrepancy

### 6.4 Withdrawal Fraud

**Risk:** Attacker gains access to a user's account and submits a withdrawal to an attacker-controlled address.

**Mitigations (layered):**

| Layer | Mitigation |
|---|---|
| Authentication | JWT with `sessionVersion`; reset on password change |
| Withdrawal address | Mandatory address whitelisting: save-first, withdraw-second. New addresses require 24h hold. |
| 2FA gate | Withdrawal requests require TOTP confirmation (Phase 7) |
| Daily limits | Per-user per-day withdrawal limits enforced in API |
| Admin approval | All withdrawals above threshold require admin approval |
| Email alert | Send withdrawal confirmation email; user has 15 minutes to cancel |
| KYC gate | Withdrawals require minimum KYC Tier 2 |

### 6.5 Hot Wallet Compromise

**Risk:** Private key for the hot wallet is leaked (env var exposure, server breach, etc.). Attacker drains the hot wallet.

**Mitigations:**

| Layer | Mitigation |
|---|---|
| Key storage | Never store private key in `.env` on disk in production. Use AWS Secrets Manager, HashiCorp Vault, or equivalent. |
| Hot wallet float | Keep only the daily float in the hot wallet (~10% of reserves). 90% in cold storage. |
| Cold storage | Hardware wallet or multi-sig requiring 2-of-3 signatories for large transfers. |
| Withdrawal limits | Automated withdrawals capped at a daily maximum. Anything above requires manual cold-wallet signing. |
| Monitoring | Alert on any hot wallet outbound transaction not initiated by the withdrawal system. |
| Key rotation | Rotate hot wallet keys periodically; sweep balance to new address. |

### 6.6 TON-Specific: Bounce Attack

**Risk:** A contract sends REAL to 3REAL's Jetton wallet with a payload that causes a bounce, returning the tokens but triggering a deposit credit before the bounce is processed.

**Mitigation:**
- Only credit after `transfer_notification` is received — this message is only emitted on successful, non-bounced delivery
- Never credit on `internal_transfer` messages alone
- Track bounce messages: if a bounce arrives after a credit has been written, reverse the ledger entry (use `withdrawal_reversal` type)

### 6.7 Seqno Collision (Withdrawal Racing)

**Risk:** Two concurrent withdrawal processes read the same `seqno` from the hot wallet. Both broadcast valid-looking transactions; one succeeds, one is silently dropped by TON validators. The dropped withdrawal creates a ledger debt.

**Mitigation:**
- Serialise all outbound transactions through a queue (Redis, pg-based queue, or similar)
- Each withdrawal job: fetch seqno, build tx, broadcast, await confirmation, then process next
- If confirmation times out, re-query the chain — never assume success

### 6.8 Address Encoding Mistakes

**Risk:** Sending REAL Jettons to a bounceable address format for a smart contract that cannot process them. Or sending to a non-bounceable address of a contract that expects bounced messages.

**Mitigation:**
- Always parse addresses through `@ton/ton`'s `Address.parse()` — it handles both formats
- For user withdrawal destinations: accept any format, normalise internally
- Validate that destination is a wallet address (workchain 0), not a masterchain address (workchain -1)
- Warn the user if sending to a contract address vs a wallet address

---

## 7. Recommended MVP Approach

### 7.1 Phase Breakdown

#### Phase 5 — Wallet Linking (no custody yet)

Goal: users can connect their TON wallet to their 3REAL account as a verified identity signal.

1. Add `ton_wallets` table: `(userId, address, linkedAt, proofPayload)`
2. Implement TON Connect 2.0 frontend button
3. Server-side `ton_proof` verification endpoint
4. Display linked wallet address on dashboard

No money movement. No ledger changes. Just ownership proof.

#### Phase 6 — Manual Deposits (Strategy A: shared address + memo)

Goal: accept REAL Jetton deposits with manual admin approval.

1. Assign each user a numeric memo tag (e.g. their user number)
2. Single 3REAL hot wallet address displayed to all deposit users
3. Admin monitors TonAPI/explorer for incoming REAL transfers
4. Admin manually submits deposit confirmations through admin panel
5. Ledger credits written on admin approval
6. `chainTxHash` stored for idempotency

This is the fastest path to v1 deposits. Downside: memo errors require support.

#### Phase 7 — Automated Deposits (Strategy B: per-user addresses)

Goal: eliminate memo errors; automate credit.

1. Generate HD-derived TON deposit address per user at registration
2. Store in `deposit_addresses` table with `derivationPath`
3. Register TonAPI webhooks for all deposit addresses
4. Implement webhook handler with Jetton master address verification
5. Automated ledger credit with `chainTxHash` idempotency
6. Reconciliation cron job as fallback

#### Phase 8 — Withdrawals

Goal: users can withdraw REAL to any TON address.

1. Withdrawal request API with balance reservation ledger entries
2. Address whitelisting (24h hold for new addresses)
3. Admin approval queue for withdrawals above threshold
4. Automated signing for approved withdrawals below threshold
5. TonAPI webhook for outbound transaction confirmation
6. Settlement ledger entries on confirmation

### 7.2 Infrastructure Requirements

| Component | Technology | Notes |
|---|---|---|
| TON RPC | TonAPI (`https://tonapi.io`) | Webhooks + REST queries. Free tier sufficient for MVP. |
| TON fallback RPC | toncenter (`https://toncenter.com/api/v2`) | Free, rate-limited. Backup for reconciliation. |
| Hot wallet | TON Wallet v5r1 (latest) | Highest security, supports W5 features |
| Key storage (dev) | Environment variable (`.env`) | Acceptable only for development |
| Key storage (prod) | AWS Secrets Manager or Vault | Never on disk in production |
| Tx queue | PostgreSQL-backed queue (pgmq) or Bull/BullMQ | Serialise outbound transactions |
| Reconciliation | Node.js cron or Vercel Cron | Every 5 minutes; compare on-chain vs ledger |
| Monitoring | TonAPI webhook + alerting | Alert on unexpected hot wallet activity |

### 7.3 Environment Variables Required

```bash
# Jetton master contract address (canonical REAL token)
REAL_JETTON_MASTER_ADDRESS="EQ<mainnet_contract_address>"

# 3REAL hot wallet address (receives user deposits)
TON_HOT_WALLET_ADDRESS="UQ<hot_wallet_address>"

# Hot wallet private key — use Secrets Manager in production, never commit
TON_HOT_WALLET_PRIVATE_KEY="<hex_or_mnemonic>"

# HD wallet master seed for per-user deposit address derivation
TON_HD_MASTER_SEED="<24_word_mnemonic>"

# TonAPI credentials
TONAPI_KEY="<api_key>"
TONAPI_WEBHOOK_SECRET="<webhook_hmac_secret>"

# Network selection
TON_NETWORK="mainnet"   # or "testnet"
```

### 7.4 Database Changes Required

The existing schema already supports the TON integration. No new tables are required for Phase 5–7. The following fields map to the design:

| Need | Existing Field |
|---|---|
| Per-user deposit address | `DepositAddress.address` (network: `ton`) |
| HD derivation path | `DepositAddress.derivationPath` |
| Withdrawal destination | `WithdrawalDestination.address` (network: `ton`) |
| Idempotency guard | `LedgerTransaction.chainTxHash` (unique) |
| Network tag | `LedgerTransaction.chainNetwork` (enum: `ton`) |
| Linked TON wallet | Requires new `ton_wallets` table (Phase 5) |

The only schema addition needed is a `ton_wallets` table for wallet linking (Phase 5). Everything else fits the existing models.

### 7.5 Testing Strategy

| Test | Method |
|---|---|
| Jetton transfer detection | TON testnet; send from any testnet wallet |
| Fake Jetton rejection | Deploy a dummy Jetton on testnet; verify it is rejected |
| Double-credit prevention | Fire webhook twice with same txHash; verify only one credit |
| Withdrawal broadcast | Testnet withdrawal to self |
| Bounce handling | Send to a non-existent contract on testnet; verify bounce handler triggers |
| seqno collision | Simulate two concurrent withdrawal requests; verify serialisation |

---

## 8. Recommended Library Stack

```json
{
  "@tonconnect/sdk": "^3.x",
  "@tonconnect/react-ui": "^2.x",
  "@ton/ton": "^15.x",
  "@ton/crypto": "^3.x",
  "tonweb-mnemonic": "^0.0.5"
}
```

All packages are MIT licensed and maintained by the TON Foundation or closely associated ecosystem teams (`@ton/*` packages are the official rewrite of the older `tonweb` library).

---

## 9. Open Questions for SETAEI

Before implementing Phase 6+, the following must be confirmed with SETAEI:

| Question | Impact |
|---|---|
| What is the REAL Jetton master contract address on mainnet/testnet? | All deposit detection depends on this address being hardcoded as a whitelist entry |
| How many decimals does the REAL Jetton use? | 9 (standard) or custom? Ledger stores as Decimal(28,8) — will need conversion |
| Is there a maximum supply or mint authority? | Affects fraud detection: large unexpected inflows are suspicious if supply is capped |
| Who controls the Jetton minter admin? | Must be SETAEI-controlled, not a compromised key |
| Should 3REAL issue the REAL Jetton or use an external contract? | Determines who deploys and controls the master contract |
| What cold storage arrangement is acceptable? | Hardware wallet? Multi-sig (2-of-3)? Geographic separation? |
| Is automated withdrawal approved for any amount, or always admin-gated? | Affects UX and operational staffing requirements |
