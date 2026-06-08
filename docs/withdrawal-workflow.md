# Withdrawal Workflow

## Overview

Users request withdrawals at `/dashboard/withdraw`. All withdrawals require KYC tier 2 and a verified email. No blockchain or bank transfer is automated — admin reviews each request manually and approves or rejects via `/admin/withdrawals`.

On approval, the ledger is settled immediately (user balance debited, funds moved to withdrawal escrow). Actual payout to the user (on-chain or bank) is handled in a future phase.

---

## Eligibility

| Rule | Detail |
|------|--------|
| Email verified | Required for all assets |
| KYC tier | Tier 2 required for all assets |
| Available balance | Amount must not exceed `available` (excludes `pending`) |
| Minimum amounts | REAL: 10 · TON: 1 · USDT: 10 · EUR: 10 · NOK: 100 · TRY: 300 |

Pending balance (ledger transactions not yet `completed`) is excluded from withdrawable funds.

---

## Destination Formats

| Asset | Destination type |
|-------|-----------------|
| REAL | TON wallet address (EQ... or UQ... format) |
| TON | TON wallet address |
| USDT | TRON TRC-20 address (T...) |
| EUR | IBAN + BIC + account holder name |
| NOK | 11-digit Norwegian account number + account holder |
| TRY | Turkish IBAN (TR...) + account holder name |

Destination is stored as free-text in `transactions.paymentRef`. Structured bank-detail forms are a future enhancement.

---

## State Machine

```
            User submits
                 |
            [pending]
                 |
         Admin reviews
         +---------------+
    approveWithdrawal  rejectWithdrawal
         |                   |
     [approved]          [rejected]
         |
  (Ledger settled)
         |
     [processing]  (future phase: payout initiated)
         |
     [completed]   (future phase: payout confirmed)
```

Statuses:
- `pending` — submitted by user, awaiting review
- `under_review` — admin has flagged for further investigation
- `approved` — admin approved; ledger settled; funds in escrow
- `processing` — actual payout initiated (Phase 9+)
- `completed` — payout confirmed (Phase 9+)
- `rejected` — denied by admin; no ledger impact

---

## API

### `POST /api/withdrawals`

Body (JSON):
```json
{
  "assetCode": "REAL",
  "amount": 50,
  "destination": "EQC..."
}
```

- Returns `201 { id, status }` on success
- Returns `403` if not eligible (email, kycTier)
- Returns `422` if amount exceeds available balance, below minimum, or missing destination

### `GET /api/withdrawals`

Returns the authenticated user's withdrawal history (most recent first, limit 50).

### `PATCH /api/admin/withdrawals/[id]`

Body:
```json
{ "action": "approve" }
{ "action": "reject", "reason": "..." }
```

- `approve` -- settles ledger, moves funds to escrow, sets status `approved`
- `reject` -- sets status `rejected` with adminNote, no ledger impact
- Both require `role in {super_admin, operator}`

---

## Approval Flow (Ledger Settlement)

All DB writes run inside `prisma.$transaction`:

1. Load Transaction -- assert status in `{pending, under_review}`
2. **Idempotency guard**: if `ledgerTxId` is set, throw `ALREADY_SETTLED`
3. **Balance check** (authoritative, inside transaction): sum completed ledger entries for user + asset; assert `available >= amount`
4. Get or create user's ledger account (`getOrCreateUserAccount`)
5. Get or create withdrawal escrow account (`getOrCreateEscrowAccount` -- `platform/withdrawals-pending/{assetCode}`)
6. Create `LedgerTransaction` (type: withdrawal, status: completed)
7. Create two `LedgerEntry` rows:

| Entry | Account | Amount |
|-------|---------|--------|
| DR user account | `user / {userId} / {asset}` | `-X` |
| CR escrow account | `platform / withdrawals-pending / {asset}` | `+X` |

8. Update `Transaction.status = approved`, `Transaction.ledgerTxId = newLedgerTxId`

After transaction:
9. Audit log: `withdrawal.approved`
10. Notification: `withdrawal_approved`

### Sign Convention

Debit = negative, Credit = positive.

- Debiting the user's LIABILITY account (`-X`) reduces what the platform owes the user
- Crediting the escrow LIABILITY account (`+X`) records the commitment to pay out

Sum of entries: `-X + X = 0` (balanced)

---

## Rejection Flow

1. Assert status in `{pending, under_review}`
2. Set `Transaction.status = rejected`, `Transaction.adminNote = reason`
3. No ledger entries created

After:
4. Audit log: `withdrawal.rejected`
5. Notification: `withdrawal_rejected`

User's balance is unaffected -- no ledger debit occurred.

---

## Idempotency

Guard order inside `approveWithdrawal`:
1. `if ledgerTxId is set` -- throw `ALREADY_SETTLED` (covers both race and sequential retry)
2. `if status not in {pending, under_review}` -- throw `INVALID_STATE`

The balance check uses the transaction's read isolation. A concurrent approval that passes both guards will still fail at the balance check or at the UPDATE.

---

## Escrow Account

`getOrCreateEscrowAccount` upserts a `platform/withdrawals-pending/{assetCode}` account on demand. New asset support requires no schema migration -- the escrow account is auto-created on first approval.

The seed pre-creates `withdrawals-pending` for REAL only. Other assets are created lazily.

---

## Notifications

| Action | Type | Title |
|--------|------|-------|
| Withdrawal approved | `withdrawal_approved` | Withdrawal Approved |
| Withdrawal rejected | `withdrawal_rejected` | Withdrawal Rejected |

Both are fire-and-forget via `createNotification()`.

---

## Audit Logs

| Action | Actor |
|--------|-------|
| `withdrawal.created` | User |
| `withdrawal.approved` | Admin |
| `withdrawal.rejected` | Admin |

---

## Future Phases

| Phase | Description |
|-------|-------------|
| Phase 9+ | Process payout: approved to processing to completed; DR escrow, CR platform float |
| Phase 9+ | TON/USDT on-chain automation: hot wallet signing, seqno management |
| Phase 9+ | Bank transfer integration: SEPA/NOK/TRY payout via banking API |
| Phase 10 | Notification bell UI so users can see withdrawal_approved in-app |
