import { prisma } from "@/lib/prisma";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { getUserBalances } from "@/lib/ledger/balance";
import { getUserAccounts, type UserAccountSummary } from "@/lib/ledger/accounts";

export type LedgerHistoryEntry = {
  id: string;
  amount: number;
  assetCode: AssetCode;
  createdAt: Date;
  tx: {
    id: string;
    type: string;
    status: string;
    note: string | null;
    chainTxHash: string | null;
    chainNetwork: string | null;
    createdAt: Date;
  };
};

export async function getLedgerHistory(
  userId: string,
  assetCode?: AssetCode,
  limit = 50,
): Promise<LedgerHistoryEntry[]> {
  const rows = await prisma.ledgerEntry.findMany({
    where: {
      assetCode: assetCode ?? undefined,
      account: {
        ownerType: "user",
        ownerId: userId,
      },
    },
    include: {
      ledgerTransaction: {
        select: {
          id: true,
          type: true,
          status: true,
          note: true,
          chainTxHash: true,
          chainNetwork: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    assetCode: r.assetCode as AssetCode,
    createdAt: r.createdAt,
    tx: {
      id: r.ledgerTransaction.id,
      type: r.ledgerTransaction.type,
      status: r.ledgerTransaction.status,
      note: r.ledgerTransaction.note,
      chainTxHash: r.ledgerTransaction.chainTxHash,
      chainNetwork: r.ledgerTransaction.chainNetwork,
      createdAt: r.ledgerTransaction.createdAt,
    },
  }));
}

export type WalletPageData = {
  balances: Awaited<ReturnType<typeof getUserBalances>>;
  accounts: UserAccountSummary[];
};

export async function getWalletPageData(userId: string): Promise<WalletPageData> {
  const [balances, accounts] = await Promise.all([
    getUserBalances(userId),
    getUserAccounts(userId),
  ]);
  return { balances, accounts };
}

export type AssetDetailData = {
  balance: Awaited<ReturnType<typeof getUserBalances>>[AssetCode];
  ledgerHistory: LedgerHistoryEntry[];
  account: UserAccountSummary | null;
};

export async function getAssetDetailData(
  userId: string,
  assetCode: AssetCode,
): Promise<AssetDetailData> {
  const [balances, ledgerHistory, accounts] = await Promise.all([
    getUserBalances(userId),
    getLedgerHistory(userId, assetCode),
    getUserAccounts(userId),
  ]);

  const account = accounts.find((a) => a.assetCode === assetCode) ?? null;

  return {
    balance: balances[assetCode],
    ledgerHistory,
    account,
  };
}
