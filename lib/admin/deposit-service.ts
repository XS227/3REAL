import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getOrCreateUserAccount } from "@/lib/ledger/accounts";
import type { AssetCode } from "@/lib/generated/prisma/enums";

// ── approveDeposit ────────────────────────────────────────────────────────────
// Settles the deposit in the ledger and credits the user account.
// Idempotent: throws ALREADY_SETTLED if ledgerTxId is already set.

export async function approveDeposit(txId: string, adminId: string): Promise<void> {
  let userId: string;
  let assetCode: AssetCode;
  let amount: number;

  await prisma.$transaction(async (tx) => {
    const deposit = await tx.transaction.findUniqueOrThrow({
      where: { id: txId },
      select: {
        id: true,
        userId: true,
        assetCode: true,
        amount: true,
        status: true,
        ledgerTxId: true,
        ecosystemId: true,
      },
    });

    if (deposit.status !== "pending" && deposit.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    // Idempotency guard — a deposit must never be credited twice
    if (deposit.ledgerTxId) {
      throw new Error("ALREADY_SETTLED");
    }

    userId = deposit.userId;
    assetCode = deposit.assetCode as AssetCode;
    amount = Number(deposit.amount);

    // Get the platform float account for this asset
    const floatAccount = await tx.account.findFirst({
      where: {
        ecosystemId: deposit.ecosystemId,
        ownerType: "platform",
        ownerId: "float",
        assetCode: deposit.assetCode,
      },
    });

    if (!floatAccount) {
      throw new Error(
        `MISSING_FLOAT_ACCOUNT: No platform float account for ${deposit.assetCode}. ` +
          "Add a seeded account before approving this asset.",
      );
    }

    // Get or create the user's account for this asset
    const userAccount = await getOrCreateUserAccount(
      tx,
      deposit.userId,
      deposit.assetCode as AssetCode,
      deposit.ecosystemId,
    );

    // Create ledger transaction + two entries (must sum to zero)
    // DR platform float (-): allocates the received funds
    // CR user account (+): records what we now owe the user
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        ecosystemId: deposit.ecosystemId,
        type: "deposit",
        status: "completed",
        referenceId: txId,
        referenceType: "deposit_request",
        initiatedById: deposit.userId,
        approvedById: adminId,
        entries: {
          createMany: {
            data: [
              {
                ecosystemId: deposit.ecosystemId,
                accountId: floatAccount.id,
                assetCode: deposit.assetCode,
                amount: `-${amount}`,
              },
              {
                ecosystemId: deposit.ecosystemId,
                accountId: userAccount.id,
                assetCode: deposit.assetCode,
                amount: `${amount}`,
              },
            ],
          },
        },
      },
    });

    await tx.transaction.update({
      where: { id: txId },
      data: { status: "completed", ledgerTxId: ledgerTx.id },
    });
  });

  await audit({
    actorId: adminId,
    targetId: userId!,
    targetType: "user",
    action: "deposit.approved",
    meta: { txId, assetCode: assetCode!, amount: amount! },
  });

  await createNotification({
    userId: userId!,
    type: "deposit_approved",
    title: "Deposit Approved",
    body: `Your deposit of ${amount!} ${assetCode!} has been approved and credited to your account.`,
    referenceId: txId,
    referenceType: "transaction",
  });
}

// ── rejectDeposit ─────────────────────────────────────────────────────────────

export async function rejectDeposit(
  txId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  let userId: string;
  let assetCode: AssetCode;
  let amount: number;

  await prisma.$transaction(async (tx) => {
    const deposit = await tx.transaction.findUniqueOrThrow({
      where: { id: txId },
      select: { id: true, userId: true, assetCode: true, amount: true, status: true },
    });

    if (deposit.status !== "pending" && deposit.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    userId = deposit.userId;
    assetCode = deposit.assetCode as AssetCode;
    amount = Number(deposit.amount);

    await tx.transaction.update({
      where: { id: txId },
      data: { status: "rejected", adminNote: reason },
    });
  });

  await audit({
    actorId: adminId,
    targetId: userId!,
    targetType: "user",
    action: "deposit.rejected",
    meta: { txId, assetCode: assetCode!, amount: amount!, reason },
  });

  await createNotification({
    userId: userId!,
    type: "deposit_rejected",
    title: "Deposit Rejected",
    body: `Your deposit of ${amount!} ${assetCode!} was rejected. Reason: ${reason}`,
    referenceId: txId,
    referenceType: "transaction",
  });
}
