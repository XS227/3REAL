import { prisma } from "@/lib/prisma";
import { getUserBalances, type BalanceMap } from "@/lib/ledger/balance";

export type DashboardUser = {
  displayName: string | null;
  email: string;
  role: string;
  kycTier: number;
  emailVerified: boolean;
  referralCode: string;
  referredById: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  onboardedAt: Date | null;
};

export type ReferralStats = {
  invitedCount: number;
  pendingRewards: number;
  earnedRewards: number;
};

export type ActivityEntry = {
  id: string;
  action: string;
  meta: unknown;
  ipAddress: string | null;
  createdAt: Date;
};

export type TransactionEntry = {
  id: string;
  type: string;
  assetCode: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  createdAt: Date;
};

export type KycSummary = {
  status: string;
  tierRequested: number;
  submittedAt: Date;
} | null;

export type DashboardData = {
  user: DashboardUser;
  balances: BalanceMap;
  referralStats: ReferralStats;
  recentActivity: ActivityEntry[];
  recentTransactions: TransactionEntry[];
  kycProfile: KycSummary;
};

async function getReferralStats(userId: string): Promise<ReferralStats> {
  const [invitedCount, groups] = await Promise.all([
    prisma.referral.count({
      where: {
        referrerId: userId,
        referralLevel: 1,
        status: { not: "invalidated" },
      },
    }),
    prisma.referral.groupBy({
      by: ["status"],
      where: { referrerId: userId },
      _sum: { rewardAmount: true },
    }),
  ]);

  let pendingRewards = 0;
  let earnedRewards = 0;

  for (const g of groups) {
    const amount = Number(g._sum.rewardAmount ?? 0);
    if (g.status === "pending" || g.status === "registered") pendingRewards += amount;
    if (g.status === "rewarded") earnedRewards += amount;
  }

  return { invitedCount, pendingRewards, earnedRewards };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [user, balances, referralStats, rawActivity, rawTxs, kycProfile] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          displayName: true,
          email: true,
          role: true,
          kycTier: true,
          emailVerified: true,
          referralCode: true,
          referredById: true,
          createdAt: true,
          lastLoginAt: true,
          onboardedAt: true,
        },
      }),
      getUserBalances(userId),
      getReferralStats(userId),
      prisma.activityLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, meta: true, ipAddress: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          assetCode: true,
          amount: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      prisma.kycProfile.findUnique({
        where: { userId },
        select: { status: true, tierRequested: true, submittedAt: true },
      }),
    ]);

  const recentActivity: ActivityEntry[] = rawActivity.map((a) => ({
    id: a.id,
    action: a.action,
    meta: a.meta,
    ipAddress: a.ipAddress,
    createdAt: a.createdAt,
  }));

  const recentTransactions: TransactionEntry[] = rawTxs.map((t) => ({
    id: t.id,
    type: t.type,
    assetCode: t.assetCode,
    amount: t.amount.toString(),
    status: t.status,
    paymentMethod: t.paymentMethod,
    createdAt: t.createdAt,
  }));

  return {
    user,
    balances,
    referralStats,
    recentActivity,
    recentTransactions,
    kycProfile,
  };
}
