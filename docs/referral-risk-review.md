# Referral Risk Review

**Date:** 2026-06-08  
**Scope:** Abuse vectors, farming attacks, Sybil resistance, multi-account abuse, reward exhaustion

---

## 1. Abuse Vectors

### 1.1 Multi-Account Self-Referral (Sybil Attack)

**Attack:** User creates one or more secondary accounts using their own referral code. Each secondary account that verifies email earns the primary account 50 REAL.

**Current blocking:** None at registration. The system only blocks same-email re-registration (duplicate email constraint). A user with `user@gmail.com` can create `user+1@gmail.com`, `user+2@gmail.com`, etc. and refer themselves.

**Confirmed via test:** Registration with own referral code + different email succeeds. A referral record is created. 50 REAL would be credited on email verification.

**Mitigations in place:**
- Rate limiting: 5 registrations per IP per hour limits burst creation
- IP fraud queue: `/admin/referrals` flags IPs with 3+ referrals in 24h
- Email verification required: reward delayed until email confirmed (disposable address farms take effort to maintain)
- Manual review: flagged IPs can be reviewed by admin before rewards are paid out

**Recommended hardening (Phase 9.5+):**
1. **Plus-address normalization:** Treat `user+1@gmail.com` as `user@gmail.com` (same user)
2. **Email domain rate limit:** Max N registrations per email domain per day
3. **KYC gate for payout:** Hold L1 reward until referred user completes KYC (much harder to Sybil with real ID documents)
4. **Device fingerprint:** Hash `User-Agent + Accept-Language + screen size` as a soft device identifier; flag multiple registrations from same fingerprint

---

### 1.2 Referral Link Hijacking

**Attack:** Attacker overwrites a legitimate referral click by convincing a user to click their own link just before registration.

**Impact:** The legitimate referrer loses the reward; attacker earns it.

**Current state:** Only form-based attribution is implemented. No click tracking (no `/r/{code}` endpoint). The referral code on the registration form is explicit and user-controlled.

**Mitigations in place:** None beyond the explicit form entry.

**Recommended hardening:**
- Implement `/r/{code}` redirect with session cookie storage (first-click attribution wins)
- Log `clickAt` and `clickIp` on click (already stored at registration, see BUG-006 fix)

---

### 1.3 Referral Code Enumeration

**Attack:** Attacker brute-forces valid referral codes and registers fake accounts under legitimate referrers to earn L2 rewards from an existing referral chain.

**Impact:** Attacker earns nothing directly (they are the referred user, not the referrer). The existing referrer chain earns rewards but for fake users — wasting pool funds.

**Current state:** Referral codes are 8-character uppercase alphanumeric (CROCKFORD BASE32-ish), ~3.2 trillion combinations. Rate limiting at registration (5/IP/hour) makes enumeration expensive.

**Mitigations in place:**
- Rate limiting on registration endpoint
- Codes are 8 chars random — brute force impractical at current scale

---

### 1.4 Reward Spam via Multiple Deposits

**Attack:** User submits many small deposits to trigger deposit rewards repeatedly.

**Current state:** Blocked — `issueFirstDepositReward` uses an activity_log idempotency check (`action = 'referral.deposit_reward_issued' AND targetId = referredUserId`). Only the first approved deposit triggers the reward.

**Status:** Mitigated.

---

### 1.5 KYC Reward Double-Issue

**Attack:** Admin approves KYC multiple times (e.g., via a bug or forced retry) to trigger KYC reward multiple times.

**Current state:** Blocked — `issueKycReward` uses activity_log idempotency check. Additionally, KYC approval endpoint returns 409 on second approval attempt (`INVALID_STATE`).

**Status:** Mitigated.

---

## 2. Farming Attacks

### 2.1 Referral Farming Ring

**Attack:** Group of colluding users all refer each other in a chain to maximize L2 rewards. User A refers B, B refers C, C refers D, etc. Each "verified" account earns the one above it 50 REAL (L1) and the one two levels above 15 REAL (L2).

**Impact:** Up to 65 REAL drained from pool per coordinated fake user. 10,000-person ring = 650,000 REAL drained.

**Current state:** Not blocked. The 2-tier structure limits depth (no L3), but rings can still be large.

**Mitigations in place:**
- Rewards pool: 500,000 REAL ceiling on total damage
- IP fraud queue: ring members likely share or rotate through limited IPs
- Email verification required (ring members need working emails)

**Recommended hardening:**
1. **KYC gate on payout:** Referral rewards held until referred user reaches KYC Tier 2. A government-ID-verified fake user is expensive to create at scale.
2. **Daily reward cap per referrer:** Configurable `referral.daily_limit` (default: 20 rewards/day). Already in `settings` table, not yet enforced in engine.
3. **Velocity alert:** If a referrer earns > 5 rewards in 1 hour, auto-flag for manual review.

---

### 2.2 Email Verification Farm

**Attack:** Automated system registers thousands of email accounts (using real email providers with scripted inbox access) and verifies them in bulk.

**Impact:** Could drain pool quickly if rate limiting is insufficient.

**Current state:**
- 5 registrations/IP/hour rate limit (in-memory, resets on server restart — not persistent)
- Single-server in-memory rate limit has no cross-instance protection

**Recommended hardening:**
1. **Redis-backed rate limiting** for production (persistent, cross-instance)
2. **CAPTCHA on registration** (reCAPTCHA invisible challenge)
3. **Pool monitoring alert:** Alert admin when pool burn rate exceeds X REAL/day

---

## 3. Sybil Attacks

### 3.1 One Person, Many Identities

**Attack:** A single person creates N accounts to earn referral rewards at scale. Combines with self-referral (#1.1) or farming ring (#2.1).

**Current state:** The system has no identity binding beyond email + password. One person can create unlimited accounts with different email addresses.

**Recommended hardening:**
1. **Phone verification:** Require SMS OTP on registration (strong identity anchor)
2. **KYC gate:** Requiring Tier 2 KYC (government ID) for reward payout makes Sybil extremely expensive
3. **Address uniqueness:** For fiat assets, require unique bank account/IBAN per user
4. **Email domain blocklist:** Block known disposable/alias email providers

---

### 3.2 IP Rotation Attack

**Attack:** VPN or proxy rotation allows attacker to bypass IP-based fraud detection. Each registration comes from a different IP.

**Current state:** IP fraud queue only catches same-IP clustering. IP rotation trivially bypasses it.

**Recommended hardening:**
1. **Device fingerprinting** (browser canvas hash, WebGL hash, font enumeration)
2. **Behavioral analysis:** Very fast registration-to-verification times suggest automation
3. **Velocity analysis on referrer:** If a single referrer earns rewards for >N users in 24h, flag regardless of IP

---

## 4. Multi-Account Abuse

### 4.1 Reward Laundering

**Attack:** User creates a secondary account, refers it, earns 50 REAL reward, then withdraws from the primary account. Secondary account is abandoned.

**Impact:** 50 REAL drained per cycle. Low complexity, low detectability.

**Current state:**
- Withdrawal requires KYC Tier 2 (limits damage to users who have completed KYC on primary account)
- Secondary account can't withdraw without its own KYC
- Reward is on the primary account — only the referrer earns

**Recommended hardening:**
1. **Link detection:** Flag if primary account's withdrawal IBAN/wallet appears in another account's deposit history
2. **Hold period:** 7-day hold on referral rewards before they become withdrawable

---

### 4.2 KYC Document Reuse

**Attack:** User submits the same ID document for multiple accounts.

**Current state:** No document deduplication check. Documents are stored as files; no hash comparison.

**Recommended hardening:**
1. **Document hash check:** SHA-256 of uploaded file checked against previously submitted documents
2. **Face similarity check:** AI-powered liveness/face match (Phase 10+ scope)

---

## 5. Reward Exhaustion

### 5.1 Pool Drain Speed

**Pool size:** 500,000 REAL  
**Max reward per referral chain:** 65 REAL (50 L1 + 15 L2) + 25 KYC + 10 deposit = 100 REAL max per referred user  
**Pool supports:** ~5,000 fully-converted referred users

At 100 users/day fully-converted → pool lasts ~50 days.  
At 10 users/day → pool lasts ~1.4 years.

**Current state:** Pool depletion is handled gracefully (rewards skipped, audit log created). No user-facing degradation.

**Recommended hardening:**
1. **Pool monitoring:** Alert admin at 50,000 REAL remaining (10% of pool)
2. **Burn rate dashboard:** Show daily/weekly REAL reward issuance on admin panel
3. **Pool topup flow:** Admin action to DR equity, CR rewards-pool with audit trail
4. **Circuit breaker:** If pool drops below 30-day burn rate, automatically pause reward issuance and notify admin

---

### 5.2 Pool Exhaustion via Timing Attack

**Attack:** Attacker times a burst of verifications to race past the pool balance check before the admin can intervene.

**Current state:** The pool check is done OUTSIDE the transaction (non-atomic). Race condition: two concurrent rewards can both see `balance > amount`, both proceed, and pool can go slightly negative.

**Impact:** Minor — each reward is small (10–50 REAL). In the worst case, pool goes negative by at most `reward_amount × concurrent_requests`.

**Recommended hardening:**
1. Move pool balance check INSIDE the `prisma.$transaction` and use `SELECT ... FOR UPDATE` to lock the pool account row
2. This eliminates the race window entirely

---

## 6. Current Protection Summary

| Attack | Blocked | Partially Mitigated | Not Mitigated |
|--------|---------|---------------------|---------------|
| Same-email self-referral | ✓ | | |
| Multi-account self-referral | | ✓ (IP rate limit + fraud queue) | |
| Deposit reward double-issue | ✓ | | |
| KYC reward double-issue | ✓ | | |
| Email verify reward double-issue | ✓ | | |
| Referral code brute force | | ✓ (rate limit + 8-char codes) | |
| Referral farming ring | | ✓ (IP fraud queue, pool cap) | |
| Email verification farm | | ✓ (rate limit) | |
| IP rotation Sybil | | | ✓ |
| KYC document reuse | | | ✓ |
| Pool timing race (minor) | | ✓ (small blast radius) | |

---

## 7. Recommended Phase 9.5+ Hardening Roadmap

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | KYC gate on reward payout (hold until KYC Tier 2) | Medium | Eliminates most Sybil vectors |
| 2 | Daily reward cap enforcement (already in settings) | Low | Limits farming ring damage |
| 3 | Redis-backed rate limiting | Low | Persistent, multi-instance safe |
| 4 | Phone/SMS verification on registration | Medium | Strong identity anchor |
| 5 | Pool topup admin UI + monitoring alerts | Low | Operational safety |
| 6 | Atomic pool check (FOR UPDATE in transaction) | Low | Eliminates race condition |
| 7 | Plus-address email normalization | Low | Blocks trivial multi-account |
| 8 | Document hash deduplication on KYC submit | Medium | Blocks ID reuse |
| 9 | Device fingerprinting | High | Blocks IP-rotation Sybil |
| 10 | Reward hold period (7 days) | Low | Slows laundering, gives review window |
