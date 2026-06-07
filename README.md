# 3REAL — Digital Asset Portal

Internal REAL token management portal. Part of the SETAEI ecosystem.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| PostgreSQL | ≥ 14 |

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url> /var/www/3real
cd /var/www/3real
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET
```

### 3. Set up PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER threereal WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE threereal_db OWNER threereal;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE threereal_db TO threereal;"
```

### 4. Run database migrations and seed

```bash
# Run migrations (creates all 17 tables)
npx prisma migrate dev

# Seed initial data (ecosystems, platform accounts, admin user, fee tiers, settings)
npx prisma db seed
```

**Seed creates:**
- 4 ecosystems: 3REAL (active), Shahnameh, TrustAI, SETAEI Pay (inactive)
- 10 platform accounts (REAL/USDT/TON/EUR/NOK float, escrows, rewards pool, fees, equity)
- 1 admin user: `admin@3real.no` / `ChangeMe@3REAL!2026` — **change before production**
- 8 fee tiers (REAL, USDT, TON — deposit/withdrawal/conversion)
- 15 platform settings (referral rewards, KYC limits)
- Rewards pool seeded with 500,000 REAL via double-entry ledger

**PostgreSQL user needs CREATEDB permission for Prisma shadow database:**
```bash
sudo -u postgres psql -c "ALTER USER threereal CREATEDB;"
```

### 5. Start development server

```bash
npm run dev
```

App: http://localhost:3000  
Health check: http://localhost:3000/api/health

---

## Authentication

Phase 3 implements full authentication. All sessions use HTTP-only cookies (`__3real_session`, 7-day HS256 JWT).

### Session Invalidation (Phase 3.6)

Every JWT contains a `sessionVersion` integer that matches `users.sessionVersion` in the database. On every protected request, `validateSession()` loads the user from the DB and rejects the session if:

- `jwt.sessionVersion !== user.sessionVersion` (password was reset, forced logout, role changed)
- `user.isActive === false` (account deactivated)

The `sessionVersion` is incremented atomically with any operation that should invalidate active sessions:

| Operation | Increments `sessionVersion`? |
|---|---|
| Password reset | ✅ Yes — in `reset-password` route |
| Account deactivation (admin) | Must — use `{ isActive: false, sessionVersion: { increment: 1 } }` |
| Role change (admin) | Must — use `{ role: "...", sessionVersion: { increment: 1 } }` |
| KYC tier revocation (admin) | Must — same pattern |
| Normal login | No — issues token with current version |
| Normal logout | No — cookie is cleared client-side |

**Note:** Existing sessions are invalidated immediately when `sessionVersion` changes. All active browser sessions for that user will receive a 401 (API routes) or be redirected to `/auth/login` (pages).

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account; sends email verification link |
| POST | `/api/auth/login` | Password login; sets session cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| GET  | `/api/auth/me` | Returns current user from cookie |
| POST | `/api/auth/verify-email` | Consumes verification token; sets kycTier=1 |
| POST | `/api/auth/forgot-password` | Sends password reset link (console in dev) |
| POST | `/api/auth/reset-password` | Consumes reset token; updates password |

### Pages

| Path | Description |
|------|-------------|
| `/auth/login` | Login form |
| `/auth/register` | Registration form (optional referral code, `?ref=CODE`) |
| `/auth/forgot-password` | Request reset link |
| `/auth/reset-password?token=...` | Set new password |
| `/auth/verify-email?token=...` | Auto-verifies on load |
| `/dashboard` | Protected user dashboard |
| `/admin` | Protected admin panel (super_admin / operator only) |

### Test credentials (seeded)

```
Email:    admin@3real.no
Password: ChangeMe@3REAL!2026
Role:     super_admin / KYC Tier 3
```

**In development**, verification and reset URLs are logged to the console and also returned as `devVerifyUrl` / `devResetUrl` in API responses.

---

## Project Structure

```
app/
  auth/              Login, register, email verify, reset password
  dashboard/         Protected user routes (wallet, KYC, referrals — Phase 5+)
  admin/             Admin panel routes (Phase 6+)
  api/
    auth/            register, login, logout, me, verify-email, forgot-password, reset-password
    health/          GET /api/health — liveness + DB check

components/
  ui/                shadcn/ui base components
  auth/              LogoutButton
  landing/           Public marketing page sections
  dashboard/         Authenticated dashboard widgets
    DashboardShell   Client shell — sidebar + mobile nav toggle
    BalanceCard      REAL balance (available / pending split)
    WalletCard       All 6 asset balances from ledger
    ReferralCard     Referral code, copy link, stats
    ProfileCard      Completion checklist + progress bar
    RecentActivity   Latest audit log entries
    RecentTransactions Latest deposit/withdrawal requests
    EcosystemCards   4 SETAEI product cards
    CopyButton       Clipboard copy (client component)

lib/
  prisma.ts          Prisma client singleton
  audit.ts           Fire-and-forget audit logging
  email/             Email stubs (console in dev; real provider in Phase 7)
  auth/
    jwt.ts           signToken, verifyToken, cookieOptions
    password.ts      hashPassword, verifyPassword (bcrypt)
    tokens.ts        createAuthToken, consumeAuthToken, generateReferralCode
    guards.ts        getSession, requireAuth, requireRole
  ledger/
    balance.ts       getUserBalances — raw SQL sum by asset, split completed/pending
  dashboard/
    queries.ts       getDashboardData — all dashboard data in parallel Promise.all
  validators/
    auth.ts          Zod schemas for all auth forms

proxy.ts             Route protection (Next.js 16 proxy / middleware)

prisma/
  schema.prisma      17-table database schema, 22 enums
  migrations/
```

---

## npm Scripts

```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run db:migrate  # Run Prisma migrations
npm run db:seed     # Run seed data
npm run db:reset    # Reset DB and re-run migrations + seed
npm run db:studio   # Open Prisma Studio (visual DB browser)
```

## Build Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Project Scaffold | ✅ Done |
| 1.5 | Architecture Review | ✅ Done |
| 2 | Database Schema | ✅ Done |
| 3 | Authentication | ✅ Done |
| 3.5 | Security Review | ✅ Done |
| 3.6 | Session Invalidation | ✅ Done |
| 4 | Landing Page | ✅ Done |
| 4.5 | TON Architecture | ✅ Done |
| 5 | User Dashboard | ✅ Done |
| 6 | Wallet & Transactions | ⬜ Pending |
| 7 | Referral System | ⬜ Pending |
| 8 | KYC Module | ⬜ Pending |
| 9 | Admin Panel | ⬜ Pending |
| 10 | Notifications | ⬜ Pending |
| 11 | Production Deployment | ⬜ Pending |

---

## Production (Phase 11)

Nginx reverse proxy + PM2 process manager on Ubuntu VPS. DNS/CDN via Cloudflare.

```bash
npm run build
pm2 start ecosystem.config.js
```

---

## Tech Stack

- **Next.js 16** · TypeScript · App Router
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** ORM + **PostgreSQL** (double-entry ledger)
- **JWT** + **bcrypt** (custom auth, no vendor lock-in)
