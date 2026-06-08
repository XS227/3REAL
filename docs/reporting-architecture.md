# Reporting Architecture — Phase 10

**Date:** 2026-06-08  
**Scope:** Reports, Analytics, Reconciliation, CSV Exports

---

## 1. Overview

Phase 10 adds three admin pages for operational visibility:

| Page | Path | Purpose |
|------|------|---------|
| Reports | `/admin/reports` | Filterable metric snapshot with CSV exports |
| Analytics | `/admin/analytics` | 30-day trend charts + top performer lists |
| Reconciliation | `/admin/reconciliation` | Ledger integrity verification + balance audit |

All three pages are **server components** with `force-dynamic`, meaning data is fetched fresh on every request directly from PostgreSQL via Prisma. No caching layer — operational data must always be real-time.

---

## 2. Reports

### Data Layer: `lib/admin/reports.ts`

**`parseDateRange(range, customFrom?, customTo?)`**  
Converts a range preset string into an absolute `{ from: Date, to: Date, label: string }` tuple.

| Preset | Window |
|--------|--------|
| `today` | Midnight today → 23:59:59 today |
| `7d` | NOW() − 7 days → NOW() |
| `30d` | NOW() − 30 days → NOW() (default) |
| `custom` | `from` and `to` URL params, parsed as ISO date strings |

**`getReportMetrics(dateRange)`**  
Executes 10 parallel queries (via `Promise.all`) and returns a `ReportMetrics` object:

| Metric | Source | Notes |
|--------|--------|-------|
| `totalUsers` | `users` COUNT | All-time, not filtered |
| `verifiedUsers` | `users` WHERE `emailVerified` | All-time |
| `newUsersInRange` | `users` WHERE `createdAt` in range | |
| `pendingKyc` | `kyc_profiles` WHERE status IN (pending, under_review) | Live queue |
| `approvedKycInRange` | `kyc_profiles` WHERE `reviewedAt` in range | |
| `totalDeposits` / `depositVolumeInRange` | `transactions` agg | Completed deposits only |
| `totalWithdrawals` / `withdrawalVolumeInRange` | `transactions` agg | Approved withdrawals only |
| `totalReferralRewardsInRange` | `referrals` WHERE status=rewarded | |
| `realIssuedInRange` | `ledger_entries` JOIN `ledger_transactions` | Only user credit side (positive entries) of referral_reward txs |
| `realRemainingInPool` | `ledger_entries` SUM for platform/rewards-pool | Current pool balance |

### Date Filter UX

`ReportsDateFilter` is a **client component** that reads and writes URL search params without a full page reload (Next.js App Router `router.push`). The server page re-renders with fresh data on each navigation.

---

## 3. Analytics

### Data Layer: `lib/admin/analytics.ts`

**`getAnalyticsData()`**  
Executes 8 queries in parallel. Returns 30-day daily time-series plus three top lists.

#### Time-Series Queries (30 days)

All time-series queries use PostgreSQL's `generate_series` to produce a row for every day in the window, even if no data exists for that day. This ensures chart continuity — no gaps.

```sql
SELECT
  to_char(gs.d::date, 'YYYY-MM-DD') AS date,
  COUNT(u.id) AS count
FROM generate_series(
  NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
) AS gs(d)
LEFT JOIN users u ON u."createdAt"::date = gs.d::date
GROUP BY gs.d::date
ORDER BY gs.d::date
```

| Series | Table | Filter |
|--------|-------|--------|
| User growth | `users` | `createdAt::date` |
| KYC approvals | `kyc_profiles` | `reviewedAt::date` WHERE status=approved |
| Deposit volume | `transactions` | `updatedAt::date` WHERE type=deposit, status=completed; SUM(amount) |
| Withdrawal volume | `transactions` | `updatedAt::date` WHERE type=withdrawal, status=approved; SUM(amount) |
| Referral activity | `referrals` | `createdAt::date` WHERE status=rewarded |

#### Top Lists

| List | Query | Limit |
|------|-------|-------|
| Top referrers | GROUP BY referrerId, ORDER BY COUNT DESC | 10 |
| Most active users | activity_logs JOIN users, last 30 days, ORDER BY COUNT DESC | 10 |
| Largest deposits | transactions WHERE type=deposit, status=completed, ORDER BY amount DESC | 10 |

### Chart Component

`AnalyticsCharts` is a **client component** using recharts 3.x:

- **User growth**: `AreaChart` with amber gradient fill
- **KYC approvals**: `BarChart` with emerald bars
- **Deposit volume**: `BarChart` with blue bars
- **Withdrawal volume**: `BarChart` with purple bars
- **Referral activity**: `AreaChart` with orange gradient fill

All charts share a consistent dark theme: `#18181b` tooltip background, `#27272a` grid lines, `#52525b` axis labels. The server page passes chart data as props — no client-side fetching.

---

## 4. CSV Exports

### Route: `app/api/admin/exports/route.ts`

**Auth:** Requires valid session cookie with role `super_admin` or `operator`. No JWT bearer — uses the same cookie auth as all other admin endpoints.

**Usage:** `GET /api/admin/exports?type={type}`

| Type | Table(s) | Limit |
|------|----------|-------|
| `users` | `users` | All |
| `deposits` | `transactions` WHERE type=deposit | All |
| `withdrawals` | `transactions` WHERE type=withdrawal | All |
| `referrals` | `referrals` JOIN users (referrer + referred) | All |
| `ledger` | `ledger_entries` JOIN ledger_transactions + accounts | 10,000 |

All exports return `Content-Type: text/csv; charset=utf-8` with a `Content-Disposition: attachment` header. Fields containing commas, quotes, or newlines are RFC 4180 quoted.

The `ExportButton` client component triggers a programmatic `<a>` element click rather than a fetch, so the browser's native file download dialog handles the file.

---

## 5. Data Flow

```
Browser
  ↓  URL params (?range=7d)
Next.js Server Component (page.tsx)
  ↓  parseDateRange() → { from, to }
  ↓  getReportMetrics() → 10× Prisma queries (parallel)
  ↓  render JSX with metric data
Browser renders
  ↓  user changes filter (ReportsDateFilter client component)
  ↓  router.push with new ?range=
Next.js re-renders server component with new params
```

---

## 6. Performance Notes

- All 10 report metrics, 8 analytics queries, and the reconciliation integrity check run in parallel via `Promise.all`
- `generate_series` queries return exactly 30 rows — minimal data over the wire, no client-side date aggregation
- Ledger export is capped at 10,000 entries to prevent memory exhaustion on large datasets
- The `grandTotalByAsset` computation in reconciliation iterates all account rows in JS (not SQL), which is acceptable since the number of accounts is O(users × assets) and bounded by the account table size
