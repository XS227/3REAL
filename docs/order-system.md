# 3REAL — Order System & Workflow Design

**Prepared for:** Phase 1.5 Architecture Review  
**Date:** 2026-06-07  
**Scope:** Deposit workflow, withdrawal workflow, conversion/exchange workflow, admin approval mechanics, status state machines, notification triggers, idempotency, and error handling.

---

## 1. What "Orders" Means in 3REAL

3REAL is not a trading exchange. There is no order book, no matching engine, no bid/ask. The word "order" here means a **user request for a financial operation** that requires admin approval before ledger settlement.

Three types of orders exist:

| Type | User Action | Admin Action | Ledger Action |
|---|---|---|---|
| Deposit | Submit amount + payment proof | Verify and approve or reject | Write credit entries on approval |
| Withdrawal | Submit amount + destination | Verify and approve or reject | Write debit entries on approval |
| Conversion | Submit source asset + amount | Automated (rate-gated) or admin | Write conversion entries |

---

## 2. Deposit Workflow

### 2.1 State Machine

```
               User submits
                    │
                    ▼
              [ pending ]
                    │
             Admin opens ticket
                    │
                    ▼
           [ under_review ]
               ┌───┴───┐
         Admin        Admin
        approves      rejects
               │          │
               ▼          ▼
         [ approved ]  [ rejected ]
               │
        Ledger entries written
               │
               ▼
         [ completed ]
               │
               ▼ (on-chain only, Phase 2)
      [ blockchain_confirmed ]

Alternative: User cancels before admin acts
               │
               ▼
          [ cancelled ]
```

### 2.2 State Definitions

| State | Who Sets It | Ledger State | User Can See |
|---|---|---|---|
| `pending` | System (on submit) | No entries | "Deposit submitted, awaiting review" |
| `under_review` | Admin (on open) | No entries | "Under review" |
| `approved` | Admin (on approve) | Entries being written | "Approved, processing..." |
| `completed` | System (after ledger write) | Entries committed | "Completed — balance updated" |
| `rejected` | Admin (on reject) | No entries | "Rejected: [admin_note]" |
| `cancelled` | User (before under_review) or System | No entries | "Cancelled" |

**Important:** The `approved` state is transient. The system moves from `approved` → `completed` in the same database transaction. Users should never see `approved` for more than milliseconds unless the DB write is slow.

**Practical v1 simplification:** Skip `approved` as a visible state. Admin clicks "Approve" → ledger entries written atomically → status jumps directly to `completed`. Only expose `completed` vs `rejected` to the user.

### 2.3 Deposit Request Data

Fields required when user submits:

```
transactions (deposit):
  type:            'deposit'
  asset_code:      'REAL'  (v1) or 'USDT', 'TON', 'EUR', 'NOK' (v2)
  amount:          user-entered gross amount
  payment_method:  'bank_transfer', 'usdt_trc20', 'ton', 'sepa'
  payment_ref:     user-provided reference (bank ref number, tx hash hint, etc.)
  status:          'pending'
```

**What the user does NOT provide:**
- `fee_amount` — calculated by the system from `fee_tiers`
- `net_amount` — computed as `amount - fee_amount`
- `ledger_tx_id` — set on approval

**Reference number:** Immediately on submission, show the user a reference number (the `transactions.id` or a short human-readable code derived from it). This is the single most important anti-pattern to avoid (see Nobitex: opaque deposit reconciliation). User must be able to say "my deposit reference is D-2024-001234."

### 2.4 Deposit Confirmation Screen

After submit, show:
```
Deposit Request Submitted

Reference: D-2024-001234
Amount:    100 REAL
Method:    Bank Transfer
Status:    Pending Review

What happens next:
  ✓ Your request is in our queue
  → Admin will review within 2-4 hours during business hours
  → You'll receive an email and in-app notification when it's processed
  
[View all transactions]
```

### 2.5 Admin Deposit Review Interface

The admin queue shows, per row:
- Reference number
- User name + KYC tier (inline, no navigation required)
- Amount + asset
- Payment method + reference
- Submission time + age (highlight if > 4 hours)
- Status

Admin actions:
- **Approve:** Opens confirmation dialog → writes ledger entries → sends user notification
- **Reject:** Opens dialog requiring a rejection reason → updates status → sends user notification
- **Comment:** Add internal note without changing status

**Atomicity rule:** If the ledger write fails after admin clicks Approve, the `transactions.status` must not change to `completed`. The approval must be wrapped in a database transaction.

---

## 3. Withdrawal Workflow

### 3.1 State Machine

```
               User submits
                    │
                    ▼
              [ pending ]
                    │
             Admin opens ticket
                    │
                    ▼
           [ under_review ]
               ┌───┴───┐
         Admin        Admin
        approves      rejects
               │          │
               ▼          ▼
         [ approved ]  [ rejected ]
               │
        Ledger entries written
        (debit user, credit withdrawals-pending)
               │
               ▼
         [ processing ]   ← Platform is sending funds
               │
        Funds sent confirmed
               │
               ▼
         [ completed ]

               OR if sending fails:
               │
               ▼
          [ failed ]  → Reversal ledger entries written → user balance restored
```

### 3.2 Withdrawal Validation (Before Submission)

Before a withdrawal request is accepted:
1. User's available balance ≥ requested amount + fees
2. User's KYC tier ≥ required tier for this withdrawal amount (from `fee_tiers`)
3. User has not exceeded daily/monthly withdrawal limits (computed from `transactions`)
4. Destination address format is valid (for crypto: address checksum; for bank: IBAN format)

If any check fails, return a specific error message — not a generic "withdrawal failed."

### 3.3 Ledger Write on Approval

```
-- Written atomically on admin approval:

1. ledger_transaction (type: 'withdrawal', status: 'processing')

2. ledger_entries:
   DR  user:{id}:REAL                    −amount          (debit user balance)
   CR  platform:withdrawals-pending:REAL  +amount          (reserve funds)

-- When platform confirms funds sent:

3. ledger_transaction update: status → 'completed'

4. ledger_entries:
   DR  platform:withdrawals-pending:REAL  −amount          (release reserve)
   CR  platform:float:REAL               +amount           (or equity if sent out)

-- Fee entries (same transaction):
   DR  user:{id}:REAL                    −fee
   CR  platform:fees:REAL               +fee
```

### 3.4 v1 Simplification

For manual withdrawals in v1, the admin verifies, sends the value externally, then marks complete. The two-step ledger write (reserve → settle) can be collapsed into one atomic write at the time the admin confirms sending.

### 3.5 Failed Withdrawal Reversal

If the external send fails (bank rejects, crypto tx fails):

```
ledger_transaction (type: 'withdrawal_reversal', status: 'completed')
ledger_entries:
  DR  platform:withdrawals-pending:REAL  −amount  (cancel reserve)
  CR  user:{id}:REAL                     +amount  (restore user balance)
```

The original withdrawal `transactions.status` becomes `failed`. A new notification is sent to the user. The admin_note field records why it failed.

---

## 4. Conversion / Exchange Workflow (Phase 2)

### 4.1 Conversion Types in 3REAL

| Conversion | v1 | v2 |
|---|---|---|
| External asset → REAL | Manual (admin) | Automated (on confirmed deposit) |
| REAL → external asset | Not offered | Via withdrawal |
| REAL → REAL (cross-ecosystem) | Not offered | Via ecosystem transfer |

In v2, when a user deposits USDT, the system can either:
- **Option A:** Credit USDT to user's USDT account (user holds USDT)
- **Option B:** Auto-convert to REAL at the current rate (user holds REAL)

**Recommendation for v2:** Offer both. Default to auto-convert with the user able to opt out. This aligns with the "REAL-first" positioning of the platform.

### 4.2 Manual Conversion Request (v2)

```
User clicks "Convert USDT to REAL":
  → Sees current rate (e.g., 1 USDT = 50 REAL)
  → Enters amount (e.g., 100 USDT)
  → System calculates: 100 × 50 × (1 − 0.02) = 4,900 REAL (2% fee)
  → User sees: "You receive 4,900 REAL. Fee: 100 REAL (2%)"
  → User confirms
  → Ledger entries written atomically (no admin approval needed for conversions)
```

### 4.3 Conversion Rate Lock

When a user initiates a conversion, lock the rate for 30 seconds. If they confirm within 30 seconds, the displayed rate applies. If they exceed 30 seconds, re-fetch the rate and show the updated quote before they can confirm.

This prevents "rate bait" where the user sees a favorable rate but gets a different one on execution.

---

## 5. Exchange Workflow (Future — Not in v1 or v2)

Per `roadmap-v1-v2-v3.md`, spot trading and an order book are explicitly out of scope. 3REAL is not an exchange. This section exists only to document why we are not building it and what the migration path would be if the decision changes.

**If exchange features are ever added:**
- A new `orders` table (type: limit/market, side: buy/sell, status: open/filled/cancelled)
- An `order_fills` table (matching engine output)
- The ledger continues to be the source of truth — order fills write ledger entries
- No balance columns added anywhere

**The ledger architecture already supports this.** The migration cost is in the matching engine and order book UI, not the data model.

---

## 6. Notification Triggers

Every state change in the order system must trigger a notification. The following are mandatory in v1:

| Event | Channel | Message |
|---|---|---|
| Deposit submitted | In-app | "Deposit request received. Reference: D-XXXX" |
| Deposit approved / completed | In-app + Email | "Your deposit of X REAL has been processed." |
| Deposit rejected | In-app + Email | "Your deposit was rejected: [admin_note]" |
| Withdrawal submitted | In-app | "Withdrawal request received. Reference: W-XXXX" |
| Withdrawal approved | In-app + Email | "Your withdrawal is being processed." |
| Withdrawal completed | In-app + Email | "Your withdrawal of X REAL has been sent." |
| Withdrawal rejected | In-app + Email | "Your withdrawal was rejected: [admin_note]" |
| Withdrawal failed | In-app + Email | "Your withdrawal could not be sent. Your balance has been restored." |

**Tone guidance (from competitive analysis — Coinbase pattern):**
- Approved: "Great news — your deposit is complete!"
- Rejected: "Unfortunately, we couldn't process your deposit. [Reason]. [What to do next]."
- Never use cold technical language ("Transaction status: REJECTED").

---

## 7. Idempotency

### 7.1 The Problem

Two admin operators accidentally click "Approve" on the same deposit at the same time → two ledger events created → user is credited twice.

### 7.2 Solution: Optimistic Lock on Transactions

Before writing ledger entries, execute:
```sql
UPDATE transactions 
SET status = 'approved', updated_at = NOW()
WHERE id = :id AND status = 'pending'
RETURNING id;
```

If this UPDATE returns 0 rows, another process has already claimed the approval. Abort and return an error to the second admin. This is a single-row UPDATE with a WHERE clause — naturally atomic in PostgreSQL.

### 7.3 Idempotency for Blockchain Events (Phase 2)

For blockchain deposit listeners:
```sql
-- Before creating ledger_transaction:
SELECT id FROM ledger_transactions 
WHERE chain_tx_hash = :tx_hash;

-- If row exists, do not create another. This deposit was already processed.
```

The `chain_tx_hash` uniqueness constraint (applied to `ledger_transactions`) provides the idempotency guarantee.

---

## 8. Fee Application

### 8.1 Fee Lookup

```typescript
async function getFeeForTransaction(
  ecosystemId: string,
  kycTier: number,
  assetCode: string,
  direction: 'deposit' | 'withdrawal',
  grossAmount: Decimal
): Promise<{ feeAmount: Decimal; netAmount: Decimal }> {
  
  // 1. Find the most specific fee tier (highest kyc_tier match)
  const tier = await prisma.feeTier.findFirst({
    where: {
      ecosystem_id: ecosystemId,
      asset_code: assetCode,
      direction,
      kyc_tier: { lte: kycTier },  // tier must not exceed user's tier
      is_active: true,
    },
    orderBy: { kyc_tier: 'desc' },  // most specific tier wins
  });

  if (!tier) throw new Error(`No fee tier configured for ${assetCode} ${direction}`);

  // 2. Calculate fee
  let feeAmount = new Decimal(tier.flat_amount);
  if (tier.fee_type === 'percent' || tier.fee_type === 'flat+percent') {
    feeAmount = feeAmount.plus(grossAmount.times(tier.percent_amount).dividedBy(100));
  }

  // 3. Apply min/max bounds
  if (tier.min_fee) feeAmount = Decimal.max(feeAmount, tier.min_fee);
  if (tier.max_fee) feeAmount = Decimal.min(feeAmount, tier.max_fee);

  // 4. Round up (platform's benefit)
  feeAmount = feeAmount.toDecimalPlaces(8, Decimal.ROUND_UP);

  return {
    feeAmount,
    netAmount: grossAmount.minus(feeAmount)
  };
}
```

### 8.2 Fee Display

Always show the fee breakdown before the user confirms:
```
You are depositing: 100 REAL
Processing fee:     -2 REAL (2%)
You will receive:   98 REAL
```

Never surprise users with fees after confirmation. This is a trust issue.

---

## 9. Admin Panel: Transaction Queue Design

Based on competitive analysis, the most important admin UX features for a transaction queue:

### 9.1 Queue Priority

Default sort: oldest pending first. Reason: prevent any single user's transaction from waiting indefinitely while newer ones get processed.

### 9.2 Inline User Context

When admin views a transaction, show on the same page:
- User's name + email
- KYC tier (with date of last KYC approval)
- Total deposit/withdrawal history (lifetime count and value)
- Whether this is the user's first transaction
- Account activity in last 30 days

This context allows admin to make informed approval decisions without navigating away.

### 9.3 Age Alerts

- > 2 hours: Yellow highlight
- > 4 hours: Orange highlight  
- > 8 hours: Red highlight + badge count on admin nav

### 9.4 Bulk Actions

Allow admin to bulk-approve or bulk-reject small deposits from verified (KYC Tier 2+) users. Requires per-row checkbox selection.

### 9.5 Rejection Reason Templates

Pre-populate common rejection reasons to reduce admin typing and ensure message quality:
- "Payment reference not found on our bank statement. Please resubmit with the correct reference."
- "Amount does not match the submitted deposit. Please contact support."
- "KYC verification required before deposits can be processed."
- "Suspicious activity detected. Please contact support."

Admin can also type a custom reason.
