# REAL Jetton Read-Only Integration

Phase 14 — added on-chain REAL Jetton balance and activity reading for connected TON wallets.

## Overview

All data is **read-only** and **fetched on demand** — nothing is stored permanently in the database. The integration:

1. Reads TON balance and REAL Jetton balance for each connected wallet
2. Reads the last 20 REAL Jetton transfer events
3. Verifies Jetton authenticity (symbol, decimals, address match)
4. Exposes admin-editable settings for the Jetton master address and TonAPI key

## REAL Jetton

| Field | Value |
|---|---|
| Symbol | `REAL` |
| Decimals | 9 |
| Master address | `EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p` |
| Raw address | `0:e1abf0e3414309a9f5cb3fc2bc27a4a53afa27d3c5d040ad13e3dc689f67b4c5` |
| Network | mainnet |

## Files Added

| File | Purpose |
|---|---|
| `lib/ton/client.ts` | TonAPI HTTP client, `toUrlAddress()` helper |
| `lib/ton/settings.ts` | Read `ton.*` settings from DB with defaults |
| `lib/ton/jetton.ts` | Jetton verification, balance fetch, activity fetch |
| `app/api/ton/balance/route.ts` | `GET /api/ton/balance?id=<walletId>` |
| `app/api/ton/activity/route.ts` | `GET /api/ton/activity?id=<walletId>&limit=20` |
| `app/api/ton/health/route.ts` | `GET /api/ton/health` — TonAPI + Jetton reachability |
| `app/api/admin/ton-settings/route.ts` | `GET/PATCH /api/admin/ton-settings` |
| `app/admin/ton-settings/page.tsx` | Admin UI to edit TON settings |
| `components/ton/TonSettingsForm.tsx` | Settings form (client component) |
| `components/ton/TonWalletBalances.tsx` | Inline balance display on wallet dashboard |
| `app/dashboard/wallet/ton/[id]/page.tsx` | Wallet detail page with balance + activity |

## API Reference

### `GET /api/ton/balance?id=<walletId>`

Returns live on-chain balances for the specified wallet. `id` is the `ton_wallets.id` UUID — ownership is verified server-side.

```json
{
  "ton": 3.421,
  "real": 12500.0,
  "tonNano": "3421000000",
  "realNano": "12500000000000",
  "fetchedAt": "2026-06-08T12:00:00.000Z"
}
```

### `GET /api/ton/activity?id=<walletId>&limit=20`

Returns the last N REAL Jetton transfers.

```json
{
  "transfers": [
    {
      "eventId": "abc123",
      "timestamp": 1749376800,
      "direction": "in",
      "amount": 100.0,
      "amountNano": "100000000000",
      "counterparty": "EQA...",
      "comment": null
    }
  ]
}
```

### `GET /api/ton/health`

Non-authenticated. Returns TonAPI connectivity and Jetton master status.

```json
{
  "ok": true,
  "checks": { "tonapi": "ok", "jetton": "ok" },
  "jettonMaster": "EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p",
  "network": "mainnet"
}
```

### `GET /api/admin/ton-settings`

Admin only. Returns current TON settings.

### `PATCH /api/admin/ton-settings`

Admin only. Update any subset of `ton.jetton_master`, `ton.network`, `ton.api_key`.

## Security

- Balance and activity routes require authentication and verify `wallet.userId === session.userId`
- Jetton address in API responses is cross-checked against configured master to reject counterfeit tokens
- `verifyJettonMaster()` validates symbol=`REAL` and decimals=9 before trusting any Jetton data
- Nothing is cached server-side — data is always fetched fresh (no stale balance risk)
- TonAPI key is stored in DB settings, never in environment variables

## TonAPI Rate Limits

Without an API key, TonAPI free tier applies (~1 req/sec). For production with many wallets, add a TonAPI key in Admin → TON Settings. Balance fetches are triggered by user page loads, not on a schedule.

## DB Settings (global, ecosystemId = null)

| Key | Default | Description |
|---|---|---|
| `ton.jetton_master` | `EQDhq_...` | REAL Jetton master address |
| `ton.network` | `mainnet` | `mainnet` or `testnet` |
| `ton.api_key` | `""` | Optional TonAPI bearer token |

## Future Phases

- Phase 15: REAL Jetton deposits (monitor wallet, credit ledger)
- Phase 16: REAL Jetton withdrawals (sign + broadcast from platform wallet)
- Deposit address per user (deterministic from user ID + platform key)
- Webhook / polling for incoming transfers
