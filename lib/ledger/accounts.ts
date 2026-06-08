import type { Prisma } from "@/lib/generated/prisma/client";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient | typeof prisma;

export async function getOrCreateUserAccount(
  client: TxClient,
  userId: string,
  assetCode: AssetCode,
  ecosystemId: string,
) {
  return client.account.upsert({
    where: {
      ecosystemId_ownerType_ownerId_assetCode: {
        ecosystemId,
        ownerType: "user",
        ownerId: userId,
        assetCode,
      },
    },
    update: {},
    create: {
      ecosystemId,
      ownerType: "user",
      ownerId: userId,
      accountType: "liability",
      assetCode,
      label: `User ${assetCode} account`,
    },
  });
}

export type UserAccountSummary = {
  id: string;
  assetCode: AssetCode;
  accountType: string;
  label: string | null;
  isActive: boolean;
  createdAt: Date;
  entryCount: number;
};

export async function getUserAccounts(userId: string): Promise<UserAccountSummary[]> {
  const rows = await prisma.account.findMany({
    where: { ownerType: "user", ownerId: userId },
    select: {
      id: true,
      assetCode: true,
      accountType: true,
      label: true,
      isActive: true,
      createdAt: true,
      _count: { select: { ledgerEntries: true } },
    },
    orderBy: { assetCode: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    assetCode: r.assetCode as AssetCode,
    accountType: r.accountType,
    label: r.label,
    isActive: r.isActive,
    createdAt: r.createdAt,
    entryCount: r._count.ledgerEntries,
  }));
}
