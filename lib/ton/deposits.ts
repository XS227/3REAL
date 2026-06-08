import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getOrCreateUserAccount } from "@/lib/ledger/accounts";
import { getTonSettings } from "./settings";
import { getJettonActivity } from "./jetton";
import { toRawHash } from "./address";
import { logger } from "@/lib/logger";
import type { JettonTransfer } from "./jetton";

const MIN_REAL_NANO = BigInt("1000000000"); // 1 REAL minimum (9 decimals)

export type DepositCheckResult = {
  credited: CreditedDeposit[];
  skipped: number;
  error: string | null;
};

export type CreditedDeposit = {
  eventId: string;
  amount: number;
  fromAddress: string;
  txId: string;
};

export type RealDepositRow = {
  id: string;
  amount: string;
  status: string;
  chainTxHash: string | null;
  paymentRef: string | null;
  createdAt: Date;
};

/**
 * Scan the platform deposit address for incoming REAL transfers from the user's
 * linked wallets. Credit any unclaimed transfers to the user's ledger.
 *
 * Idempotent: LedgerTransaction.chainTxHash unique constraint prevents double-credit.
 */
export async function detectAndCreditDeposits(
  userId: string
): Promise<DepositCheckResult> {
  const settings = await getTonSettings();

  if (!settings.depositAddress) {
    return { credited: [], skipped: 0, error: "deposit_address_not_configured" };
  }

  const apiKey = settings.apiKey || undefined;

  // Load user's linked wallets (only verified, active ones)
  const wallets = await prisma.tonWallet.findMany({
    where: { userId },
    select: { walletAddress: true },
  });

  if (wallets.length === 0) {
    return { credited: [], skipped: 0, error: "no_linked_wallets" };
  }

  const linkedHashes = new Set(wallets.map((w) => toRawHash(w.walletAddress)));

  // Fetch incoming REAL transfers to the platform deposit address
  let transfers: JettonTransfer[];
  try {
    transfers = await getJettonActivity(
      settings.depositAddress,
      settings.jettonMaster,
      50,
      apiKey
    );
  } catch (e) {
    logger.error("ton.deposits: failed to fetch activity", { error: String(e), userId });
    return { credited: [], skipped: 0, error: "tonapi_error" };
  }

  // Filter: incoming only, from a linked wallet, minimum amount
  const candidates = transfers.filter(
    (t) =>
      t.direction === "in" &&
      t.counterparty !== null &&
      linkedHashes.has(toRawHash(t.counterparty)) &&
      t.amountNano >= MIN_REAL_NANO
  );

  if (candidates.length === 0) {
    return { credited: [], skipped: 0, error: null };
  }

  // Fetch ecosystem + platform float account once (outside transaction)
  const ecosystem = await prisma.ecosystem.findUniqueOrThrow({
    where: { code: "three_real" },
    select: { id: true },
  });

  const floatAccount = await prisma.account.findFirst({
    where: {
      ecosystemId: ecosystem.id,
      ownerType: "platform",
      ownerId: "float",
      assetCode: "REAL",
    },
    select: { id: true },
  });

  if (!floatAccount) {
    logger.error("ton.deposits: missing REAL float account", { ecosystemId: ecosystem.id });
    return { credited: [], skipped: 0, error: "missing_float_account" };
  }

  const credited: CreditedDeposit[] = [];
  let skipped = 0;

  for (const transfer of candidates) {
    // eventId is the on-chain event hash — used as chainTxHash for idempotency
    const chainTxHash = transfer.eventId;

    // Check idempotency before attempting DB write
    const alreadyCredited = await prisma.ledgerTransaction.findUnique({
      where: { chainTxHash },
      select: { id: true },
    });
    if (alreadyCredited) {
      skipped++;
      continue;
    }

    const amountDecimal = transfer.amount.toFixed(9);
    const txId = crypto.randomUUID();

    try {
      await prisma.$transaction(async (tx) => {
        const userAccount = await getOrCreateUserAccount(
          tx,
          userId,
          "REAL",
          ecosystem.id
        );

        // Create the ledger transaction (blockchain_deposit type)
        // chainTxHash unique constraint is the final idempotency guard
        const ledgerTx = await tx.ledgerTransaction.create({
          data: {
            ecosystemId: ecosystem.id,
            type: "blockchain_deposit",
            status: "completed",
            referenceId: txId,
            referenceType: "ton_deposit",
            chainTxHash,
            chainNetwork: "ton",
            initiatedById: userId,
            entries: {
              createMany: {
                data: [
                  // Debit platform float (funds received on-chain)
                  {
                    ecosystemId: ecosystem.id,
                    accountId: floatAccount.id,
                    assetCode: "REAL",
                    amount: `-${amountDecimal}`,
                  },
                  // Credit user account
                  {
                    ecosystemId: ecosystem.id,
                    accountId: userAccount.id,
                    assetCode: "REAL",
                    amount: amountDecimal,
                  },
                ],
              },
            },
          },
        });

        // Create the Transaction row for user-visible deposit history
        await tx.transaction.create({
          data: {
            id: txId,
            ecosystemId: ecosystem.id,
            userId,
            type: "deposit",
            assetCode: "REAL",
            amount: amountDecimal,
            feeAmount: 0,
            netAmount: amountDecimal,
            status: "completed",
            paymentMethod: "ton",
            paymentRef: transfer.counterparty,
            chainTxHash,
            ledgerTxId: ledgerTx.id,
          },
        });
      });

      credited.push({
        eventId: chainTxHash,
        amount: transfer.amount,
        fromAddress: transfer.counterparty!,
        txId,
      });

      logger.info("ton.deposits: credited", {
        userId,
        txId,
        amount: transfer.amount,
        chainTxHash,
      });
    } catch (e: unknown) {
      // Unique constraint violation = race condition, already credited by concurrent call
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
        skipped++;
        continue;
      }
      logger.error("ton.deposits: credit failed", { userId, chainTxHash, error: msg });
      // Continue processing remaining transfers; don't abort the whole check
    }
  }

  // Fire-and-forget side effects for newly credited deposits
  if (credited.length > 0) {
    const totalAmount = credited.reduce((s, d) => s + d.amount, 0);

    audit({
      actorId: userId,
      targetId: userId,
      targetType: "user",
      action: "deposit.blockchain_credited",
      meta: {
        assetCode: "REAL",
        count: credited.length,
        totalAmount,
        eventIds: credited.map((c) => c.eventId),
      },
    }).catch(() => {});

    createNotification({
      userId,
      type: "deposit_approved",
      title: "REAL Deposit Credited",
      body:
        credited.length === 1
          ? `${credited[0].amount.toLocaleString()} REAL has been credited to your account.`
          : `${credited.length} REAL deposits totaling ${totalAmount.toLocaleString()} REAL have been credited.`,
    }).catch(() => {});
  }

  return { credited, skipped, error: null };
}

/** Get a user's credited REAL blockchain deposits. */
export async function getRealDepositHistory(
  userId: string,
  limit = 50
): Promise<RealDepositRow[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      type: "deposit",
      assetCode: "REAL",
      paymentMethod: "ton",
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      status: true,
      chainTxHash: true,
      paymentRef: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    status: r.status,
    chainTxHash: r.chainTxHash,
    paymentRef: r.paymentRef,
    createdAt: r.createdAt,
  }));
}

/** Admin: all REAL blockchain deposits across all users. */
export async function getAllRealDepositsAdmin(page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize;
  const where = {
    type: "deposit" as const,
    assetCode: "REAL" as const,
    paymentMethod: "ton" as const,
  };

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        chainTxHash: true,
        paymentRef: true,
        createdAt: true,
        user: { select: { email: true, displayName: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.user.email,
      displayName: r.user.displayName,
      amount: r.amount.toString(),
      status: r.status,
      chainTxHash: r.chainTxHash,
      fromAddress: r.paymentRef,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
