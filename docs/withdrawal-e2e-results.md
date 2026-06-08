# Withdrawal E2E Validation Results

**Phase:** 8.5  
**Date:** 2026-06-08  
**Branch:** main  
**Server:** http://localhost:3003  
**Test user:** e2e-test@example.com (kycTier=2, emailVerified=true, 100 REAL funded)  
**No-KYC user:** no-kyc@example.com (kycTier=1, emailVerified=true)  
**Admin:** admin@3real.no (role=super_admin)

---

## Pre-test fix applied

**Critical bug fixed before test run:**  
`lib/ledger/balance.ts` — raw SQL used snake_case column names (`account_id`, `ledger_transaction_id`, `owner_type`, `owner_id`, `asset_code`) but PostgreSQL stores all columns in camelCase. All five column references were corrected to double-quoted camelCase (`"accountId"`, `"ledgerTransactionId"`, `"ownerType"`, `"ownerId"`, `"assetCode"`).  
This was a prerequisite: without the fix every call to `POST /api/withdrawals` returned HTTP 500 with `column le.account_id does not exist`.

---

## Results Summary

| # | Test | Result |
|---|------|--------|
| 1a | KYC tier 1 user blocked | PASS |
| 1b | Unauthenticated user blocked | PASS |
| 2 | Valid withdrawal created | PASS |
| 3 | Amount exceeds available balance | PASS |
| 4 | Amount below minimum | PASS |
| 5 | Invalid destination (too short) | PASS |
| 6 | Invalid asset code | PASS |
| 7 | GET withdrawal history | PASS |
| 8 | Admin approve | PASS |
| 9 | Double-approve idempotency | PASS |
| 10 | Admin reject with reason | PASS |
| 11 | Balance constraint after approval | PASS |
| 11b | Updated history / notifications / audit | PASS |

**13/13 PASS. 0 FAIL.**

---

## Detailed Results

### Test 1a — KYC tier 1 user blocked

**Request:**
```bash
POST /api/withdrawals
Cookie: [no-kyc user session, kycTier=1]
Body: {"assetCode":"REAL","amount":10,"destination":"EQC1234567890abcdefghij"}
```

**Result:** PASS  
HTTP 403 `{"error":"KYC tier 2 required for withdrawals"}`

**DB verification:** No transaction created.

---

### Test 1b — Unauthenticated user blocked

**Request:**
```bash
POST /api/withdrawals (no cookie)
Body: {"assetCode":"REAL","amount":10,"destination":"EQC1234567890abcdefghij"}
```

**Result:** PASS  
HTTP 307 redirect to `/auth/login?from=%2Fapi%2Fwithdrawals` (proxy.ts guard).

**DB verification:** No transaction created.

---

### Test 2 — Valid withdrawal created

**Request:**
```bash
POST /api/withdrawals
Cookie: [e2e-test user, kycTier=2]
Body: {"assetCode":"REAL","amount":50,"destination":"EQC_test_wallet_address_abc123"}
```

**Result:** PASS  
HTTP 201 `{"id":"61078caa-fa22-4b12-ac19-84fbd2f9ca3f","status":"pending"}`

**DB verification:**
```
id: 61078caa-fa22-4b12-ac19-84fbd2f9ca3f
type: withdrawal | status: pending | amount: 50.00 | assetCode: REAL
paymentRef: EQC_test_wallet_address_abc123 | ledgerTxId: NULL
```
- Status `pending`, no ledger entries created yet (correct).

**Audit log:**
```
action: withdrawal.created
actorId: 6b0e7e12... (e2e-test user)
meta: {txId, amount:50, assetCode:"REAL", destination:"EQC_test_wallet_address_abc123"}
```

---

### Test 3 — Amount exceeds available balance

**Request:**
```bash
POST /api/withdrawals
Body: {"assetCode":"REAL","amount":200,"destination":"EQC_test_wallet_address_abc123"}
```

**Result:** PASS  
HTTP 422 `{"error":"Insufficient balance. Available: 100 REAL"}`

**DB verification:** No transaction created.

---

### Test 4 — Amount below minimum

**Request:**
```bash
POST /api/withdrawals
Body: {"assetCode":"REAL","amount":5,"destination":"EQC_test_wallet_address_abc123"}
```

**Result:** PASS  
HTTP 422 `{"error":"Minimum withdrawal is 10 REAL"}`

**DB verification:** No transaction created.

---

### Test 5 — Invalid destination (too short)

**Request:**
```bash
POST /api/withdrawals
Body: {"assetCode":"REAL","amount":20,"destination":"EQ"}
```

**Result:** PASS  
HTTP 422 `{"error":"Destination address or bank details are required"}`

**DB verification:** No transaction created.

---

### Test 6 — Invalid asset code

**Request:**
```bash
POST /api/withdrawals
Body: {"assetCode":"BTC","amount":20,"destination":"bc1q_test_wallet_address"}
```

**Result:** PASS  
HTTP 422 `{"error":"Invalid asset"}`

**DB verification:** No transaction created.

---

### Test 7 — GET withdrawal history

**Request:**
```bash
GET /api/withdrawals
Cookie: [e2e-test user]
```

**Result:** PASS  
HTTP 200 — 1 withdrawal returned:
```
status: pending | amount: 50 | assetCode: REAL
```

---

### Test 8 — Admin approve withdrawal

**Request:**
```bash
PATCH /api/admin/withdrawals/61078caa-fa22-4b12-ac19-84fbd2f9ca3f
Cookie: [admin session]
Body: {"action":"approve"}
```

**Result:** PASS  
HTTP 200 `{"success":true}`

**DB verification:**
```sql
-- Transaction
status: approved | ledgerTxId: 5bdfdabc-1aca-46dc-8f03-57244a55ca53

-- LedgerTransaction
type: withdrawal | status: completed

-- LedgerEntries (2 balanced entries)
amount: -50.00 | ownerType: user     | ownerId: 6b0e7e12... | assetCode: REAL
amount: +50.00 | ownerType: platform | ownerId: withdrawals-pending | assetCode: REAL
```

**Ledger balance:** -50 + 50 = 0 (balanced). Correct double-entry.

**Notification:**
```
type: withdrawal_approved
title: Withdrawal Approved
body: Your withdrawal of 50 REAL has been approved and is being processed.
isRead: false
```

**Audit log:**
```
action: withdrawal.approved
actorId: 23e58dc0... (admin)
meta: {txId: "61078caa...", amount: 50, assetCode: "REAL"}
```

---

### Test 9 — Double-approve idempotency

**Request:**
```bash
PATCH /api/admin/withdrawals/61078caa-fa22-4b12-ac19-84fbd2f9ca3f
Cookie: [admin session]
Body: {"action":"approve"}
```

**Result:** PASS  
HTTP 409 `{"error":"This withdrawal has already been processed in the ledger"}`

**DB verification:**
```sql
-- Ledger entry count still 2 (not duplicated to 4)
SELECT COUNT(*) → 2
```

Idempotency guard (`ALREADY_SETTLED` check on `ledgerTxId`) fired correctly before any DB write.

---

### Test 10 — Admin reject with reason

**Setup:** Submitted second withdrawal (10 REAL) → W2_ID `eac92369-f476-47c6-a366-fd8357270420`

**Request:**
```bash
PATCH /api/admin/withdrawals/eac92369-f476-47c6-a366-fd8357270420
Cookie: [admin session]
Body: {"action":"reject","reason":"Destination address could not be verified"}
```

**Result:** PASS  
HTTP 200 `{"success":true}`

**DB verification:**
```sql
status: rejected
adminNote: Destination address could not be verified
ledgerTxId: NULL  ← no ledger settlement
```

**Balance verification — user balance unaffected by rejection:**
```sql
SELECT available_real → 50.00
```
Correct: only the approved 50 REAL was debited; the rejected 10 REAL was never debited.

**Notification:**
```
type: withdrawal_rejected
title: Withdrawal Rejected
body: Your withdrawal of 10 REAL was rejected. Reason: Destination address could not be verified
isRead: false
```

**Audit log:**
```
action: withdrawal.rejected
actorId: 23e58dc0... (admin)
meta: {txId: "eac92369...", amount: 10, reason: "Destination address could not be verified", assetCode: "REAL"}
```

---

### Test 11 — Balance constraint after approval

**Context:** User originally had 100 REAL; 50 approved (debited). Available now = 50 REAL.

**Request:**
```bash
POST /api/withdrawals
Body: {"assetCode":"REAL","amount":60,"destination":"EQC_over_balance_address"}
```

**Result:** PASS  
HTTP 422 `{"error":"Insufficient balance. Available: 50 REAL"}`

The `getUserBalances` function correctly returns the updated available balance after the approval debit.

---

### Test 11b — Updated history, notifications, audit logs

**GET /api/withdrawals** returned 2 withdrawals:
```
status: rejected | amount: 10 | assetCode: REAL | adminNote: "Destination address could not be verified"
status: approved | amount: 50 | assetCode: REAL
```

**Activity_logs (all 4 entries present):**
```
withdrawal.created  (W1 — 50 REAL)   actorId: user
withdrawal.approved (W1)              actorId: admin  
withdrawal.created  (W2 — 10 REAL)   actorId: user
withdrawal.rejected (W2)              actorId: admin
```

**Notifications (2 entries):**
```
withdrawal_approved — 50 REAL
withdrawal_rejected — 10 REAL, with reason
```

---

## Bugs Found

**None.** All 13 tests passed after the pre-test fix to `getUserBalances`.

The critical bug fixed before this test run:

| ID | File | Issue | Fix |
|----|------|-------|-----|
| BUG-005 | `lib/ledger/balance.ts` | Raw SQL used snake_case column names; PostgreSQL schema uses camelCase | Replaced `le.account_id`, `le.ledger_transaction_id`, `a.owner_type`, `a.owner_id`, `a.asset_code` with double-quoted camelCase equivalents |

---

## Final Ledger State

After full test run:

| Account | Type | Balance |
|---------|------|---------|
| user / 6b0e7e12 / REAL | liability | +50 (100 funded − 50 approved withdrawal) |
| platform / withdrawals-pending / REAL | liability | +50 (escrow for approved withdrawal) |
| platform / float / REAL | asset | +100 (unchanged — deposit funded this) |

Ledger is balanced. All entries sum to zero across each transaction.
