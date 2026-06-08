# Private Beta Launch Checklist — 3REAL

**Date:** 2026-06-08  
**Target:** Private beta with invited users

Mark each item ✅ before opening access.

---

## Infrastructure

- [x] App deployed at `https://3real.setaei.com`
- [x] TLS certificate valid (expires 2026-09-06, auto-renews)
- [x] HTTP → HTTPS redirect active
- [x] HSTS enabled (`max-age=63072000; includeSubDomains`)
- [x] PM2 running, uptime confirmed (`pm2 status`)
- [x] Health endpoint returns 200 (`curl https://3real.setaei.com/api/health`)
- [ ] Uptime monitor configured (UptimeRobot or equivalent)
- [ ] Post-renewal nginx reload hook installed (`/etc/letsencrypt/renewal-hooks/post/`)

---

## Security

- [x] Security headers active (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [x] JWT_SECRET set to 64+ character random value
- [ ] JWT_SECRET confirmed not the default `change-this-to-a-secure-random-string-in-production`
  ```bash
  grep JWT_SECRET /var/www/3real/.env | wc -c
  # Should be > 50
  ```
- [x] Rate limiting active on auth endpoints
- [ ] Admin password changed from seed default
  ```bash
  # Trigger password reset for admin account via /api/auth/forgot-password
  ```
- [ ] Database password changed from `threereal_dev_pass`
  ```bash
  psql -U postgres -c "ALTER USER threereal WITH PASSWORD 'NEW_PASSWORD';"
  ```
- [x] Session invalidation on password reset working
- [x] KYC document files isolated per user (path traversal blocked)
- [x] Admin routes require `super_admin` or `operator` role

---

## Environment

- [x] `NODE_ENV=production` in `.env`
- [x] `NEXT_PUBLIC_APP_URL=https://3real.setaei.com`
- [ ] Confirm `.env` is not tracked in git
  ```bash
  git ls-files /var/www/3real/.env
  # Should return nothing
  ```
- [ ] Confirm `.env` is in `.gitignore`
  ```bash
  grep "\.env" /var/www/3real/.gitignore
  ```
- [ ] `DEBUG` or `VERBOSE` env vars not set in production
- [ ] Email provider configured (currently sends to console in dev — set `EMAIL_PROVIDER` if using real email)

---

## Data

- [x] Database migrations applied (`prisma migrate status`)
- [x] Seed data present (ecosystems, platform accounts, rewards pool)
- [ ] Rewards pool balance confirmed
  ```bash
  psql -U threereal threereal_db -c "
    SELECT SUM(le.amount) FROM ledger_entries le
    JOIN accounts a ON a.id = le.account_id
    WHERE a.owner_type = 'platform' AND a.name = 'rewards-pool';"
  # Should show 500000 (500k REAL)
  ```
- [ ] Backup scheduled (DB + uploads cron jobs)
  ```bash
  crontab -l | grep backup
  ```
- [ ] Test backup runs and produces files
  ```bash
  bash /var/www/3real/deploy/backup-db.sh
  ls /var/backups/3real/db/
  ```

---

## Logging

- [ ] PM2 log rotation installed
  ```bash
  pm2 describe pm2-logrotate
  # If missing: pm2 install pm2-logrotate
  ```
- [ ] Log files exist and are readable
  ```bash
  ls -lh /var/log/pm2/3real-*.log
  ```

---

## Application smoke test

Run each flow manually before inviting beta users.

### 1. Landing page
- [ ] `https://3real.setaei.com` loads with correct branding
- [ ] All sections visible: Hero, Ecosystem, Features, How It Works, Security, FAQ, Footer
- [ ] Navigation links work (Login, Register)

### 2. Registration
- [ ] Register with a new email address
- [ ] Verification email arrives (or appears in PM2 logs for dev SMTP)
- [ ] Clicking verification link sets `emailVerified = true`
- [ ] Referral code appears on dashboard after verification

### 3. Login / Logout
- [ ] Login with correct credentials → redirects to `/dashboard`
- [ ] Login with wrong password → shows error, not 500
- [ ] Session cookie set as HTTP-only
- [ ] Logout clears session, redirects to `/`
- [ ] After logout, `/dashboard` redirects to `/auth/login`

### 4. KYC upload
- [ ] Navigate to `/dashboard/kyc`
- [ ] Upload 4 documents (passport, national ID, selfie, address proof)
- [ ] Status shows "Pending"
- [ ] Admin at `/admin/kyc` shows the submission
- [ ] Admin approves → user's `kycTier` becomes 2
- [ ] User dashboard shows KYC approved status

### 5. Deposit request
- [ ] Navigate to `/dashboard/deposit`
- [ ] Select REAL, enter amount and reference
- [ ] Upload proof image
- [ ] Submission appears in `/admin/deposits`
- [ ] Admin approves → ledger shows credit
- [ ] Dashboard balance increases

### 6. Withdrawal request
- [ ] Navigate to `/dashboard/withdraw`
- [ ] Requires KYC tier ≥ 2 (verified in step 4)
- [ ] Request with amount ≤ available balance
- [ ] Submission appears in `/admin/withdrawals`
- [ ] Admin approves → balance decreases, escrow cleared

### 7. Admin panel
- [ ] `/admin` shows correct metrics
- [ ] `/admin/users` lists registered users
- [ ] `/admin/reports` renders metrics and export buttons work
- [ ] `/admin/analytics` renders charts
- [ ] `/admin/reconciliation` shows PASS
- [ ] `/admin/audit-log` lists activity entries

### 8. Reports & exports
- [ ] CSV export: users → downloads file with headers
- [ ] CSV export: deposits → downloads file
- [ ] Date range filter on reports page changes numbers

---

## Performance

- [ ] Lighthouse score > 80 on `/` (mobile)
- [ ] `/dashboard` page load < 3s on mobile 3G (can simulate in DevTools)
- [ ] No unhandled console errors in browser on golden path

---

## Error handling

- [ ] Visit `/nonexistent-path` → custom 404 page with navigation links
- [ ] Session cookie manually deleted → redirected to login with `?from=` parameter
- [ ] Session cookie tampered → treated as unauthenticated

---

## Post-beta hardening (non-blocking for private beta)

- [ ] Nonce-based CSP (eliminates `unsafe-inline` on script-src)
- [ ] Redis-backed rate limiting
- [ ] Email provider integration (SendGrid, Resend, etc.)
- [ ] S3/object storage for KYC documents
- [ ] Automated test suite (Playwright E2E or Vitest integration)
- [ ] Error reporting service (Sentry, Axiom)
- [ ] Off-server backup destination (rsync to remote or rclone to S3)
