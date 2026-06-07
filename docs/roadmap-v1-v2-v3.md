# 3REAL — Product Roadmap

**Last Updated:** 2026-06-07  
**Status:** Draft — Awaiting Approval  
**Owner:** SETAEI

---

## Versioning Philosophy

Each version is **shippable in production** before the next begins. No version is a stepping stone that only makes sense when the next one ships. This keeps the team grounded and ensures real users can validate assumptions before engineering resources are committed to the next phase.

| Version | Theme | Blockchain | Products |
|---|---|---|---|
| v1 | Trust & Foundation | None — all internal | 3REAL (portal only) |
| v2 | Real Assets | TON + USDT | 3REAL + Shahnameh |
| v3 | Ecosystem | REAL chain + SETAEI Pay | All 4 products |

---

## V1 — Trust & Foundation

**Target:** MVP live, real users, real KYC, real deposits handled manually

### Goal
Prove that users will register, complete KYC, and deposit into a REAL account. Validate that the referral system drives organic growth.

### Core Constraints
- No blockchain — all deposits/withdrawals are manual (admin-approved)
- No trading — this is a portal, not an exchange
- REAL balance is a number in the ledger — no token issuance
- All financial operations go through the double-entry ledger

### V1 Deliverables

#### Infrastructure
- [ ] Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] Prisma + PostgreSQL: full schema (see database-design.md)
- [ ] Nginx + PM2 + Cloudflare deployment on VPS
- [ ] Docker + docker-compose for local dev
- [ ] Environment configuration and secrets management
- [ ] i18n: English, Norwegian, Persian

#### Authentication
- [ ] Registration with email + password (bcrypt)
- [ ] Email verification (magic link or OTP)
- [ ] Login with JWT (httpOnly cookie)
- [ ] Forgot password / reset flow
- [ ] Rate limiting on all auth endpoints

#### Ledger Core
- [ ] `ecosystems`, `accounts`, `ledger_transactions`, `ledger_entries` tables
- [ ] Account creation (lazy, on first event)
- [ ] Balance calculation functions
- [ ] Journal entry functions (atomic double-entry writes)
- [ ] Ledger integrity checks (transaction sum = 0 assertion)

#### User Dashboard
- [ ] Wallet overview (REAL balance, calculated from ledger)
- [ ] Recent transaction history
- [ ] Referral stats panel
- [ ] Profile completion progress
- [ ] Notification bell + dropdown

#### Wallet & Transactions
- [ ] Deposit request form (amount + payment reference)
- [ ] Withdrawal request form (amount + destination)
- [ ] Transaction status tracking (pending → approved / rejected)
- [ ] Full transaction history with filters

#### Referral System
- [ ] Auto-generate unique referral code on registration
- [ ] Shareable referral link (/r/{code})
- [ ] Click tracking (IP + timestamp)
- [ ] Registration attribution on sign-up with code
- [ ] Reward issuance (configurable REAL amount via settings)
- [ ] Referral stats: clicks, registrations, total earned

#### KYC Module
- [ ] Tier 0 → Tier 2 upgrade flow (email + ID + selfie)
- [ ] Document upload (local storage in v1)
- [ ] KYC status display for user
- [ ] Admin: review queue, approve/reject with reason
- [ ] Tier-gated deposit/withdrawal limits (settings-driven)

#### Admin Panel
- [ ] Dashboard: user count, pending KYC, pending transactions, referral growth
- [ ] User management: list, view, deactivate
- [ ] Transaction management: approve / reject with admin note
- [ ] KYC management: review queue + decision tools
- [ ] Ledger view: per-user account ledger entries
- [ ] Settings page (fee config, reward amounts, limits)
- [ ] Activity log viewer

#### Landing Page
- [ ] Hero with REAL value proposition
- [ ] How it works (3 steps)
- [ ] Referral program section
- [ ] Security & trust signals
- [ ] FAQ accordion
- [ ] Multi-language toggle (EN / NO / FA)
- [ ] Footer with legal links

### V1 Success Metrics
- 100+ registered users within 30 days of launch
- 50+ KYC completions
- 20+ deposit requests (any size)
- Referral conversion rate > 15% (registered / link clicks)

---

## V2 — Real Assets

**Target:** Real crypto deposits and withdrawals via TON and USDT

### Goal
Remove the manual deposit bottleneck. Enable users to deposit USDT or TON directly from their wallets. Platform holds custody; no self-custody in v2.

### New Capabilities

#### Blockchain Integration
- [ ] TON deposit addresses generated per user (custodial)
- [ ] USDT (TRC-20 or ERC-20) deposit addresses per user
- [ ] On-chain deposit listener service (background process)
- [ ] Confirmed deposit → automatic ledger event (no manual approval)
- [ ] Withdrawal to user-provided address (admin-approved in v2, auto in v3)
- [ ] `chain_tx_hash` + `chain_network` populated on ledger_transactions
- [ ] Block explorer links for all on-chain transactions

#### Asset Management
- [ ] Multi-asset wallet display (REAL, USDT, TON)
- [ ] Real-time REAL/USDT and REAL/TON rates (manual or oracle)
- [ ] Asset conversion UI (USDT → REAL, TON → REAL)
- [ ] Conversion creates two ledger transactions (deposit + conversion fee)

#### Shahnameh Integration
- [ ] Shahnameh ecosystem row in `ecosystems`
- [ ] REAL spending in Shahnameh creates ledger entries in Shahnameh ecosystem
- [ ] Unified balance view across ecosystems in user dashboard

#### KYC Enhancement
- [ ] Tier 3: address proof document
- [ ] Automated ID verification (third-party API — e.g., Veriff, Onfido)
- [ ] Liveness check for selfie verification

#### Infrastructure Upgrades
- [ ] S3-compatible file storage for KYC documents
- [ ] Sentry error tracking
- [ ] Database read replica for ledger balance queries
- [ ] API versioning (/api/v2/...)

### V2 Success Metrics
- First on-chain deposit within 7 days of v2 launch
- < 5 min average deposit confirmation time
- 0 instances of double-spend or balance discrepancy

---

## V3 — Ecosystem

**Target:** REAL native blockchain, SETAEI Pay, TrustAI, full ecosystem velocity

### Goal
REAL becomes a real on-chain asset. SETAEI Pay goes live as a payment gateway. All four products share the same ledger. REAL has external market value.

### New Capabilities

#### REAL Chain Integration
- [ ] REAL token smart contract / L1 deployment
- [ ] On-chain REAL deposit + withdrawal (non-custodial path)
- [ ] REAL staking mechanics (lock REAL → earn yield in REAL ledger)
- [ ] Cross-chain bridge: TON ↔ REAL chain

#### SETAEI Pay
- [ ] Merchant API for accepting REAL payments
- [ ] Payment link generation (one-click pay)
- [ ] EUR / NOK / TRY on-ramp via bank transfer
- [ ] Settlement: merchant receives REAL or local currency
- [ ] `setaei_pay` ecosystem in ledger

#### TrustAI
- [ ] REAL-denominated AI compute credits
- [ ] Usage-based billing via ledger entries
- [ ] Credit top-up from wallet
- [ ] `trust_ai` ecosystem in ledger

#### Advanced Admin
- [ ] Cross-ecosystem treasury dashboard
- [ ] REAL supply analytics (total issued, in circulation, staked)
- [ ] Automated compliance reporting
- [ ] Multi-operator permission roles (separate KYC team, finance team, etc.)

#### Regulatory
- [ ] Full AML transaction monitoring
- [ ] FATF Travel Rule compliance for large transfers
- [ ] Jurisdiction-specific KYC tier requirements
- [ ] GDPR data export / deletion tools

### V3 Success Metrics
- REAL token listed on at least one external market
- SETAEI Pay processing > 10 merchant transactions/day
- All 4 products live on shared ledger with zero balance discrepancies

---

## What We Are NOT Building

These are explicit non-goals. If a stakeholder asks for these, the answer is: not in this roadmap.

| Feature | Reason |
|---|---|
| Spot trading engine | Not an exchange — use Binance/Kraken for trading |
| Order book | Same as above |
| Margin / leverage | Regulatory and complexity risk |
| Derivatives | Same as above |
| Social trading | Out of scope for SETAEI ecosystem |
| Mining pool | Separate infrastructure concern |
| NFT marketplace (full) | Shahnameh handles this separately |

---

## Dependency Map

```
V1 must be complete before:
  → V2 blockchain features (need stable ledger + KYC + user base)

V2 must be complete before:
  → V3 REAL chain (need proven custodial flow to migrate from)
  → V3 SETAEI Pay (needs stable multi-asset ledger)

Ledger architecture (V1) is the foundation everything else depends on.
If the ledger has a design flaw, ALL three versions are affected.
Get ledger approval before writing production code.
```

---

## Approval Gates

Before each version ships to production:

| Gate | V1 | V2 | V3 |
|---|---|---|---|
| Schema approval | Required | Required | Required |
| Security review | Required | Required | Required |
| Ledger integrity test (sum = 0) | Required | Required | Required |
| KYC compliance review | Required | Required | Required |
| Legal review (jurisdiction) | Norway required | + crypto regulation | + payment license |
