# TON Connect Implementation — 3REAL

**Phase:** 13  
**Date:** 2026-06-08  
**Scope:** Wallet linking via TON Connect 2.0. No deposits, withdrawals, or Jetton transfers in this phase.

---

## Overview

Users can link one or more TON wallets to their 3REAL account. The link is established via a cryptographic proof — the wallet signs a server-generated nonce with its Ed25519 private key. The server verifies the signature, ensuring that only the true key-holder can link a given address.

```
User                 3REAL Frontend              3REAL Backend
  │                       │                             │
  │  click Connect ──────▶│                             │
  │                       │── GET /api/ton/challenge ──▶│
  │                       │                             │── create nonce, store in memory
  │                       │◀── { payload: "abc123..." } │
  │                       │                             │
  │                       │── setConnectRequestParameters({ tonProof: payload })
  │                       │                             │
  │  open wallet ─────────│◀──────────────────────────  │
  │  sign ton_proof ──────│                             │
  │                       │                             │
  │                       │── POST /api/ton/connect ───▶│
  │                       │   { account, proof }        │── consumeChallenge(userId, payload)
  │                       │                             │── verifyTonProof(...)
  │                       │                             │── upsertTonWallet(...)
  │                       │                             │── log audit event
  │                       │◀── { wallet } ──────────────│
  │◀── wallet linked ─────│                             │
```

---

## Files

### Backend

| File | Purpose |
|------|---------|
| `lib/ton/challenge.ts` | In-memory nonce store (5-min TTL, one-time use) |
| `lib/ton/proof.ts` | ton_proof cryptographic verification |
| `lib/ton/queries.ts` | Database CRUD for `ton_wallets` table |
| `app/api/ton/challenge/route.ts` | `GET` — issue a nonce for the authed user |
| `app/api/ton/connect/route.ts` | `POST` — verify proof and save wallet |
| `app/api/ton/disconnect/[id]/route.ts` | `DELETE` — remove a linked wallet |
| `app/api/ton/set-primary/[id]/route.ts` | `PATCH` — mark a wallet as primary |

### Frontend

| File | Purpose |
|------|---------|
| `components/ton/TonConnectProvider.tsx` | `TonConnectUIProvider` wrapper (client component) |
| `components/ton/ConnectWalletSection.tsx` | Connection button + proof submission flow |
| `components/ton/ConnectedWallets.tsx` | Linked wallets list with disconnect/primary actions |
| `app/dashboard/wallet/connect/page.tsx` | `/dashboard/wallet/connect` page |
| `app/dashboard/wallet/page.tsx` | Wallet overview — now includes TON wallets section |
| `public/.well-known/tonconnect-manifest.json` | TON Connect app manifest |

---

## Database

### `ton_wallets` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | UUID | FK → users |
| `walletAddress` | VARCHAR(66) | Raw address in `"workchain:hexhash"` format |
| `network` | VARCHAR(16) | `"mainnet"` or `"testnet"` |
| `publicKey` | VARCHAR(64) | Hex Ed25519 public key (stored for future withdrawal signing) |
| `isPrimary` | BOOLEAN | First wallet is auto-primary; user can change |
| `verifiedAt` | TIMESTAMP | When ton_proof was last verified (refreshed on re-link) |
| `lastConnectedAt` | TIMESTAMP | Updated on each verified connection |
| `createdAt` | TIMESTAMP | Row creation time |

Unique constraint: `(userId, walletAddress)` — a user can re-link the same address (updates `verifiedAt`).

---

## Proof verification algorithm

See `lib/ton/proof.ts` for the full implementation. Summary:

1. **Payload check** — submitted payload must match the nonce issued by the server
2. **Timestamp check** — proof timestamp must be within ±5 minutes of server time
3. **Domain check** — `proof.domain.value` must equal `3real.setaei.com`
4. **Domain length check** — `proof.domain.lengthBytes` must equal `Buffer.from(domain).length`
5. **Address parsing** — split `"workchain:hexhash"` into int32 BE workchain + 32-byte hash

Message bytes construction (per TON Connect spec):
```
message = concat(
  "ton-proof-item-v2/",   // UTF-8, no null terminator
  workchain (int32 BE),
  address_hash (32 bytes),
  domain_length (uint32 LE),
  domain_value (UTF-8),
  timestamp (uint64 LE),
  payload (UTF-8)
)
```

Buffer to verify:
```
verify_buf = concat(0xFF, 0xFF, "ton-connect", sha256(message))
```

Signature verification:
```typescript
signVerify(verify_buf, signature_bytes, public_key_bytes)  // from @ton/crypto
```

`signVerify` uses TweetNaCl's `detached.verify` internally (Ed25519, no pre-hashing).

---

## Challenge nonce security

The one-time nonce prevents replay attacks:

- Server generates `randomBytes(16).toString("hex")` per `GET /api/ton/challenge` call
- Stored in process memory with 5-minute TTL
- `consumeChallenge()` deletes the entry on first use — duplicate proof submissions are rejected
- The ton_proof timestamp is also checked independently (±5 min)

**Limitation:** The in-memory store is per-process. If PM2 is running multiple instances (fork mode) or the process restarts between `GET /challenge` and `POST /connect`, the challenge will not be found. 3REAL currently runs as a single PM2 instance in fork mode, so this is acceptable for private beta.

**TODO:** Migrate to Redis when scaling to multiple instances.

---

## Packages

| Package | Version | Usage |
|---------|---------|-------|
| `@tonconnect/ui-react` | 2.4.4 | Frontend: TonConnectUIProvider, useTonWallet, useTonConnectUI |
| `@ton/ton` | 16.3.0 | Address utilities (available for future blockchain calls) |
| `@ton/crypto` | — | `signVerify` for Ed25519 proof verification |

---

## Audit events

All wallet operations are recorded in `activity_logs`:

| Action | When |
|--------|------|
| `ton_wallet.connected` | Proof verified, wallet saved |
| `ton_wallet.disconnected` | User removes wallet |
| `ton_wallet.set_primary` | User changes primary wallet |

---

## What is NOT implemented (future phases)

- **On-chain balance display** — requires TonAPI/TonCenter HTTP calls
- **REAL Jetton balance** — requires querying the user's Jetton wallet contract
- **Deposits** — per-user HD-derived deposit addresses (Phase 7 in ton-architecture.md)
- **Withdrawals** — hot wallet signing via `@ton/ton` transfer construction
- **WalletStateInit verification** — verify the public key is embedded in the wallet contract's state_init (hardens against spoofed public keys)
- **TonAPI pubkey verification** — cross-check `account.publicKey` against on-chain wallet state
- **Mainnet/testnet selector** — currently accepts both, distinguished by `chain` field

---

## Known limitations

### Public key trust

The public key is taken from `account.publicKey` as provided by the TON Connect bridge. This key comes from the wallet app via an end-to-end encrypted channel, so it is trusted in practice. However, a fully hardened implementation would:

1. Parse the `walletStateInit` BOC to extract the embedded public key
2. Verify that the derived address matches `account.address`
3. Cross-check via TonAPI: `GET /v2/accounts/{address}` returns `public_key`

### In-memory challenge store

Challenges are stored in process memory. A PM2 restart (or crash) between challenge issuance and proof submission will invalidate the challenge. The 5-minute window is generous enough that this rarely affects users, but the UX shows a clear error message if it happens ("Verification failed — refresh and try again").
