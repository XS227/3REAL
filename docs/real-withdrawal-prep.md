# REAL Withdrawal Preparation

Phase 16 — manual blockchain payout architecture for REAL Jetton withdrawals.

## Architecture

REAL withdrawals follow a two-phase settlement model:

### Phase 1 — Admin Approval (Automated)
User submits withdrawal → Admin reviews in `/admin/withdrawals` → Admin clicks "Approve & Debit":

```
DR user.{userId}.REAL  (-amount)  ← user's ledger balance reduced
CR platform.withdrawals-pending.REAL (+amount) ← held in escrow
LedgerTransactionType: withdrawal
Transaction.status → approved
```

The user can no longer spend these funds. They sit in the `withdrawals-pending` escrow account.

### Phase 2 — Blockchain Payout (Manual)
Admin opens Tonkeeper / TON Space → sends REAL from the platform hot wallet to the user's TON address → copies the on-chain transaction hash → enters it in the admin withdrawal review page:

```
DR platform.withdrawals-pending.REAL (-amount) ← escrow cleared
CR platform.float.REAL (+amount)               ← float restored
LedgerTransactionType: blockchain_withdrawal
chainNetwork: ton
Transaction.status → completed
Transaction.chainTxHash → the actual on-chain hash
```

The escrow is cleared. The withdrawal is complete.

## Security Guarantees

| Threat | Mitigation |
|---|---|
| Double-credit of payout | `LedgerTransaction.chainTxHash @unique` — database idempotency |
| Wrong amount confirmed | Server validates `sentAmount ≈ withdrawal.amount` (±0.001 tolerance) |
| Payout confirmed twice | `Transaction.status === "completed"` check rejects re-confirmation |
| Private key exposure | No keys stored in application. Admin signs manually in Tonkeeper. |
| Automatic token sending | No signing code. Manual only. |
| Invalid TON destination | `parseTonAddress()` validates on submission — rejected before storage |
| Non-REAL blockchain payout | `INVALID_ASSET` guard: `confirm_payout` action only for REAL |

## No Private Keys — Ever

The application:
- Does NOT store private keys or seed phrases
- Does NOT sign TON transactions
- Does NOT have access to the hot wallet
- Does NOT send tokens automatically

The admin must use an external wallet (Tonkeeper, TON Space, MyTonWallet) to sign and broadcast payout transactions manually.

## Configuration

Set in **Admin → TON Settings**:

| Setting | Key | Default | Purpose |
|---|---|---|---|
| Hot Wallet Address | `ton.hot_wallet_address` | `""` | Shown to admin as the "send from" address. Display only. |
| Withdrawals Enabled | `ton.withdrawals_enabled` | `"false"` | Feature flag. Currently informational — no auto-signing. |
| Manual Withdrawal Mode | `ton.manual_withdrawal_mode` | `"true"` | Always true in this phase. Future: flip to false for hot-wallet automation. |

## API Reference

### `PATCH /api/admin/withdrawals/:id`

**Approve** (Phase 1):
```json
{ "action": "approve" }
```
Debits user ledger, credits escrow. Transaction status → `approved`.

**Confirm Payout** (Phase 2, REAL only):
```json
{
  "action": "confirm_payout",
  "chainTxHash": "d27d1a38...",
  "sentAmount": 1000,
  "adminNote": "Sent via Tonkeeper, 2026-06-08"
}
```
Clears escrow, restores float. Transaction status → `completed`.

**Error responses:**

| Status | Code | Meaning |
|---|---|---|
| 409 | `ALREADY_SETTLED` | Transaction already completed |
| 409 | `DUPLICATE_CHAIN_TX` | This `chainTxHash` already recorded |
| 422 | `AMOUNT_MISMATCH` | `sentAmount` does not match withdrawal amount |
| 422 | `INVALID_ASSET` | `confirm_payout` only valid for REAL |
| 409 | `INVALID_STATE` | Transaction is not `approved` |

## Files

| File | Purpose |
|---|---|
| `lib/ton/withdrawals.ts` | `parseTonAddress()` — validate and normalise TON addresses |
| `lib/ton/settings.ts` | Extended with `hotWalletAddress`, `withdrawalsEnabled`, `manualWithdrawalMode` |
| `lib/admin/withdrawal-service.ts` | `confirmBlockchainPayout()` — Phase 2 settlement |
| `lib/admin/queries.ts` | `getWithdrawalReviewData()` extended with user REAL balance + hot wallet |
| `app/api/withdrawals/route.ts` | TON address validation on REAL withdrawal submission |
| `app/api/admin/withdrawals/[id]/route.ts` | `confirm_payout` action handler |
| `app/admin/withdrawals/[id]/page.tsx` | REAL-specific payout panel + user balance display |
| `components/admin/RealWithdrawalPayoutPanel.tsx` | Admin UI: payout instructions + confirmation form |
| `components/ton/TonSettingsForm.tsx` | 3 new fields: hot wallet, withdrawals_enabled, manual_mode |
| `prisma/seed.ts` | Seeds 3 new TON settings |

## Admin Workflow

1. User submits a REAL withdrawal at `/dashboard/withdraw`
2. Admin sees it in `/admin/withdrawals` (status: `pending`)
3. Admin opens the review page `/admin/withdrawals/:id`
4. Admin verifies user identity, KYC tier, and TON destination address
5. Admin clicks **Approve & Debit** → user's REAL balance is debited, escrow increases
6. Admin opens Tonkeeper with the platform hot wallet
7. Admin sends exact REAL amount to the user's TON address shown on the review page
8. Admin copies the on-chain transaction hash from Tonkeeper
9. Admin returns to the review page — sees the **Manual Blockchain Payout Required** panel
10. Admin enters: chain tx hash + sent amount + admin note
11. Admin clicks **Confirm Payout Sent**
12. System: clears escrow, restores float, marks transaction `completed`, notifies user

## Future: Hot-Wallet Automation (Phase 17+)

When the platform is ready for automated on-chain signing:

1. Deploy a signing service (separate process, hardware wallet, or HSM)
2. The signing service holds the private key — never the web app
3. After Phase 1 approval, the web app posts a signed payout request to the signing service
4. The signing service broadcasts the TON transaction and returns the hash
5. The web app calls `confirmBlockchainPayout()` with the returned hash
6. Flip `ton.manual_withdrawal_mode` = `"false"` to indicate automation is active

The ledger model (Phase 1 + Phase 2) does not change. Only the trigger for Phase 2 changes from manual to automated.

## Known Limitations

- No fee deduction on REAL withdrawals (feeAmount = 0). Fee logic can be added in Phase 17.
- Minimum is 10 REAL (enforced in `WITHDRAWAL_MINIMUMS`). Configurable via settings in Phase 17.
- All users share one hot wallet. Per-user escrow addresses are a Phase 17+ enhancement.
- No withdrawal rate limiting per user per day. Add via `kyc.tier*.withdrawal_limit_daily` settings in Phase 17.
