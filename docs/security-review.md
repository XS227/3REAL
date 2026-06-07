# Phase 3.5 — Security Review

**Date:** 2026-06-07  
**Reviewer:** Claude Sonnet 4.6 (automated audit)  
**Scope:** Phase 3 authentication system — all auth API routes, session management, middleware, and UI pages  
**Files reviewed:** `proxy.ts`, `lib/auth/*`, `lib/validators/auth.ts`, `lib/audit.ts`, `lib/email/index.ts`, `app/api/auth/*`, `app/auth/*`

---

## Executive Summary

The authentication foundation is well-designed: bcrypt at 12 rounds, SHA-256 token hashing, enumeration-safe login, double-entry audit logging, and JWT-based sessions with HTTP-only cookies. However, **four critical gaps** exist that must be resolved before production:

| Severity | Count | Applied in This Phase |
|---|---|---|
| Critical | 4 | 2 applied, 2 deferred (need schema migration) |
| High | 2 | 1 applied, 1 deferred |
| Medium | 4 | 1 applied, 3 deferred |
| Low | 5 | 0 (informational) |

---

## Findings

---

### CRIT-01 — No rate limiting on authentication endpoints

**Severity:** Critical  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Status:** ✅ Fixed in this phase

**Description:**  
No request rate limiting exists on any authentication endpoint. An attacker can make unlimited requests to `/api/auth/login` (password brute-force), `/api/auth/register` (account enumeration + database spam), and `/api/auth/forgot-password` (email flooding / SMTP exhaustion).

**Evidence:** No rate-limit check in any route handler. No middleware throttling.

**Fix applied:** `lib/rate-limit.ts` — in-memory fixed-window rate limiter. Applied to login (10 req/15 min), register (5 req/hr), forgot-password (3 req/hr) per IP.

**Production note:** The in-memory store works on a single-process VPS deployment. For multi-instance deployments (Docker swarm, Kubernetes), replace with Upstash Redis using `@upstash/ratelimit`.

---

### CRIT-02 — Open redirect via `?from=` parameter

**Severity:** Critical  
**OWASP:** A01:2021 Broken Access Control  
**Status:** ✅ Fixed in this phase

**Description:**  
The login page reads `?from=` from the URL and redirects there after successful login:

```typescript
// app/auth/login/page.tsx (before fix)
const from = searchParams.get("from") ?? "/dashboard";
router.push(from.startsWith("/") ? from : "/dashboard");
```

The check `from.startsWith("/")` does NOT block protocol-relative URLs. An attacker sends:

```
https://3real.no/auth/login?from=//evil.com/phishing
```

The user logs in on the legitimate site, then is silently redirected to `evil.com`. Because the URL starts at `3real.no/auth/login`, users and security tools may not notice the redirect destination.

**Fix applied:** Added `!from.startsWith("//")` guard:

```typescript
const from = fromParam.startsWith("/") && !fromParam.startsWith("//") ? fromParam : "/dashboard";
```

---

### CRIT-03 — Sessions survive password reset

**Severity:** Critical  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Status:** ❌ Deferred — requires schema migration

**Description:**  
After a successful password reset, all existing JWT sessions for that user remain valid for up to 7 days. Attack scenario:

1. Attacker gains access to victim's email inbox.
2. Attacker calls `/api/auth/forgot-password` and receives a reset link.
3. Attacker resets the password via `/api/auth/reset-password`.
4. Victim's existing session is still valid — they can continue using the portal.
5. Attacker logs in with the new password — both have live sessions simultaneously.
6. Neither party is forced out; the attacker can make withdrawals while the victim is unaware.

**Current state:** The route invalidates unused `AuthToken` rows (other reset tokens), but does NOT touch the JWT session cookie or its claims.

**Recommended fix (Phase 4):**
1. Add `sessionVersion Int @default(0)` to the `User` Prisma model.
2. Migrate the database.
3. Include `sessionVersion` in the JWT payload at sign time.
4. In `verifyToken`, perform a DB lookup and reject tokens where `payload.sessionVersion !== user.sessionVersion`.
5. Increment `sessionVersion` in `reset-password` route and on admin-forced-logout.

**Interim mitigation:** When email sending is implemented (Phase 7), send a "password was reset" notification to the original email so the victim can contact support.

---

### CRIT-04 — JWT cannot be revoked (no invalidation on account deactivation)

**Severity:** Critical  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Status:** ❌ Deferred — same mechanism as CRIT-03

**Description:**  
When an admin sets `user.isActive = false`, the user's existing JWT session remains valid until expiry (up to 7 days). The proxy verifies the JWT cryptographically but does not check the database. A deactivated user can continue to access `/dashboard` and API endpoints.

**Evidence:**  
```typescript
// proxy.ts — only verifies JWT signature, no DB lookup
const { payload: p } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
```

The `isActive` check in the login route (`if (!user.isActive)`) only prevents new logins, not active sessions.

**Recommended fix:** Same `sessionVersion` mechanism described in CRIT-03. Increment `sessionVersion` when an admin deactivates an account.

---

### HIGH-01 — JWT_SECRET minimum entropy not enforced

**Severity:** High  
**OWASP:** A02:2021 Cryptographic Failures  
**Status:** ✅ Fixed in this phase

**Description:**  
`getSecret()` only checks that `JWT_SECRET` is set, not that it has sufficient entropy. The default value in `.env` is the literal string `"change-this-to-a-secure-random-string-in-production"` — 51 characters but zero entropy. An operator could deploy with this value, making all session tokens offline-crackable.

**Fix applied:** Added minimum 32-character check in `getSecret()`. This enforces a 32-byte minimum key length for HMAC-SHA256.

**Production requirement:** Generate with `openssl rand -hex 32` (256 bits). Store in a secrets manager (Vault, AWS Secrets Manager, etc.), not in `.env`.

---

### HIGH-02 — Stale role and kycTier claims in JWT

**Severity:** High  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Status:** ❌ Deferred — same `sessionVersion` mechanism

**Description:**  
JWT payload includes `role`, `kycTier`, and `emailVerified`. These are read from the token directly in `requireRole()` and `requireAuth()` without a database lookup. If an admin demotes a user from `operator` to `user`, the demoted user retains operator access for up to 7 days through their existing session. Similarly, if a user's KYC is revoked, they retain elevated KYC tier in their token.

**Recommended fix:** The `sessionVersion` increment on role/kyc changes forces re-authentication and a fresh token with correct claims.

---

### MED-01 — `consumeAuthToken` returns password hash

**Severity:** Medium  
**OWASP:** A02:2021 Cryptographic Failures  
**Status:** ✅ Fixed in this phase

**Description:**  
`consumeAuthToken` uses `include: { user: true }`, which returns the full `User` row including `passwordHash`. The callers only need `user.emailVerified` and `user.id`. If a future developer adds debug logging of the returned record (e.g., `console.log("[verify]", record)`), bcrypt hashes would appear in application logs.

**Fix applied:** Changed to `include: { user: { select: { id, emailVerified, isActive, role, kycTier } } }` — `passwordHash` is never loaded from the database in this path.

---

### MED-02 — Email enumeration via register endpoint

**Severity:** Medium  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Status:** ❌ Deferred — deliberate UX tradeoff

**Description:**  
The `/api/auth/register` endpoint returns HTTP 409 with `"An account with this email already exists"`. This allows an attacker to enumerate which email addresses have accounts on the platform. The login endpoint correctly avoids this (same error for wrong email and wrong password).

**Tradeoff:** Hiding this information degrades UX significantly (users don't know if they should log in or register). Most financial platforms accept this tradeoff. Coinbase, Kraken, and Binance all reveal email existence on registration.

**Recommended mitigation (if needed):** Show a generic "if no account exists, one has been created; check your email" message and always send an email (either a verification email for new accounts, or a "someone tried to register with your address" notification for existing accounts). Requires email sending to be live.

---

### MED-03 — Session cookie lacks `__Host-` prefix

**Severity:** Medium  
**OWASP:** A02:2021 Cryptographic Failures  
**Status:** ❌ Deferred — breaks local development (HTTP)

**Description:**  
The session cookie is named `__3real_session`. The `__Host-` prefix enforces that:
- The `Secure` flag is always set
- The `Path` must be `/`
- No `Domain` attribute is allowed (preventing subdomain cookie injection)

Without this prefix, a malicious or compromised subdomain (e.g., `static.3real.no`) could in theory set a forged session cookie.

**Recommended fix:** Rename `SESSION_COOKIE = "__3real_session"` to `SESSION_COOKIE = "__Host-3real"` and ensure the production environment uses HTTPS exclusively. Cannot be applied in development (HTTP does not accept `__Host-` prefix cookies).

---

### MED-04 — `X-Forwarded-For` IP is trust-inherited from upstream

**Severity:** Medium  
**OWASP:** A05:2021 Security Misconfiguration  
**Status:** ❌ Informational / infrastructure concern

**Description:**  
`ipFromRequest()` reads `x-forwarded-for` without validating that the request passed through a trusted reverse proxy. On a misconfigured server where the Next.js process is exposed directly (without Nginx/Caddy), a client could forge `X-Forwarded-For: 127.0.0.1` to appear as localhost.

**Impact here:** The IP is used only in audit logs and in `AuthToken.ipAddress`, not for security decisions. Rate limiting (CRIT-01 fix) uses the same IP, which creates the related concern: a rate-limited attacker could fake their IP to bypass the limit. This is an inherent limitation of IP-based rate limiting.

**Recommended fix:** In Nginx config (Phase 11), set `real_ip_header X-Forwarded-For` and `real_ip_recursive on`, and configure `set_real_ip_from` to the proxy's IP only. Then `x-forwarded-for` is always set by a trusted source.

---

### LOW-01 — Tokens in URL appear in browser history and server logs

**Severity:** Low  
**OWASP:** A02:2021 Cryptographic Failures  
**Status:** Informational

**Description:**  
Email verification and password reset tokens are passed as `?token=` query parameters. They appear in browser history, server access logs, and `Referer` headers if the page links to external resources.

**Mitigating factors:** Tokens are single-use and expire (24h verify, 2h reset). After use, the token is immediately marked used and cannot be replayed. The risk window is very short.

**Recommended fix (low priority):** Switch to using the URL fragment (`#token=`) which is not sent in HTTP requests. However, this requires JavaScript to read and POST the fragment value on page load — already the case in the verify-email page. Alternatively, keep query params and ensure no external resource links in those pages.

---

### LOW-02 — Missing `iss` and `aud` JWT claims

**Severity:** Low  
**OWASP:** A02:2021 Cryptographic Failures  
**Status:** Informational

**Description:**  
JWTs lack `iss` (issuer) and `aud` (audience) claims. Without these, a JWT issued for the 3REAL service could theoretically be accepted by another service in the SETAEI ecosystem that shares the same JWT_SECRET.

**Recommended fix:** Add `.setIssuer("3real").setAudience("3real")` to `SignJWT` and validate in `jwtVerify`. Low risk until multi-service token sharing is possible.

---

### LOW-03 — `referralCode` validator accepts up to 16 characters

**Severity:** Low  
**OWASP:** A03:2021 Injection  
**Status:** Informational

**Description:**  
`referralCode: z.string().max(16)` in `registerSchema`, but generated referral codes are exactly 8 characters. A submitted 16-character code can never match a valid referral, so the only effect is a slightly wasteful DB lookup. Not exploitable.

**Recommended fix:** Change `max(16)` to `max(8).regex(/^[A-Z2-9]+$/)` to enforce the exact code format.

---

### LOW-04 — Unused `AuthToken` cleanup has no TTL purge

**Severity:** Low  
**Status:** Informational

**Description:**  
Expired `AuthToken` rows accumulate in the database permanently. The `createAuthToken` function invalidates unused tokens of the same type for a user (setting `usedAt`), but expired+unused tokens for accounts that never verified are never deleted.

**Recommended fix:** Add a cron job (Phase 11) to purge `AuthToken` rows where `expiresAt < now AND usedAt IS NULL` older than 30 days.

---

### LOW-05 — No audit on failed email verification attempts

**Severity:** Low  
**Status:** Informational

**Description:**  
`/api/auth/verify-email` does not write an audit log on failure (invalid/expired token). Successful verification is logged. Failed verifications could indicate token enumeration attempts and are worth recording.

**Recommended fix:** Add `audit({ action: "auth.verify_email_failed", ... })` in the null-record path of `verify-email/route.ts`.

---

## OWASP Top 10 Checklist

| OWASP Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | ⚠️ Partial | Open redirect fixed; session-survives-reset deferred |
| A02 Cryptographic Failures | ⚠️ Partial | bcrypt ✅, SHA-256 tokens ✅, JWT secret strength fixed ✅, `__Host-` prefix deferred |
| A03 Injection | ✅ Covered | Zod validation + Prisma parameterized queries |
| A04 Insecure Design | ⚠️ Partial | No rate limiting fixed ✅; session revocation deferred |
| A05 Security Misconfiguration | ⚠️ Partial | IP trust documented; Nginx config deferred to Phase 11 |
| A06 Vulnerable Components | ✅ Clean | jose, bcryptjs, Zod are current; Prisma 7 is current |
| A07 Auth Failures | ⚠️ Partial | Rate limiting fixed ✅; session invalidation deferred |
| A08 Software Integrity | ✅ N/A | No auto-update pipelines |
| A09 Logging Failures | ✅ Covered | Audit log on all auth events; fire-and-forget never crashes |
| A10 SSRF | ✅ N/A | No server-side URL fetching in auth flows |

---

## Production Readiness Score

### Pre-fix (Phase 3 as committed)

| Dimension | Score | Notes |
|---|---|---|
| Authentication core | 8/10 | bcrypt, JWT, enumeration-safe — solid |
| Session management | 3/10 | No invalidation after password reset or deactivation |
| Rate limiting | 0/10 | Completely absent |
| Input validation | 8/10 | Zod on all routes, good error messages |
| CSRF protection | 6/10 | sameSite lax + JSON content-type provides adequate coverage |
| Audit logging | 8/10 | Good coverage; minor gaps |
| Admin access control | 8/10 | Double-gated at proxy + server component |
| Referral integrity | 7/10 | Minor race condition in code generation |
| **Overall** | **5.5 / 10** | Not production-ready |

### Post-fix (after this phase)

| Dimension | Score | Notes |
|---|---|---|
| Authentication core | 9/10 | +JWT secret validation |
| Session management | 3/10 | Unchanged — deferred |
| Rate limiting | 7/10 | In-memory; adequate for single VPS, not for distributed |
| Input validation | 9/10 | passwordHash no longer returned in token consumption |
| CSRF protection | 6/10 | Unchanged |
| Audit logging | 8/10 | Unchanged |
| Admin access control | 9/10 | +open redirect fixed |
| Referral integrity | 7/10 | Unchanged |
| **Overall** | **7 / 10** | Acceptable for private beta; not for open production |

---

## Required Before Production Launch

The following must be resolved before accepting real user funds:

1. **CRIT-03** — Session invalidation after password reset (Phase 4 via `sessionVersion`)
2. **CRIT-04** — JWT revocation on account deactivation (same mechanism)
3. **HIGH-02** — Stale role/kycTier claims (same mechanism)
4. **Email provider** — Replace console stub in `lib/email/index.ts` with Resend / Sendgrid (Phase 7)
5. **Rate limiting** — Upgrade to Redis-backed limiter for multi-instance deployments (Phase 11)
6. **HTTPS** — Apply `__Host-` cookie prefix once TLS is configured (Phase 11)
7. **Nginx** — Configure trusted proxy IP for real IP extraction (Phase 11)

---

## Critical Fixes Applied in This Phase

| Fix | File | Change |
|---|---|---|
| Rate limiting on login | `app/api/auth/login/route.ts` | 10 req / 15 min per IP |
| Rate limiting on register | `app/api/auth/register/route.ts` | 5 req / hr per IP |
| Rate limiting on forgot-password | `app/api/auth/forgot-password/route.ts` | 3 req / hr per IP |
| Open redirect | `app/auth/login/page.tsx` | Block `//` protocol-relative redirects |
| JWT secret entropy | `lib/auth/jwt.ts` | Minimum 32-character check on startup |
| passwordHash exposure | `lib/auth/tokens.ts` | Scope `include.user` to non-sensitive fields only |
