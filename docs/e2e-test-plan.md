# End-to-End Validation Plan — 3REAL Portal

**Scope:** Full lifecycle from user registration through deposit settlement and balance reflection.  
**Environment:** Local development (`http://localhost:3000`), PostgreSQL 14 `threereal_db`.  
**Notation:** `→` = expected result; `✓` = assertion to verify manually or via SQL.

---

## Prerequisites

Before running the plan, ensure:

1. Database is migrated and seeded — `npx prisma migrate deploy && npx prisma db seed`
2. The seed creates platform float accounts for all 6 assets (REAL, TON, USDT, EUR, NOK, TRY) — verify:
   ```sql
   SELECT owner_type, owner_id, asset_code, id FROM accounts
   WHERE owner_type = 'platform' AND owner_id = 'float'
   ORDER BY asset_code;
   ```
   → 6 rows, one per asset code.
3. An admin user exists with `role = 'super_admin'` or `'operator'`.
4. Storage directory exists and is writable: `storage/uploads/`.
5. Dev server running: `npm run dev`.

---

## Test Data

| Variable | Value |
|----------|-------|
| `TEST_EMAIL` | `e2e-test@example.com` |
| `TEST_PASSWORD` | `Test1234!` |
| `DEPOSIT_ASSET` | `REAL` |
| `DEPOSIT_AMOUNT` | `100` |
| `DEPOSIT_REF` | `E2E-TEST-001` |

---

## Step 1 — Register

**Action:** `POST /api/auth/register` with `{ email, password, firstName?, referralCode? }`  
or navigate to `/auth/register` and submit the form.

### DB Changes

```sql
-- New user row
SELECT id, email, email_verified, kyc_tier, role, session_version, referral_code, created_at
FROM users WHERE email = 'e2e-test@example.com';
```
✓ `email_verified = false`  
✓ `kyc_tier = 0`  
✓ `role = 'user'`  
✓ `session_version = 1`  
✓ `referral_code` is a non-null alphanumeric string  

```sql
-- Verification token created
SELECT id, type, expires_at, used_at
FROM auth_tokens
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
  AND type = 'email_verification';
```
✓ Exactly 1 row  
✓ `used_at IS NULL`  
✓ `expires_at` ≈ now + 24 hours  

```sql
-- Audit log
SELECT action, actor_id, meta FROM activity_logs
WHERE action = 'auth.register'
ORDER BY created_at DESC LIMIT 1;
```
✓ Row exists with `actor_id` matching new user's `id`

### UI Changes

→ Redirect to `/auth/login` (or a "check your email" confirmation screen)  
→ No dashboard access yet — navigating to `/dashboard` redirects to `/auth/login`  
→ In dev: verification link is printed to server console (no real email sent)

### Ledger Changes

None. No accounts or entries created at registration.

---

## Step 2 — Verify Email

**Action:** Copy the verification URL from server console. Open it in the browser.  
URL format: `/api/auth/verify-email?token=<uuid>`

### DB Changes

```sql
-- Token consumed
SELECT used_at FROM auth_tokens
WHERE type = 'email_verification'
  AND user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com');
```
✓ `used_at IS NOT NULL` (token consumed, not deleted)

```sql
-- User upgraded
SELECT email_verified, kyc_tier, session_version
FROM users WHERE email = 'e2e-test@example.com';
```
✓ `email_verified = true`  
✓ `kyc_tier = 1` (email verification grants Tier 1)  
✓ `session_version = 2` (incremented because kycTier changed — invalidates any stale JWT)

```sql
-- Audit log
SELECT action FROM activity_logs
WHERE action = 'auth.email_verified'
  AND actor_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
ORDER BY created_at DESC LIMIT 1;
```
✓ Row exists

### UI Changes

→ Redirect to `/auth/login` with a success banner ("Email verified. You can now log in.")  
→ `/dashboard` still inaccessible until login

### Ledger Changes

None.

---

## Step 3 — Login

**Action:** `POST /api/auth/login` with `{ email, password }`  
or navigate to `/auth/login` and submit.

### DB Changes

```sql
SELECT last_login_at FROM users WHERE email = 'e2e-test@example.com';
```
✓ `last_login_at` ≈ now (updated on every successful login)

```sql
-- Audit log
SELECT action, meta FROM activity_logs
WHERE action = 'auth.login'
  AND actor_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
ORDER BY created_at DESC LIMIT 1;
```
✓ Row exists

### JWT Claims (inspect via browser DevTools → Application → Cookies → `__3real_session`)

Decode the JWT payload (base64 middle segment):

✓ `sub` = user's `id`  
✓ `email` = `e2e-test@example.com`  
✓ `role` = `user`  
✓ `kycTier` = `1`  
✓ `emailVerified` = `true`  
✓ `sessionVersion` = `2` (matches DB — session is valid)  

### UI Changes

→ Redirect to `/dashboard`  
→ ProfileCard shows: Email Verified ✓, KYC Tier 1, 2FA pending  
→ KYC checklist item shows "Not verified" with link to `/dashboard/kyc`  
→ Wallet page shows all-zero balances  
→ Deposit buttons are enabled (REAL requires Tier 1 — already satisfied)

### Ledger Changes

None.

---

## Step 4 — Submit KYC

**Action:** Navigate to `/dashboard/kyc`. Upload documents:  
- **Passport** (`id_front`) — required. Use any `.jpg` or `.png` under 10 MB.  
- **National ID back** (`id_back`) — optional. Skip or include.  
- **Selfie** (`selfie`) — required.  
- **Proof of address** (`address_proof`) — required. Use a `.pdf` or image.

Click **Submit for Verification**.

### DB Changes

```sql
-- KYC profile created
SELECT id, status, tier_requested, submitted_at, reviewed_at
FROM kyc_profiles
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com');
```
✓ Exactly 1 row  
✓ `status = 'pending'`  
✓ `tier_requested = 2`  
✓ `submitted_at` ≈ now  
✓ `reviewed_at IS NULL`

```sql
-- Documents stored
SELECT doc_type, status, version, file_path FROM kyc_documents
WHERE profile_id = (
  SELECT id FROM kyc_profiles
  WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
)
ORDER BY doc_type, version;
```
✓ Rows for `id_front`, `selfie`, `address_proof` (minimum)  
✓ All `status = 'pending'`  
✓ All `version = 1` (first submission)  
✓ `file_path` values follow pattern `kyc/{userId}/{docType}/{timestamp}-{filename}`  

```sql
-- Files exist on disk
-- Verify each file_path by checking storage/uploads/{file_path}
```

```sql
-- Audit log
SELECT action FROM activity_logs
WHERE action IN ('kyc.submitted', 'kyc.resubmitted')
  AND actor_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
ORDER BY created_at DESC LIMIT 1;
```
✓ `kyc.submitted` (first submission)

### UI Changes

→ Page reloads (router.refresh() called after successful POST)  
→ Status banner: amber/yellow **"Pending Review"** — "Your documents have been submitted and are under review"  
→ Document slots show uploaded file previews (images) or file name (PDF)  
→ Submit button is hidden; re-upload is blocked while status is `pending`  
→ `/dashboard/kyc` header shows "Pending" badge

### Ledger Changes

None. KYC submission has no ledger impact.

---

## Step 5 — Approve KYC

**Action:** Log in as admin. Navigate to `/admin/kyc`. Find the submission in the "Awaiting Review" queue. Click **Review**. On the review page, click **Approve**.

This calls `PATCH /api/admin/kyc/{profileId}` with body `{ action: "approve" }`.

All DB writes below execute inside a single `prisma.$transaction`.

### DB Changes

```sql
-- Profile approved
SELECT status, reviewed_at, reviewed_by FROM kyc_profiles
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com');
```
✓ `status = 'approved'`  
✓ `reviewed_at` ≈ now  
✓ `reviewed_by` = admin user's `id`

```sql
-- Documents bulk-approved
SELECT doc_type, status FROM kyc_documents
WHERE profile_id = (
  SELECT id FROM kyc_profiles
  WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
);
```
✓ All rows `status = 'approved'`

```sql
-- User tier upgraded + session invalidated
SELECT kyc_tier, session_version FROM users
WHERE email = 'e2e-test@example.com';
```
✓ `kyc_tier = 2`  
✓ `session_version = 3` (incremented from 2 → 3; invalidates user's active JWT)

```sql
-- Notification created
SELECT type, title, body, channel, delivery_status FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
  AND type = 'kyc_approved'
ORDER BY created_at DESC LIMIT 1;
```
✓ Row exists  
✓ `channel = 'in_app'`  
✓ `delivery_status = 'sent'`

```sql
-- Audit log
SELECT action, actor_id FROM activity_logs
WHERE action = 'kyc.approved'
ORDER BY created_at DESC LIMIT 1;
```
✓ `actor_id` = admin's user `id`

### UI Changes

**Admin side:**  
→ After clicking Approve, redirected to `/admin/kyc`  
→ Profile moves from "Awaiting Review" to "Recently Reviewed" with `approved` badge

**User side (after re-login — see note below):**  
→ The user's `session_version` is now `3`, but their JWT still encodes `2`  
→ Next `requireAuth()` call detects mismatch → `validateSession()` returns `null` → redirect to `/auth/login`  
→ After logging in again: JWT includes `sessionVersion = 3`, `kycTier = 2`  
→ `/dashboard/kyc` shows green **"Approved"** banner  
→ ProfileCard shows KYC: Full Verification ✓  

**Session invalidation note:** The user must re-login after KYC approval. This is by design — the `sessionVersion` pattern ensures stale JWT claims (old kycTier) are never trusted.

### Ledger Changes

None. KYC approval has no ledger impact.

---

## Step 6 — Create Deposit

**Prerequisite:** User re-logs in (JWT must encode `sessionVersion = 3`).

**Action:** Navigate to `/dashboard/deposit` (or click Deposit on the REAL AssetCard in `/dashboard/wallet`).  
Select asset **REAL**. Enter amount `100`. Enter payment reference `E2E-TEST-001`. Optionally upload a proof image. Click **Submit Deposit Request**.

This calls `POST /api/deposits` (multipart FormData).

### DB Changes

```sql
-- Transaction row created
SELECT id, type, status, asset_code, amount, payment_ref, proof_file_path, ledger_tx_id, created_at
FROM transactions
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
  AND type = 'deposit'
ORDER BY created_at DESC LIMIT 1;
```
✓ `type = 'deposit'`  
✓ `status = 'pending'`  
✓ `asset_code = 'REAL'`  
✓ `amount = 100` (numeric)  
✓ `payment_ref = 'E2E-TEST-001'`  
✓ `ledger_tx_id IS NULL` — **ledger is not touched yet**  
✓ If proof uploaded: `proof_file_path` follows `deposits/{userId}/{txId}/proof.{ext}`

```sql
-- Audit log
SELECT action, actor_id FROM activity_logs
WHERE action = 'deposit.created'
ORDER BY created_at DESC LIMIT 1;
```
✓ `actor_id` = user's `id`

### UI Changes

→ DepositForm shows success state ("Deposit request submitted")  
→ Deposit history table (below the form) shows a new row: **100 REAL — Pending**  
→ `/dashboard/wallet` REAL balance is unchanged (still `0.00`)  
→ No ledger impact until admin approves

### Ledger Changes

None. Submission creates a transaction record only — no ledger_transactions or ledger_entries rows are created.

---

## Step 7 — Approve Deposit

**Action:** Log in as admin. Navigate to `/admin/deposits`. Find the pending REAL deposit. Click **Review**. Verify the amount, user, and proof (if any). Click **Approve & Credit Ledger**.

This calls `PATCH /api/admin/deposits/{txId}` with body `{ action: "approve" }`.

All ledger writes below execute inside a single `prisma.$transaction` with row-level locking.

### DB Changes

```sql
-- Transaction settled
SELECT status, ledger_tx_id FROM transactions
WHERE id = '<txId>';
```
✓ `status = 'completed'`  
✓ `ledger_tx_id IS NOT NULL` (FK to ledger_transactions)

```sql
-- LedgerTransaction created
SELECT id, type, status, reference_id, reference_type
FROM ledger_transactions
WHERE reference_id = '<txId>' AND reference_type = 'deposit_request';
```
✓ Exactly 1 row  
✓ `type = 'deposit'`  
✓ `status = 'completed'`  
✓ `reference_id` = `transactions.id`

```sql
-- Two LedgerEntry rows
SELECT e.account_id, a.owner_type, a.owner_id, a.asset_code, e.amount
FROM ledger_entries e
JOIN accounts a ON a.id = e.account_id
WHERE e.ledger_tx_id = (
  SELECT ledger_tx_id FROM transactions WHERE id = '<txId>'
)
ORDER BY e.amount;
```
✓ Exactly 2 rows:

| `owner_type` | `owner_id` | `asset_code` | `amount` |
|--------------|------------|--------------|----------|
| `platform`   | `float`    | `REAL`       | `-100`   |
| `user`       | `{userId}` | `REAL`       | `+100`   |

✓ Sum of amounts = 0 (double-entry balanced)

```sql
-- User account created (if first REAL deposit)
SELECT id, owner_type, owner_id, asset_code FROM accounts
WHERE owner_type = 'user'
  AND owner_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
  AND asset_code = 'REAL';
```
✓ Exactly 1 row (created by `getOrCreateUserAccount` inside the transaction)

```sql
-- Notification created
SELECT type, title, delivery_status FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
  AND type = 'deposit_approved'
ORDER BY created_at DESC LIMIT 1;
```
✓ Row exists, `delivery_status = 'sent'`

```sql
-- Audit log
SELECT action, actor_id, meta FROM activity_logs
WHERE action = 'deposit.approved'
ORDER BY created_at DESC LIMIT 1;
```
✓ `actor_id` = admin's `id`

### UI Changes

**Admin side:**  
→ After clicking Approve, redirected to `/admin/deposits`  
→ Deposit moves from pending queue to reviewed with `completed` badge  
→ Approve button is now locked ("Already settled") if review page is revisited

**User side:**  
→ `/dashboard/deposit` history row changes badge: **Pending → Completed**  
→ `/dashboard/wallet` REAL balance shows **100.00 REAL**  
→ AssetCard available balance: `100.00`; pending balance: `0.00`

### Ledger Changes

| Account | Type | Asset | Entry | Running Balance |
|---------|------|-------|-------|-----------------|
| `platform / float / REAL` | ASSET | REAL | −100 (debit) | decreases by 100 |
| `user / {userId} / REAL` | LIABILITY | REAL | +100 (credit) | 0 → 100 |

---

## Step 8 — Verify Ledger Entries

Comprehensive ledger integrity check after deposit approval.

```sql
-- All entries for this ledger transaction
SELECT
  lt.id            AS ledger_tx_id,
  lt.type,
  lt.status,
  lt.reference_id,
  a.owner_type,
  a.owner_id,
  a.asset_code,
  e.amount
FROM ledger_transactions lt
JOIN ledger_entries e ON e.ledger_tx_id = lt.id
JOIN accounts a ON a.id = e.account_id
WHERE lt.reference_id = '<txId>'
ORDER BY e.amount;
```

**Expected output (2 rows):**

| `ledger_tx_id` | `type` | `status` | `owner_type` | `owner_id` | `asset_code` | `amount` |
|----------------|--------|----------|--------------|------------|--------------|----------|
| `{uuid}`       | deposit | completed | platform    | float      | REAL         | -100     |
| `{uuid}`       | deposit | completed | user        | {userId}   | REAL         | +100     |

```sql
-- Sanity check: sum of all entries in this transaction = 0
SELECT SUM(amount::numeric) AS balance_check
FROM ledger_entries
WHERE ledger_tx_id = (SELECT ledger_tx_id FROM transactions WHERE id = '<txId>');
```
✓ `balance_check = 0`

```sql
-- Bidirectional link integrity
SELECT
  t.id AS transaction_id,
  t.status AS tx_status,
  t.ledger_tx_id,
  lt.reference_id,
  lt.reference_type
FROM transactions t
JOIN ledger_transactions lt ON lt.id = t.ledger_tx_id
WHERE t.id = '<txId>';
```
✓ `transaction_id = ledger_transactions.reference_id` (bidirectional link intact)

```sql
-- No duplicate ledger transactions for this deposit (idempotency check)
SELECT COUNT(*) FROM ledger_transactions
WHERE reference_id = '<txId>' AND reference_type = 'deposit_request';
```
✓ Count = 1 (exactly one settlement, never double-credited)

---

## Step 9 — Verify Wallet Balance

```sql
-- Raw balance from getUserBalances logic
SELECT
  a.asset_code,
  SUM(CASE WHEN lt.status = 'completed' THEN e.amount::numeric ELSE 0 END) AS available,
  SUM(CASE WHEN lt.status IN ('pending','processing') THEN e.amount::numeric ELSE 0 END) AS pending
FROM ledger_entries e
JOIN accounts a ON a.id = e.account_id
JOIN ledger_transactions lt ON lt.id = e.ledger_tx_id
WHERE a.owner_type = 'user'
  AND a.owner_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
GROUP BY a.asset_code;
```

✓ Row for `REAL`: `available = 100`, `pending = 0`  
✓ No rows for other assets (or all zeros if accounts were pre-created)

**UI verification (`/dashboard/wallet`):**  
→ REAL AssetCard shows **100.00 REAL**  
→ "Available" sub-label: `100.00`  
→ "Pending" sub-label: `0.00`  
→ All other asset cards: `0.00`

**UI verification (`/dashboard`):**  
→ BalanceCard (if REAL-specific): shows `100.00 REAL`

---

## Step 10 — Verify Notifications

```sql
-- All notifications for the test user, in order
SELECT type, title, body, channel, delivery_status, sent_at, read_at
FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
ORDER BY sent_at ASC;
```

**Expected rows (at minimum):**

| `type` | `title` | `channel` | `delivery_status` |
|--------|---------|-----------|------------------|
| `kyc_approved` | Identity Verification Approved | `in_app` | `sent` |
| `deposit_approved` | Deposit Approved | `in_app` | `sent` |

✓ Both rows exist  
✓ `sent_at IS NOT NULL`  
✓ `read_at IS NULL` (unread — notification bell UI is Phase 10)  
✓ `delivery_status = 'sent'` for both  

**Note:** Notification bell UI (in-app inbox) is not yet implemented — these rows exist but are not surfaced to the user. Verify via SQL only at this stage.

---

## Step 11 — Verify Audit Logs

Complete audit trail for the full lifecycle:

```sql
SELECT
  al.action,
  al.actor_id,
  u.email    AS actor_email,
  al.meta,
  al.created_at
FROM activity_logs al
LEFT JOIN users u ON u.id = al.actor_id
WHERE al.actor_id = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
   OR (al.meta::text LIKE '%e2e-test@example.com%')
   OR al.action IN ('kyc.approved', 'deposit.approved')
ORDER BY al.created_at ASC;
```

**Expected audit trail (in order):**

| `action` | `actor_email` | Notes |
|----------|---------------|-------|
| `auth.register` | `e2e-test@example.com` | User self |
| `auth.email_verified` | `e2e-test@example.com` | User self |
| `auth.login` | `e2e-test@example.com` | First login |
| `kyc.submitted` | `e2e-test@example.com` | User self |
| `kyc.approved` | `admin@...` | Actor = admin who approved |
| `auth.login` | `e2e-test@example.com` | Re-login after session invalidation |
| `deposit.created` | `e2e-test@example.com` | User self |
| `deposit.approved` | `admin@...` | Actor = admin who approved |

✓ Every action is logged  
✓ Admin actions (`kyc.approved`, `deposit.approved`) have `actor_id` = admin's user ID, not the test user  
✓ No gaps in the chain — every state transition has an audit entry  
✓ `meta` fields contain contextual data (profile IDs, transaction IDs, amounts)

---

## Idempotency Checks

These edge cases must NOT cause double-crediting or duplicate state.

### Double-Approval Guard (Deposit)

Attempt to approve the same deposit a second time by calling `PATCH /api/admin/deposits/{txId}` again with `{ action: "approve" }`.

→ Response: `409 Conflict` with `{ error: "ALREADY_SETTLED" }`  
→ No new `ledger_transactions` row created  
→ `COUNT(*) FROM ledger_transactions WHERE reference_id = '<txId>'` remains 1  
→ User balance unchanged

### Stale Session Rejection (Post-KYC-Approval)

After admin approves KYC (which increments `sessionVersion`), the user's existing cookie is stale.  
Navigate to any protected page without re-logging in.

→ `validateSession()` detects `jwtSessionVersion (2) ≠ dbSessionVersion (3)`  
→ Response: redirect to `/auth/login`  
→ No 500 error; no stale kycTier claims accepted

### Re-submission Block (KYC)

Attempt to submit KYC again while `status = 'approved'`.

→ `POST /api/kyc/submit` responds `409 Conflict`  
→ No new `kyc_profiles` or `kyc_documents` rows created

---

## Cleanup

After validation, remove test data to avoid polluting the dev database:

```sql
-- Identify test user
SELECT id FROM users WHERE email = 'e2e-test@example.com';
-- Use this ID as :userId in the deletes below

-- Delete in dependency order
DELETE FROM notifications      WHERE user_id = :userId;
DELETE FROM ledger_entries     WHERE account_id IN (SELECT id FROM accounts WHERE owner_id = :userId);
DELETE FROM ledger_transactions WHERE reference_id IN (SELECT id FROM transactions WHERE user_id = :userId);
DELETE FROM transactions       WHERE user_id = :userId;
DELETE FROM kyc_documents      WHERE profile_id IN (SELECT id FROM kyc_profiles WHERE user_id = :userId);
DELETE FROM kyc_profiles       WHERE user_id = :userId;
DELETE FROM auth_tokens        WHERE user_id = :userId;
DELETE FROM activity_logs      WHERE actor_id = :userId;
DELETE FROM accounts           WHERE owner_id = :userId AND owner_type = 'user';
DELETE FROM users              WHERE id = :userId;
```

Also remove uploaded test files:

```bash
rm -rf storage/uploads/kyc/<userId>/
rm -rf storage/uploads/deposits/<userId>/
```
