import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getOrCreateUserAccount } from "@/lib/ledger/accounts";

// ── helpers ───────────────────────────────────────────────────────────────────

async function getSetting(key: string, ecosystemId: string): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { ecosystemId_key: { ecosystemId, key } },
  });
  return row ? Number(row.value) : 0;
}

async function getRewardsPoolAccount(ecosystemId: string) {
  return prisma.account.findFirst({
    where: { ecosystemId, ownerType: "platform", ownerId: "rewards-pool", assetCode: "REAL" },
  });
}

async function getPoolBalance(ecosystemId: string): Promise<number> {
  const pool = await getRewardsPoolAccount(ecosystemId);
  if (!pool) return 0;
  const result = await prisma.$queryRaw<[{ bal: string }]>`
    SELECT COALESCE(SUM(le.amount), 0)::text AS bal
    FROM ledger_entries le
    JOIN ledger_transactions lt ON lt.id = le."ledgerTransactionId"
    WHERE le."accountId" = ${pool.id}
      AND lt.status = 'completed'
  `;
  return Number(result[0]?.bal ?? 0);
}

async function getEcosystemId(): Promise<string> {
  const eco = await prisma.ecosystem.findUniqueOrThrow({ where: { code: "three_real" } });
  return eco.id;
}

// ── issueReward (internal) ────────────────────────────────────────────────────
// Creates ledger transaction + 2 entries, updates referral record, notifies.
// Must be called OUTSIDE a prisma.$transaction (opens its own).

async function issueRewardForReferral(
  referralId: string,
  recipientUserId: string,
  rewardAmount: number,
  ecosystemId: string,
  label: string,
): Promise<void> {
  const pool = await getRewardsPoolAccount(ecosystemId);
  if (!pool) {
    console.error("[referral] Rewards pool account not found, cannot issue reward");
    return;
  }

  const poolBal = await getPoolBalance(ecosystemId);
  if (poolBal < rewardAmount) {
    console.error(`[referral] Rewards pool depleted (${poolBal} < ${rewardAmount}), skipping`);
    await audit({
      ecosystemId,
      action: "referral.pool_depleted",
      meta: { needed: rewardAmount, available: poolBal },
    });
    return;
  }

  const userAccount = await getOrCreateUserAccount(
    prisma,
    recipientUserId,
    "REAL",
    ecosystemId,
  );

  await prisma.$transaction(async (tx) => {
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        ecosystemId,
        type: "referral_reward",
        status: "completed",
        referenceId: referralId,
        referenceType: "referral",
        entries: {
          createMany: {
            data: [
              {
                ecosystemId,
                accountId: pool.id,
                assetCode: "REAL",
                amount: `-${rewardAmount}`,
              },
              {
                ecosystemId,
                accountId: userAccount.id,
                assetCode: "REAL",
                amount: `${rewardAmount}`,
              },
            ],
          },
        },
      },
    });

    await tx.referral.update({
      where: { id: referralId },
      data: {
        status: "rewarded",
        rewardAmount: rewardAmount,
        ledgerTxId: ledgerTx.id,
      },
    });
  });
}

// ── issueEmailVerifyReward ────────────────────────────────────────────────────
// Trigger: user verifies email (kycTier 0 → 1).
// Issues level-1 reward to direct referrer and level-2 reward to indirect referrer.
// Idempotent: referral.ledgerTxId guards double-issue.

export async function issueEmailVerifyReward(referredUserId: string): Promise<void> {
  try {
    const ecosystemId = await getEcosystemId();
    const [level1Amount, level2Amount] = await Promise.all([
      getSetting("referral.reward.level1", ecosystemId),
      getSetting("referral.reward.level2", ecosystemId),
    ]);

    // Find all referral records for this user that are still pending reward
    const referrals = await prisma.referral.findMany({
      where: {
        referredId: referredUserId,
        status: "registered",
        ledgerTxId: null, // idempotency: skip if already rewarded
      },
    });

    for (const ref of referrals) {
      const amount = ref.referralLevel === 1 ? level1Amount : level2Amount;
      if (amount <= 0) continue;

      await issueRewardForReferral(
        ref.id,
        ref.referrerId,
        amount,
        ecosystemId,
        `Level ${ref.referralLevel} referral reward`,
      );

      await audit({
        ecosystemId,
        actorId: undefined,
        targetId: ref.referrerId,
        targetType: "user",
        action: "referral.reward_issued",
        meta: {
          referralId: ref.id,
          referredUserId,
          level: ref.referralLevel,
          amount,
          trigger: "email_verified",
        },
      });

      await createNotification({
        userId: ref.referrerId,
        type: "referral_reward",
        title: "Referral Reward Earned",
        body: `You earned ${amount} REAL — a friend you referred verified their email.`,
        referenceId: ref.id,
        referenceType: "referral",
      });
    }
  } catch (err) {
    console.error("[referral] issueEmailVerifyReward failed:", err);
  }
}

// ── issueKycReward ────────────────────────────────────────────────────────────
// Trigger: referred user's KYC is approved (any tier).
// Issues bonus reward to direct referrer only (level 1).
// Idempotent: checked via activity_log (KYC can only be approved once per tier).

export async function issueKycReward(referredUserId: string): Promise<void> {
  try {
    const ecosystemId = await getEcosystemId();
    const amount = await getSetting("referral.reward.kyc", ecosystemId);
    if (amount <= 0) return;

    // Check if KYC reward already issued for this user
    const existing = await prisma.activityLog.findFirst({
      where: {
        action: "referral.kyc_reward_issued",
        targetId: referredUserId,
      },
    });
    if (existing) return;

    // Find the level-1 referral for this user
    const ref = await prisma.referral.findFirst({
      where: {
        referredId: referredUserId,
        referralLevel: 1,
        status: { in: ["registered", "rewarded"] },
      },
    });
    if (!ref) return;

    const pool = await getRewardsPoolAccount(ecosystemId);
    if (!pool) return;

    const poolBal = await getPoolBalance(ecosystemId);
    if (poolBal < amount) {
      console.error(`[referral] Pool depleted for KYC reward (${poolBal} < ${amount})`);
      return;
    }

    const userAccount = await getOrCreateUserAccount(prisma, ref.referrerId, "REAL", ecosystemId);

    await prisma.$transaction(async (tx) => {
      await tx.ledgerTransaction.create({
        data: {
          ecosystemId,
          type: "referral_reward",
          status: "completed",
          referenceId: ref.id,
          referenceType: "referral",
          entries: {
            createMany: {
              data: [
                { ecosystemId, accountId: pool.id, assetCode: "REAL", amount: `-${amount}` },
                { ecosystemId, accountId: userAccount.id, assetCode: "REAL", amount: `${amount}` },
              ],
            },
          },
        },
      });
    });

    await audit({
      ecosystemId,
      actorId: undefined,
      targetId: referredUserId,
      targetType: "user",
      action: "referral.kyc_reward_issued",
      meta: { referralId: ref.id, recipientId: ref.referrerId, amount, trigger: "kyc_approved" },
    });

    await createNotification({
      userId: ref.referrerId,
      type: "referral_reward",
      title: "KYC Bonus Earned",
      body: `You earned ${amount} REAL — a friend you referred completed identity verification.`,
      referenceId: ref.id,
      referenceType: "referral",
    });
  } catch (err) {
    console.error("[referral] issueKycReward failed:", err);
  }
}

// ── issueFirstDepositReward ───────────────────────────────────────────────────
// Trigger: referred user's first deposit is approved.
// Issues bonus reward to direct referrer only (level 1).
// Idempotent: checked via activity_log.

export async function issueFirstDepositReward(referredUserId: string): Promise<void> {
  try {
    const ecosystemId = await getEcosystemId();
    const amount = await getSetting("referral.reward.deposit", ecosystemId);
    if (amount <= 0) return;

    // Check if deposit reward already issued for this user
    const existing = await prisma.activityLog.findFirst({
      where: {
        action: "referral.deposit_reward_issued",
        targetId: referredUserId,
      },
    });
    if (existing) return;

    // Find the level-1 referral for this user
    const ref = await prisma.referral.findFirst({
      where: {
        referredId: referredUserId,
        referralLevel: 1,
        status: { in: ["registered", "rewarded"] },
      },
    });
    if (!ref) return;

    const pool = await getRewardsPoolAccount(ecosystemId);
    if (!pool) return;

    const poolBal = await getPoolBalance(ecosystemId);
    if (poolBal < amount) {
      console.error(`[referral] Pool depleted for deposit reward (${poolBal} < ${amount})`);
      return;
    }

    const userAccount = await getOrCreateUserAccount(prisma, ref.referrerId, "REAL", ecosystemId);

    await prisma.$transaction(async (tx) => {
      await tx.ledgerTransaction.create({
        data: {
          ecosystemId,
          type: "referral_reward",
          status: "completed",
          referenceId: ref.id,
          referenceType: "referral",
          entries: {
            createMany: {
              data: [
                { ecosystemId, accountId: pool.id, assetCode: "REAL", amount: `-${amount}` },
                { ecosystemId, accountId: userAccount.id, assetCode: "REAL", amount: `${amount}` },
              ],
            },
          },
        },
      });
    });

    await audit({
      ecosystemId,
      actorId: undefined,
      targetId: referredUserId,
      targetType: "user",
      action: "referral.deposit_reward_issued",
      meta: { referralId: ref.id, recipientId: ref.referrerId, amount, trigger: "deposit_approved" },
    });

    await createNotification({
      userId: ref.referrerId,
      type: "referral_reward",
      title: "Deposit Bonus Earned",
      body: `You earned ${amount} REAL — a friend you referred made their first deposit.`,
      referenceId: ref.id,
      referenceType: "referral",
    });
  } catch (err) {
    console.error("[referral] issueFirstDepositReward failed:", err);
  }
}
