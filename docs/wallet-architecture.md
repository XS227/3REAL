# Wallet Architecture

**Phase 5.5 — Wallet Foundation**  
**Date:** 2026-06-08  
**Scope:** Internal ledger, balance model, account structure, transfer service, and future integration paths

---

## Overview

The 3REAL wallet is an **internal accounting system**, not a blockchain wallet. It tracks user asset balances using a double-entry ledger. On-chain assets (REAL Jettons, TON, USDT TRC-20) flow through the ledger only after settlement on the corresponding blockchain. Users interact with internal balances; the platform manages custody.

---

## 1. Internal Ledger

### Design Principles

1. **No balance columns on users.** `users.real_balance` or similar fields do not exist and must never be added. Balances are always computed from ledger entries.
2. **Every financial event = ≥ 2 ledger entries.** The sum of all entries in one `ledger_transaction` must always equal zero (double-entry invariant).
3. **Entries are immutable.** `ledger_entries` rows are never updated or deleted. Corrections create reversing entries.
4. **Sign convention:** Debit = negative amount, Credit = positive amount.
5. **User accounts are liability accounts.** The platform owes the user their balance. A deposit credits the user (increases platform liability) and debits the platform float (reduces the asset the platform holds on behalf of the user).

### Account Model

```
accounts table
  ├── ownerType: 'user' | 'platform'
  ├── ownerId:   userId (UUID string) | platform slug ('float', 'rewards-pool', ...)
  ├── assetCode: REAL | TON | USDT | EUR | NOK | TRY
  ├── accountType: asset | liability | equity | revenue | expense
  └── @@unique([ecosystemId, ownerType, ownerId, assetCode])
```

Each user has **one account per asset per ecosystem**, created lazily on the first ledger entry. Accounts are identified by the unique 4-tuple `(ecosystemId, ownerType, ownerId, assetCode)`. The `getOrCreateUserAccount()` function in `lib/ledger/accounts.ts` uses an upsert to create on first access.

### Balance Calculation

```sql
SELECT
  a.asset_code::text,
  COALESCE(SUM(le.amount) FILTER (WHERE lt.status = 'completed'), 0)::float8 AS available,
  COALESCE(SUM(le.amount) FILTER (WHERE lt.status IN ('pending', 'processing')), 0)::float8 AS pending
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
WHERE a.owner_type::text = 'user'
  AND a.owner_id = $userId
GROUP BY a.asset_code
```

- **Available** = sum of all completed entries. Spendable immediately.
- **Pending** = sum of entries in pending/processing transactions. Held, not yet settled.
- **Total** = available + pending.

This query lives in `lib/ledger/balance.ts` and is called from every page that shows balances.

### Ledger Transaction Types

| Type | Direction | Journal Entry |
|---|---|---|
| `deposit` | Inbound fiat | DR platform:float:EUR / CR user:EUR |
| `blockchain_deposit` | Inbound on-chain | DR platform:float:REAL / CR user:REAL |
| `withdrawal` | Outbound fiat | DR user:EUR / CR platform:float:EUR |
| `blockchain_withdrawal` | Outbound on-chain | DR user:REAL / CR platform:float:REAL |
| `referral_reward` | Reward to user | DR platform:rewards-pool:REAL / CR user:REAL |
| `transfer` | Internal user→user | DR user_A:REAL / CR user_B:REAL |
| `fee` | Fee collection | DR user:REAL / CR platform:fees:REAL |
| `conversion` | Asset swap | DR user:EUR / CR user:REAL (+ fee entries) |
| `correction` | Manual fix | Reversing + correcting pair of entries |

---

## 2. Internal Transfer Architecture

### Service: `createInternalTransfer()`

Located at `lib/ledger/transfer.ts`. Transfers REAL (or any asset) from one user's internal account to another within the same ecosystem. No blockchain transaction is created.

**Signature:**
```typescript
createInternalTransfer({
  fromUserId: string;
  toUserId: string;
  assetCode: AssetCode;
  amount: number;
  note?: string;
  initiatedById?: string;
}): Promise<InternalTransferResult>
```

**Execution steps (single DB transaction):**
1. Look up `three_real` ecosystem ID
2. `getOrCreateUserAccount` for both parties
3. Fetch current available balance of `fromUserId` for the asset
4. If balance < amount → throw `INSUFFICIENT_BALANCE`
5. Create `LedgerTransaction` (type: `transfer`, status: `completed`)
6. Create two `LedgerEntry` rows:
   - DR fromUser account: `-amount`
   - CR toUser account: `+amount`

**Error codes:**
- `SELF_TRANSFER` — fromUserId === toUserId
- `INVALID_AMOUNT` — amount ≤ 0
- `INSUFFICIENT_BALANCE` — available balance < requested amount

**Note:** No UI is exposed for this in Phase 5.5. The service is ready for Phase 9 admin panel and Phase 6 peer transfers.

---

## 3. Future: TON Deposit Flow

When Phase 7 (blockchain deposits) is implemented:

```
User sends REAL Jetton to their deposit address
       │
       ▼
TonAPI webhook fires → POST /api/webhooks/tonapi
       │
       ├─ Validate: Jetton master == REAL_JETTON_MASTER_ADDRESS (whitelist check)
       ├─ Validate: chainTxHash not already in ledger_transactions (idempotency)
       ├─ Validate: amount >= minimum deposit threshold
       │
       ▼
Create Transaction (status: pending)
       │
       ▼
Admin approves (or auto-approve if below threshold)
       │
       ▼
Create LedgerTransaction (type: blockchain_deposit, status: completed)
  LedgerEntry: DR platform:float:REAL   -amount
  LedgerEntry: CR user:REAL             +amount
       │
       ▼
getUserBalances() now returns the credited amount
```

The `chainTxHash` unique constraint on `ledger_transactions` is the idempotency guard. Duplicate webhook firings for the same on-chain transaction throw a `P2002` unique constraint violation, which is caught and discarded.

**Required env vars:**
```
REAL_JETTON_MASTER_ADDRESS=EQ<mainnet_address>
TON_HOT_WALLET_ADDRESS=UQ<hot_wallet>
TON_HD_MASTER_SEED=<24 word mnemonic>
TONAPI_KEY=<api_key>
TONAPI_WEBHOOK_SECRET=<hmac_secret>
```

Full details in `docs/ton-architecture.md`.

---

## 4. Future: Withdrawal Flow

```
User submits withdrawal request
       │
       ▼
POST /api/transactions/withdraw
  Validate: balance, KYC tier, daily limit, address whitelist
       │
       ▼
Create Transaction (status: pending)
Create LedgerTransaction (type: withdrawal, status: pending)
  LedgerEntry: DR user:REAL                -amount  (reserved)
  LedgerEntry: CR platform:withdrawals-pending:REAL +amount
       │
       ▼
Admin reviews / auto-approves
       │
       ▼
Withdrawal signer broadcasts TON transfer
       │
       ▼
TonAPI confirms on-chain
       │
       ▼
Settlement:
  LedgerTransaction status → completed
  LedgerEntry: DR platform:withdrawals-pending:REAL  -amount
  LedgerEntry: CR platform:float:REAL                +amount (net outflow recorded)
```

The pre-settlement entries "reserve" the user's balance (included in pending, excluded from available). This prevents double-spending while the withdrawal is in flight.

---

## 5. Future: REAL Jetton Integration

The REAL token is a Jetton on TON blockchain (TEP-74/89). Platform integration:

```
REAL Jetton Master Contract
  └── Platform Jetton Wallet (hot wallet's derived Jetton wallet)
        ├── per-user deposit addresses (HD-derived, BIP-44 m/44'/607'/0'/0'/n')
        └── monitored via TonAPI webhooks

Internal Ledger (3REAL)
  └── platform:float:REAL account (mirrors on-chain REAL holdings)
  └── user:REAL accounts (sum = total user claim on platform's REAL)
```

**Invariant to maintain:** `SUM(all user REAL accounts) ≤ platform:float:REAL + platform:cold-storage:REAL`

If this invariant ever breaks, it indicates a crediting error or hot wallet shortfall.

---

## 6. Wallet Page Architecture

### Routes

| Route | Component | Data Source |
|---|---|---|
| `/dashboard/wallet` | Wallet overview | `getWalletPageData()` → balances + accounts |
| `/dashboard/wallet/[asset]` | Asset detail | `getAssetDetailData()` → balance + ledger history + account |

### Component Tree

```
WalletPage (server)
  ├── AssetCard × 6          — per-asset balance card with link to detail
  └── AccountExplorer        — ledger accounts table (empty for new users)

AssetDetailPage (server)
  ├── AssetHeader            — large balance display, asset identity
  ├── LedgerHistory          — ledger entries for this asset, paginated (50)
  └── AccountExplorer        — single-asset account record
```

### Asset Metadata

`lib/wallet/assets.ts` is the single source of truth for:
- Asset code, name, symbol
- Display decimals (REAL: 2, TON: 4, USDT: 2, fiat: 2)
- Network label
- Tailwind color classes (accent, bg, border, ring)

All wallet components import from here. No hardcoded asset data in components.

---

## 7. Data Flow Summary

```
PostgreSQL
  ledger_entries ──────────────────────────────▶ getUserBalances()
  accounts ─────────────────────────────────────▶ getUserAccounts()
  ledger_entries + ledger_transactions ─────────▶ getLedgerHistory()

Server Components (no client state)
  WalletPage ──── getWalletPageData() ──── AssetCard × 6 + AccountExplorer
  AssetDetailPage ─ getAssetDetailData() ── AssetHeader + LedgerHistory + AccountExplorer

No client-side fetching on wallet pages.
All data resolved at render time via parallel Promise.all.
```

---

## 8. What Is Not Yet Built

| Feature | Phase |
|---|---|
| Deposit request form + API | Phase 6 |
| Withdrawal request form + API | Phase 6 |
| TON Connect wallet linking | Phase 5 (TON) |
| On-chain deposit detection (webhook) | Phase 7 |
| On-chain withdrawal broadcast | Phase 7 |
| REAL Jetton per-user deposit addresses | Phase 7 |
| Peer-to-peer internal transfer UI | Phase 9 |
| Multi-page transaction history with filters | Phase 6 |
| Exchange rate display (fiat equivalent) | Phase 6 |
