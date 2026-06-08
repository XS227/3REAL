# E2E Validation Results — 3REAL Portal

**Executed:** 2026-06-08  
**Environment:** Local dev, Next.js 16.2.7 (Turbopack, port 3003), PostgreSQL 14  
**Test user:** `e2e-test@example.com`  
**Admin:** `admin@3real.no` (super_admin)

---

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | Register | **PASS** |
| 2 | Verify email | **FAIL** — BUG-001: `sessionVersion` not incremented |
| 3 | Login | **PASS** |
| 4 | Submit KYC | **PASS** |
| 5 | Approve KYC | **PASS** |
| 6 | Create deposit | **PASS** |
| 7 | Approve deposit | **PASS** |
| 8 | Verify ledger entries | **PASS** |
| 9 | Verify wallet balance | **PASS** |
| 10 | Verify notifications | **PASS** |
| 11 | Verify audit logs | **PASS** |
| I-1 | Idempotency: double deposit approval | **PASS** |
| I-2 | Idempotency: KYC re-submission block | **PASS** |
| I-3 | Stale session rejection | **PASS** |

**Total: 13 / 14 PASS — 1 FAIL — 3 additional bugs found (BUG-002, BUG-003, BUG-004)**

---

## Step 1 — Register

**Result: PASS**

**API:** `POST /api/auth/register` → `201 Created`

```json
{
  "success": true,
  "message": "Account created. Check your email to verify your address.",
  "devVerifyUrl": "http://localhost:3000/auth/verify-email?token=f9c3c94f..."
}
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `emailVerified` | false | false | ✓ |
| `kycTier` | 0 | 0 | ✓ |
| `role` | user | user | ✓ |
| `sessionVersion` | 1 | 1 | ✓ |
| `referralCode` | non-null | `7R3TH7M4` | ✓ |
| auth_token type | email_verify | email_verify | ✓ |
| auth_token usedAt | NULL | NULL | ✓ |
| auth_token expiresAt | ~now+24h | 2026-06-09 10:44:50 | ✓ |
| activity_log `auth.register` | present | present | ✓ |

**Bug note:** `devVerifyUrl` uses `NEXT_PUBLIC_APP_URL=http://localhost:3000` but dev server was on port 3003. URL in response was non-functional. See **BUG-002**.

---

## Step 2 — Verify Email

**Result: FAIL — BUG-001**

**API:** `POST /api/auth/verify-email` → `200 OK`

```json
{ "success": true, "message": "Email verified. You're now at KYC Tier 1." }
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `emailVerified` | true | true | ✓ |
| `kycTier` | 1 | 1 | ✓ |
| `sessionVersion` | **2** (incremented) | **1** (unchanged) | **✗ FAIL** |
| auth_token `usedAt` | non-null | 2026-06-08 10:46:58 | ✓ |
| activity_log `auth.email_verified` | present | present | ✓ |

**Bug:** `sessionVersion` was not incremented when `kycTier` changed from 0 → 1. The Phase 3.6 invariant requires `sessionVersion: { increment: 1 }` on every `kycTier` change. This means a user who logs in before verifying their email holds a JWT with `kycTier: 0`. Without the `sessionVersion` increment, `validateSession()` cannot signal the stale claim — however, since `validateSession()` always returns fresh DB values (including `kycTier`), the kycTier is still served correctly on subsequent requests. The security impact is low, but the invariant is violated.

**Location:** `app/api/auth/verify-email/route.ts:33` — `prisma.user.update` missing `sessionVersion: { increment: 1 }`.

---

## Step 3 — Login

**Result: PASS**

**API:** `POST /api/auth/login` → `200 OK`

```json
{
  "success": true,
  "user": { "id": "6b0e7e12...", "email": "e2e-test@example.com",
            "role": "user", "kycTier": 1, "emailVerified": true }
}
```

**JWT payload decoded:**

```json
{
  "userId": "6b0e7e12-...",
  "role": "user",
  "kycTier": 1,
  "emailVerified": true,
  "sessionVersion": 1,
  "iat": 1780915724, "exp": 1781520524
}
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `lastLoginAt` | ~now | 2026-06-08 10:48:44 | ✓ |
| JWT `kycTier` | 1 | 1 | ✓ |
| JWT `emailVerified` | true | true | ✓ |
| JWT `sessionVersion` | 1 | 1 | ✓ (matches DB) |
| activity_log `auth.login` | present | present | ✓ |
| Cookie `__3real_session` | HttpOnly, SameSite=lax | HttpOnly, SameSite=lax | ✓ |

---

## Step 4 — Submit KYC

**Result: PASS**

**API:** `POST /api/kyc/submit` (multipart, 3 files: id_front, selfie, address_proof) → `200 OK`

```json
{ "success": true }
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| kyc_profile `status` | pending | pending | ✓ |
| kyc_profile `tierRequested` | 2 | 2 | ✓ |
| kyc_profile `reviewedAt` | NULL | NULL | ✓ |
| kyc_documents count | 3 (no id_back) | 3 | ✓ |
| doc types | id_front, selfie, address_proof | all 3 present | ✓ |
| doc `status` | pending | pending (all) | ✓ |
| doc `version` | 1 | 1 (all) | ✓ |
| file paths pattern | `kyc/{userId}/{type}/{ts}-{name}` | ✓ | ✓ |
| files on disk | present | present (331 bytes each) | ✓ |
| activity_log `kyc.submitted` | present | present | ✓ |

---

## Step 5 — Approve KYC

**Result: PASS**

**API:** `PATCH /api/admin/kyc/{profileId}` with `{ action: "approve" }` → `200 OK`

```json
{ "success": true }
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| kyc_profile `status` | approved | approved | ✓ |
| kyc_profile `reviewedAt` | ~now | 2026-06-08 10:50:25 | ✓ |
| kyc_profile `reviewedById` | admin ID | `23e58dc0-...` | ✓ |
| kyc_documents all `status` | approved | approved (3/3) | ✓ |
| user `kycTier` | 2 | 2 | ✓ |
| user `sessionVersion` | 2 (incremented) | 2 | ✓ |
| notification `kyc_approved` | present | present | ✓ |
| notification `deliveryStatus` | sent | sent | ✓ |
| activity_log `kyc.approved` actorId | admin ID | `23e58dc0-...` | ✓ |

**Ledger changes:** None (as expected).

---

## Step 6 — Create Deposit

**Result: PASS**

**API:** `POST /api/deposits` (multipart: assetCode=REAL, amount=100, paymentRef=E2E-TEST-001) → `201 Created`

```json
{ "id": "7dd8ee6a-...", "status": "pending" }
```

**Note on test execution:** Initial curl attempt using manual `-H "Cookie: ..."` resulted in a 307 redirect. Root cause: `proxy.ts` correctly blocked the stale (sessionVersion=1) cookie used in the first attempt. Re-run using a fresh session cookie jar passed correctly.

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| transaction `type` | deposit | deposit | ✓ |
| transaction `status` | pending | pending | ✓ |
| transaction `assetCode` | REAL | REAL | ✓ |
| transaction `amount` | 100 | 100.00000000 | ✓ |
| transaction `paymentRef` | E2E-TEST-001 | E2E-TEST-001 | ✓ |
| transaction `ledgerTxId` | NULL | NULL | ✓ |
| transaction `proofFilePath` | NULL | NULL | ✓ |
| activity_log `deposit.created` | present | present | ✓ |

**Ledger changes:** None (as expected — no credit until admin approval).

---

## Step 7 — Approve Deposit

**Result: PASS**

**API:** `PATCH /api/admin/deposits/{txId}` with `{ action: "approve" }` → `200 OK`

```json
{ "success": true }
```

**DB validation:**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| transaction `status` | completed | completed | ✓ |
| transaction `ledgerTxId` | non-null | `57c6edbc-...` | ✓ |
| ledger_transaction `type` | deposit | deposit | ✓ |
| ledger_transaction `status` | completed | completed | ✓ |
| ledger_transaction `referenceId` | txId | `7dd8ee6a-...` | ✓ |
| ledger_transaction `referenceType` | deposit_request | deposit_request | ✓ |
| notification `deposit_approved` | present | present | ✓ |
| notification `deliveryStatus` | sent | sent | ✓ |
| activity_log `deposit.approved` actorId | admin ID | `23e58dc0-...` | ✓ |

---

## Step 8 — Verify Ledger Entries

**Result: PASS**

**Ledger entries for the deposit settlement:**

| `ownerType` | `ownerId` | `assetCode` | `amount` |
|-------------|-----------|-------------|----------|
| platform | float | REAL | **-100.00000000** (DR) |
| user | `6b0e7e12-...` | REAL | **+100.00000000** (CR) |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Entry count | 2 | 2 | ✓ |
| Platform float entry | -100 | -100.00000000 | ✓ |
| User account entry | +100 | +100.00000000 | ✓ |
| SUM of entries | 0 | 0.00000000 | ✓ |
| Bidirectional link: `transaction.ledgerTxId` → `ledger_transaction.id` | intact | intact | ✓ |
| Bidirectional link: `ledger_transaction.referenceId` → `transaction.id` | intact | intact | ✓ |

---

## Step 9 — Verify Wallet Balance

**Result: PASS**

**DB balance query result:**

```
 assetCode |  available   | pending
-----------+--------------+---------
 REAL      | 100.00000000 |       0
```

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| REAL available | 100 | 100.00000000 | ✓ |
| REAL pending | 0 | 0 | ✓ |
| Other assets | 0 (no rows) | no rows | ✓ |

---

## Step 10 — Verify Notifications

**Result: PASS**

**Notifications for test user (ordered by sentAt):**

| `type` | `title` | `channel` | `deliveryStatus` | `isRead` |
|--------|---------|-----------|-----------------|---------|
| kyc_approved | Identity Verification Approved | in_app | sent | false |
| deposit_approved | Deposit Approved | in_app | sent | false |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `kyc_approved` present | yes | yes | ✓ |
| `deposit_approved` present | yes | yes | ✓ |
| `deliveryStatus` both | sent | sent | ✓ |
| `isRead` both | false (no bell UI yet) | false | ✓ |
| `sentAt` set | non-null | non-null | ✓ |

---

## Step 11 — Verify Audit Logs

**Result: PASS**

**Complete audit trail (chronological):**

| `action` | `actor_email` | `createdAt` |
|----------|---------------|-------------|
| auth.register | e2e-test@example.com | 10:44:50 |
| auth.email_verified | e2e-test@example.com | 10:46:58 |
| auth.login | e2e-test@example.com | 10:47:38 |
| auth.login | e2e-test@example.com | 10:48:44 |
| kyc.submitted | e2e-test@example.com | 10:49:37 |
| auth.login | admin@3real.no | 10:50:19 |
| kyc.approved | **admin@3real.no** | 10:50:25 |
| auth.login | e2e-test@example.com | 10:51:02 |
| auth.login | e2e-test@example.com | 10:52:12 |
| deposit.created | e2e-test@example.com | 10:53:46 |
| auth.login | admin@3real.no | 10:53:56 |
| deposit.approved | **admin@3real.no** | 10:54:02 |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| All 7 distinct action types logged | yes | yes | ✓ |
| `kyc.approved` actor = admin | admin ID | `23e58dc0-...` (admin@3real.no) | ✓ |
| `deposit.approved` actor = admin | admin ID | `23e58dc0-...` (admin@3real.no) | ✓ |
| No gaps in state transitions | all present | all present | ✓ |

---

## Idempotency Checks

### I-1: Double Deposit Approval

**Result: PASS**

Second `PATCH /api/admin/deposits/{txId}` with `{ action: "approve" }` after deposit is already `completed`:

```json
{"error": "This deposit is not in a reviewable state"}
--- STATUS: 409 ---
```

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| HTTP status | 409 | 409 | ✓ |
| `ledger_entries` count | 2 (unchanged) | 2 | ✓ |
| `ledger_transactions` count | 1 (unchanged) | 1 | ✓ |
| User balance | 100 (unchanged) | 100 | ✓ |

**Note:** The test plan expected error message `"ALREADY_SETTLED"`, but actual is `"This deposit is not in a reviewable state"`. This is correct behavior — the INVALID_STATE guard fires first (status is `completed`) before the ALREADY_SETTLED guard (which is for concurrent/race scenarios). No double-credit occurred. See **BUG-003** for details.

### I-2: KYC Re-submission Block

**Result: PASS**

Second `POST /api/kyc/submit` after profile is `approved`:

```json
{"error": "KYC submission already under review or approved"}
--- STATUS: 409 ---
```

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| HTTP status | 409 | 409 | ✓ |
| No new kyc_profiles row | correct | correct | ✓ |

### I-3: Stale Session Rejection

**Result: PASS**

`GET /api/auth/me` using JWT with `sessionVersion=1` after DB `sessionVersion=2`:

```
HTTP 401
```

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Stale JWT rejected | 401 | 401 | ✓ |
| No 500 error | correct | correct | ✓ |

---

## Bugs Found

### BUG-001 — sessionVersion Not Incremented on Email Verification *(MEDIUM)*

**Step:** 2 — Verify Email  
**File:** `app/api/auth/verify-email/route.ts:33`  
**Symptom:** After `verify-email` changes `kycTier` from 0 → 1, `sessionVersion` remains `1` instead of incrementing to `2`.

**Expected:**
```typescript
data: { emailVerified: true, kycTier: 1, sessionVersion: { increment: 1 } }
```
**Actual:**
```typescript
data: { emailVerified: true, kycTier: 1 }
```

**Impact:** Violates the Phase 3.6 invariant: "any `prisma.user.update` that changes `kycTier` must also include `sessionVersion: { increment: 1 }`". If a user registers and logs in *before* verifying their email, their JWT holds `kycTier: 0`. The `validateSession()` function reads fresh DB values so the wrong kycTier is never served — but the invariant is broken and could cause confusion when debugging.

---

### BUG-002 — devVerifyUrl Uses Hardcoded Port from NEXT_PUBLIC_APP_URL *(LOW)*

**Step:** 1 — Register  
**File:** `app/api/auth/register/route.ts:120`  
**Symptom:** `devVerifyUrl` in register response is `http://localhost:3000/auth/verify-email?token=...`, but the dev server was running on port 3003.

**Root cause:** URL is built from `NEXT_PUBLIC_APP_URL` env var (`.env` has `http://localhost:3000`). When Next.js port-shifts due to port conflict, the dev verify URL becomes wrong.

**Impact:** Developer must manually fix the port in the URL to verify email during testing. The actual email verification endpoint is not broken — only the convenience `devVerifyUrl` is wrong.

**Fix:** Build devVerifyUrl from the request's `Host` header at runtime instead of relying on the env var.

---

### BUG-003 — ALREADY_SETTLED Guard Unreachable in Normal Sequential Flow *(LOW / INFO)*

**Step:** Idempotency I-1  
**File:** `lib/admin/deposit-service.ts`  
**Symptom:** The test plan expected `ALREADY_SETTLED` error on double-approval. Actual error is `"This deposit is not in a reviewable state"` (INVALID_STATE).

**Root cause:** The guard sequence in `approveDeposit` is:
1. Check `status ∈ {pending, under_review}` → throws `INVALID_STATE` if not
2. Check `ledgerTxId !== null` → throws `ALREADY_SETTLED` if set

In sequential double-approval, the first approval sets `status = completed`. The second attempt hits guard #1 (`completed` ∉ `{pending, under_review}`) and throws `INVALID_STATE` before ever reaching the `ALREADY_SETTLED` check.

The `ALREADY_SETTLED` guard is only reachable via a true race condition: two concurrent requests both pass guard #1 simultaneously (both see `status = pending`), then the second writer hits guard #2 inside the transaction.

**Impact:** No double-credit risk — the guard works. The HTTP 409 response is returned correctly. However, the error message is less specific than intended for operators and the ALREADY_SETTLED guard is dead code in normal sequential flow.

---

### BUG-004 — `/api/admin/*` Routes Not In ADMIN_PATHS in proxy.ts *(LOW / INFO)*

**File:** `proxy.ts:21`  
**Symptom:** `ADMIN_PATHS = ["/admin"]` covers only the admin UI pages. `/api/admin/*` endpoints are not listed, so the middleware's admin role check is never applied to admin API calls.

**Current state:** Admin API routes (`/api/admin/kyc/[id]`, `/api/admin/deposits/[id]`) perform their own role check via `getAdminSession()` and return 403. This works correctly.

**Impact:** Defense-in-depth gap. A regular user's valid JWT passes the middleware for `/api/admin/*` routes, and role rejection happens only at the route handler level. If a future admin API route forgets to call `getAdminSession()`, it would be exposed. No current routes are affected.

**Fix:** Add `/api/admin` to `ADMIN_PATHS` in `proxy.ts`.
