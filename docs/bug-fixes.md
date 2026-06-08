# Bug Fix Report — Phase 7.8

**Source:** `docs/e2e-results.md` (Phase 7.7 validation run)  
**Fixed:** 2026-06-08  

---

## BUG-001 — sessionVersion Not Incremented on Email Verification

**Severity:** Medium  
**File:** `app/api/auth/verify-email/route.ts`

### Root Cause

`prisma.user.update` on email verification changed `emailVerified` and `kycTier` but omitted the Phase 3.6 `sessionVersion: { increment: 1 }` rule.

### Impact

If a user registered and logged in *before* verifying their email, their active JWT held `kycTier: 0`. Because `sessionVersion` was not incremented, `validateSession()` saw no mismatch and kept serving the session (with fresh DB values, so `kycTier: 1` was returned correctly from DB). No security breach — but the documented invariant was violated and any session-debug tooling would give wrong signals.

### Fix

```diff
- data: { emailVerified: true, kycTier: 1 },
+ data: { emailVerified: true, kycTier: 1, sessionVersion: { increment: 1 } },
```

After this fix, verifying email increments `sessionVersion` (0 → 1 → **2**), consistently with how KYC approval and password reset work. Any logged-in session with `sessionVersion: 1` is invalidated on the next request.

---

## BUG-002 — devVerifyUrl Uses Static Port from NEXT_PUBLIC_APP_URL

**Severity:** Low  
**File:** `app/api/auth/register/route.ts`

### Root Cause

The verification URL for the `devVerifyUrl` dev-helper was built from `process.env.NEXT_PUBLIC_APP_URL` (set to `http://localhost:3000` in `.env`). When Next.js port-shifts due to a collision (e.g., another process owns 3000), the URL in the register response points to the wrong port and the dev link is broken.

### Fix

In non-production environments, derive the URL base from the request's own `Host` header instead of the env var:

```diff
- const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
+ const appUrl =
+   process.env.NODE_ENV !== "production"
+     ? `${req.nextUrl.protocol}//${req.headers.get("host") ?? "localhost:3000"}`
+     : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
```

Production behavior is unchanged — it still uses `NEXT_PUBLIC_APP_URL`. In dev, the URL matches whatever port Next.js actually started on.

---

## BUG-003 — ALREADY_SETTLED Guard Unreachable in Sequential Flow

**Severity:** Low  
**File:** `lib/admin/deposit-service.ts`

### Root Cause

Guard order inside `approveDeposit`:

```
1. if status ∉ {pending, under_review}  → INVALID_STATE
2. if ledgerTxId is set                 → ALREADY_SETTLED
```

In normal sequential double-approval, the first approval sets `status = completed`. The second attempt hits guard #1 (status check) before guard #2 (ledgerTxId check), so `ALREADY_SETTLED` was never returned — only `INVALID_STATE`.

The `ALREADY_SETTLED` error was effectively dead code in sequential scenarios and only reachable via a concurrent race.

### Fix

Swap guard order — check `ledgerTxId` first:

```diff
- if (deposit.status !== "pending" && deposit.status !== "under_review") {
-   throw new Error("INVALID_STATE");
- }
- if (deposit.ledgerTxId) {
-   throw new Error("ALREADY_SETTLED");
- }
+ // Idempotency guard first — catches both race conditions and sequential retries
+ if (deposit.ledgerTxId) {
+   throw new Error("ALREADY_SETTLED");
+ }
+ if (deposit.status !== "pending" && deposit.status !== "under_review") {
+   throw new Error("INVALID_STATE");
+ }
```

Now:
- Settled deposit → `ALREADY_SETTLED` (409 "already credited to ledger")
- Non-settled, wrong status → `INVALID_STATE` (409 "not in a reviewable state")
- Race condition (two concurrent approvals, both pass status check) → second writer hits `ALREADY_SETTLED` inside the transaction

No ledger behavior changed — both paths already prevented double-credit.

---

## BUG-004 — /api/admin/* Not In ADMIN_PATHS in proxy.ts

**Severity:** Low (defence-in-depth gap)  
**File:** `proxy.ts`

### Root Cause

`ADMIN_PATHS = ["/admin"]` only matched the admin UI routes (`/admin`, `/admin/kyc`, etc.). Admin API routes (`/api/admin/kyc/[id]`, `/api/admin/deposits/[id]`) were not listed, so the middleware's admin role check was bypassed for API calls. A regular user's valid JWT passed the middleware and was only rejected at the route handler level by `getAdminSession()`.

The current admin API routes all call `getAdminSession()` correctly, so there was no actual vulnerability. However, any future admin API route that omits the internal check would be left wide open.

### Fix

```diff
- const ADMIN_PATHS = ["/admin"];
+ const ADMIN_PATHS = ["/admin", "/api/admin"];
```

Now the middleware rejects non-admin roles before the request even reaches the route handler, providing defense-in-depth for all current and future `/api/admin/*` routes.

---

## Test Coverage After Fixes

Re-running BUG-001's scenario after the fix:

```
POST /api/auth/verify-email  →  200 OK
DB: sessionVersion: 2 (was: 1)  ✓
DB: kycTier: 1  ✓
DB: emailVerified: true  ✓
```

Re-running BUG-002's scenario after the fix:

```
POST /api/auth/register  →  201 Created
devVerifyUrl: http://localhost:3003/auth/verify-email?token=...  ✓  (matches running port)
```

Re-running BUG-003's scenario after the fix:

```
PATCH /api/admin/deposits/{completed-txId}  →  409 Conflict
{"error": "This deposit has already been credited to the ledger"}  ✓
```

Re-running BUG-004's scenario after the fix:

```
PATCH /api/admin/deposits/{id} with user JWT (non-admin)  →  307 redirect to /dashboard  ✓
(middleware rejects before reaching route handler)
```
