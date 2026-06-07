# 3REAL — Business Model

**Last Updated:** 2026-06-07  
**Status:** Draft — Awaiting Approval  
**Owner:** SETAEI

---

## 1. Executive Summary

3REAL is the user-facing portal for the SETAEI digital asset ecosystem. It is not a crypto exchange. It is a **digital asset management portal** where users hold, earn, and transact in REAL — the native accounting unit of the SETAEI ecosystem.

The platform is designed to grow from a single-product MVP into a multi-product financial infrastructure layer shared across:

| Product | Purpose |
|---|---|
| **3REAL** | Digital asset portal — REAL token balances, KYC, referrals |
| **Shahnameh** | Culture/content platform — NFT or digital collectibles powered by REAL |
| **TrustAI** | AI services marketplace — REAL-denominated compute credits |
| **SETAEI Pay** | Payment gateway — cross-border payments in REAL, USDT, EUR, NOK, TRY |

All products share a single ledger. REAL is the internal unit of account.

---

## 2. REAL Token — Role and Positioning

- **Native accounting currency** for the entire SETAEI ecosystem
- All internal balances are stored in REAL
- All cross-product transfers are denominated in REAL
- External assets (TON, USDT, EUR, NOK, TRY) are represented as **asset accounts** in the ledger
- Exchange rates between REAL and external assets are managed at the application layer

REAL is not a cryptocurrency in v1. It is an **internal ledger unit** backed by trust and utility within the SETAEI ecosystem. Blockchain backing is planned for v2/v3.

---

## 3. Revenue Model

### 3.1 Deposit / Withdrawal Fees
- Flat or percentage fee on fiat deposits (EUR, NOK)
- Flat or percentage fee on crypto deposits (USDT, TON)
- Withdrawal fees cover network costs + platform margin

### 3.2 Spread on Conversion
- When users convert external assets to REAL, a spread is applied
- Spread revenue captured as a fee entry in the ledger (credited to a platform fee account)

### 3.3 Referral-Driven Growth
- Users earn REAL rewards for referring new users
- Referral rewards funded from a platform rewards pool account in the ledger
- Incentivizes organic growth at low CAC

### 3.4 Future Revenue Streams
- **SETAEI Pay:** Payment processing fees (merchant integration)
- **TrustAI:** Compute credit sales denominated in REAL
- **Shahnameh:** NFT marketplace royalties and listing fees in REAL

---

## 4. User Journey

```
Discovery → Registration → KYC → Deposit → Earn/Use REAL → Withdraw
```

### 4.1 Discovery
- Referral links (organic viral growth)
- SEO landing page (3real.no)
- SETAEI ecosystem cross-promotion

### 4.2 Registration
- Email + password
- Referral code attribution at signup
- Email verification required

### 4.3 KYC
- Tier 0: No KYC — view balance only, no deposits/withdrawals
- Tier 1: Email verified — small deposit limits
- Tier 2: ID + selfie — standard limits
- Tier 3: ID + selfie + address proof — full limits

### 4.4 First Value Moment
- Referral reward credited on first successful sign-up
- Welcome bonus (optional — from platform rewards pool)
- Balance visible immediately

### 4.5 Core Loop
```
Earn REAL (referrals, rewards, deposits)
  → Use REAL (Shahnameh, TrustAI, payments)
    → Grow REAL balance
      → Refer others
```

---

## 5. Ecosystem Flywheel

```
More Users → More Referral Activity → More REAL in Circulation
     ↑                                         ↓
More Products ← More Developer Interest ← More Ecosystem Value
```

The ledger architecture is the **backbone** that makes this flywheel work. Every product plugs into the same accounts/ledger_entries/ledger_transactions system. REAL flows freely between products without technical fragmentation.

---

## 6. Target Markets

| Market | Priority | Entry Product |
|---|---|---|
| Persian diaspora (Europe, North America) | Primary | 3REAL |
| Norwegian users (3real.no domain) | Secondary | 3REAL / SETAEI Pay |
| Iranian domestic (if regulation permits) | Future | 3REAL |
| Global REAL token holders | Future | All products |

---

## 7. Competitive Positioning

3REAL is **not competing** with Binance, Kraken, or Coinbase. The competitive frame is:

- **vs. Nobitex/Wallex/Ramzinex:** Better UX, multi-language, diaspora-first
- **vs. Revolut/Wise:** REAL-native, crypto-capable, ecosystem-linked
- **vs. PayPal:** Open, non-custodial path, programmable REAL

The key differentiator is the **SETAEI ecosystem lock-in**: REAL earned in 3REAL is spendable in Shahnameh, TrustAI, and SETAEI Pay. No other product offers this.

---

## 8. Key Constraints

1. No blockchain in v1 — all balances are internal ledger entries
2. No spot trading in v1 — this is not an exchange
3. All financial operations go through the ledger — no balance columns on user accounts
4. Regulatory compliance required before operating in any jurisdiction
5. KYC is a prerequisite for financial activity (not for browsing)
