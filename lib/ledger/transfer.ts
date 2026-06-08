import { prisma } from "@/lib/prisma";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { getOrCreateUserAccount } from "@/lib/ledger/accounts";

export type InternalTransferParams = {
  fromUserId: string;
  toUserId: string;
  assetCode: AssetCode;
  amount: number;
  note?: string;
  initiatedById?: string;
};

export type InternalTransferResult = {
  ledgerTransactionId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  assetCode: AssetCode;
};

async function getAvailableBalance(
  client: typeof prisma,
  accountId: string,
): Promise<number> {
  const result = await client.ledgerEntry.aggregate({
    where: {
      accountId,
      ledgerTransaction: { status: "completed" },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function createInternalTransfer(
  params: InternalTransferParams,
): Promise<InternalTransferResult> {
  const { fromUserId, toUserId, assetCode, amount, note, initiatedById } = params;

  if (fromUserId === toUserId) {
    throw new Error("SELF_TRANSFER: Cannot transfer to the same account");
  }
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT: Transfer amount must be positive");
  }

  return prisma.$transaction(async (tx) => {
    const ecosystem = await tx.ecosystem.findFirstOrThrow({
      where: { code: "three_real" },
      select: { id: true },
    });

    const [fromAccount, toAccount] = await Promise.all([
      getOrCreateUserAccount(tx, fromUserId, assetCode, ecosystem.id),
      getOrCreateUserAccount(tx, toUserId, assetCode, ecosystem.id),
    ]);

    // Balance check using the outer prisma client (reads committed state)
    const available = await getAvailableBalance(
      prisma,
      fromAccount.id,
    );

    if (available < amount) {
      throw new Error(
        `INSUFFICIENT_BALANCE: Available ${available} ${assetCode}, requested ${amount}`,
      );
    }

    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        ecosystemId: ecosystem.id,
        type: "transfer",
        status: "completed",
        initiatedById: initiatedById ?? null,
        note: note ?? null,
        entries: {
          createMany: {
            data: [
              {
                ecosystemId: ecosystem.id,
                accountId: fromAccount.id,
                assetCode,
                amount: `-${amount}`,
              },
              {
                ecosystemId: ecosystem.id,
                accountId: toAccount.id,
                assetCode,
                amount: `${amount}`,
              },
            ],
          },
        },
      },
      select: { id: true },
    });

    return {
      ledgerTransactionId: ledgerTx.id,
      debitAccountId: fromAccount.id,
      creditAccountId: toAccount.id,
      amount,
      assetCode,
    };
  });
}
