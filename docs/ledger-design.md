# 3REAL — Ledger Design Specification

**Prepared for:** Phase 1.5 Architecture Review  
**Date:** 2026-06-07  
**Scope:** Complete specification of the double-entry ledger: sign convention, account taxonomy, all journal entry patterns, integrity rules, reconciliation procedures, and performance model.

---

## 1. Why Double-Entry for a Digital Asset Portal

A single-column `balance` field on the user table is the most common mistake in financial software. The problems:

- **No audit trail.** If the balance is wrong, there is no history to diagnose why.
- **Concurrency bugs.** Two simultaneous deposits can overwrite each other (classic race condition).
- **No business intelligence.** You cannot answer "how much REAL did the platform issue in Q1?" without rebuilding history from logs.
- **Blockchain incompatibility.** On-chain transactions are ledger entries. A balance field cannot absorb them cleanly in v2/v3.

Double-entry solves all four. Every financial event is recorded as two entries that sum to zero. The balance is always derivable. The history is always complete. Concurrency is safe because entries are appended, not updated.

---

## 2. Sign Convention

**This must be consistent across all code. Any deviation causes reconciliation failures.**

```
Debit  = negative amount  (−)
Credit = positive amount  (+)
```

The sum of all entries in a ledger_transaction must always equal exactly **zero**.

### 2.1 Account Behavior by Type

| Account Type | Normal Balance | What "increases" means |
|---|---|---|
| `asset` | Debit (negative) | Platform received something |
| `liability` | Credit (positive) | Platform owes more |
| `equity` | Credit (positive) | Platform ownership stake grows |
| `revenue` | Credit (positive) | Platform earned income |
| `expense` | Debit (negative) | Platform spent from reserves |

### 2.2 User Account Classification

User REAL accounts are **liability accounts**. The platform owes the user their balance.

This is counterintuitive but correct. When a user deposits 100 REAL:
- The platform's obligation to the user increases: **CR user:alice:REAL +100**
- Something must balance it: **DR platform:deposits-pending:REAL −100**

A user's balance is always the sum of their `ledger_entries.amount` for their account_id. A positive sum means the platform owes them money. A negative sum means the user owes the platform (which should never happen in normal operation).

---

## 3. Account Taxonomy

### 3.1 Platform Boot Accounts

These accounts are created when the `3REAL` ecosystem row is seeded. They never belong to a user.

| owner_type | owner_id | asset_code | account_type | label | Description |
|---|---|---|---|---|---|
| platform | float | REAL | asset | Platform REAL Float | REAL held in platform custody |
| platform | float | USDT | asset | Platform USDT Float | USDT held in custody (v2) |
| platform | float | TON | asset | Platform TON Float | TON held in custody (v2) |
| platform | deposits-pending | REAL | liability | Pending Deposit Escrow | REAL deposited but not yet settled |
| platform | withdrawals-pending | REAL | liability | Pending Withdrawal Escrow | REAL reserved for approved withdrawals |
| platform | rewards-pool | REAL | expense | Referral Rewards Pool | Funded at launch; drained by rewards |
| platform | fees | REAL | revenue | Fee Collection | Platform fee income |
| platform | equity | REAL | equity | Platform Equity | Platform's own REAL allocation |

### 3.2 User Accounts

User accounts are created **lazily** — on the user's first financial event in a given ecosystem.

| owner_type | owner_id | asset_code | account_type | label | Created When |
|---|---|---|---|---|---|
| user | {user_uuid} | REAL | liability | {displayName} REAL | First deposit/reward in 3REAL |
| user | {user_uuid} | USDT | liability | {displayName} USDT | First USDT interaction (v2) |
| user | {user_uuid} | TON | liability | {displayName} TON | First TON interaction (v2) |

**Important:** User accounts are liability accounts from the platform's perspective. The "balance" a user sees is what the platform owes them.

---

## 4. Journal Entry Templates

Each template shows the ledger_transaction that groups the entries, followed by the entries. Format: `DR/CR  account_slug  amount`.

### 4.1 User Deposits (Manual, v1)

**Scenario:** Admin approves a 100 REAL deposit request.

```
ledger_transaction:
  type: 'deposit'
  status: 'completed'
  reference_id: transactions.id
  reference_type: 'deposit_request'

ledger_entries:
  DR  platform:deposits-pending:REAL    −100
  CR  user:{id}:REAL                    +100

Sum: −100 + 100 = 0  ✓
```

**Note:** The `platform:deposits-pending:REAL` account is a holding account. When the user submitted the deposit request, the admin records that 100 REAL was received from the user. On approval, it moves from pending to the user's account.

**Alternative interpretation:** If platform doesn't hold the REAL until settlement, substitute `platform:float:REAL` as the debit side. The choice depends on whether "float" represents platform's own REAL or custodied REAL. For simplicity in v1, use `deposits-pending` for the escrow model.

### 4.2 Platform Receives Cash for REAL (Fiat On-Ramp, v1)

**Scenario:** User sends EUR bank transfer. Admin confirms receipt and credits REAL.

```
ledger_transaction:
  type: 'fiat_deposit'
  status: 'completed'

ledger_entries:
  DR  platform:deposits-pending:REAL    −100     (escrow account clears)
  CR  user:{id}:REAL                    +100     (user's claim increases)
  DR  platform:fees:REAL                −5       (platform keeps 5 REAL fee)
  CR  platform:float:REAL               +5       (fee income recorded)

Wait — this is wrong. Let's separate fee from principal.
```

**Correct separation with fee:**

```
1. Principal settlement:
  DR  platform:deposits-pending:REAL    −95
  CR  user:{id}:REAL                    +95

2. Fee entry (same ledger_transaction):
  DR  platform:float:REAL               −5
  CR  platform:fees:REAL                +5

Sum per entry group: 0  ✓
Total sum: −95+95 + −5+5 = 0  ✓
```

The fee is moved from `platform:float` (the pool of REAL the platform controls) to `platform:fees` (revenue account). The user receives net 95.

### 4.3 User Withdrawal (Admin Approved, v1)

**Scenario:** User requests withdrawal of 50 REAL. Admin approves after verifying receipt.

**Step 1: Reservation (when admin approves but before sending):**
```
ledger_transaction:
  type: 'withdrawal'
  status: 'processing'

ledger_entries:
  DR  user:{id}:REAL                    −50   (user's balance decreases)
  CR  platform:withdrawals-pending:REAL  +50   (reserved for payout)
```

**Step 2: Completion (after sending confirmed):**
```
ledger_transaction:
  type: 'withdrawal_settlement'
  status: 'completed'

ledger_entries:
  DR  platform:withdrawals-pending:REAL  −50
  CR  platform:float:REAL                +50   (REAL returns to platform pool)

-- OR if REAL was actually sent out:
  DR  platform:withdrawals-pending:REAL  −50
  CR  platform:equity:REAL               +50   (reduces platform liability)
```

**v1 simplification:** For manual withdrawals, combine steps. When admin marks withdrawal complete, write both entry groups in one atomic transaction.

### 4.4 Referral Reward

**Scenario:** User A refers User B. System issues 10 REAL reward to User A.

```
ledger_transaction:
  type: 'referral_reward'
  reference_id: referrals.id
  reference_type: 'referral'

ledger_entries:
  DR  platform:rewards-pool:REAL    −10
  CR  user:{A.id}:REAL              +10

Sum: 0  ✓
```

**For 2-tier referral** (User C was referred by User B who was referred by User A):

```
When User C's registration is confirmed:

Transaction 1 — reward to User B (direct referrer, level 1):
  DR  platform:rewards-pool:REAL    −10
  CR  user:{B.id}:REAL              +10

Transaction 2 — reward to User A (indirect referrer, level 2):
  DR  platform:rewards-pool:REAL    −3
  CR  user:{A.id}:REAL              +3
```

Each transaction is separate and independently referenceable to its `referrals` row.

### 4.5 Platform Reward Pool Seeding

**Scenario:** At platform launch, the operator allocates 1,000,000 REAL to the rewards pool.

```
ledger_transaction:
  type: 'initial_credit'
  note: 'Platform rewards pool seeding at launch'

ledger_entries:
  DR  platform:equity:REAL          −1,000,000
  CR  platform:rewards-pool:REAL    +1,000,000

Sum: 0  ✓
```

This is the only time the equity account should be debited for pool funding. All subsequent pool credits require a corresponding funding event.

### 4.6 USDT → REAL Conversion (Phase 2)

**Scenario:** User deposits 100 USDT. Platform converts at rate 1 USDT = 50 REAL with 2% fee.

```
-- Step 1: USDT deposit confirmed on-chain
ledger_transaction:
  type: 'blockchain_deposit'
  chain_tx_hash: '0xabc...'
  chain_network: 'trc20'

ledger_entries:
  DR  platform:float:USDT        −100
  CR  user:{id}:USDT             +100

-- Step 2: User converts USDT to REAL
  Net REAL = 100 × 50 × 0.98 = 4,900 REAL
  Fee REAL = 100 × 50 × 0.02 = 100 REAL

ledger_transaction:
  type: 'conversion'
  note: 'USDT→REAL at 50.000000 REAL/USDT, 2% fee'

ledger_entries:
  DR  user:{id}:USDT             −100        (USDT balance clears)
  CR  platform:float:USDT        +100        (USDT goes to platform float)
  DR  platform:float:REAL        −4,900      (platform provides REAL)
  CR  user:{id}:REAL             +4,900      (user receives net REAL)
  DR  platform:float:REAL        −100        (fee from platform float)
  CR  platform:fees:REAL         +100        (fee income)

Sum: −100+100 + −4900+4900 + −100+100 = 0  ✓
```

### 4.7 Reversal / Correction

**Scenario:** A deposit was credited with wrong amount. Correction required.

```
-- Original (wrong):
  DR  platform:deposits-pending:REAL    −100
  CR  user:{id}:REAL                    +100

-- Reversal (new ledger_transaction with type: 'correction'):
  DR  user:{id}:REAL                    −100   (reverse the original)
  CR  platform:deposits-pending:REAL    +100

-- Correct entry:
  DR  platform:deposits-pending:REAL    −90
  CR  user:{id}:REAL                    +90
```

**Rule:** Ledger entries are never updated or deleted. Corrections are always explicit reversals followed by correct entries. This preserves a complete, auditable history.

---

## 5. Integrity Rules

These must be enforced at the application layer (not just the DB) since they span multiple rows.

### 5.1 Transaction Sum = Zero

Every function that writes ledger entries must assert:
```typescript
const sum = entries.reduce((acc, e) => acc + e.amount, 0);
assert(Math.abs(sum) < 0.000001, 'Ledger transaction does not balance');
```

Use a threshold (< 0.000001) rather than exact zero to handle floating-point edge cases. Use `NUMERIC(28,8)` in Postgres to avoid floating-point entirely.

### 5.2 Atomic Writes

A ledger_transaction and all its ledger_entries must be written in a single database transaction. If any entry write fails, the entire transaction rolls back.

```typescript
await prisma.$transaction(async (tx) => {
  const lt = await tx.ledgerTransaction.create({ ... });
  await tx.ledgerEntry.createMany({ data: entries.map(e => ({ ...e, ledgerTransactionId: lt.id })) });
  // Assert sum = 0 before commit
});
```

### 5.3 No Updates to Ledger Entries

The `ledger_entries` table should never receive UPDATE or DELETE statements in production. Enforce this at the application layer (Prisma does not expose `update()` in the journal module). Optionally enforce with a PostgreSQL trigger.

### 5.4 Account Must Exist Before Entry

Never create a ledger entry referencing an account_id that doesn't exist. Always use `findOrCreate` for user accounts (lazy creation pattern).

### 5.5 Ecosystem Consistency

All entries in a ledger_transaction must share the same `ecosystem_id`. Cross-ecosystem transfers (e.g., spending 3REAL REAL in Shahnameh) require two separate transactions linked by a reference.

---

## 6. Balance Calculation Patterns

### 6.1 User Balance (Single Asset, Single Ecosystem)

```sql
SELECT COALESCE(SUM(le.amount), 0) AS balance
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'user'
  AND a.owner_id = :user_id
  AND a.asset_code = 'REAL'
  AND le.ecosystem_id = :ecosystem_id;
```

### 6.2 User Multi-Asset Wallet Overview

```sql
SELECT 
  a.asset_code,
  COALESCE(SUM(le.amount), 0) AS confirmed_balance
FROM accounts a
LEFT JOIN ledger_entries le 
  ON le.account_id = a.id 
  AND le.ecosystem_id = :ecosystem_id
WHERE a.owner_type = 'user'
  AND a.owner_id = :user_id
  AND a.is_active = TRUE
GROUP BY a.asset_code;
```

### 6.3 Total REAL in Circulation (Platform-Wide)

```sql
SELECT COALESCE(SUM(le.amount), 0) AS total_user_real
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'user'
  AND a.asset_code = 'REAL';
```

### 6.4 Platform Rewards Pool Remaining

```sql
SELECT COALESCE(SUM(le.amount), 0) AS pool_balance
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'platform'
  AND a.owner_id = 'rewards-pool'
  AND a.asset_code = 'REAL';
```

---

## 7. Performance Model

### 7.1 The Problem

As the platform grows, `ledger_entries` will have millions of rows. A balance query that scans all entries for a user is increasingly slow.

### 7.2 Running Balance Snapshot

The `ledger_entries.running_balance` field (nullable in current schema) solves this. When an entry is written, record the account's balance after this entry.

```typescript
const previousBalance = await getLatestRunningBalance(accountId);
const newBalance = previousBalance + newEntry.amount;
await tx.ledgerEntry.create({
  data: { ...entry, running_balance: newBalance }
});
```

Balance query becomes:
```sql
SELECT running_balance
FROM ledger_entries
WHERE account_id = :account_id
ORDER BY created_at DESC
LIMIT 1;
```

**Risk:** If one entry's running_balance is wrong, all subsequent balances for that account are wrong. Mitigate with a scheduled reconciliation job that computes the full SUM and compares to the latest running_balance.

### 7.3 Reconciliation Schedule

Run nightly:
1. For all active accounts with activity in the last 24 hours, compute SUM(amount) from scratch
2. Compare to the latest running_balance entry
3. If divergence > threshold, alert admin and log to `activity_logs`

---

## 8. Ledger vs. Transactions Table — Clarification

A common question: what is `transactions` for if `ledger_transactions` exists?

| Table | Purpose | Created When | Contains |
|---|---|---|---|
| `transactions` | Deposit/withdrawal **request** | When user submits request | User intent, payment reference, status workflow |
| `ledger_transactions` | Financial **settlement** | When admin approves | Accounting record, immutable |

The lifecycle: `transactions` row is created first (status: pending). When admin approves, a `ledger_transaction` is created and linked back (`transactions.ledger_tx_id = ledger_transactions.id`). The `transactions` row status is then updated to `completed`.

If admin rejects: `ledger_transaction` is never created. Only `transactions.status` changes to `rejected`.

This separation means the accounting ledger is never polluted with rejected or pending events.
