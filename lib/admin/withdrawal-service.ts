import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getOrCreateUserAccount, getOrCreateEscrowAccount } from "@/lib/ledger/accounts";
import type { AssetCode } from "@/lib/generated/prisma/enums";

// ── approveWithdrawal ─────────────────────────────────────────────────────────
// Moves funds from user's ledger account into the withdrawal escrow.
// Idempotent: ALREADY_SETTLED guard checked before status check.

export async function approveWithdrawal(txId: string, adminId: string): Promise<void> {
  let userId: string;
  let assetCode: AssetCode;
  let amount: number;

  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.transaction.findUniqueOrThrow({
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

    // Idempotency guard first — catches race conditions and sequential retries
    if (withdrawal.ledgerTxId) {
      throw new Error("ALREADY_SETTLED");
    }

    if (withdrawal.status !== "pending" && withdrawal.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    userId = withdrawal.userId;
    assetCode = withdrawal.assetCode as AssetCode;
    amount = Number(withdrawal.amount);

    // Authoritative balance check inside the transaction (row-level lock)
    const balanceResult = await tx.$queryRaw<[{ available: string }]>`
      SELECT COALESCE(SUM(le.amount), 0)::text AS available
      FROM ledger_entries le
      JOIN accounts a ON a.id = le."accountId"
      JOIN ledger_transactions lt ON lt.id = le."ledgerTransactionId"
      WHERE a."ownerType" = 'user'
        AND a."ownerId" = ${withdrawal.userId}
        AND a."assetCode" = ${withdrawal.assetCode}::"AssetCode"
        AND lt.status = 'completed'
    `;

    const available = Number(balanceResult[0]?.available ?? 0);
    if (available < amount) {
      throw new Error(`INSUFFICIENT_BALANCE: available ${available}, requested ${amount}`);
    }

    // Get user's account for this asset
    const userAccount = await getOrCreateUserAccount(
      tx,
      withdrawal.userId,
      assetCode,
      withdrawal.ecosystemId,
    );

    // Get or create the withdrawal escrow account for this asset
    const escrowAccount = await getOrCreateEscrowAccount(
      tx,
      assetCode,
      withdrawal.ecosystemId,
    );

    // Create ledger transaction + two entries (must sum to zero)
    // DR user account (-): reduce platform's liability to the user
    // CR escrow account (+): funds held in withdrawal escrow pending payout
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        ecosystemId: withdrawal.ecosystemId,
        type: "withdrawal",
        status: "completed",
        referenceId: txId,
        referenceType: "withdrawal_request",
        initiatedById: withdrawal.userId,
        approvedById: adminId,
        entries: {
          createMany: {
            data: [
              {
                ecosystemId: withdrawal.ecosystemId,
                accountId: userAccount.id,
                assetCode: withdrawal.assetCode,
                amount: `-${amount}`,
              },
              {
                ecosystemId: withdrawal.ecosystemId,
                accountId: escrowAccount.id,
                assetCode: withdrawal.assetCode,
                amount: `${amount}`,
              },
            ],
          },
        },
      },
    });

    await tx.transaction.update({
      where: { id: txId },
      data: { status: "approved", ledgerTxId: ledgerTx.id },
    });
  });

  await audit({
    actorId: adminId,
    targetId: userId!,
    targetType: "user",
    action: "withdrawal.approved",
    meta: { txId, assetCode: assetCode!, amount: amount! },
  });

  await createNotification({
    userId: userId!,
    type: "withdrawal_approved",
    title: "Withdrawal Approved",
    body: `Your withdrawal of ${amount!} ${assetCode!} has been approved and is being processed.`,
    referenceId: txId,
    referenceType: "transaction",
  });
}

// ── rejectWithdrawal ──────────────────────────────────────────────────────────

export async function rejectWithdrawal(
  txId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  let userId: string;
  let assetCode: AssetCode;
  let amount: number;

  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.transaction.findUniqueOrThrow({
      where: { id: txId },
      select: { id: true, userId: true, assetCode: true, amount: true, status: true },
    });

    if (withdrawal.status !== "pending" && withdrawal.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    userId = withdrawal.userId;
    assetCode = withdrawal.assetCode as AssetCode;
    amount = Number(withdrawal.amount);

    await tx.transaction.update({
      where: { id: txId },
      data: { status: "rejected", adminNote: reason },
    });
  });

  await audit({
    actorId: adminId,
    targetId: userId!,
    targetType: "user",
    action: "withdrawal.rejected",
    meta: { txId, assetCode: assetCode!, amount: amount!, reason },
  });

  await createNotification({
    userId: userId!,
    type: "withdrawal_rejected",
    title: "Withdrawal Rejected",
    body: `Your withdrawal of ${amount!} ${assetCode!} was rejected. Reason: ${reason}`,
    referenceId: txId,
    referenceType: "transaction",
  });
}
