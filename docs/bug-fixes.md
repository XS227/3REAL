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

## BUG-005 — getUserBalances Raw SQL Uses Snake-Case Column Names

**Severity:** Critical  
**File:** `lib/ledger/balance.ts`  
**Discovered:** Phase 8.5 withdrawal E2E validation

### Root Cause

The raw SQL query inside `getUserBalances` referenced column names in snake_case (`account_id`, `ledger_transaction_id`, `owner_type`, `owner_id`, `asset_code`). The actual PostgreSQL schema stores all columns in camelCase as created by Prisma's migrations. PostgreSQL is case-sensitive for unquoted identifiers, so every query failed immediately with:

```
Raw query failed. Code: 42703
Message: column le.account_id does not exist
```

### Impact

- `GET /dashboard/wallet` — 500 on every load (wallet page calls `getUserBalances`)
- `POST /api/withdrawals` — 500 on every submission (pre-submission balance check calls `getUserBalances`)
- No withdrawal submissions were possible until this was fixed

### Fix

```diff
- a.asset_code::text AS asset_code,
+ a."assetCode"::text AS asset_code,

- JOIN accounts a ON le.account_id = a.id
+ JOIN accounts a ON le."accountId" = a.id

- JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
+ JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id

- WHERE a.owner_type::text = 'user'
-   AND a.owner_id = ${userId}
- GROUP BY a.asset_code
+ WHERE a."ownerType"::text = 'user'
+   AND a."ownerId" = ${userId}
+ GROUP BY a."assetCode"
```

Note: the authoritative balance check inside `lib/admin/withdrawal-service.ts` was written correctly with double-quoted camelCase from the start — only `getUserBalances` in `lib/ledger/balance.ts` was affected.

---

---

## BUG-006 — clickIp Never Written to Referral Records

**Severity:** Medium  
**File:** `app/api/auth/register/route.ts`  
**Discovered:** Phase 9.5 referral E2E validation

### Root Cause

The fraud detection system in `getAdminReferralData` queries `referrals."clickIp"` to find IPs with 3+ registrations in 24 hours. The `clickIp` and `clickAt` fields exist in the schema but were never populated at registration time — both L1 and L2 referral `create` calls omitted these fields. As a result, every `clickIp` was NULL and the fraud queue was always empty.

### Impact

- Admin fraud queue on `/admin/referrals` never surfaced any suspicious IPs
- IP-based Sybil attack clustering was undetectable

### Fix

Added `clickAt: new Date()` and `clickIp: ip` to both the L1 and L2 referral creation blocks inside the registration transaction:

```diff
  await tx.referral.create({
    data: {
      ecosystemId: ecosystem.id,
      referrerId:  referrer.id,
      referredId:  created.id,
      code:        referralCode!.trim().toUpperCase(),
      referralLevel: 1,
      registeredAt: new Date(),
+     clickAt: new Date(),
+     clickIp: ip,
      status: "registered",
    },
  });
```

The same two fields were added to the L2 referral create. Now every registration originating from a referral link stamps both `clickAt` and `clickIp`, making IP clustering queries accurate.

---

## BUG-007 — Notifications and Audits Created Even When Reward Skipped

**Severity:** Medium  
**File:** `lib/referral/engine.ts`  
**Discovered:** Phase 9.5 referral E2E validation

### Root Cause

`issueRewardForReferral` returned `void` and used `return` (with no value) on early exits (pool depleted, account not found). The caller `issueEmailVerifyReward` looped over referrals and, after calling `issueRewardForReferral`, unconditionally created an audit log entry and a notification — even though no ledger transaction was created.

When the rewards pool was depleted, this produced spurious `referral_reward` notifications and `referral.reward_issued` audit entries for rewards that were never actually issued.

### Impact

- Referrers received "Referral Reward Earned" notifications when no reward was paid
- Audit log showed `referral.reward_issued` entries without corresponding ledger transactions
- Trust violation: user dashboard could show phantom rewards

### Fix

Changed `issueRewardForReferral` return type from `Promise<void>` to `Promise<boolean>`. Returns `false` on pool depletion or missing account, `true` on successful ledger transaction creation.

```diff
- async function issueRewardForReferral(...): Promise<void> {
+ async function issueRewardForReferral(...): Promise<boolean> {
    if (!pool) {
-     return;
+     return false;
    }
    if (poolBal < rewardAmount) {
      await audit({ action: "referral.pool_depleted", ... });
-     return;
+     return false;
    }
    // ... create ledger tx ...
+   return true;
  }
```

Caller now gates on the return value:

```diff
  const issued = await issueRewardForReferral(...);
+ if (!issued) continue;
  await audit({ action: "referral.reward_issued", ... });
  await createNotification({ type: "referral_reward", ... });
```

Notifications and audit logs are now only created when a ledger entry was actually written.

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
