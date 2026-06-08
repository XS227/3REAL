# REAL Deposit Detection — E2E Test Plan

## Prerequisites

1. A TON wallet with REAL Jetton balance (testnet or mainnet)
2. The platform deposit address configured in Admin → TON Settings
3. A user account with a verified linked TON wallet

---

## Test Cases

### T1 — Happy Path: Deposit Detected and Credited

**Setup:**
- Configure `ton.deposit_address` = `<platform address>`
- User has linked wallet `W1`
- Send 10 REAL from `W1` to the deposit address on-chain
- Wait for transaction to confirm (typically < 5 seconds on TON mainnet)

**Steps:**
1. Visit `/dashboard/deposit?asset=REAL`
2. Click "Check for Deposit"

**Expected:**
- API response: `{"credited":[{"amount":10,"eventId":"...","fromAddress":"...","txId":"..."}],"found":1}`
- Deposit appears in the table below
- User's REAL balance increases by 10 on `/dashboard/wallet`
- Notification created: "REAL Deposit Credited"
- Audit log entry: `deposit.blockchain_credited`

**DB check:**
```sql
SELECT * FROM transactions WHERE asset_code='REAL' AND payment_method='ton' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM ledger_transactions WHERE chain_tx_hash='<eventId>';
SELECT * FROM ledger_entries WHERE ledger_transaction_id='<ledgerTxId>';
-- entries: one negative (float), one positive (user) — sum = 0
```

---

### T2 — Idempotency: Check Twice, Credit Once

**Steps:**
1. After T1, click "Check for Deposit" again immediately

**Expected:**
- Response: `{"credited":[],"skipped":1,"found":0}`
- No new `transactions` or `ledger_transactions` rows
- Balance unchanged

---

### T3 — Fake Jetton Rejection

**Steps:**
1. Send a different Jetton (not REAL master) from `W1` to the deposit address
2. Click "Check for Deposit"

**Expected:**
- Transfer not detected (Jetton address filtered by whitelist in `getJettonActivity`)
- Response: `{"credited":[],"skipped":0,"found":0}`

---

### T4 — Wrong Sender (Unlinked Wallet)

**Setup:**
- Wallet `W2` is NOT linked to this user's account
- Send REAL from `W2` to the deposit address

**Steps:**
1. Click "Check for Deposit" as the user

**Expected:**
- Transfer not detected (sender hash not in `linkedHashes`)
- Response: `{"credited":[],"skipped":0,"found":0}`

---

### T5 — No Deposit Address Configured

**Setup:**
- Set `ton.deposit_address = ""` in Admin → TON Settings

**Steps:**
1. Click "Check for Deposit"

**Expected:**
- HTTP 503: `{"error":"Deposit address not yet configured. Contact support."}`
- "Check for Deposit" button disabled or shows error in UI

---

### T6 — No Linked Wallets

**Setup:**
- User has no linked TON wallets

**Steps:**
1. Visit `/dashboard/deposit?asset=REAL`
2. Click "Check for Deposit"

**Expected:**
- HTTP 400: `{"error":"No linked TON wallets. Connect a wallet first."}`
- UI shows amber warning: "No TON wallet connected"

---

### T7 — Below Minimum Amount

**Setup:**
- Send 0.5 REAL (500_000_000 nano) from linked wallet

**Steps:**
1. Click "Check for Deposit"

**Expected:**
- Transfer filtered by `amountNano >= MIN_REAL_NANO` (1_000_000_000)
- Response: `{"credited":[],"skipped":0,"found":0}`

---

### T8 — Multiple Deposits in One Check

**Setup:**
- Send 5 REAL and 20 REAL in separate transactions from `W1`

**Steps:**
1. Click "Check for Deposit" once

**Expected:**
- Both credited in one check
- Response: `{"credited":[...],"found":2}`
- Notification: "2 REAL deposits totaling 25 REAL have been credited."
- 4 ledger entries total (2 × debit float + 2 × credit user)

---

### T9 — Concurrent Check (Race Condition)

**Setup:**
- Two browser tabs open simultaneously
- Both click "Check for Deposit" at the same moment

**Expected:**
- One request credits the deposit, the other sees unique constraint violation
- Unique constraint error caught silently → `skipped: 1, found: 0`
- No 500 error surfaced to the user
- Net result: deposit credited exactly once

---

### T10 — Admin View

**Steps:**
1. Login as `admin@3real.no`
2. Visit `/admin/ton-deposits`

**Expected:**
- All credited REAL deposits visible in table
- Columns: Date, User email, Amount, From wallet, Tx hash, Status
- Deposit address configured indicator (green) or warning (amber)
- Pagination works for > 50 deposits

---

### T11 — Cross-User Isolation

**Setup:**
- User A linked wallet `W1`, sends REAL to deposit address
- User B has no linked wallets or different linked wallet

**Steps:**
1. User B clicks "Check for Deposit"

**Expected:**
- User B sees no new deposits
- User A's deposit NOT credited to User B

---

### T12 — Ledger Sum-to-Zero Verification

After any credited deposit, verify entries sum to zero:

```sql
SELECT SUM(amount::decimal) FROM ledger_entries
WHERE ledger_transaction_id = '<ledgerTxId>';
-- Result must be 0.000000000
```

---

## Admin Smoke Tests

| Check | Command / URL |
|---|---|
| Deposit address configured | `/admin/ton-settings` |
| REAL float account exists | `SELECT * FROM accounts WHERE owner_id='float' AND asset_code='REAL'` |
| Activity log entries | `/admin/audit-log` → filter `deposit.blockchain_credited` |
| Health check includes TON | `GET /api/ton/health` → `checks.jetton: "ok"` |

---

## Rollback / Correction

If a deposit was incorrectly credited:
1. Find the `ledger_transaction` by `chain_tx_hash`
2. Create a correction entry: DR user account, CR float account
3. Update `transaction.status` to `rejected` with admin note
4. Contact user

There is no automated rollback. Manual correction entries preserve full audit trail.
