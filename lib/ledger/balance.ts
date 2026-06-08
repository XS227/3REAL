import { prisma } from "@/lib/prisma";
import { AssetCode } from "@/lib/generated/prisma/enums";

export type AssetBalance = { available: number; pending: number };
export type BalanceMap = Record<AssetCode, AssetBalance>;

type BalanceRow = { asset_code: string; available: number; pending: number };

const ZERO: AssetBalance = { available: 0, pending: 0 };

function defaultMap(): BalanceMap {
  return {
    REAL: { ...ZERO },
    TON: { ...ZERO },
    USDT: { ...ZERO },
    EUR: { ...ZERO },
    NOK: { ...ZERO },
    TRY: { ...ZERO },
  };
}

export async function getUserBalances(userId: string): Promise<BalanceMap> {
  const rows = await prisma.$queryRaw<BalanceRow[]>`
    SELECT
      a."assetCode"::text AS asset_code,
      COALESCE(
        SUM(le.amount) FILTER (WHERE lt.status = 'completed'),
        0
      )::float8 AS available,
      COALESCE(
        SUM(le.amount) FILTER (WHERE lt.status IN ('pending', 'processing')),
        0
      )::float8 AS pending
    FROM ledger_entries le
    JOIN accounts a ON le."accountId" = a.id
    JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
    WHERE a."ownerType"::text = 'user'
      AND a."ownerId" = ${userId}
    GROUP BY a."assetCode"
  `;

  const map = defaultMap();
  for (const row of rows) {
    const code = row.asset_code as AssetCode;
    if (code in map) {
      map[code] = { available: Number(row.available), pending: Number(row.pending) };
    }
  }
  return map;
}

export function totalBalance(b: AssetBalance): number {
  return b.available + b.pending;
}

export function fmtAmount(amount: number, decimals = 2): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
