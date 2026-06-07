# 3REAL — Database Design

**Last Updated:** 2026-06-07  
**Status:** Draft — Awaiting Approval  
**Owner:** SETAEI

---

## 1. Design Principles

1. **No stored balances.** User balances are always derived by summing `ledger_entries`.
2. **Double-entry ledger.** Every financial event debits one account and credits another. The algebraic sum of any transaction's entries is always zero.
3. **Ecosystem isolation.** All financial tables carry `ecosystem_id` to support 3REAL, Shahnameh, TrustAI, and SETAEI Pay on the same database.
4. **Asset-agnostic.** REAL, USDT, TON, EUR, NOK, TRY — all assets flow through the same ledger tables. Asset type is carried on the `accounts` record and ledger entries.
5. **Immutable ledger.** `ledger_entries` are never updated or deleted. Corrections are made via reversing entries.
6. **Blockchain-ready.** `chain_tx_hash` and `chain_network` fields are present but nullable in v1.

---

## 2. Complete Schema

### 2.1 `ecosystems`
Defines each product in the SETAEI ecosystem.

```sql
ecosystems
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── code            VARCHAR(32) UNIQUE NOT NULL    -- 'three_real', 'shahnameh', 'trust_ai', 'setaei_pay'
├── name            VARCHAR(128) NOT NULL
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.2 `users`
Platform accounts. No balance fields — ever.

```sql
users
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── email           VARCHAR(255) UNIQUE NOT NULL
├── password_hash   VARCHAR(255) NOT NULL
├── role            VARCHAR(32) DEFAULT 'user'     -- 'user', 'operator', 'super_admin'
├── kyc_tier        SMALLINT DEFAULT 0             -- 0=none, 1=email, 2=id, 3=full
├── referral_code   VARCHAR(16) UNIQUE NOT NULL
├── referred_by_id  UUID REFERENCES users(id)
├── is_active       BOOLEAN DEFAULT TRUE
├── email_verified  BOOLEAN DEFAULT FALSE
├── last_login_at   TIMESTAMPTZ
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.3 `accounts`
One record per (user OR platform entity) × asset × ecosystem.  
These are the **chart of accounts** for the entire platform.

```sql
accounts
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── owner_type      VARCHAR(32) NOT NULL            -- 'user', 'platform'
├── owner_id        VARCHAR(255) NOT NULL            -- user UUID or platform slug
├── account_type    VARCHAR(32) NOT NULL            -- 'asset', 'liability', 'equity', 'revenue', 'expense'
├── asset_code      VARCHAR(16) NOT NULL            -- 'REAL', 'USDT', 'TON', 'EUR', 'NOK', 'TRY'
├── label           VARCHAR(255)                    -- Human-readable: 'Alice REAL Wallet'
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      TIMESTAMPTZ DEFAULT NOW()
│
├── UNIQUE(ecosystem_id, owner_type, owner_id, asset_code)
```

**Key accounts created at platform init:**

| owner_type | owner_id | asset_code | account_type | label |
|---|---|---|---|---|
| platform | float | REAL | asset | Platform REAL Float |
| platform | float | USDT | asset | Platform USDT Float |
| platform | float | TON | asset | Platform TON Float |
| platform | fees | REAL | revenue | Platform Fee Collection |
| platform | rewards-pool | REAL | expense | Referral Rewards Pool |
| platform | deposits-pending | REAL | liability | Pending Deposit Escrow |
| platform | equity | REAL | equity | Platform Equity |

### 2.4 `ledger_transactions`
Groups related ledger entries into a single logical event.

```sql
ledger_transactions
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── type            VARCHAR(64) NOT NULL
│                   -- 'deposit', 'withdrawal', 'referral_reward',
│                   -- 'fee', 'transfer', 'blockchain_deposit',
│                   -- 'blockchain_withdrawal', 'correction', 'initial_credit'
├── status          VARCHAR(32) DEFAULT 'pending'
│                   -- 'pending', 'under_review', 'completed', 'rejected', 'reversed'
├── reference_id    UUID                            -- FK to transactions.id, referrals.id, etc.
├── reference_type  VARCHAR(64)                     -- 'deposit_request', 'referral', etc.
├── chain_tx_hash   VARCHAR(128)                    -- nullable; filled for blockchain events
├── chain_network   VARCHAR(32)                     -- 'ton', 'ethereum', 'real_chain'
├── initiated_by    UUID REFERENCES users(id)       -- who triggered this event
├── approved_by     UUID REFERENCES users(id)       -- admin who approved (if applicable)
├── note            TEXT                            -- internal admin note
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.5 `ledger_entries`
**Immutable.** The atomic double-entry records.  
Every `ledger_transaction` has at least 2 entries. Sum of amounts per transaction = 0.

```sql
ledger_entries
├── id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id)
├── ecosystem_id        UUID NOT NULL REFERENCES ecosystems(id)
├── account_id          UUID NOT NULL REFERENCES accounts(id)
├── asset_code          VARCHAR(16) NOT NULL        -- denormalized for query performance
├── amount              NUMERIC(28, 8) NOT NULL     -- positive = credit, negative = debit
│                                                   -- OR use signed convention: debit is negative
├── running_balance     NUMERIC(28, 8)              -- optional snapshot for performance
├── created_at          TIMESTAMPTZ DEFAULT NOW()
│
│   -- Entries are never updated or deleted.
│   -- Corrections use a reversal ledger_transaction with opposite signs.
```

> **Sign convention:** Debit = negative, Credit = positive (standard accounting).  
> User accounts are **liability** accounts (platform owes user). A user deposit:  
> - DR platform:deposits-pending:REAL (-100) — platform liability increases  
> - CR user:{id}:REAL (+100) — user's claim increases  

### 2.6 `transactions`
Deposit and withdrawal **requests** submitted by users. Drives the admin approval workflow. After admin approval, a `ledger_transaction` is created.

```sql
transactions
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── user_id         UUID NOT NULL REFERENCES users(id)
├── type            VARCHAR(16) NOT NULL             -- 'deposit', 'withdrawal'
├── asset_code      VARCHAR(16) NOT NULL             -- 'REAL', 'USDT', 'TON', 'EUR'
├── amount          NUMERIC(28, 8) NOT NULL
├── fee_amount      NUMERIC(28, 8) DEFAULT 0
├── net_amount      NUMERIC(28, 8)                  -- amount - fee_amount
├── status          VARCHAR(32) DEFAULT 'pending'
│                   -- 'pending' → 'under_review' → 'approved' / 'rejected' → 'completed'
├── ledger_tx_id    UUID REFERENCES ledger_transactions(id)  -- set when approved
├── payment_method  VARCHAR(64)                      -- 'bank_transfer', 'usdt_trc20', etc.
├── payment_ref     VARCHAR(255)                     -- user-provided payment reference
├── admin_note      TEXT
├── chain_tx_hash   VARCHAR(128)                     -- for crypto deposits
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.7 `referrals`
Tracks referral events — click, registration, reward.

```sql
referrals
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID NOT NULL REFERENCES ecosystems(id)
├── referrer_id     UUID NOT NULL REFERENCES users(id)
├── referred_id     UUID REFERENCES users(id)        -- null until registration
├── code            VARCHAR(16) NOT NULL
├── click_ip        VARCHAR(64)
├── click_at        TIMESTAMPTZ
├── registered_at   TIMESTAMPTZ
├── reward_amount   NUMERIC(28, 8) DEFAULT 0         -- REAL rewarded
├── ledger_tx_id    UUID REFERENCES ledger_transactions(id)  -- set when reward issued
├── status          VARCHAR(32) DEFAULT 'pending'
│                   -- 'pending', 'registered', 'rewarded', 'invalidated'
├── created_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.8 `kyc_profiles`
One KYC profile per user. Each submission attempt creates/updates this record.

```sql
kyc_profiles
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id         UUID UNIQUE NOT NULL REFERENCES users(id)
├── tier_requested  SMALLINT NOT NULL                -- 1, 2, or 3
├── status          VARCHAR(32) DEFAULT 'pending'
│                   -- 'pending', 'under_review', 'approved', 'rejected', 'update_requested'
├── id_doc_type     VARCHAR(32)                      -- 'passport', 'national_id', 'drivers_license'
├── id_doc_path     VARCHAR(512)                     -- file path or S3 key
├── selfie_path     VARCHAR(512)
├── address_doc_path VARCHAR(512)
├── rejection_reason TEXT
├── reviewed_by     UUID REFERENCES users(id)
├── reviewed_at     TIMESTAMPTZ
├── submitted_at    TIMESTAMPTZ DEFAULT NOW()
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.9 `activity_logs`
Immutable audit trail for all admin and user-facing financial actions.

```sql
activity_logs
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID REFERENCES ecosystems(id)
├── actor_id        UUID REFERENCES users(id)        -- who performed the action
├── target_id       UUID                             -- affected record ID
├── target_type     VARCHAR(64)                      -- 'user', 'kyc_profile', 'transaction', etc.
├── action          VARCHAR(128) NOT NULL             -- 'kyc.approve', 'transaction.reject', etc.
├── meta            JSONB                            -- additional context
├── ip_address      VARCHAR(64)
├── user_agent      TEXT
├── created_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.10 `notifications`
In-app notifications per user.

```sql
notifications
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── ecosystem_id    UUID REFERENCES ecosystems(id)
├── type            VARCHAR(64) NOT NULL
│                   -- 'kyc_approved', 'deposit_approved', 'withdrawal_approved',
│                   -- 'referral_reward', 'kyc_update_requested', 'kyc_rejected'
├── title           VARCHAR(255) NOT NULL
├── body            TEXT
├── is_read         BOOLEAN DEFAULT FALSE
├── reference_id    UUID                             -- linked record
├── reference_type  VARCHAR(64)
├── created_at      TIMESTAMPTZ DEFAULT NOW()
```

### 2.11 `settings`
Platform-level configuration key/value store.

```sql
settings
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── ecosystem_id    UUID REFERENCES ecosystems(id)   -- null = global
├── key             VARCHAR(255) NOT NULL
├── value           TEXT NOT NULL
├── type            VARCHAR(32) DEFAULT 'string'     -- 'string', 'number', 'boolean', 'json'
├── updated_by      UUID REFERENCES users(id)
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
│
├── UNIQUE(ecosystem_id, key)
```

---

## 3. Key Indexes

```sql
-- Ledger queries (balance lookups are hot path)
CREATE INDEX idx_ledger_entries_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_entries_ecosystem ON ledger_entries(ecosystem_id);
CREATE INDEX idx_ledger_entries_asset ON ledger_entries(asset_code);
CREATE INDEX idx_ledger_entries_tx ON ledger_entries(ledger_transaction_id);

-- Account lookups
CREATE INDEX idx_accounts_owner ON accounts(owner_type, owner_id);
CREATE INDEX idx_accounts_ecosystem ON accounts(ecosystem_id);

-- Transaction queries
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_ecosystem ON transactions(ecosystem_id);

-- Activity log queries
CREATE INDEX idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

---

## 4. Balance Calculation Patterns

### 4.1 User balance in a single asset/ecosystem

```sql
SELECT COALESCE(SUM(le.amount), 0) AS balance
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'user'
  AND a.owner_id = :user_id
  AND a.asset_code = 'REAL'
  AND le.ecosystem_id = :ecosystem_id;
```

### 4.2 User balances across all assets (wallet overview)

```sql
SELECT a.asset_code, COALESCE(SUM(le.amount), 0) AS balance
FROM accounts a
LEFT JOIN ledger_entries le ON le.account_id = a.id 
  AND le.ecosystem_id = :ecosystem_id
WHERE a.owner_type = 'user'
  AND a.owner_id = :user_id
  AND a.is_active = TRUE
GROUP BY a.asset_code;
```

### 4.3 Platform total REAL in circulation

```sql
SELECT COALESCE(SUM(le.amount), 0) AS total_real
FROM ledger_entries le
JOIN accounts a ON le.account_id = a.id
WHERE a.owner_type = 'user'
  AND a.asset_code = 'REAL';
```

---

## 5. Example: Full Deposit Flow

```
User submits deposit request (100 REAL equivalent):
  → transactions row created (status: 'pending')
  → activity_log: 'transaction.create'
  → notification: pending confirmation

Admin reviews and approves:
  → transactions.status → 'approved'
  → ledger_transaction created (type: 'deposit')
  → ledger_entries:
      DR  platform:deposits-pending:REAL   -100
      CR  user:{id}:REAL                   +100
  → ledger_transaction.status → 'completed'
  → transactions.ledger_tx_id = ledger_transaction.id
  → transactions.status → 'completed'
  → activity_log: 'transaction.approve'
  → notification: deposit_approved
```

---

## 6. Referral Reward Flow

```
User B registers with User A's referral code:
  → referrals row created (status: 'registered')
  → referrals.referred_id = User B's UUID

System issues reward (e.g., 10 REAL to User A):
  → ledger_transaction created (type: 'referral_reward', reference_id: referral.id)
  → ledger_entries:
      DR  platform:rewards-pool:REAL   -10
      CR  user:{A.id}:REAL             +10
  → referrals.status → 'rewarded'
  → referrals.reward_amount = 10
  → referrals.ledger_tx_id = ledger_transaction.id
  → notification to User A: referral_reward
```

---

## 7. Multi-Ecosystem Design Notes

When a user creates an account, their `accounts` records are created **lazily** (on first interaction with an ecosystem) or **eagerly** (on registration, for each active ecosystem). 

**Recommendation:** Create accounts lazily on first financial event per ecosystem. This keeps the chart of accounts clean and avoids orphaned account records.

When SETAEI Pay launches:
- A new `ecosystems` row is inserted: `{ code: 'setaei_pay', name: 'SETAEI Pay' }`
- No schema changes required
- Users transacting in SETAEI Pay get new `accounts` rows for `ecosystem_id = setaei_pay_uuid`
- All historical 3REAL ledger entries remain untouched
