# Referral Engine

## Overview

The referral engine issues REAL rewards to users who refer new registrations. It is event-driven: three trigger points fire reward functions that settle via the double-entry ledger.

All rewards:
- Create a `LedgerTransaction` (type: `referral_reward`, status: `completed`)
- Create two `LedgerEntry` rows that sum to zero
- Create an `ActivityLog` entry
- Create a `Notification` for the recipient
- Are fire-and-forget: failures are logged and never crash the triggering operation

---

## Reward Events

### 1. Email Verification Reward

**Trigger:** User verifies their email address (`POST /api/auth/verify-email`)  
**Reward:** 50 REAL to direct referrer (Level 1), 15 REAL to indirect referrer (Level 2)  
**Idempotency:** `referral.ledgerTxId !== null` — the referral record is updated once and never overwritten  
**Function:** `issueEmailVerifyReward(referredUserId)`

Ledger entries per reward:
```
DR  platform:rewards-pool:REAL     −50
CR  user:{referrerId}:REAL         +50

DR  platform:rewards-pool:REAL     −15  (if level-2 exists)
CR  user:{indirectReferrerId}:REAL +15
```

### 2. KYC Completion Bonus

**Trigger:** Admin approves a user's KYC profile (`approveKYC` in `lib/kyc/admin.ts`)  
**Reward:** 25 REAL to direct referrer only (Level 1, no indirect)  
**Idempotency:** Activity log check — `action = 'referral.kyc_reward_issued' AND targetId = referredUserId`  
**Function:** `issueKycReward(referredUserId)`

Ledger entries:
```
DR  platform:rewards-pool:REAL     −25
CR  user:{referrerId}:REAL         +25
```

### 3. First Deposit Bonus

**Trigger:** Admin approves a user's first deposit (`approveDeposit` in `lib/admin/deposit-service.ts`)  
**Reward:** 10 REAL to direct referrer only (Level 1, no indirect)  
**Idempotency:** Activity log check — `action = 'referral.deposit_reward_issued' AND targetId = referredUserId`  
**Function:** `issueFirstDepositReward(referredUserId)`

Note: only fires on the first approved deposit. Subsequent deposits do not trigger the reward.

Ledger entries:
```
DR  platform:rewards-pool:REAL     −10
CR  user:{referrerId}:REAL         +10
```

---

## Reward Amounts

Stored in the `settings` table under the `three_real` ecosystem:

| Key | Default | Description |
|-----|---------|-------------|
| `referral.reward.level1` | 50 | REAL per direct referral (email verify) |
| `referral.reward.level2` | 15 | REAL per indirect referral (email verify) |
| `referral.reward.kyc` | 25 | Bonus REAL when referred user completes KYC |
| `referral.reward.deposit` | 10 | Bonus REAL when referred user makes first deposit |

To change rates: update the `settings` table. No code changes needed.

---

## Rewards Pool

Source account: `platform / rewards-pool / REAL` (seeded with 500,000 REAL at launch).

Pool sustainability at current rates (65 REAL max per referral chain):
- 500,000 REAL pool ≈ 7,692 fully-converted referrals before top-up needed

If the pool balance is insufficient, the reward is silently skipped and an audit log entry with action `referral.pool_depleted` is created. The user experience is unaffected — the triggering operation (email verify, KYC approve, deposit approve) completes normally.

Pool top-up (manual admin operation):
```
LedgerTransaction type: pool_topup
DR  platform:equity:REAL     −X
CR  platform:rewards-pool:REAL +X
```

---

## Anti-Fraud Controls

| Control | Implementation |
|---------|---------------|
| Self-referral | Blocked at registration: `referrerId !== referredId` (checked in `register/route.ts`) |
| Duplicate email | Blocked at registration: unique email constraint in DB |
| Reward idempotency | `referral.ledgerTxId` guard (email verify), activity log guard (KYC, deposit) |
| Same-IP flag | Admin fraud queue shows IPs with 3+ referrals in 24h (`/admin/referrals`) |
| Pool depletion | Rewards silently skipped + audit log if pool insufficient |
| Reward cap | `referral.daily_limit = 20` setting available; not yet enforced in engine (Phase 9.5) |

---

## Attribution Flow

```
1. Referrer shares link: /auth/register?ref=CODE
2. User registers with ?ref=CODE:
   → referral record created (level 1): status='registered'
   → if referrer was also referred: level-2 record created: status='registered'
3. User verifies email:
   → issueEmailVerifyReward fires
   → referral.status → 'rewarded', referral.ledgerTxId set
   → 50 REAL credited to level-1 referrer
   → 15 REAL credited to level-2 referrer (if exists)
4. Admin approves KYC:
   → issueKycReward fires
   → 25 REAL bonus to level-1 referrer
5. Admin approves first deposit:
   → issueFirstDepositReward fires
   → 10 REAL bonus to level-1 referrer
```

---

## User Dashboard (`/dashboard/referrals`)

Sections:
1. **Stats** — total invites, active referrals, pending/earned/lifetime rewards
2. **Share tools** — copy code, copy link, QR code modal
3. **Earnings calculator** — interactive slider (client component)
4. **Invite table** — one row per level-1 referral with status and reward tracking
5. **Reward history** — all rewarded referrals with date, trigger, amount

---

## Admin Panel (`/admin/referrals`)

Sections:
1. **Metrics** — total referrals, rewarded count, total REAL issued, pool balance, fraud signal count
2. **Leaderboard** — top 10 referrers by total referrals
3. **Fraud queue** — IPs with 3+ referrals in the last 24 hours, with risk rating
4. **Anti-fraud rules** — static summary of active controls

---

## Ledger Sign Convention

All referral rewards follow the same sign convention as the rest of the platform:
- Debit = negative (pool DR reduces what pool holds)
- Credit = positive (user CR increases what platform owes user)
- Each LedgerTransaction is balanced: entries sum to zero

---

## Future Enhancements (Phase 9.5+)

| Feature | Description |
|---------|-------------|
| Daily reward cap | Enforce `referral.daily_limit` in engine — hold excess for review |
| Reward reversal | Admin tool to reverse fraudulent rewards via correcting ledger entry |
| Pool top-up UI | Admin action to DR equity / CR rewards-pool with audit trail |
| Same-device detection | Flag registrations from same device fingerprint |
| Pending reward display | Show pendingRewards on dashboard (requires rewardAmount pre-set on registered referrals) |
| Earnings chart | Weekly bar chart of REAL earned per day |
| Public leaderboard | Anonymized top referrer display on dashboard |
