import { prisma } from "@/lib/prisma";

export type AdminLedgerEntry = {
  id: string;
  amount: number;
  assetCode: string;
  createdAt: Date;
  accountName: string | null;
  tx: {
    id: string;
    type: string;
    status: string;
    note: string | null;
    chainTxHash: string | null;
    referenceType: string | null;
    referenceId: string | null;
    createdAt: Date;
  };
};

const PAGE_SIZE = 30;

export async function getAdminUserLedger(
  userId: string,
  assetCode?: string,
  page = 1,
): Promise<{ entries: AdminLedgerEntry[]; total: number; pages: number }> {
  const where = {
    account: {
      ownerType: "user" as const,
      ownerId: userId,
      ...(assetCode ? { assetCode: assetCode as never } : {}),
    },
  };

  const [rows, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      include: {
        account: { select: { label: true } },
        ledgerTransaction: {
          select: {
            id: true,
            type: true,
            status: true,
            note: true,
            chainTxHash: true,
            referenceType: true,
            referenceId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      assetCode: r.assetCode as string,
      createdAt: r.createdAt,
      accountName: r.account.label,
      tx: {
        id: r.ledgerTransaction.id,
        type: r.ledgerTransaction.type,
        status: r.ledgerTransaction.status,
        note: r.ledgerTransaction.note,
        chainTxHash: r.ledgerTransaction.chainTxHash,
        referenceType: r.ledgerTransaction.referenceType,
        referenceId: r.ledgerTransaction.referenceId,
        createdAt: r.ledgerTransaction.createdAt,
      },
    })),
    total,
    pages: Math.ceil(total / PAGE_SIZE),
  };
}
