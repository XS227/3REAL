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

// ── confirmBlockchainPayout ───────────────────────────────────────────────────
// Phase 2 of a REAL withdrawal: admin has manually sent REAL on-chain and
// provides the chain tx hash to confirm. Clears the withdrawal escrow and
// restores the platform float. Idempotent via LedgerTransaction.chainTxHash.

export async function confirmBlockchainPayout(
  txId: string,
  adminId: string,
  opts: { chainTxHash: string; sentAmount: number; adminNote: string },
): Promise<void> {
  const { chainTxHash, sentAmount, adminNote } = opts;
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
        chainTxHash: true,
        ecosystemId: true,
      },
    });

    // Must be a REAL withdrawal
    if (withdrawal.assetCode !== "REAL") {
      throw new Error("INVALID_ASSET");
    }

    // Must already be approved (Phase 1 done: user ledger debited)
    if (withdrawal.status !== "approved") {
      if (withdrawal.status === "completed") throw new Error("ALREADY_SETTLED");
      throw new Error("INVALID_STATE");
    }

    // chainTxHash idempotency — check before write
    if (chainTxHash) {
      const dupe = await tx.ledgerTransaction.findUnique({
        where: { chainTxHash },
        select: { id: true },
      });
      if (dupe) throw new Error("DUPLICATE_CHAIN_TX");
    }

    userId = withdrawal.userId;
    assetCode = withdrawal.assetCode as AssetCode;
    amount = Number(withdrawal.amount);

    // Validate sentAmount matches the withdrawal amount (±0.001 tolerance)
    if (Math.abs(sentAmount - amount) > 0.001) {
      throw new Error(`AMOUNT_MISMATCH: expected ${amount}, got ${sentAmount}`);
    }

    // Get escrow and float accounts
    const escrowAccount = await tx.account.findFirst({
      where: {
        ecosystemId: withdrawal.ecosystemId,
        ownerType: "platform",
        ownerId: "withdrawals-pending",
        assetCode: "REAL",
      },
      select: { id: true },
    });
    if (!escrowAccount) throw new Error("MISSING_ESCROW_ACCOUNT");

    const floatAccount = await tx.account.findFirst({
      where: {
        ecosystemId: withdrawal.ecosystemId,
        ownerType: "platform",
        ownerId: "float",
        assetCode: "REAL",
      },
      select: { id: true },
    });
    if (!floatAccount) throw new Error("MISSING_FLOAT_ACCOUNT");

    // Phase 2 ledger: DR escrow (cleared), CR float (restored)
    await tx.ledgerTransaction.create({
      data: {
        ecosystemId: withdrawal.ecosystemId,
        type: "blockchain_withdrawal",
        status: "completed",
        referenceId: txId,
        referenceType: "withdrawal_payout",
        chainTxHash,
        chainNetwork: "ton",
        initiatedById: withdrawal.userId,
        approvedById: adminId,
        note: adminNote || undefined,
        entries: {
          createMany: {
            data: [
              {
                ecosystemId: withdrawal.ecosystemId,
                accountId: escrowAccount.id,
                assetCode: "REAL",
                amount: `-${amount}`,
              },
              {
                ecosystemId: withdrawal.ecosystemId,
                accountId: floatAccount.id,
                assetCode: "REAL",
                amount: `${amount}`,
              },
            ],
          },
        },
      },
    });

    await tx.transaction.update({
      where: { id: txId },
      data: {
        status: "completed",
        chainTxHash,
        adminNote: adminNote || undefined,
      },
    });
  });

  await audit({
    actorId: adminId,
    targetId: userId!,
    targetType: "user",
    action: "withdrawal.blockchain_sent",
    meta: { txId, assetCode: assetCode!, amount: amount!, chainTxHash, adminNote },
  });

  await createNotification({
    userId: userId!,
    type: "withdrawal_approved",
    title: "REAL Withdrawal Sent",
    body: `${amount!.toLocaleString()} REAL has been sent to your TON wallet. Transaction: ${chainTxHash.slice(0, 16)}…`,
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
