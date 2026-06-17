# 3REAL — Controlled Public Beta Launch Checklist

Generated: 2026-06-17. Status reflects a live audit of production configuration,
a real backup/restore test, and the current deployed build versus repo HEAD.

Legend: **PASS** / **FAIL** / **WARNING**

---

## Security

| Item | Result | Notes |
|---|---|---|
| JWT_SECRET non-default | PASS | Production value is a random 64-byte string, not the `.env.example` placeholder. |
| DATABASE_URL credentials non-default | PASS | Password is not the known dev default (`threereal_dev_pass`) and not the example placeholder. |
| Admin account password non-default | PASS | Verified by comparing the live `super_admin` password hash against the seed script's default (`ChangeMe@3REAL!2026`) — does not match. |
| SMTP / email provider credentials | PASS | Uses Resend (`RESEND_API_KEY`) instead of raw SMTP; key is a real production key, not a placeholder. |
| TON API key | WARNING | Not configured (empty in `settings` table). Not a leak risk, but TON status checks and on-chain features run unauthenticated/rate-limited until set. Acceptable for V1 since TON is V2 scope, but should be set before relying on TON deposit detection. |
| SESSION_SECRET | NOT FOUND | No separate session secret exists in this codebase — `JWT_SECRET` signs the session token directly. Not a gap, just a naming difference from the generic checklist. |
| HTTPS verified | PASS | Both `3real.no` and `3real.setaei.com` nginx vhosts are live with valid Let's Encrypt certs and HTTP→HTTPS redirects confirmed in `/etc/nginx/sites-enabled/`. |
| Cookie security verified | PASS | `__3real_session` cookie is `httpOnly`, `secure` (conditional on `NODE_ENV=production`, which is set), `sameSite=lax`. Minor hardening gap: no `__Host-` prefix (low severity, documented as deferred). |
| Admin access verified | PASS | Exactly one `super_admin` account exists, password confirmed non-default. |

## Data Protection

| Item | Result | Notes |
|---|---|---|
| Backups scheduled | PASS | Cron installed: DB backup daily 03:00, uploads backup daily 04:00. Confirmed via `crontab -l`. Recent backup files present in `/var/backups/3real/db/`. |
| Restore test completed | PASS | Performed live: created a fresh backup, restored into an isolated `threereal_restore_test` database, verified row counts matched the live DB exactly (users: 18, kyc_profiles: 3, kyc_documents: 11, ledger_entries: 22, transactions: 6, referrals: 9), and confirmed the ledger sum-to-zero invariant held post-restore. Test database was dropped after verification. |
| Off-server / remote backup copy | WARNING | Backups are local to the VPS only (`/var/backups/3real/`). No rsync/rclone off-server copy confirmed configured — a full VPS loss would still lose all backups. Documented as recommended in `docs/backup-restore.md` §6 but not verified as active. |

## Operations

| Item | Result | Notes |
|---|---|---|
| Health endpoint verified | PASS | `GET /api/health` returns `200` on the live app (port 3020). |
| Status page verified | **FAIL** | `GET /status` currently redirects to `/auth/login` in production. The fix (adding `/status` to `PUBLIC_PATHS` in `proxy.ts`) **is committed in the repo** (commit `66a102b`) but **not yet deployed** — the running build (`.next`, last built 2026-06-15 03:30) predates that commit (2026-06-15 19:08). Requires a rebuild + redeploy before this is fixed in production. |
| Deployed build matches latest commit | **FAIL** | Same root cause as above: production is running a build older than the current `HEAD`, meaning the admin per-user ledger, transaction detail page, and the `/status`/`/r` public-route fix are in the repo but not live. **A rebuild and redeploy is required before beta launch.** |
| Uptime monitor configured | WARNING | No external uptime monitor (e.g. UptimeRobot) confirmed configured. Health/status endpoints are real and working once redeployed, but nothing is currently polling them. |

## Legal

| Item | Result | Notes |
|---|---|---|
| Terms page live | WARNING | `/terms` page built this session (`app/terms/page.tsx`), added to `PUBLIC_PATHS`, footer links updated (EN + FA). **Not yet deployed** (same stale-build issue as above). Content is production-quality draft language covering Norway jurisdiction, KYC, deposit/withdrawal rules, AML, liability limitation, suspension rights, no-investment-advice, and digital asset risk — **not yet reviewed by a lawyer**. Recommend legal review before treating as final, especially the jurisdiction and liability sections. |
| Privacy page live | WARNING | Same status as Terms: built (`app/privacy/page.tsx`), wired into footer and `PUBLIC_PATHS`, not yet deployed, not yet legally reviewed. Covers data collected, KYC document handling, cookies/sessions, security practices, retention, user rights (incl. Datatilsynet complaint right), and contact info. |

## Product

| Item | Result | Notes |
|---|---|---|
| Registration tested | PASS (historical) | Confirmed working per prior E2E test runs (`docs/e2e-results.md`). Not re-run this session. |
| Login tested | PASS (historical) | Same — confirmed in prior E2E docs. |
| KYC tested | PASS (historical) | Submission → admin review → tier gating confirmed in prior E2E docs. |
| Deposit tested | PASS (historical) | Confirmed in prior E2E docs. |
| Withdrawal tested | PASS (historical) | Confirmed in prior E2E docs, including authoritative balance check inside the DB transaction (`lib/admin/withdrawal-service.ts`). |
| Referral tested | PASS (historical) | Confirmed in prior E2E docs (click tracking, reward issuance). |
| Ledger tested | PASS | Re-verified this session via the restore test — sum-to-zero invariant holds on a freshly restored database. |

> Product rows marked "PASS (historical)" reflect prior E2E test documentation, not a fresh run in this session — re-verify these flows manually against the **redeployed** build before declaring beta-ready, since the live app is currently running stale code.

---

## Blocking Items Before Launch

1. **Rebuild and redeploy.** This is the single biggest blocker: the running production build predates the latest commit. None of this session's fixes (status page public access, legal pages, 2FA cleanup) or the previous session's features (admin ledger, transaction detail) are live yet.
2. **Legal review** of `/terms` and `/privacy` content — the pages are structurally complete and cover the required topics, but the text is a draft, not lawyer-reviewed copy, and the user-facing footnote in this checklist should not be treated as compliance sign-off.
3. **Off-server backup copy** — local backups only; configure rsync/rclone per `docs/backup-restore.md` §6 before relying on backups for disaster recovery.

## Non-Blocking, Recommended Soon

- Configure external uptime monitoring.
- Set the TON API key if TON deposit detection is needed.
- Re-run the product E2E flows once against the redeployed build to confirm nothing regressed.
