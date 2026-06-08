import { prisma } from "@/lib/prisma";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export type WithdrawalRow = {
  id: string;
  assetCode: string;
  amount: string;
  status: string;
  destination: string | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getWithdrawalHistory(
  userId: string,
  limit = 50,
): Promise<WithdrawalRow[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: "withdrawal" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      assetCode: true,
      amount: true,
      status: true,
      paymentRef: true,
      adminNote: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    assetCode: r.assetCode as AssetCode,
    amount: r.amount.toString(),
    status: r.status,
    destination: r.paymentRef,
    adminNote: r.adminNote,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
