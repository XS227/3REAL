# 3REAL — Database Architecture Review

**Prepared for:** Phase 1.5 Architecture Review  
**Date:** 2026-06-07  
**Scope:** Critical gaps in the existing schema, recommended new entities, admin panel data model, wallet architecture requirements  
**Does not contain:** Prisma syntax — that comes in Phase 2.

---

## 1. Verdict on the Existing Schema

The 9-table schema in `database-design.md` has a solid foundation. The double-entry ledger core (`accounts`, `ledger_transactions`, `ledger_entries`) is correct. The `ecosystem_id` threading is correct. The immutability principle for ledger entries is correct.

**However, 7 entities are missing or incomplete.** These gaps are not cosmetic — they affect auth security, KYC usability, fee configurability, and blockchain readiness. They must be resolved before Phase 2.

---

## 2. Existing Schema — Gap Analysis

### 2.1 Authentication: No Session Management Table

**Gap:** The existing schema has `users` with a `password_hash` but no table for:
- Email verification tokens
- Password reset tokens
- Refresh token rotation

Without this, auth is either stateless-only (no refresh) or tokens are stored in a way that cannot be revoked. For a financial portal, token revocation is not optional.

**Impact:** High. Cannot safely implement password reset, email verification, or "log out all devices."

### 2.2 KYC: Document Management is Too Flat

**Gap:** `kyc_profiles` stores three document paths as flat fields:
```
id_doc_path     VARCHAR(512)
selfie_path     VARCHAR(512)
address_doc_path VARCHAR(512)
```

**Problems with this:**
- Admin cannot reject a specific document and ask for re-upload of only that one
- Cannot track revision history (user re-submitted the ID 3 times)
- Cannot record per-document review notes
- Adding a 4th document type (e.g., bank statement for Tier 3) requires a schema migration

**Impact:** Medium-High. Directly degrades KYC review UX and causes support tickets.

### 2.3 No Fee Schedule Table

**Gap:** The `settings` table (key-value) is used for everything configurable, including fees. For fees this creates:
- No enforcement of fee tiers by KYC tier
- No per-asset fee rules
- No deposit vs. withdrawal differentiation
- No min/max transaction limits per tier
- All fees are free-text values with no type safety

**Impact:** Medium. Workable for v1 if fee structure is simple, but fragile and must be refactored before v2 multi-asset launch.

### 2.4 No Exchange Rate Table

**Gap:** The system has no place to store current or historical exchange rates (REAL/USDT, REAL/TON, REAL/EUR, etc.). Without this:
- Conversion calculations are hardcoded or use ephemeral API calls
- There is no audit trail of what rate was applied when
- Historical rate lookups (for dispute resolution) are impossible

**Impact:** Low for v1 (no conversion in v1), Critical for v2.

### 2.5 No Blockchain Deposit Address Table

**Gap:** No place to store per-user deposit addresses for blockchain networks (TON, TRC20, ERC20). This is a v2 requirement but the table design should be decided now to ensure compatibility.

**Impact:** Low for v1, Critical for v2.

### 2.6 No Saved Withdrawal Destinations

**Gap:** Withdrawal requests (`transactions` table) have a free-text `payment_ref` field but no structured destination management. Users cannot save and reuse withdrawal addresses. Every withdrawal is a new manual entry, increasing error risk and admin review burden.

**Impact:** Low for v1, High for UX quality in v2.

### 2.7 Notifications: Missing Channel and Delivery Tracking

**Gap:** The `notifications` table has no delivery channel field and no delivery status tracking. This makes it impossible to know if a notification was actually delivered (email sent? push delivered?) or to retry failed deliveries.

**Impact:** Low for v1 (in-app only), Medium for v2.

---

## 3. Recommended Additional Entities

### 3.1 `auth_tokens` — Auth Session & Token Management

**Purpose:** Stores hashed tokens for email verification, password reset, and JWT refresh rotation.

```
auth_tokens
├── id              UUID PRIMARY KEY
├── user_id         UUID NOT NULL REFERENCES users(id)
├── token_hash      VARCHAR(128) NOT NULL UNIQUE   -- bcrypt or SHA-256 hash, never plain
├── type            VARCHAR(32) NOT NULL
│                   -- 'email_verify', 'password_reset', 'refresh_token'
├── expires_at      TIMESTAMPTZ NOT NULL
├── used_at         TIMESTAMPTZ                    -- null until consumed
├── ip_address      VARCHAR(64)
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── INDEX(user_id, type)
├── INDEX(token_hash)
```

**Why:** Token revocation requires server-side storage. Refresh token rotation (new token on each use, old token invalidated) requires this table. Email verification and password reset both need expiry-checked one-time tokens.

**Security note:** The raw token is sent to the user. Only the hash is stored. A stolen database cannot be used to verify emails or reset passwords.

### 3.2 `kyc_documents` — Per-Document KYC Management

**Purpose:** Replace the 3 flat path fields in `kyc_profiles` with a proper document table that supports revision history, per-document status, and extensible document types.

```
kyc_documents
├── id              UUID PRIMARY KEY
├── kyc_profile_id  UUID NOT NULL REFERENCES kyc_profiles(id)
├── doc_type        VARCHAR(32) NOT NULL
│                   -- 'id_front', 'id_back', 'selfie', 'address_proof', 'bank_statement'
├── file_path       VARCHAR(512) NOT NULL
├── file_name       VARCHAR(255)
├── file_size_bytes INTEGER
├── mime_type       VARCHAR(64)
├── status          VARCHAR(32) DEFAULT 'pending'
│                   -- 'pending', 'approved', 'rejected'
├── rejection_reason TEXT
├── reviewed_by     UUID REFERENCES users(id)
├── reviewed_at     TIMESTAMPTZ
├── version         SMALLINT DEFAULT 1             -- increments on re-upload
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── INDEX(kyc_profile_id, doc_type)
```

**Why:** This enables admin to reject only the blurry selfie without voiding the whole KYC submission. Users can re-upload specific documents. Tabdeal and Wallex's superior KYC UX is enabled by exactly this kind of per-document tracking.

**Migration:** The 3 path fields on `kyc_profiles` become soft-deprecated; new submissions use this table.

### 3.3 `fee_tiers` — Configurable Fee Schedule

**Purpose:** Replace ad-hoc settings keys with a structured, queryable fee schedule that supports per-asset, per-direction, and per-KYC-tier fee rules.

```
fee_tiers
├── id              UUID PRIMARY KEY
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── kyc_tier        SMALLINT NOT NULL DEFAULT 0    -- 0 = any tier, or specific tier
├── asset_code      VARCHAR(16) NOT NULL
├── direction       VARCHAR(16) NOT NULL           -- 'deposit', 'withdrawal', 'conversion'
├── fee_type        VARCHAR(16) NOT NULL           -- 'flat', 'percent', 'flat+percent'
├── flat_amount     NUMERIC(28, 8) DEFAULT 0
├── percent_amount  NUMERIC(8, 4) DEFAULT 0        -- e.g., 1.5000 = 1.5%
├── min_fee         NUMERIC(28, 8) DEFAULT 0
├── max_fee         NUMERIC(28, 8)                 -- null = no cap
├── min_transaction NUMERIC(28, 8) DEFAULT 0       -- minimum transaction amount for this tier
├── max_transaction NUMERIC(28, 8)                 -- null = no cap
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── UNIQUE(ecosystem_id, kyc_tier, asset_code, direction)
```

**Why:** Without this, adding a second asset (USDT) in v2 requires editing settings keys and code simultaneously. With this table, adding USDT fees is an INSERT statement, not a code change.

### 3.4 `exchange_rates` — Rate History and Oracle Feed

**Purpose:** Store current and historical exchange rates for all asset pairs. Provides an audit trail of "what rate was applied when" for every conversion.

```
exchange_rates
├── id              UUID PRIMARY KEY
├── from_asset      VARCHAR(16) NOT NULL           -- 'USDT'
├── to_asset        VARCHAR(16) NOT NULL           -- 'REAL'
├── rate            NUMERIC(28, 8) NOT NULL        -- 1 USDT = X REAL
├── source          VARCHAR(32) NOT NULL           -- 'manual', 'oracle', 'admin'
├── set_by          UUID REFERENCES users(id)      -- admin who set manual rate
├── valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW()
├── valid_until     TIMESTAMPTZ                    -- null = currently active
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── INDEX(from_asset, to_asset, valid_from DESC)
```

**Query pattern:** To get current rate, select WHERE valid_until IS NULL or valid_until > NOW(), ordered by valid_from DESC LIMIT 1.

**Why:** Every conversion that touches the ledger must record the rate used. Without historical rates, any user dispute about "what rate was applied to my USDT deposit" is unresolvable.

### 3.5 `deposit_addresses` — Per-User Blockchain Addresses (Phase 2 prep)

**Purpose:** Stores the custodial deposit addresses assigned to each user per network. Created at account setup or on first deposit request.

```
deposit_addresses
├── id              UUID PRIMARY KEY
├── user_id         UUID NOT NULL REFERENCES users(id)
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── network         VARCHAR(32) NOT NULL           -- 'ton', 'trc20', 'erc20', 'real_chain'
├── address         VARCHAR(255) NOT NULL UNIQUE
├── derivation_path VARCHAR(128)                   -- BIP-44 path for HD wallet
├── label           VARCHAR(128)                   -- human-readable: 'User Alice TON Deposit'
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── UNIQUE(user_id, ecosystem_id, network)
```

**Why:** In v2, when a user deposits TON, the system needs a 1:1 mapping from deposit address to user_id to attribute the incoming transaction. This table enables that without code changes. Add it now; it stays empty until v2.

### 3.6 `withdrawal_destinations` — Saved Destination Addresses

**Purpose:** Users can save frequently used withdrawal destinations (bank accounts, crypto addresses) to reduce re-entry errors and speed up the withdrawal flow.

```
withdrawal_destinations
├── id              UUID PRIMARY KEY
├── user_id         UUID NOT NULL REFERENCES users(id)
├── type            VARCHAR(32) NOT NULL           -- 'crypto', 'bank_transfer', 'sepa'
├── network         VARCHAR(32)                    -- 'ton', 'trc20', 'bank'
├── address         VARCHAR(512) NOT NULL           -- crypto address or IBAN
├── label           VARCHAR(128)                   -- "My TON Wallet", "Norwegian Bank"
├── is_verified     BOOLEAN DEFAULT FALSE
├── verified_at     TIMESTAMPTZ
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── INDEX(user_id, type, is_active)
```

**Why:** Every exchange that asks users to re-type a wallet address on every withdrawal creates error risk. A verified destinations list reduces both user friction and admin review burden (a known destination requires less scrutiny than a novel one).

---

## 4. Existing Entity Modifications

### 4.1 `users` — Add `display_name`, `locale`

```
-- Add to users:
display_name    VARCHAR(128)                -- user's chosen display name
locale          VARCHAR(8) DEFAULT 'en'    -- 'en', 'no', 'fa'
avatar_path     VARCHAR(512)               -- optional profile picture
two_fa_enabled  BOOLEAN DEFAULT FALSE
two_fa_secret   VARCHAR(128)               -- TOTP secret (if 2FA enabled)
```

### 4.2 `notifications` — Add Channel and Delivery Tracking

```
-- Add to notifications:
channel         VARCHAR(16) DEFAULT 'in_app'  -- 'in_app', 'email', 'push'
sent_at         TIMESTAMPTZ                   -- when actually sent
delivery_status VARCHAR(32) DEFAULT 'pending' -- 'pending', 'sent', 'failed'
```

### 4.3 `referrals` — Add Level for Multi-Tier Support

```
-- Add to referrals:
referral_level  SMALLINT DEFAULT 1    -- 1 = direct, 2 = second-level
parent_referral_id UUID REFERENCES referrals(id)  -- links level-2 to level-1
```

Without `referral_level` and `parent_referral_id`, implementing a 2-tier referral commission (35% direct / 15% second-level) is impossible without a separate table.

### 4.4 `kyc_profiles` — Deprecate Flat Path Fields

When `kyc_documents` table is added, the 3 flat path fields (`id_doc_path`, `selfie_path`, `address_doc_path`) should be deprecated. They can remain in the schema as nullable and be phased out in v2.

---

## 5. Complete Recommended Entity List

| Entity | Status | Priority |
|---|---|---|
| `ecosystems` | Existing — keep as-is | — |
| `users` | Existing — add 4 fields | Phase 2 |
| `accounts` | Existing — keep as-is | — |
| `ledger_transactions` | Existing — keep as-is | — |
| `ledger_entries` | Existing — keep as-is | — |
| `transactions` | Existing — keep as-is | — |
| `referrals` | Existing — add 2 fields | Phase 2 |
| `kyc_profiles` | Existing — deprecate path fields | Phase 2 |
| `activity_logs` | Existing — keep as-is | — |
| `notifications` | Existing — add 3 fields | Phase 2 |
| `settings` | Existing — keep (non-fee config) | — |
| `auth_tokens` | **New** | Phase 2 (auth) |
| `kyc_documents` | **New** | Phase 2 (KYC) |
| `fee_tiers` | **New** | Phase 2 |
| `exchange_rates` | **New** | Phase 2 |
| `deposit_addresses` | **New** (empty until v2) | Phase 2 |
| `withdrawal_destinations` | **New** | Phase 2 |

**Total: 17 entities** (9 original + 6 new + 2 modified)

---

## 6. Recommended Admin Panel Data Model

The admin panel is not a separate service — it reads from the same database. The data model requirements for a well-functioning admin panel:

### 6.1 KYC Review Queue
Requires joining: `kyc_profiles` + `kyc_documents` + `users`  
Must support: sort by submission age (oldest first), filter by status, flag submissions > 4 hours old  
Key metrics: total pending, avg review time, rejection rate by reason

### 6.2 Transaction Approval Queue
Requires joining: `transactions` + `users` + `accounts` + `activity_logs`  
Must support: filter by type (deposit/withdrawal), sort by amount, view user's KYC tier inline  
Key risk signal: first transaction from this user, large amount, unusual destination

### 6.3 User Management
Requires: `users` + `kyc_profiles` + aggregated `ledger_entries` (balance)  
Must support: search by email/name, filter by role/tier/status, view full activity per user  
Actions: deactivate account, adjust KYC tier (with audit log), view complete ledger history

### 6.4 Ledger Explorer
Requires: `accounts` + `ledger_entries` + `ledger_transactions` + `users`  
Must support: view balance per account, view all entries for an account, verify transaction integrity (sum = 0)  
This view is for debugging and auditing, not daily operations

### 6.5 Platform Metrics Dashboard
All derived from existing tables:
- Total users registered (COUNT from `users`)
- Active KYC completions this month (COUNT from `kyc_profiles` WHERE status = 'approved')
- Pending deposits value (SUM from `transactions` WHERE type = 'deposit' AND status = 'pending')
- Total REAL in circulation (SUM of user `ledger_entries`)
- Referral conversion rate (registered / clicks from `referrals`)
- Daily new registrations (time-series from `users.created_at`)

### 6.6 Admin Panel Section Map

```
Admin Panel
├── Dashboard           ← aggregated metrics, auto-refresh
├── KYC Queue           ← kyc_profiles + kyc_documents
├── Transactions        ← transactions (pending approval)
├── Users               ← users + kyc + balance
├── Referrals           ← referrals + reward ledger entries
├── Ledger              ← accounts + ledger_entries (read-only)
├── Activity Log        ← activity_logs (read-only)
├── Notifications       ← send bulk or individual notifications
├── Settings            ← fee_tiers + settings + exchange_rates
└── Reports             ← exportable data (CSV/Excel)
```

---

## 7. Recommended Wallet Architecture

The wallet is not a separate system — it is a projection of the ledger. All wallet data is derived.

### 7.1 Balance Calculation

```sql
-- Available balance (confirmed only)
SELECT COALESCE(SUM(le.amount), 0) AS available_balance
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'user'
  AND a.owner_id = :user_id
  AND a.asset_code = 'REAL'
  AND le.ecosystem_id = :ecosystem_id;

-- Pending balance (from transactions in 'pending' or 'under_review' state)
SELECT COALESCE(SUM(t.net_amount), 0) AS pending_balance
FROM transactions t
WHERE t.user_id = :user_id
  AND t.type = 'deposit'
  AND t.status IN ('pending', 'under_review');
```

**Key principle:** Never show a user a "pending" balance from ledger entries. Show pending from `transactions` table. Ledger entries only exist for completed events.

### 7.2 Wallet Page Architecture (UI perspective)

```
Wallet Page
├── Balance Header
│   ├── Available: X REAL           ← from ledger_entries
│   ├── Pending: Y REAL             ← from transactions (pending)
│   └── Total: X+Y REAL             ← sum of above
│
├── Quick Actions
│   ├── [Request Deposit]
│   └── [Request Withdrawal]
│
├── Transaction History
│   ├── Filter: All / Deposits / Withdrawals / Pending
│   ├── Sort: Newest first
│   ├── Each row: date, type, amount, status, reference
│   └── [Export CSV]
│
└── (Phase 2) Multi-Asset View
    ├── REAL: X.XX
    ├── USDT: X.XX
    └── TON: X.XX
```

### 7.3 Wallet Architecture Anti-Patterns to Avoid

| Anti-Pattern | Source | Why Avoided |
|---|---|---|
| Multiple wallet types (spot/funding/earn) | Binance | Users don't know where their money is |
| Balance stored on user table | Any naive design | Violates ledger-first principle; creates drift |
| Pending deposits mixed into confirmed balance | Any naive design | Creates false balance display; support issues |
| No pending state visible to user | — | Users don't know if deposit was received |
| Withdrawal requires wallet-to-wallet transfer | Binance P2P | Pure friction, no benefit |

---

## 8. Index Recommendations (Refined)

The indexes in `database-design.md` are correct. Additional indexes for the new tables and for performance-critical query patterns:

```sql
-- auth_tokens
CREATE INDEX idx_auth_tokens_user_type ON auth_tokens(user_id, type);
CREATE INDEX idx_auth_tokens_hash ON auth_tokens(token_hash);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at) WHERE used_at IS NULL;

-- kyc_documents
CREATE INDEX idx_kyc_docs_profile ON kyc_documents(kyc_profile_id, doc_type);
CREATE INDEX idx_kyc_docs_status ON kyc_documents(status);

-- fee_tiers
CREATE INDEX idx_fee_tiers_lookup ON fee_tiers(ecosystem_id, asset_code, direction, kyc_tier);

-- exchange_rates (hot read path for conversions)
CREATE INDEX idx_exchange_rates_pair ON exchange_rates(from_asset, to_asset, valid_from DESC);

-- transactions (admin queue)
CREATE INDEX idx_transactions_status_type ON transactions(status, type, created_at DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type, created_at DESC);

-- referrals (chain lookup)
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_level ON referrals(referral_level, parent_referral_id);
```

---

## 9. Migration Risk Assessment

| Risk | Mitigation |
|---|---|
| Adding columns to `users` | All new columns are nullable or have defaults — zero downtime |
| Adding `kyc_documents` and deprecating path fields | Keep path fields nullable; migrate existing records in a background job |
| Adding `auth_tokens` | New table, no migration of existing data required |
| Adding `fee_tiers` | Seed with v1 fee rules on creation; application reads from this table instead of settings |
| Adding `referral_level` to `referrals` | Nullable, defaults to 1 — existing rows remain valid |

All changes are additive. No destructive schema changes required.
