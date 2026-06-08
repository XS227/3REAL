import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImbalancedTx = {
  id: string;
  type: string;
  createdAt: Date;
  sumAmount: number;
  entryCount: number;
};

export type LedgerIntegrityResult = {
  status: "PASS" | "FAIL";
  totalTransactionsChecked: number;
  imbalancedCount: number;
  totalImbalanceAmount: number;
  imbalancedTransactions: ImbalancedTx[];
};

export type AccountBalanceRow = {
  ownerType: string;
  ownerId: string;
  assetCode: string;
  balance: number;
  accountType: string;
  label: string | null;
};

export type ReconciliationSummary = {
  integrity: LedgerIntegrityResult;
  userBalances: AccountBalanceRow[];
  platformBalances: AccountBalanceRow[];
  grandTotalByAsset: Record<string, number>;
};

// ── Integrity check ───────────────────────────────────────────────────────────

type ImbalanceRow = {
  id: string;
  type: string;
  createdAt: Date;
  sumAmount: string;
  entryCount: bigint;
};

export async function runLedgerIntegrityCheck(): Promise<LedgerIntegrityResult> {
  const rows = await prisma.$queryRaw<ImbalanceRow[]>`
    SELECT
      lt.id,
      lt.type::text,
      lt."createdAt",
      SUM(le.amount)::text AS "sumAmount",
      COUNT(le.id) AS "entryCount"
    FROM ledger_transactions lt
    JOIN ledger_entries le ON le."ledgerTransactionId" = lt.id
    WHERE lt.status = 'completed'
    GROUP BY lt.id, lt.type, lt."createdAt"
    HAVING ABS(SUM(le.amount)) > 0.000001
    ORDER BY ABS(SUM(le.amount)) DESC
  `;

  const totalChecked = await prisma.ledgerTransaction.count({
    where: { status: "completed" },
  });

  const imbalancedTxs: ImbalancedTx[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.createdAt,
    sumAmount: Number(r.sumAmount),
    entryCount: Number(r.entryCount),
  }));

  const totalImbalance = imbalancedTxs.reduce(
    (acc, r) => acc + Math.abs(r.sumAmount),
    0,
  );

  return {
    status: rows.length === 0 ? "PASS" : "FAIL",
    totalTransactionsChecked: totalChecked,
    imbalancedCount: rows.length,
    totalImbalanceAmount: totalImbalance,
    imbalancedTransactions: imbalancedTxs,
  };
}

// ── Balance summary ───────────────────────────────────────────────────────────

type BalanceRow = {
  ownerType: string;
  ownerId: string;
  assetCode: string;
  balance: string;
  accountType: string;
  label: string | null;
};

export async function getAccountBalances(): Promise<{
  userBalances: AccountBalanceRow[];
  platformBalances: AccountBalanceRow[];
  grandTotalByAsset: Record<string, number>;
}> {
  const rows = await prisma.$queryRaw<BalanceRow[]>`
    SELECT
      a."ownerType"::text,
      a."ownerId",
      a."assetCode"::text AS "assetCode",
      a."accountType"::text AS "accountType",
      a.label,
      COALESCE(SUM(le.amount) FILTER (WHERE lt.status = 'completed'), 0)::text AS balance
    FROM accounts a
    LEFT JOIN ledger_entries le ON le."accountId" = a.id
    LEFT JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
    GROUP BY a.id, a."ownerType", a."ownerId", a."assetCode", a."accountType", a.label
    ORDER BY a."ownerType", a."ownerId", a."assetCode"
  `;

  const toRow = (r: BalanceRow): AccountBalanceRow => ({
    ownerType: r.ownerType,
    ownerId: r.ownerId,
    assetCode: r.assetCode,
    balance: Number(r.balance),
    accountType: r.accountType,
    label: r.label,
  });

  const userBalances = rows.filter((r) => r.ownerType === "user").map(toRow);
  const platformBalances = rows.filter((r) => r.ownerType === "platform").map(toRow);

  // Aggregate grand totals per asset across ALL accounts (should sum near zero for closed system)
  const grandTotalByAsset: Record<string, number> = {};
  for (const r of rows) {
    const key = r.assetCode;
    grandTotalByAsset[key] = (grandTotalByAsset[key] ?? 0) + Number(r.balance);
  }

  return { userBalances, platformBalances, grandTotalByAsset };
}
