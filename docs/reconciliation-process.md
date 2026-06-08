# Reconciliation Process — Phase 10

**Date:** 2026-06-08  
**Scope:** Ledger integrity verification, balance audit procedures

---

## 1. Core Principle

3REAL uses a **double-entry ledger** where every financial event creates at least two `ledger_entries` that sum to exactly zero:

```
Debit (negative)  +  Credit (positive)  =  0
```

Any deviation from zero in a completed transaction indicates a data integrity problem.

---

## 2. Integrity Check: `runLedgerIntegrityCheck()`

**Location:** `lib/admin/reconciliation.ts`

### Algorithm

```sql
SELECT
  lt.id,
  lt.type::text,
  lt."createdAt",
  SUM(le.amount)::text AS "sumAmount",
  COUNT(le.id) AS "entryCount"
FROM ledger_transactions lt
JOIN ledger_entries le ON le."ledgerTransactionId" = lt.id
WHERE lt.status = 'completed'
GROUP BY lt.id, lt.type, lt."createdAt"
HAVING ABS(SUM(le.amount)) > 0.000001
ORDER BY ABS(SUM(le.amount)) DESC
```

The `HAVING ABS(SUM) > 0.000001` threshold allows for floating-point representation epsilon. Any sum exceeding this threshold is reported as an imbalance.

### Output

```typescript
{
  status: "PASS" | "FAIL",
  totalTransactionsChecked: number,  // count of completed LedgerTransactions
  imbalancedCount: number,           // rows returned by HAVING clause
  totalImbalanceAmount: number,      // sum of |Δ| across all imbalanced txs
  imbalancedTransactions: [{
    id: string,                      // LedgerTransaction UUID
    type: string,                    // e.g. "referral_reward"
    createdAt: Date,
    sumAmount: number,               // the actual imbalance (should be ~0)
    entryCount: number,              // how many entries were in this tx
  }]
}
```

### PASS Criteria

- `imbalancedCount === 0`
- All completed transactions have entries that sum within ±0.000001

### FAIL Response

If any transactions fail, the reconciliation page:
1. Displays a red FAIL banner with total imbalance amount
2. Lists each imbalanced transaction with its ID, type, date, entry count, and Δ amount
3. Does not auto-remediate — requires manual investigation and a correction entry

---

## 3. Balance Audit: `getAccountBalances()`

Computes the current balance for every account in the system:

```sql
SELECT
  a."ownerType",
  a."ownerId",
  a."assetCode",
  a."accountType",
  a.label,
  COALESCE(SUM(le.amount) FILTER (WHERE lt.status = 'completed'), 0) AS balance
FROM accounts a
LEFT JOIN ledger_entries le ON le."accountId" = a.id
LEFT JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
GROUP BY a.id, a."ownerType", a."ownerId", a."assetCode", a."accountType", a.label
```

Only `completed` transactions contribute to balances. Pending/processing transactions are not included.

---

## 4. Grand Total Verification

For a closed double-entry system, the sum of ALL ledger entries across ALL accounts and ALL assets must equal zero:

```
Σ(all ledger_entries.amount for completed transactions) = 0
```

The reconciliation page computes `grandTotalByAsset` — the sum per asset across all accounts. In a healthy system:
- Each asset's grand total should be **≈ 0** (within floating-point tolerance)
- Any non-zero grand total per asset means money was created or destroyed (ledger bug)

### Why Non-Zero Grand Totals Are Expected During Development

During seeding, `initial_credit` or `pool_topup` transactions inject REAL into the system from outside the ledger (i.e., from the equity account). If the equity account exists, its balance is negative (debit), exactly offsetting the positive user/pool balances, and the grand total is zero. If the equity account was never created, the grand total will appear non-zero — this is a seeding gap, not a bug in the transaction engine.

---

## 5. Account Structure

### Platform Accounts (ownerType = 'platform')

| ownerId | Purpose |
|---------|---------|
| `rewards-pool` | REAL held for referral reward payouts |
| `float` | Operational float for fiat |
| `fees` | Collected fee revenue |
| `escrow` | Funds held during withdrawal processing |
| `equity` | Injected capital (debit = issued capital) |

### User Accounts (ownerType = 'user')

One account per (user × asset) created on first credit. Balance = SUM(ledger_entries) for completed transactions.

---

## 6. When to Run Reconciliation

| Trigger | Frequency | Who |
|---------|-----------|-----|
| Routine audit | Daily | Admin (automated alert future state) |
| Before any bulk operation | As needed | Super admin |
| After a production incident | Immediately | Engineering + super admin |
| Regulatory reporting | Monthly | Compliance officer |
| After DB migration | Immediately post-migration | Engineering |

---

## 7. Remediation Procedure

If `runLedgerIntegrityCheck()` returns FAIL:

1. **Identify** the imbalanced transaction ID(s) from the report
2. **Inspect** the transaction's entries: `SELECT * FROM ledger_entries WHERE "ledgerTransactionId" = '{id}'`
3. **Determine** the missing or extra entry (which account is short or excess)
4. **Create a correction entry** using a `LedgerTransaction` of type `correction`:
   ```sql
   -- Example: TX is missing a debit entry (sum is +50 instead of 0)
   INSERT INTO ledger_transactions (..., type, note) VALUES (..., 'correction', 'Fix imbalanced TX {id}');
   INSERT INTO ledger_entries (..., amount) VALUES
     (..., pool_account_id, -50),   -- debit the pool
     (..., equity_account_id, 50);  -- credit equity (manual adjustment)
   ```
5. **Re-run** the integrity check — it should now return PASS
6. **Audit log** the correction with the admin's ID and a full explanation in the `note` field

---

## 8. Operational Invariants

These must always hold in production:

1. **No direct balance updates** — `users` table has no balance column; all balances derive from ledger
2. **Immutable entries** — `ledger_entries` rows are never UPDATEd or DELETEd
3. **Two-entry minimum** — every `LedgerTransaction` has at least 2 entries
4. **Zero sum** — entries in every `completed` transaction sum to 0
5. **Sequential approval** — ledger entries created only after admin approval (never on request submission)
6. **Pool protection** — rewards engine checks pool balance before issuing; skips if insufficient

---

## 9. Escrow Verification

Withdrawals in `processing` status should have a corresponding escrow debit in the ledger. The expected escrow balance equals the sum of all `processing` withdrawal amounts.

```sql
-- Expected escrow
SELECT SUM(amount) FROM transactions
WHERE type = 'withdrawal' AND status = 'processing';

-- Actual escrow balance
SELECT SUM(le.amount)
FROM ledger_entries le
JOIN accounts a ON le."accountId" = a.id
JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
WHERE a."ownerType" = 'platform' AND a."ownerId" = 'escrow'
  AND lt.status = 'completed';
```

These should match. A discrepancy means a withdrawal was moved to `processing` without the corresponding ledger entry.
