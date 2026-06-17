# Beta Operations Checklist — 3REAL

**Status:** Onboarding (registration → email verification → login → deposit/withdrawal
gates) verified end-to-end in production on 2026-06-17. This document covers how to
*operate* the closed beta day-to-day — it is not a launch checklist (see
`docs/launch-checklist.md` and `docs/private-beta-checklist.md` for that) and does not
introduce any new product features.

This is a living operations doc for whoever is on admin duty during the beta. Run the
daily checks every day the beta is live, and use the approval/incident checklists every
time you touch a deposit, withdrawal, or production problem.

---

## Beta sizing & guardrails

- **Recommended first beta size: 5–10 users.** Invite-only. Do not open public
  registration links beyond this group until at least one full week has passed with
  no incidents below and at least one real deposit + withdrawal cycle has been
  completed cleanly end-to-end.
- **Max manual deposit limit during beta: the admin reviewing a deposit should not
  approve any single deposit above the equivalent of 500 REAL (or local-currency
  equivalent) without a second admin's sign-off.** This is a manual review policy, not
  a code-enforced limit — `lib/admin/deposit-service.ts` has no maximum, so this is
  purely an operator discipline rule for the beta period. Tighten or raise it based on
  real usage once a few weeks of clean data exist.
- **Rule: no automated TON deposits until the TON API key/integration is fully
  verified.** Per `docs/launch-checklist.md`, the TON API key is currently unset in the
  `settings` table. Until it is set **and** a manual end-to-end TON deposit has been
  confirmed detected and credited correctly (see `docs/real-deposit-e2e-results.md` for
  the test pattern), treat all TON deposits as **manual-only**: the user submits proof,
  an admin verifies the on-chain transaction by hand (e.g. via a TON block explorer)
  before approving. Do not rely on `/api/ton/deposits/check` or any automatic detection
  path for crediting real funds during the beta.

---

## Daily checks

Run these once per day while the beta is live. Each takes a couple of minutes; none of
them require code changes — they're all read-only.

### 1. `/api/health`
```bash
curl -s https://3real.no/api/health
```
Expect `{"status":"ok", "services":{"database":{"status":"ok"},"ton":{"status":"ok"}}}`.
If `status` is `degraded`, check which service (`database` or `ton`) reports `error` and
go to the matching incident section below.

### 2. PM2 status
```bash
pm2 status
pm2 describe 3real | grep -i "restart\|status\|uptime"
```
Expect `online`, low/zero `restarts` since the last deploy, no `unstable restarts`. A
climbing restart count with no corresponding deploy is a sign of crashes or memory
pressure — check `pm2 logs 3real --lines 50` and the memory/swap check below.

### 3. Disk usage
```bash
df -h /
```
Watch the root filesystem. KYC/deposit proof uploads live under
`/var/uploads/3real`, DB dumps under `/var/backups/3real/db`, and `node_modules` +
`.next` under `/var/www/3real`. Flag anything above ~85% used.

### 4. Memory / swap usage
```bash
free -h
```
This VPS has ~957MB RAM + swap. Some headroom in `available` is normal; sustained
near-zero free memory *and* heavy swap use (`Swap: used` climbing) is a precursor to
the OOM/PM2-restart pattern documented in `deploy/deploy.sh`'s comments. Don't run a
deploy while memory is already tight — see the deploy script's built-in
stop-before-build behavior, which mitigates but doesn't eliminate this.

### 5. Backup status
```bash
crontab -l | grep backup
ls -lh /var/backups/3real/db/ | tail -5
ls -lh /var/backups/3real/uploads/ | tail -5
```
Confirm a DB dump from within the last 24h (cron runs daily at 03:00) and an uploads
archive from within the last 24h (cron runs daily at 04:00). If either is missing or
stale, check `/var/log/3real-backup.log` for errors and re-run manually:
```bash
bash /var/www/3real/deploy/backup-db.sh
bash /var/www/3real/deploy/backup-uploads.sh
```

### 6. Failed email logs
```bash
grep "\[email\] Send failed" /var/log/pm2/3real-error.log | tail -20
```
Any hits mean Resend rejected or failed to send (domain verification lapsed, API key
issue, rate limit, etc.) — registrations and resend-verification requests will still
succeed (`emailSent:false`, no 500), but users won't get their email. Investigate the
specific error message in the log line; it's safe to read (no secrets are logged, see
`lib/email/index.ts`'s `sendEmailSafe`).

### 7. Pending KYC
```bash
# In the admin UI:
https://3real.no/admin/kyc
```
Review the "Awaiting Review" queue. During beta, aim to clear this same-day — slow KYC
turnaround blocks deposits/withdrawals (kycTier gates) for real invited users.

### 8. Pending deposits
```bash
https://3real.no/admin/deposits
```
Review the queue. Use the **Before approving deposits** checklist below before
clicking approve on each one.

### 9. Pending withdrawals
```bash
https://3real.no/admin/withdrawals
```
Review the queue. Use the **Before approving withdrawals** checklist below before
clicking approve on each one.

### 10. Ledger imbalance check
```bash
https://3real.no/admin/reconciliation
```
Expect a **PASS** banner. See `docs/reconciliation-process.md` for the full algorithm
(`runLedgerIntegrityCheck()` in `lib/admin/reconciliation.ts`) — any **FAIL** is a data
integrity incident, go to the matching incident section below immediately and do not
approve any further deposits/withdrawals until resolved.

### 11. Suspicious referral activity
```bash
https://3real.no/admin/referrals
```
Check the fraud queue (flags IPs with 3+ referrals in 24h, per
`docs/referral-risk-review.md`). With only 5–10 beta users, *any* flagged entry is
worth a manual look — at this scale there's no legitimate reason for burst referrals
from one IP.

---

## Before approving deposits

Go through all four for every deposit, every time — don't skip steps for users you
recognize.

1. **Verify payment proof.** Open the uploaded proof file from `/admin/deposits/[id]`.
   Confirm the amount, asset, and reference/memo on the proof actually match what the
   user entered in the request. For TON deposits specifically, cross-check the
   transaction hash against a block explorer by hand (see the TON rule above — no
   automatic detection trusted during beta).
2. **Verify user `emailVerified`.** Check the user's profile (`/admin/users/[id]`) shows
   email verified. The API already blocks unverified users from submitting a deposit
   (`403 Email verification required`), but re-confirm on the admin side before
   approving — a verified flag flipped back to false (e.g. by a session/data issue)
   should never reach this stage in the first place.
3. **Verify KYC tier.** Confirm `kycTier` meets the asset's requirement: REAL needs
   tier ≥ 1 (email-verified is enough), TON/USDT/EUR/NOK/TRY need tier ≥ 2 (full KYC).
   See `lib/deposits/instructions.ts` eligibility rules.
4. **Verify ledger entries after approval.** After clicking approve, check
   `/admin/users/[id]/ledger` (or re-run the reconciliation check) to confirm the
   credit posted as a balanced double-entry (debit float/platform account, credit user
   account) and that the user's dashboard balance increased by the correct amount.

---

## Before approving withdrawals

1. **Verify KYC tier 2.** Withdrawals require `kycTier ≥ 2` regardless of asset (live
   API confirmed: `403 KYC tier 2 required for withdrawals` below tier 2). Don't
   override this manually.
2. **Verify available balance.** Confirm the requested amount is ≤ the user's actual
   available balance at `/admin/users/[id]/ledger`, not just the dashboard figure they
   reported — the approval service re-checks this inside the DB transaction
   (`lib/admin/withdrawal-service.ts`), but catching a mismatch before clicking approve
   avoids a confusing rejection for the user.
3. **Verify destination/account details.** Re-read the destination address/account the
   user entered on the withdrawal request. For on-chain assets, sanity-check the
   address format/network. Mistakes here are typically unrecoverable once funds are
   sent.
4. **Verify admin note.** Make sure you (or the previous reviewer) left a clear note —
   especially for any rejection, partial action, or manual TON payout — so the next
   person on admin duty has context without re-investigating from scratch.
5. **Verify ledger entries after approval.** After approval, confirm the escrow debit
   clears and the user's balance decreases by the correct amount (see
   `docs/reconciliation-process.md` §9, "Escrow Verification" — processing-withdrawal
   sum should match the platform escrow account balance).

---

## Incident checklist

### Email sending failure
1. Confirm via the daily "Failed email logs" check above.
2. Check Resend dashboard (resend.com/domains) — confirm `3real.no` still shows
   verified. Domain verification can silently lapse if DNS records are changed/removed
   elsewhere.
3. Test directly against the Resend API to isolate app vs. provider:
   ```bash
   curl -s -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $(grep RESEND_API_KEY /var/www/3real/.env | cut -d= -f2 | tr -d '\"')" \
     -H "Content-Type: application/json" \
     -d '{"from":"3REAL <noreply@3real.no>","to":"YOUR_TEST_ADDRESS","subject":"test","text":"test"}'
   ```
4. If Resend itself is down/erroring, no app-side fix will help — registrations and
   resend-verification will keep returning `emailSent:false` gracefully (no 500s) until
   it recovers, per the resilience fix in `app/api/auth/register/route.ts` and
   `app/api/auth/resend-verification/route.ts`. Affected users can be told to use the
   "Resend verification email" button once Resend recovers.

### Database down
1. `curl -s https://3real.no/api/health` will show `database: error`.
2. Check Postgres is actually running: `systemctl is-active postgresql`,
   `pg_isready`.
3. Check Postgres logs for the real cause: `tail -50 /var/log/postgresql/postgresql-14-main.log`.
4. If Postgres is up but the app still can't connect, confirm `DATABASE_URL` is
   actually present in the running PM2 process's env (`pm2 env <id> | grep DATABASE`)
   — `ecosystem.config.js` loads `.env` explicitly for exactly this reason; if it's
   missing, `pm2 restart 3real --update-env`.
5. Once restored, re-run the daily health check and the ledger reconciliation check
   before resuming approvals — a DB outage during a partially-completed approval is
   the most likely source of a ledger imbalance.

### Ledger imbalance
1. `/admin/reconciliation` shows FAIL — **stop approving deposits/withdrawals
   immediately.**
2. Follow the remediation procedure in `docs/reconciliation-process.md` §7: identify
   the imbalanced `LedgerTransaction` id(s), inspect its entries, determine the
   missing/extra entry, and create a `correction` transaction with a clear `note`
   explaining the fix.
3. Re-run reconciliation — must show PASS before resuming approvals.
4. Write up what happened (which transaction, why, what was corrected) — this is a
   financial data integrity event and should have a paper trail even during beta.

### Failed deploy
1. With the hardened `deploy/deploy.sh`, a failed build automatically restores the
   previous `.next` build and restarts PM2 on it — the app should not be left down.
   Confirm this happened: `pm2 status` shows `3real` online, and
   `curl -s https://3real.no/api/health` returns `200`.
2. Read the build failure output (the deploy script logs build started/failed clearly).
   Common causes seen so far: TypeScript errors, OOM during the TS-check phase on this
   1GB box (mitigated by `NODE_OPTIONS=--max-old-space-size=1536` plus stopping the app
   before building), or a transient Turbopack filesystem error (usually safe to retry).
3. Fix the root cause, commit, push, and re-run `bash deploy/deploy.sh`.
4. After a successful redeploy, re-run the full daily checklist once, not just
   `/api/health` — a deploy is the highest-risk moment for regressions.

### Suspicious user activity
1. Triggered by the daily referral-fraud check, an unexpected spike in registrations,
   or a KYC/deposit pattern that doesn't look like a real beta user (e.g. many small
   deposits in quick succession, mismatched proof details, multiple accounts from one
   IP).
2. Do not approve anything pending for that user until reviewed.
3. Check `/admin/audit-log` for the user's full action history.
4. With only 5–10 beta users, the safest response is usually to pause the account
   (`isActive=false` via the admin user page) and reach out directly — at this scale,
   false positives cost nothing and a real abuse case caught early is cheap to contain.

### VPS memory pressure
1. Triggered by the daily memory/swap check, or by climbing PM2 restart counts with no
   corresponding deploy.
2. `free -h` — if swap is heavily used and `available` memory is near zero, identify
   what's consuming it: `ps aux --sort=-%mem | head -10`. This VPS runs other sites
   (e.g. `khabat`, `stapay`, `shahnameh-preview`, `trustai-claude`) alongside 3real —
   confirm it's not one of those.
3. Do not start a build/deploy while memory is already under pressure — wait for it to
   settle, or stop non-critical processes first.
4. If `3real` itself was OOM-killed, PM2 should auto-restart it
   (`restart_delay: 4000ms`, `max_restarts: 10` in `ecosystem.config.js`) — confirm it
   came back online and re-run the daily health check.
