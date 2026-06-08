# REAL Deposit Detection

Phase 15 — on-demand detection and automatic crediting of REAL Jetton deposits.

## Architecture

Users send REAL Jetton from a verified linked TON wallet to the platform deposit address. When the user clicks "Check for Deposit", the system:

1. Fetches REAL Jetton transfer history for the platform deposit address from TonAPI
2. Filters for incoming transfers from any of the user's linked wallets
3. Cross-checks each transfer's Jetton address against the configured master (whitelist)
4. Skips any transfer already credited (idempotency via `LedgerTransaction.chainTxHash`)
5. Credits qualifying transfers atomically (Transaction + LedgerTransaction + 2 LedgerEntries)
6. Sends a notification to the user

The system is **pull-based** (user-triggered). No background daemon or cron job required for beta.

## Security Guarantees

| Threat | Mitigation |
|---|---|
| Double credit | `LedgerTransaction.chainTxHash @unique` — database-level idempotency |
| Fake Jetton | `getJettonActivity` cross-checks jetton address against whitelisted master |
| Wrong sender | Sender hash must match a linked/verified wallet belonging to the user |
| Race condition | Unique constraint violation caught — treated as already-credited, no crash |
| Below minimum | Transfers under 1 REAL (1_000_000_000 nano) filtered out |
| Sum-to-zero | Double-entry: DR float account, CR user account — always balanced |
| Unauthorized check | `requireAuth()` on POST endpoint — only the wallet owner can trigger a check |

## Ledger Entries (Double-Entry)

```
Debit:  platform.float.REAL   -amount   (funds received on-chain)
Credit: user.{userId}.REAL    +amount   (what we owe the user)
```

`LedgerTransaction.type = blockchain_deposit`  
`LedgerTransaction.chainNetwork = ton`

## Files

| File | Purpose |
|---|---|
| `lib/ton/address.ts` | `toRawHash()` — shared address normalisation |
| `lib/ton/deposits.ts` | Detection + credit service, deposit history queries |
| `lib/ton/settings.ts` | Extended with `ton.deposit_address` |
| `app/api/ton/deposits/check/route.ts` | `POST /api/ton/deposits/check` — user-triggered scan |
| `app/api/ton/deposits/route.ts` | `GET /api/ton/deposits` — user deposit history |
| `app/api/admin/ton-deposits/route.ts` | `GET /api/admin/ton-deposits` — admin view |
| `app/admin/ton-deposits/page.tsx` | Admin deposits table |
| `components/ton/RealDepositSection.tsx` | Deposit page UI (address, check button, history) |
| `app/dashboard/deposit/page.tsx` | Updated to show blockchain flow for REAL |
| `components/ton/TonSettingsForm.tsx` | Updated with `ton.deposit_address` field |

## Configuration

Set `ton.deposit_address` in **Admin → TON Settings** before accepting REAL deposits.

The deposit address is the platform's on-chain TON address where users send REAL. For Phase 16 (withdrawals), this same address will be the hot wallet that signs outgoing transactions.

## API Reference

### `POST /api/ton/deposits/check`

Authenticated. Scans the deposit address for new REAL transfers from the user's linked wallets. Credits any unclaimed transfers.

**Response:**
```json
{
  "credited": [
    {
      "eventId": "abc123...",
      "amount": 100.0,
      "fromAddress": "0:deadbeef...",
      "txId": "uuid"
    }
  ],
  "skipped": 0,
  "found": 1
}
```

**Error responses:**
| Status | Error | Meaning |
|---|---|---|
| 400 | `no_linked_wallets` | User has no verified TON wallets |
| 502 | `tonapi_error` | TonAPI unreachable |
| 503 | `deposit_address_not_configured` | Admin hasn't set `ton.deposit_address` |
| 500 | `missing_float_account` | Platform REAL float account missing from ledger |

### `GET /api/ton/deposits`

Authenticated. Returns user's credited REAL deposits.

### `GET /api/admin/ton-deposits?page=1`

Admin only. All REAL deposits across all users, paginated.

## Known Limitations

- **Pull-based only** — user must click "Check for Deposit". No automatic background polling.
- **Limit 50 events** — checks last 50 REAL transfers to the deposit address. Large-volume platforms should increase this limit or add cursor-based pagination (Phase 16+).
- **No deposit address per user** — all users share one platform deposit address. Sender verification via linked wallet ensures correct attribution.
- **No fee deduction** — deposits are credited at face value (feeAmount = 0). Fee logic can be added from the settings in Phase 16.
