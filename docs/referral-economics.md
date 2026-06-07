# 3REAL — Referral Economics

**Prepared for:** Phase 1.5 Architecture Review  
**Date:** 2026-06-07  
**Scope:** Referral reward mechanics, attribution rules, anti-fraud controls, reward timing, multi-tier structure, platform sustainability, leaderboard mechanics, and v1 implementation recommendations.

---

## 1. Why Referrals Are Critical for 3REAL

3REAL's primary user acquisition channel is organic referrals, not paid advertising. This is by design and mirrors the growth strategy of every successful Iranian exchange:

- Nobitex built to 5+ million users primarily through referral commission sharing
- Wallex's 2-tier referral was a key differentiator when entering the market
- Ramzinex's 3-tier structure and commission calendar drove its professional-trader segment

For 3REAL, with a target market spread across diaspora communities in Norway, Europe, and North America, referrals are not just cost-effective — they are the primary trust mechanism. In diaspora communities, a recommendation from a known contact carries far more weight than any advertising channel.

**Design implication:** The referral system must be prominent, feel rewarding, and show earnings in real-time. A referral module buried in settings is a missed growth opportunity.

---

## 2. Competitive Benchmark

| Platform | Structure | Direct Rate | L2 Rate | L3 Rate | Calculator | Calendar | Custom Code |
|---|---|---|---|---|---|---|---|
| Nobitex | Flat | 30% fees | — | — | No | No | No |
| Wallex | 2-tier | 30% fees | 10% fees | — | No | No | Yes (premium) |
| Ramzinex | 3-tier | 35% fees | 15% fees | 5% fees | Buried | Yes (daily chart) | No |
| Tabdeal | 2-tier | 25% fees | 10% fees | — | Yes (on page) | No | No |
| Binance | Flat + kickback | 20–40% fees | — | — | No | No | No |
| Kraken | One-time | $10 flat | — | — | No | No | No |
| Coinbase | One-time | $10 BTC | — | — | No | No | No |

**Key insight:** Iranian exchanges use ongoing fee commissions (referrer earns % of what their referral does) because they work best for a trading-active user base. Global exchanges use one-time bonuses because they have large enough user bases to absorb the cost.

3REAL's model is different from both: there is no trading fee to share (3REAL is not an exchange). The referral reward must be a fixed REAL amount, not a fee percentage.

---

## 3. Recommended Referral Model for 3REAL

### 3.1 Reward Type: Fixed REAL on Registration

**Model:** Referrer earns a fixed number of REAL when a referred user:
1. Registers with their referral code, AND
2. Completes email verification (Tier 1 KYC)

**Why fixed REAL, not fee percentage:**
- No trading fees to share (not an exchange)
- Fixed rewards are predictable and easy for users to understand
- Makes the earnings calculator trivial to implement
- Less gameable than ongoing fee sharing (no incentive to generate fake trading volume)

**Optional v2 upgrade:** Add a second reward trigger — a bonus when the referred user completes Tier 2 KYC or makes their first deposit above a threshold. This incentivizes referrers to actively help their referrals through the funnel.

### 3.2 Tier Structure

**Recommendation: 2-tier system.**

| Level | Description | Reward | Trigger |
|---|---|---|---|
| Level 1 (direct) | You referred User B | 50 REAL | User B verifies email |
| Level 2 (indirect) | User B referred User C | 15 REAL | User C verifies email |

**Example earnings flow:**
- Alice refers Bob → Alice earns **50 REAL** when Bob verifies
- Bob refers Carol → Bob earns **50 REAL** when Carol verifies; Alice earns **15 REAL** (level 2)
- Carol refers Dave → Carol earns 50 REAL; Bob earns 15 REAL; Alice earns **nothing** (3rd level is not supported)

**Why 2 tiers and not 3:**
- 2 tiers drives network effect without legal "pyramid scheme" concerns in most jurisdictions
- 3 tiers (Ramzinex model) complicates explanation and creates more anti-fraud complexity
- The Level 2 reward is the key growth mechanic: Alice is incentivized to recruit active referrers, not just passive sign-ups

### 3.3 Reward Amounts

Starting values (configurable via `settings` table, not hardcoded):

| Setting Key | Default Value | Description |
|---|---|---|
| `referral.reward.level1` | `50` | REAL rewarded to direct referrer |
| `referral.reward.level2` | `15` | REAL rewarded to indirect referrer |
| `referral.trigger` | `email_verified` | What event triggers the reward |
| `referral.min_days_to_payout` | `0` | Days after trigger before REAL is credited |

**Platform sustainability check:** If the platform issues 65 REAL per registration (50 + 15), and the rewards pool starts at 1,000,000 REAL, the pool supports ~15,385 successful referrals before requiring a top-up. Monitor pool balance closely once growth accelerates.

---

## 4. Attribution Model

### 4.1 How Attribution Works

1. User visits `/r/{code}` — referral click recorded in `referrals` (status: 'pending', `click_at` set, `click_ip` stored)
2. User registers — referral attributed if: cookie contains referral_code OR last_click within 30 days from same IP matches a referral
3. On registration with referral_code: `referrals.referred_id` set, `referrals.registered_at` set, status → 'registered'
4. On email verification: reward issued, `referrals.status` → 'rewarded', `referrals.ledger_tx_id` set

### 4.2 Attribution Priority

If a user has multiple referral touchpoints (visited two different referral links before registering):

**Rule:** First-click attribution wins. The first referral click (earliest `click_at`) for a unique session is the one that earns the reward.

**Why first-click over last-click:** Last-click creates an incentive for fraud (overwrite legitimate referral clicks with your own just before registration). First-click is harder to game and rewards the person who actually introduced the user.

### 4.3 Registration Attribution

On the registration form, there are two paths:
1. **Direct referral code entry:** User types a code in the registration form
2. **Cookie-based attribution:** User visited `/r/{code}` before registering

Priority when both exist: **Form entry wins over cookie.** The user explicitly chose to attribute to that referrer.

---

## 5. Anti-Fraud Controls

### 5.1 Self-Referral Prevention

```
Rule: A user cannot earn rewards by referring themselves.
Check: If referrer_id == referred_id → block at registration.
Also: If referred email shares a domain with referrer email and both are corporate (@company.com) — flag for manual review.
```

### 5.2 IP-Based Deduplication

```
Rule: Multiple registrations from the same IP within a short window are suspicious.
Signal: If 3+ referrals all originate from the same IP within 24 hours → flag as suspicious, hold rewards for manual review.
This does not block registration — only delays reward.
```

### 5.3 Email Disposable Address Detection

```
Rule: Referral reward is triggered on email_verified, not on registration.
By requiring email verification, disposable email farms (temp-mail services) are automatically excluded.
Additional check: Run email domain against a disposable email domain list before issuing rewards.
```

### 5.4 KYC Verification Gate

```
Rule (optional v2 upgrade): Referral reward is only fully paid when referred user reaches KYC Tier 2.
Justification: A verified user is much harder to fake and represents genuine user acquisition.
Implementation: Split the 50 REAL reward — 25 REAL on email verify, 25 REAL on KYC Tier 2 approval.
```

### 5.5 Reward Hold Period

```
Setting: referral.min_days_to_payout = 0 (v1 default, can be raised)
If fraud is detected post-payout, a correcting ledger entry (reversal) can still recover the REAL.
A hold period of 3-7 days after trigger is a common practice.
```

### 5.6 Rate Limiting

```
Rule: A single referrer cannot trigger more than N rewards in a 24-hour window without triggering a review flag.
Default N: 20 (configurable via settings).
Reason: Legitimate organic referrers rarely exceed this; VPN farms and bot accounts do.
```

### 5.7 Anti-Fraud Data Stored in `referrals`

Ensure `referrals.click_ip` is populated on click. The `activity_logs` table captures all reward issuances. The admin panel should expose a "suspicious referral patterns" view filtered by:
- Multiple registrations from one IP
- Referrers with > 20 referrals in 24h
- Referrals where referred user has never logged in after verification

---

## 6. Reward Issuance Mechanics

### 6.1 Reward Trigger Event

When `email_verified` event fires (user clicks verification link):
1. Check if this user was referred (lookup `referrals WHERE referred_id = user.id AND status = 'registered'`)
2. If found:
   a. Issue Level 1 reward to `referrals.referrer_id`
   b. Look up `referrals WHERE referred_id = referrer_id AND referral_level = 1` (was the referrer also referred by someone?)
   c. If found, issue Level 2 reward to the original referrer's referrer

### 6.2 Reward Issuance as Ledger Event

```typescript
async function issueReferralReward(
  referralId: string,
  recipientUserId: string,
  level: 1 | 2,
  ecosystemId: string
): Promise<void> {
  const rewardAmount = level === 1
    ? await getSetting('referral.reward.level1', ecosystemId)  // e.g., 50 REAL
    : await getSetting('referral.reward.level2', ecosystemId); // e.g., 15 REAL

  // Check rewards pool balance
  const poolBalance = await getAccountBalance('platform', 'rewards-pool', 'REAL', ecosystemId);
  if (poolBalance < rewardAmount) {
    // Alert admin: rewards pool is depleted
    await alertAdminPoolDepleted(poolBalance, rewardAmount);
    return; // Do not crash — just do not issue reward
  }

  await prisma.$transaction(async (tx) => {
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        ecosystem_id: ecosystemId,
        type: 'referral_reward',
        status: 'completed',
        reference_id: referralId,
        reference_type: 'referral',
        initiated_by: null, // system-initiated
      }
    });

    await tx.ledgerEntry.createMany({
      data: [
        { ledger_transaction_id: ledgerTx.id, ecosystem_id: ecosystemId,
          account_id: await getOrCreateAccount('platform', 'rewards-pool', 'REAL', ecosystemId),
          asset_code: 'REAL', amount: -rewardAmount },
        { ledger_transaction_id: ledgerTx.id, ecosystem_id: ecosystemId,
          account_id: await getOrCreateAccount('user', recipientUserId, 'REAL', ecosystemId),
          asset_code: 'REAL', amount: rewardAmount },
      ]
    });

    await tx.referral.update({
      where: { id: referralId },
      data: { status: 'rewarded', reward_amount: rewardAmount, ledger_tx_id: ledgerTx.id }
    });

    // Notify recipient
    await tx.notification.create({
      data: {
        user_id: recipientUserId,
        ecosystem_id: ecosystemId,
        type: 'referral_reward',
        title: 'You earned a referral reward!',
        body: `${rewardAmount} REAL has been added to your wallet.`,
        reference_id: referralId,
        reference_type: 'referral',
      }
    });
  });
}
```

---

## 7. Referral Dashboard UX (User-Facing)

Based on competitive analysis, the referral dashboard must include:

### 7.1 Essential Elements

**1. Referral link + one-tap copy**
```
Your referral link:
https://3real.no/r/ABC123
[Copy] [Share on Telegram] [Share QR Code]
```

**2. Earnings calculator** (Tabdeal pattern — most motivating)
```
If your friend deposits:    [100] REAL
You will earn:              50 REAL

If they also refer someone:
You will earn (Level 2):    15 REAL
```

**3. Live stats panel**
```
Total referrals:    47
Verified:           32
Total earned:       1,600 REAL
Pending (in hold):  50 REAL
```

**4. Referral activity table**
| User | Joined | Status | Your Reward |
|---|---|---|---|
| User_A4F2 | Jun 1 | Verified ✓ | 50 REAL |
| User_B91C | Jun 3 | Pending email | — |

Show anonymized display names (not full emails) for privacy. Show status clearly.

**5. Earnings chart** (Ramzinex commission calendar — highest motivation signal)
A weekly bar chart showing REAL earned per day. Even small daily bars create habit-forming behavior.

### 7.2 Shareable Referral Page

URL: `/r/{code}`

This page should:
- Be designed for conversion: explain 3REAL in 2-3 sentences
- Show the new user's potential reward: "Register now and earn your first 50 REAL bonus"
- Have a single prominent CTA: [Create Account]
- Pre-populate the referral code in the registration form
- Work well in Telegram link previews (og:image, og:title)
- Support Persian, Norwegian, English

---

## 8. Rewards Pool Sustainability

### 8.1 Pool Sizing

At platform launch, the platform allocates REAL to the rewards pool. Sizing considerations:

| Users Target | Avg Referral Depth | Rewards per User | Pool Required |
|---|---|---|---|
| 1,000 users | 1.5 referrals each | 65 REAL avg | 97,500 REAL |
| 10,000 users | 1.5 referrals each | 65 REAL avg | 975,000 REAL |
| 100,000 users | 1.5 referrals each | 65 REAL avg | 9,750,000 REAL |

**Recommendation for v1 launch:** Seed the rewards pool with 500,000 REAL. This supports ~7,700 successful referrals — enough to validate the referral model before deciding whether to top up.

### 8.2 Pool Monitoring

Admin dashboard should prominently display:
- Rewards pool current balance
- Rewards pool 30-day burn rate (REAL/day)
- Estimated days until pool depleted (at current burn rate)

Alert admin when pool balance drops below 30 days of burn rate.

### 8.3 Pool Top-Up

When the pool needs refilling, the operator credits from platform equity:
```
ledger_transaction: type = 'pool_topup'

ledger_entries:
  DR  platform:equity:REAL      −X
  CR  platform:rewards-pool:REAL +X
```

This is an intentional economic decision and should require two-admin authorization in the admin panel.

---

## 9. Multi-Ecosystem Referrals

In v2 and v3, when Shahnameh and TrustAI launch, referrals need ecosystem scoping:

**Rule:** A referral code is platform-wide (not ecosystem-specific). If User B registers via 3REAL referral, they are a SETAEI platform user. Their activity in any ecosystem benefits their referrer.

**Complication:** If Shahnameh wants to run its own referral campaign with different reward rates, it needs its own `referral_reward_rates` per ecosystem.

**Recommendation:** The `referral.reward.level1` and `referral.reward.level2` settings should be stored in the `settings` table with `ecosystem_id` scoping. Global default: 50/15 REAL. Shahnameh can override with `ecosystem_id = shahnameh_uuid`.

---

## 10. Referral Admin Controls

The admin panel's Referral section should include:

| Feature | Purpose |
|---|---|
| Reward history | View all rewards issued with ledger tx link |
| Suspicious patterns | Flag referrers with anomalous patterns |
| Manual reward | Issue reward to a user manually (with required note) |
| Reward revoke | Reverse a fraudulent reward with required note |
| Pool top-up | Credit rewards pool (requires 2FA confirmation) |
| Rate configuration | Update Level 1 and Level 2 reward amounts |
| Leaderboard | Top referrers by month (gamification — also user-facing) |
| Blacklist | Block specific users from earning referral rewards |

---

## 11. Leaderboard (Optional, High Engagement)

A monthly leaderboard showing top 10 referrers drives competitive behavior among active promoters.

```
This Month's Top Referrers — June 2026
#1  User_X7A2    →   47 referrals  →  2,350 REAL earned
#2  User_F19B    →   31 referrals  →  1,550 REAL earned
#3  User_M44C    →   28 referrals  →  1,400 REAL earned
...

[Your Rank: #23 — 12 referrals — 600 REAL earned]
```

**Privacy:** Show only anonymized user handles, not emails or full names.  
**Reset:** Monthly — prevents early leader lock-in.  
**Reward top 3:** Optional — a small monthly bonus (e.g., 100 REAL) for the top 3 referrers increases motivation dramatically without significant cost.
