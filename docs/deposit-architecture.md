# Deposit Architecture

## Overview

Deposit requests are manual-approval flows. Users submit a request with amount, payment reference, and optional proof file. Admin reviews and approves (in Phase 9). Ledger credit happens only on admin approval — never on submission.

---

## Flow

```
User submits form
       │
       ▼
POST /api/deposits
  ├── Validate: emailVerified + kycTier
  ├── Validate: amount ≥ minimum
  ├── Upload proof file (if provided) → storage/uploads/deposits/{userId}/{txId}/proof.ext
  └── Create Transaction { type: deposit, status: pending, NO ledgerTxId }
       │
       ▼
Transaction.status = pending
       │
       ▼  [Admin: Phase 9]
Admin reviews → approveDeposit()
  ├── Create LedgerTransaction (type: deposit, status: completed)
  ├── Create LedgerEntry: DR platform float, CR user account
  ├── Update Transaction: status=completed, ledgerTxId=...
  └── Notify user
```

**The ledger is never touched at submission time.** This is by design.

---

## Eligibility Rules

| Asset | Email Verified | KYC Tier Required |
|-------|----------------|-------------------|
| REAL  | Yes            | 1 (email tier)    |
| TON   | Yes            | 2 (full KYC)      |
| USDT  | Yes            | 2 (full KYC)      |
| EUR   | Yes            | 2 (full KYC)      |
| NOK   | Yes            | 2 (full KYC)      |
| TRY   | Yes            | 2 (full KYC)      |

REAL deposits are allowed for KYC tier 1 to let new users onboard and test the platform.

---

## Payment Methods per Asset

| Asset | PaymentMethod   | Network          |
|-------|-----------------|------------------|
| REAL  | `manual`        | TON Jetton       |
| TON   | `ton`           | The Open Network |
| USDT  | `usdt_trc20`    | TRON TRC-20      |
| EUR   | `sepa`          | SEPA bank        |
| NOK   | `bank_transfer` | Norwegian bank   |
| TRY   | `bank_transfer` | Turkish bank     |

No automated on-chain monitoring is active. All deposits are processed manually.

---

## Database

### Transaction record (at submission)

```
type:          deposit
status:        pending
assetCode:     REAL | TON | USDT | EUR | NOK | TRY
amount:        user-entered amount
paymentMethod: derived from asset
paymentRef:    user-entered reference (TxHash / KID / SEPA ref)
proofFilePath: storage-relative path to uploaded proof file (nullable)
ledgerTxId:    null — set only after admin approval
```

### proofFilePath column

Added in migration `20260608000000_add_proof_file_path_to_transactions`.

File stored at: `deposits/{userId}/{txId}/proof.{ext}`

Served via `GET /api/kyc/files/` is NOT appropriate for deposit proofs (path starts with `deposits/`, not `kyc/`). A separate admin file-serving route should be added in Phase 9.

---

## Deposit Instructions (`lib/deposits/instructions.ts`)

Static config per asset containing:
- `paymentMethod` — which `PaymentMethod` enum value to use
- `steps[]` — ordered instructions for the user
- `details[]` — label/value pairs (wallet address, IBAN, etc.)
- `refLabel` — label for the payment reference input
- `refRequired` — whether the reference is mandatory
- `proofLabel` — label for the proof upload input
- `note?` — warning/important note shown to user

**All addresses and IBANs are placeholders.** Replace with real values via the Settings panel (Phase 9) or via environment variables.

---

## Minimum Deposit Amounts

| Asset | Minimum |
|-------|---------|
| REAL  | 1       |
| TON   | 0.1     |
| USDT  | 10      |
| EUR   | 10      |
| NOK   | 100     |
| TRY   | 300     |

---

## API Routes

### `POST /api/deposits`

Accepts `multipart/form-data`:

| Field       | Type    | Required | Notes                             |
|-------------|---------|----------|-----------------------------------|
| `assetCode` | string  | Yes      | REAL, TON, USDT, EUR, NOK, TRY   |
| `amount`    | number  | Yes      | Must meet minimum                 |
| `paymentRef`| string  | Varies   | Required for bank/USDT deposits   |
| `proof`     | File    | No       | Image or PDF, max 10 MB           |

**Guards:**
1. `requireAuth()` — user must be logged in
2. `emailVerified` — all deposits require email verification
3. `kycTier` ≥ required tier for the asset
4. `amount` ≥ minimum
5. File size ≤ 10 MB, MIME type in allowlist

**Response:** `{ id: string, status: "pending" }` with HTTP 201.

### `GET /api/deposits`

Returns `DepositRow[]` for the authenticated user, ordered by `createdAt DESC`.

---

## Future: Admin Approval (Phase 9)

The `approveDeposit(txId, adminId)` service function should:

1. Load the Transaction, assert `status === 'pending' || 'under_review'`
2. Get the user's account for the asset (`getOrCreateUserAccount`)
3. Get the platform float account for the asset
4. Create a `LedgerTransaction` (type: deposit, status: completed)
5. Create two `LedgerEntry` rows (DR float, CR user) — see `lib/ledger/transfer.ts` for the pattern
6. Update `Transaction`: `status = completed`, `ledgerTxId = newLedgerTx.id`
7. Increment `user.sessionVersion` if kycTier changed (not applicable here)
8. Write audit log: `deposit.approved`

This keeps the ledger untouched until a human has verified the payment.
