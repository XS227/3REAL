import { prisma } from "@/lib/prisma";

export type TransactionDetail = {
  id: string;
  type: "deposit" | "withdrawal";
  assetCode: string;
  amount: string;
  feeAmount: string;
  netAmount: string | null;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  proofFilePath: string | null;
  adminNote: string | null;
  chainTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  ledgerTx: {
    id: string;
    type: string;
    status: string;
    createdAt: Date;
    chainTxHash: string | null;
    chainNetwork: string | null;
    approvedById: string | null;
    entries: Array<{
      id: string;
      amount: number;
      assetCode: string;
      accountLabel: string | null;
      accountOwnerType: string;
      accountOwnerId: string;
    }>;
  } | null;
};

export async function getTransactionDetail(
  id: string,
  userId: string,
): Promise<TransactionDetail | null> {
  const tx = await prisma.transaction.findUnique({
    where: { id, userId },
    include: {
      ledgerTx: {
        include: {
          entries: {
            include: {
              account: {
                select: { label: true, ownerType: true, ownerId: true },
              },
            },
            orderBy: { amount: "desc" },
          },
        },
      },
    },
  });

  if (!tx) return null;

  return {
    id: tx.id,
    type: tx.type as "deposit" | "withdrawal",
    assetCode: tx.assetCode as string,
    amount: tx.amount.toString(),
    feeAmount: tx.feeAmount.toString(),
    netAmount: tx.netAmount?.toString() ?? null,
    status: tx.status as string,
    paymentMethod: tx.paymentMethod ?? null,
    paymentRef: tx.paymentRef ?? null,
    proofFilePath: tx.proofFilePath ?? null,
    adminNote: tx.adminNote ?? null,
    chainTxHash: tx.chainTxHash ?? null,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    ledgerTx: tx.ledgerTx
      ? {
          id: tx.ledgerTx.id,
          type: tx.ledgerTx.type,
          status: tx.ledgerTx.status,
          createdAt: tx.ledgerTx.createdAt,
          chainTxHash: tx.ledgerTx.chainTxHash ?? null,
          chainNetwork: tx.ledgerTx.chainNetwork ?? null,
          approvedById: tx.ledgerTx.approvedById ?? null,
          entries: tx.ledgerTx.entries.map((e) => ({
            id: e.id,
            amount: Number(e.amount),
            assetCode: e.assetCode as string,
            accountLabel: e.account.label,
            accountOwnerType: e.account.ownerType as string,
            accountOwnerId: e.account.ownerId,
          })),
        }
      : null,
  };
}
