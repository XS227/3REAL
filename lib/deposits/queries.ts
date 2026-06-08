import { prisma } from "@/lib/prisma";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export type DepositRow = {
  id: string;
  assetCode: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getDepositHistory(
  userId: string,
  limit = 50,
): Promise<DepositRow[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: "deposit" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      assetCode: true,
      amount: true,
      status: true,
      paymentMethod: true,
      paymentRef: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    assetCode: r.assetCode as AssetCode,
    amount: r.amount.toString(),
    status: r.status,
    paymentMethod: r.paymentMethod,
    paymentRef: r.paymentRef,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
