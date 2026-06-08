# Admin Operations

## Overview

Admin operations are handled by users with `super_admin` or `operator` roles. All actions are logged to `activity_logs` and trigger in-app notifications to affected users.

Pages are protected at two levels:
1. `proxy.ts` (middleware) redirects unauthenticated users from `/admin/*`
2. `requireRole("super_admin", "operator")` in every layout and page for role enforcement

---

## Pages

| Route                    | Purpose                                   |
|--------------------------|-------------------------------------------|
| `/admin`                 | Dashboard — metrics + recent activity     |
| `/admin/kyc`             | KYC review queue                          |
| `/admin/kyc/[id]`        | Review a single KYC application          |
| `/admin/deposits`        | Deposit review queue                      |
| `/admin/deposits/[id]`   | Review a single deposit request          |
| `/admin/users`           | Read-only user list                       |

---

## KYC Workflow

### State Machine

```
pending / under_review
    │
    ├── approveKYC()     → approved        (user.kycTier upgraded)
    ├── rejectKYC()      → rejected        (user re-submits everything)
    └── requestUpdate()  → update_requested (user re-uploads flagged docs)
```

### approveKYC(profileId, reviewerId)

Runs inside `prisma.$transaction`:
1. Assert profile is `pending` or `under_review`
2. Set `kycProfile.status = approved`
3. Set `user.kycTier = profile.tierRequested`
4. Increment `user.sessionVersion` — immediately invalidates stale JWT claims (Phase 3.6)
5. Bulk-approve all pending `KycDocument` rows on the profile
6. Audit log: `kyc.approved`
7. Notification: `kyc_approved`

### rejectKYC(profileId, reviewerId, reason)

1. Assert reviewable state
2. Set `status = rejected`, `rejectionReason = reason`
3. Audit log: `kyc.rejected`
4. Notification: `kyc_rejected`

User must re-submit all documents from scratch.

### requestUpdate(profileId, reviewerId, reason, docIds?)

1. Assert reviewable state
2. Set `status = update_requested`, `rejectionReason = reason`
3. If `docIds` provided: set those documents to `status = rejected` with per-document reason
4. Audit log: `kyc.update_requested`
5. Notification: `kyc_update_requested`

User re-uploads only the flagged documents. Already-approved documents are locked.

---

## Deposit Workflow

### State Machine

```
pending / under_review
    │
    ├── approveDeposit()  → completed  (ledger settled, user balance credited)
    └── rejectDeposit()   → rejected   (no ledger impact)
```

### approveDeposit(txId, adminId)

The critical path. All DB writes run inside `prisma.$transaction`:

1. Load Transaction — assert `status ∈ {pending, under_review}`
2. **Idempotency guard**: if `ledgerTxId` is already set → throw `ALREADY_SETTLED`
3. Look up platform float account for the asset (`ownerType = 'platform', ownerId = 'float'`)
4. Get or create user ledger account for the asset (`getOrCreateUserAccount`)
5. Create `LedgerTransaction` (type: deposit, status: completed, referenceId: txId)
6. Create two `LedgerEntry` rows:
   - DR platform float: `amount = -X` (allocated from float)
   - CR user account:  `amount = +X` (user balance increases)
7. Update `Transaction.status = completed`, `Transaction.ledgerTxId = newLedgerTxId`
8. Audit log: `deposit.approved`
9. Notification: `deposit_approved`

**Idempotency note:** The guard at step 2 is evaluated inside the transaction with row-level locking. A duplicate approval call will always fail with `ALREADY_SETTLED` — never double-credit.

### rejectDeposit(txId, adminId, reason)

1. Assert `status ∈ {pending, under_review}`
2. Set `Transaction.status = rejected`, `Transaction.adminNote = reason`
3. No ledger impact — the ledger is never touched for rejected deposits
4. Audit log: `deposit.rejected`
5. Notification: `deposit_rejected`

---

## Ledger Settlement — Double-Entry

Sign convention: **Debit = negative, Credit = positive**

For a deposit of X units of asset A:

| Entry              | Account              | Amount |
|--------------------|----------------------|--------|
| DR platform float  | `platform / float / A` | `-X`   |
| CR user account    | `user / {userId} / A`  | `+X`   |

Sum: `-X + X = 0` ✓

The platform float account represents funds physically held by the platform. When a deposit is approved, the float is debited (allocated to the user), and the user's liability account is credited (what the platform now owes them).

**Missing float account:** If no `Account` row exists for the asset (e.g., TRY — not seeded), `approveDeposit` throws `MISSING_FLOAT_ACCOUNT`. The fix is to add a seeded float account for that asset. Until then, TRY deposits cannot be auto-approved.

---

## Notifications

| Action              | Type                  | Title                              |
|---------------------|-----------------------|------------------------------------|
| KYC approved        | `kyc_approved`        | Identity Verification Approved     |
| KYC rejected        | `kyc_rejected`        | Identity Verification Rejected     |
| KYC update request  | `kyc_update_requested`| Identity Verification — Update Required |
| Deposit approved    | `deposit_approved`    | Deposit Approved                   |
| Deposit rejected    | `deposit_rejected`    | Deposit Rejected                   |

Notifications are created via `createNotification()` in `lib/notifications.ts`. It is fire-and-forget — notification failures never propagate to the caller.

Notifications are stored in the `notifications` table and delivered via in-app channel only (Phase 10 adds the bell UI).

---

## API Routes

### `PATCH /api/admin/kyc/[id]`

Body: `{ action: "approve" | "reject" | "request_update", reason?: string, docIds?: string[] }`

- `approve`: no reason needed
- `reject`: `reason` required
- `request_update`: `reason` required; optionally `docIds` to flag specific documents

### `PATCH /api/admin/deposits/[id]`

Body: `{ action: "approve" | "reject", reason?: string }`

- `approve`: no reason needed; triggers ledger settlement
- `reject`: `reason` required

Both routes call `getSession() + validateSession()` and verify `role ∈ {super_admin, operator}`.

---

## Escalation Paths

### KYC Escalation

- If a user re-submits after `update_requested` and the new documents are still insufficient, use `rejectKYC` to fully reject (user must start over)
- For suspicious submissions (fabricated documents), use `rejectKYC` with a note and flag the user account manually (role/isActive not yet admin-settable — Phase 9 enhancement)

### Deposit Escalation

- If the proof of payment is ambiguous, set status to `under_review` manually in the DB while awaiting further information from the user (admin note field)
- For disputed deposits: reject with reason; user should contact support
- If `MISSING_FLOAT_ACCOUNT` error: add a seeded platform float account for the asset and retry

### Reconciliation

- Every approved deposit has a linked `LedgerTransaction` (via `Transaction.ledgerTxId`)
- The `referenceId` on `LedgerTransaction` is the `Transaction.id` — enables bidirectional lookup
- Reversals are not yet implemented; for disputes, handle via manual journal entries through the ledger directly

---

## Security

- All admin routes are protected by `requireRole` — non-admin users are redirected to `/dashboard`
- All admin actions are logged to `activity_logs` with `actorId = adminId`
- The `sessionVersion` pattern (Phase 3.6) means KYC approval invalidates stale JWTs immediately
- Deposit approval is transactional and idempotent — the `ALREADY_SETTLED` guard prevents double crediting under any race condition or retry scenario
