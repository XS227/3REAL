# 3REAL — Asset Model

**Prepared for:** Phase 1.5 Architecture Review  
**Date:** 2026-06-07  
**Scope:** REAL token definition, TON and USDT integration architecture, fiat support, exchange rate model, precision rules, fee model per asset class.

---

## 1. Asset Registry

The system must support these assets across three versions:

| Asset | Code | Type | v1 | v2 | v3 | Notes |
|---|---|---|---|---|---|---|
| REAL Token | `REAL` | Internal | ✅ | ✅ | ✅ | Native accounting unit — always present |
| Tether USD | `USDT` | Crypto | — | ✅ | ✅ | TRC-20 recommended (see §4) |
| TON Coin | `TON` | Crypto | — | ✅ | ✅ | Strategic for Telegram ecosystem |
| Euro | `EUR` | Fiat | — | ✅ | ✅ | Via SEPA bank transfer |
| Norwegian Krone | `NOK` | Fiat | — | ✅ | ✅ | Core market: 3real.no |
| Turkish Lira | `TRY` | Fiat | — | — | ✅ | Via SETAEI Pay |
| REAL (on-chain) | `REAL` | Chain token | — | — | ✅ | Same code, different type flag |

**Design rule:** Asset codes are short UPPERCASE strings (max 16 chars). The code is the primary identifier. The same `REAL` code serves both off-chain (v1/v2) and on-chain (v3). A separate `asset_type` field or platform convention distinguishes them in context.

---

## 2. REAL Token — Full Specification

### 2.1 What REAL Is

In v1, REAL is a **pure internal accounting unit**. It is:
- A number in a ledger — not a file, not a blockchain token, not a certificate
- The native currency of the SETAEI ecosystem
- The denomination in which all internal balances, rewards, and fees are expressed
- Not tradeable on external markets in v1

REAL is conceptually equivalent to "points" in a loyalty program, or "credits" in a gaming economy — but backed by a formal double-entry ledger and governed by the same rules that govern bank accounts.

### 2.2 REAL in v2 and v3

| Version | REAL Status | Mechanism |
|---|---|---|
| v1 | Internal ledger unit | Numbers in DB |
| v2 | Internal unit with real asset backing | Every REAL has a USDT or TON reserve |
| v3 | Native on-chain token | Smart contract or L1 blockchain |

The ledger schema does not change between versions. In v3, blockchain deposits add a `chain_tx_hash` to the `ledger_transaction` — the entry pattern is identical to manual deposits.

### 2.3 REAL Precision

All REAL balances are stored as `NUMERIC(28, 8)`. This supports:
- Maximum value: 99,999,999,999,999,999,999.99999999 REAL
- Fractional precision: 8 decimal places (0.00000001 REAL minimum unit)

This matches Bitcoin precision (satoshi = 10⁻⁸) and USDT precision, ensuring compatibility with future blockchain representation.

### 2.4 REAL Supply Model

REAL is issued by the platform. There is no mining. Supply events:
1. **Platform seeding:** At launch, platform equity account is credited with initial supply (e.g., 100,000,000 REAL)
2. **User deposits:** When a user deposits value (fiat or crypto) and it is converted to REAL
3. **Referral rewards:** Drawn from the pre-allocated rewards pool

There is no uncontrolled REAL creation. Every REAL that enters a user account comes from a platform account. The total sum across all platform accounts + all user accounts should always equal the initial seed amount.

**Burn mechanism (optional, future):** REAL can be destroyed by a debit entry against a user account with no corresponding credit — but this should only be implemented intentionally for fee burning or token economics programs.

### 2.5 REAL Exchange Rate (v1)

In v1, the REAL exchange rate is set manually by the admin:
- Stored in `exchange_rates` table (from `database-review.md`)
- Changed via admin settings panel
- Applied at conversion time; the rate is stored on the ledger_transaction `note` field

Rate format: `1 USDT = X REAL` where X is the platform's chosen rate. The platform can set different rates for different directions (USDT→REAL vs REAL→USDT) to capture spread revenue.

---

## 3. TON Integration (Phase 2 Architecture)

### 3.1 Why TON

TON (The Open Network) is the blockchain built into Telegram. Telegram has 950M+ monthly active users as of 2025, with very high penetration among Persian-speaking diaspora communities (Iran's primary messaging app). A large portion of 3REAL's target users already have TON wallets through Telegram.

This makes TON strategically the most important blockchain integration for 3REAL's market.

### 3.2 TON Deposit Architecture

**Model:** Custodial hot wallet. Platform controls the deposit private keys.

```
User wants to deposit:
  → User goes to wallet → "Deposit TON" → sees their unique TON address
  → User sends TON to that address from their personal wallet
  → Platform's listener detects the confirmed transaction
  → Ledger event created automatically
  → User's TON (or converted REAL) balance updates
```

**Address generation:**
- Platform generates one TON HD wallet at bootstrap
- Per-user deposit addresses are derived from the HD wallet using BIP-44 derivation paths
- Example path: `m/44'/607'/0'/0/{user_index}` (607 is TON's coin type)
- Addresses stored in `deposit_addresses` table (from `database-review.md`)

**Confirmation threshold:** 1 confirmation is sufficient for TON (finality is fast). However, only credit the user's ledger after 3 confirmations to handle reorgs.

**On-chain listener requirements (v2 service):**
- Polls the TON blockchain for transactions to any platform deposit address
- Matches `to_address` against `deposit_addresses.address`
- Creates `ledger_transaction` (type: `blockchain_deposit`) with `chain_tx_hash`
- Must be idempotent: same `chain_tx_hash` must never credit twice

### 3.3 TON Withdrawal Architecture

**v2 model:** Admin-approved, platform manually sends TON from hot wallet.

```
User submits withdrawal:
  → transactions row created (status: pending)
  → Admin approves in admin panel
  → Ledger entries written (debit user TON, credit withdrawals-pending)
  → Platform sends TON on-chain
  → chain_tx_hash recorded on ledger_transaction
  → Status: completed
```

**v3 model (automated):** Platform's hot wallet signs and broadcasts automatically after KYC checks pass.

### 3.4 TON Fee Model

| Direction | Fee Type | Suggested v2 Rate |
|---|---|---|
| Deposit | None (or flat) | 0 (cover network costs from spread) |
| Withdrawal | Flat network fee pass-through + platform fee | 0.1 TON network + 0.5% platform |
| Conversion TON→REAL | Percent spread | 1.5–2% |

---

## 4. USDT Integration (Phase 2 Architecture)

### 4.1 TRC-20 vs ERC-20 Decision

**Recommendation: TRC-20 (Tron network) for v2.**

| Factor | TRC-20 (Tron) | ERC-20 (Ethereum) |
|---|---|---|
| Network fee | ~$0.001–0.10 | $2–$50+ (gas-dependent) |
| Adoption in MENA/Iran | Very high | Moderate |
| Nobitex/Wallex support | Primary (TRC-20) | Secondary |
| Transaction speed | ~3 seconds | ~15 seconds (variable) |
| Centralization risk | Higher (Tron is more centralized) | Lower |
| Developer tooling | Good | Excellent |
| Compliance concerns | Lower complexity | Higher complexity (mixed with DeFi) |

**Why TRC-20:** The target users (Persian diaspora, Nobitex/Wallex users) are accustomed to TRC-20 USDT. Iranian exchanges handle TRC-20 as the primary USDT channel. ERC-20 gas fees make small deposits economically unviable. Add ERC-20 support in v3 if demand emerges.

**Network code:** Store as `asset_code = 'USDT'`, `chain_network = 'trc20'` on the ledger_transaction. If ERC-20 is added later, it's `asset_code = 'USDT'`, `chain_network = 'erc20'`.

### 4.2 USDT Deposit Address Generation

Same model as TON. Platform-controlled HD wallet on the Tron network.

- BIP-44 path for Tron: `m/44'/195'/0'/0/{user_index}` (195 = TRC coin type)
- Address stored in `deposit_addresses` (network = 'trc20')

**Security note:** The Tron HD wallet and the TON HD wallet must use different seed phrases. Do not share a seed phrase between chains.

### 4.3 USDT Confirmation Threshold

TRC-20 transactions: require **19 confirmations** (~60 seconds) before crediting. This is the threshold used by major exchanges (Binance, Wallex) and is the practical industry standard for TRC-20 USDT.

### 4.4 USDT Fee Model

| Direction | Fee Type | Suggested v2 Rate |
|---|---|---|
| Deposit | None | 0 (absorb small TRC-20 fee in spread) |
| Withdrawal | Flat (TRC-20 fee pass-through + platform) | 1 USDT network fee + 1 USDT platform |
| Conversion USDT→REAL | Percent spread | 1.5–2% |

---

## 5. Fiat Asset Handling (EUR, NOK)

### 5.1 v1: Manual Bank Transfer

In v1, fiat deposits are manual:
1. User submits deposit request, provides proof of bank transfer (reference number or screenshot)
2. Admin verifies bank statement, approves
3. Admin enters the REAL equivalent (at current rate)
4. Ledger entries written

Fiat is not stored as an asset in the ledger in v1. The ledger stores the converted REAL value. The EUR/NOK amount is metadata on the `transactions` record.

### 5.2 v2: SEPA Integration (EUR/NOK)

In v2, EUR and NOK become first-class assets in the ledger:
- Platform opens a business bank account with a bank that supports SEPA Instant
- Users see a dedicated IBAN + reference code for their deposit
- Bank receives transfer, webhook notifies platform, ledger credited

**Account model:**
```
platform:bank:EUR   (asset account — EUR held in platform's bank)
platform:bank:NOK   (asset account — NOK held in platform's bank)
user:{id}:EUR       (liability account — EUR owed to user, before conversion)
```

### 5.3 EUR/NOK Precision

| Asset | Precision | Stored as |
|---|---|---|
| EUR | 2 decimal places | NUMERIC(28, 8) — extra precision stored, displayed as 2 decimal |
| NOK | 2 decimal places | NUMERIC(28, 8) |
| TRY | 2 decimal places | NUMERIC(28, 8) |

**Rule:** Always store 8 decimal places in the ledger regardless of the asset's native precision. Display layer rounds for presentation.

---

## 6. Exchange Rate Model

### 6.1 Rate Storage

From `database-review.md`, the `exchange_rates` table stores:
- `from_asset`: e.g., `USDT`
- `to_asset`: e.g., `REAL`
- `rate`: e.g., `50.00000000` (1 USDT = 50 REAL)
- `valid_from`, `valid_until`: time-bounded validity

**Bidirectional rates:** Store both directions explicitly.
- `USDT → REAL: 50.00` (platform sells REAL to user)
- `REAL → USDT: 49.00` (platform buys REAL from user)

The spread between these two rates is the platform's conversion revenue. At 50 vs 49, the spread is ~2%.

### 6.2 Rate Application

When a user initiates a conversion:
1. Fetch current active rate from `exchange_rates`
2. Calculate gross amount, fee amount, net amount
3. Store the rate used in `ledger_transaction.note` (or a dedicated `rate_applied` field)
4. Write ledger entries using the net and fee amounts

**Never apply a rate that is not stored in the database.** Hardcoded rates in application code will cause auditing failures.

### 6.3 v1 Rate Management

In v1, an admin manually updates the REAL/USDT rate in the admin settings panel. The update creates a new `exchange_rates` row with `valid_from = NOW()` and sets the previous row's `valid_until = NOW()`.

The rate update itself is logged in `activity_logs` with `action = 'exchange_rate.update'`.

---

## 7. Decimal Precision and Rounding Rules

### 7.1 Storage Precision

All monetary amounts stored as `NUMERIC(28, 8)` in PostgreSQL.
- 28 significant digits: sufficient for any realistic asset value
- 8 decimal places: compatible with BTC/TON/USDT/REAL precision

### 7.2 Display Precision

| Asset | Display Precision | Example |
|---|---|---|
| REAL | 2 decimal places | 1,250.00 REAL |
| USDT | 2 decimal places | 25.50 USDT |
| TON | 4 decimal places | 2.5000 TON |
| EUR | 2 decimal places | 50.00 EUR |
| NOK | 2 decimal places | 550.00 NOK |

Display rounding is always **floor** (not round), i.e., truncate at the display precision. Never show a user more balance than they actually have due to rounding up.

### 7.3 Fee Calculation Rounding

Fees are always rounded **up** (ceiling) to the platform's benefit. A 1.5% fee on 99.99 REAL = 1.4999 → display as 1.50, store as 1.50000000.

**Implementation:** Use Postgres `NUMERIC` arithmetic exclusively. Do not convert to JavaScript `number` (IEEE 754 float) for fee calculations. Use the `decimal.js` or `big.js` library if JavaScript arithmetic is required.

---

## 8. Asset-Specific Admin Controls

For each active asset, the admin panel's Settings page should expose:

| Control | Description |
|---|---|
| Is active | Enable/disable deposits and withdrawals for this asset |
| Deposit min/max | Minimum and maximum deposit per transaction |
| Withdrawal min/max | Minimum and maximum withdrawal per transaction |
| Daily deposit limit | Per-user daily deposit cap (per KYC tier) |
| Daily withdrawal limit | Per-user daily withdrawal cap (per KYC tier) |
| Deposit fee | Fee for deposits (flat or percent, or 0) |
| Withdrawal fee | Fee for withdrawals |
| Conversion rate (manual) | If manual rate: current REAL exchange rate |
| Confirmation threshold | For blockchain assets: number of confirmations required |
| Network fee buffer | Extra buffer above network fee to absorb volatility |

All of these are stored in `fee_tiers` and `settings` tables — no hardcoded values in application code.
