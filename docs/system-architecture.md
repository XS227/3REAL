# 3REAL — System Architecture

**Last Updated:** 2026-06-07  
**Status:** Draft — Awaiting Approval  
**Owner:** SETAEI

---

## 1. Architectural Philosophy

### Ledger-First
Every financial operation is a ledger event. No balance is ever stored directly on a user record. Balances are always **calculated** by summing ledger entries.

### Ecosystem-First
All financial tables carry an `ecosystem_id`. A single deployed instance of the system can serve multiple products (3REAL, Shahnameh, TrustAI, SETAEI Pay) with full isolation between ecosystems and the ability to query across them.

### Asset-Agnostic
The ledger makes no assumptions about what asset is being moved. REAL, USDT, TON, EUR, NOK, TRY — all are represented as asset accounts. Conversion rates are handled at the application layer, not the database layer.

### Blockchain-Ready
No blockchain in v1, but the architecture anticipates it. Ledger entries will link to on-chain transactions in v2/v3 via a nullable `chain_tx_hash` field. No schema migrations will be required to enable blockchain integration.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SETAEI Ecosystem                         │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐ │
│  │  3REAL   │  │  Shahnameh   │  │ TrustAI  │  │  Pay   │ │
│  │  Portal  │  │   Platform   │  │  Marketplace│ │Gateway │ │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───┬────┘ │
│       │               │               │             │      │
│  ─────┴───────────────┴───────────────┴─────────────┴──── │
│                   SETAEI Core API Layer                     │
│  ─────────────────────────────────────────────────────── │
│                                                             │
│           ┌─────────────────────────────┐                  │
│           │   Double-Entry Ledger Core  │                  │
│           │  accounts / ledger_entries  │                  │
│           │    / ledger_transactions    │                  │
│           └─────────────────────────────┘                  │
│                                                             │
│           ┌─────────────────────────────┐                  │
│           │        PostgreSQL            │                  │
│           └─────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Application Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR + RSC for performance, SEO, and i18n |
| API | Next.js API Routes (REST) | Co-located with frontend, easy to extract later |
| ORM | Prisma | Type-safe DB access, clean migration history |
| Database | PostgreSQL | ACID compliance required for financial ledger |
| Auth | Custom JWT + bcrypt | Full control; no vendor lock-in |
| File Storage | Local (v1) → S3-compatible (v2) | KYC documents |
| Process Manager | PM2 | VPS deployment |
| Web Server | Nginx (reverse proxy) | SSL termination, static file serving |
| DNS/CDN | Cloudflare | DDoS protection, caching |

---

## 4. Folder Structure

```
/var/www/3real/
├── app/                        # Next.js App Router
│   ├── (public)/               # Landing, about, etc.
│   ├── (auth)/                 # Login, register, verify
│   ├── (dashboard)/            # Protected user routes
│   │   ├── wallet/
│   │   ├── transactions/
│   │   ├── referrals/
│   │   ├── kyc/
│   │   └── settings/
│   ├── (admin)/                # Admin panel routes
│   └── api/                    # API route handlers
│       ├── auth/
│       ├── wallet/
│       ├── transactions/
│       ├── kyc/
│       ├── referrals/
│       └── admin/
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── layout/                 # Shell, sidebar, header, footer
│   ├── dashboard/              # Dashboard-specific components
│   ├── wallet/
│   ├── kyc/
│   └── admin/
├── lib/
│   ├── ledger/                 # Double-entry ledger core logic
│   │   ├── accounts.ts
│   │   ├── journal.ts          # Record journal entries
│   │   └── balance.ts          # Calculate balances from ledger
│   ├── auth/
│   ├── kyc/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/                       # Architecture & design docs (this folder)
├── public/
└── .env
```

---

## 5. Double-Entry Ledger Architecture

### 5.1 Core Principle

Every financial event creates **at least two ledger entries**: one debit and one credit. The sum of all entries for a transaction always equals zero. This is standard double-entry bookkeeping applied to a digital asset system.

```
User deposits 100 REAL:
  DR  user:alice:real           +100  (user's asset account increases)
  CR  platform:deposits:real    -100  (platform liability increases)

Platform approves deposit:
  DR  platform:deposits:real    +100
  CR  platform:float:real       -100

User earns 10 REAL referral reward:
  DR  user:alice:real           +10
  CR  platform:rewards-pool:real -10
```

### 5.2 Account Types

| Type | Description | Examples |
|---|---|---|
| `asset` | Platform holds an asset | platform:float:usdt, platform:custody:ton |
| `liability` | Platform owes a user | user:{id}:real, user:{id}:usdt |
| `equity` | Platform ownership | platform:equity:real |
| `revenue` | Platform income | platform:fees:real |
| `expense` | Platform costs | platform:rewards-pool:real |

### 5.3 Account Naming Convention

```
{owner_type}:{owner_id}:{asset_code}
```

Examples:
- `user:uuid-alice:real` — Alice's REAL balance
- `user:uuid-alice:usdt` — Alice's USDT balance
- `platform:fees:real` — Platform fee collection account
- `platform:rewards-pool:real` — Referral/reward funding account
- `platform:float:usdt` — USDT held by platform

---

## 6. Ecosystem Isolation

Every financial table contains `ecosystem_id`. This enables:

1. **Product separation:** 3REAL earnings vs. Shahnameh earnings are separate ecosystems
2. **Cross-ecosystem queries:** Total platform-wide REAL in circulation
3. **Ecosystem-specific rate limits, fee schedules, and KYC tiers**
4. **Future multi-tenancy:** White-label the ledger for partners

```sql
-- User's REAL balance in the 3REAL ecosystem
SELECT SUM(amount) 
FROM ledger_entries 
WHERE account_id = 'user:alice:real' 
  AND ecosystem_id = 'ecosystem:3real'
  AND asset_code = 'REAL';
```

---

## 7. API Design

### 7.1 Route Structure

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/verify-email

GET    /api/wallet                    # Current user balance (calculated)
POST   /api/wallet/deposit            # Submit deposit request
POST   /api/wallet/withdraw           # Submit withdrawal request
GET    /api/wallet/history            # Ledger entries for user

GET    /api/transactions              # Transaction list for user
GET    /api/transactions/:id          # Single transaction

GET    /api/referrals                 # User's referral stats
GET    /api/referrals/code            # User's referral code

POST   /api/kyc/submit               # Submit KYC documents
GET    /api/kyc/status               # KYC status for user

GET    /api/notifications            # User notifications
PATCH  /api/notifications/:id/read   # Mark as read

# Admin routes (require admin role)
GET    /api/admin/users
GET    /api/admin/kyc/pending
PATCH  /api/admin/kyc/:id/approve
PATCH  /api/admin/kyc/:id/reject
GET    /api/admin/transactions/pending
PATCH  /api/admin/transactions/:id/approve
PATCH  /api/admin/transactions/:id/reject
GET    /api/admin/ledger/accounts
GET    /api/admin/ledger/journal
```

### 7.2 Balance Calculation

Balances are **never stored**. They are always computed:

```typescript
// lib/ledger/balance.ts
async function getUserBalance(userId: string, assetCode: string, ecosystemId: string) {
  const result = await prisma.ledgerEntry.aggregate({
    where: {
      account: { owner_id: userId, asset_code: assetCode },
      ecosystem_id: ecosystemId,
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
```

---

## 8. Security Architecture

| Layer | Control |
|---|---|
| Authentication | JWT (httpOnly cookie), bcrypt password hashing |
| Authorization | Role-based middleware (user / operator / super_admin) |
| Rate Limiting | Per-IP on auth endpoints, per-user on financial endpoints |
| Input Validation | Zod schemas on all API inputs |
| CSRF | SameSite cookie + origin header check |
| SQL Injection | Prisma ORM (parameterized queries only) |
| File Uploads | Type + size validation; stored outside web root |
| Audit Trail | `activity_logs` on every admin action and financial event |
| HTTPS | Nginx + Cloudflare SSL termination |

---

## 9. Future Blockchain Integration (v2/v3)

The ledger is ready for blockchain. When a TON or REAL blockchain deposit is confirmed:

1. A listener (off-chain service) detects the on-chain transaction
2. It calls the internal ledger API with the confirmed amount + `chain_tx_hash`
3. A `ledger_transaction` is created with type `blockchain_deposit`
4. Two `ledger_entries` are written (debit user account, credit custody account)
5. The `chain_tx_hash` is stored on the ledger_transaction for audit

**Nothing in the database schema changes.** The blockchain is just a new source of ledger events.

---

## 10. Observability

| Signal | Tool |
|---|---|
| Application Logs | PM2 log rotation + structured JSON logs |
| Error Tracking | Console (v1) → Sentry (v2) |
| Database | pg_stat_statements for slow query tracking |
| Uptime | Cloudflare health checks |
| Admin alerts | In-app notifications (v1) → webhook/email (v2) |
