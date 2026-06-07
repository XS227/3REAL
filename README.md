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

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start development server

```bash
npm run dev
```

App: http://localhost:3000  
Health check: http://localhost:3000/api/health

---

## Project Structure

```
app/
  (public)/          Landing page and public routes
  (auth)/            Login, register, email verify
  (dashboard)/       Protected user routes (wallet, KYC, referrals)
  (admin)/           Admin panel routes
  api/               REST API handlers
    health/          GET /api/health — liveness + DB check

components/
  ui/                shadcn/ui base components
  layout/            Shell, sidebar, header, footer
  dashboard/
  wallet/
  kyc/
  admin/

lib/
  prisma.ts          Prisma client singleton
  ledger/            Double-entry ledger core (Phase 6)
  auth/              JWT + bcrypt helpers (Phase 3)
  kyc/               KYC file handling (Phase 8)
  utils/

prisma/
  schema.prisma      Database schema
  migrations/

uploads/
  kyc/               KYC documents (outside web root)
```

---

## Build Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Project Scaffold | ✅ Done |
| 2 | Database Schema | ⬜ Pending |
| 3 | Authentication | ⬜ Pending |
| 4 | Landing Page | ⬜ Pending |
| 5 | User Dashboard | ⬜ Pending |
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
