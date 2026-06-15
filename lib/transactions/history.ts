import { prisma } from "@/lib/prisma";

export type TxHistoryRow = {
  id: string;
  type: "deposit" | "withdrawal";
  assetCode: string;
  amount: string;
  feeAmount: string;
  status: string;
  paymentRef: string | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TxHistoryFilters = {
  type?: "deposit" | "withdrawal";
  status?: string;
  assetCode?: string;
  from?: Date;
  to?: Date;
};

const PAGE_SIZE = 25;

export async function getTransactionHistory(
  userId: string,
  filters: TxHistoryFilters = {},
  page = 1,
): Promise<{ rows: TxHistoryRow[]; total: number; pages: number }> {
  const where = {
    userId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.assetCode ? { assetCode: filters.assetCode as never } : {}),
    ...((filters.from || filters.to)
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        assetCode: true,
        amount: true,
        feeAmount: true,
        status: true,
        paymentRef: true,
        adminNote: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    rows: rows.map((r: {
      id: string;
      type: string;
      assetCode: string;
      amount: { toString(): string };
      feeAmount: { toString(): string };
      status: string;
      paymentRef: string | null;
      adminNote: string | null;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: r.id,
      type: r.type as "deposit" | "withdrawal",
      assetCode: r.assetCode,
      amount: r.amount.toString(),
      feeAmount: r.feeAmount.toString(),
      status: r.status,
      paymentRef: r.paymentRef,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total,
    pages: Math.ceil(total / PAGE_SIZE),
  };
}
