import { prisma } from "@/lib/prisma";

export type ReferralOverview = {
  code: string;
  link: string;
  totalInvites: number;
  activeReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
  lifetimeRewards: number;
};

export type InviteRow = {
  referralId: string;
  displayName: string | null;
  email: string;
  registeredAt: Date | null;
  status: string;
  rewardStatus: string;
  rewardAmount: number;
  referralLevel: number;
};

export type RewardHistoryRow = {
  id: string;
  createdAt: Date;
  trigger: string;
  amount: number;
  status: string;
  referredEmail: string;
  referralLevel: number;
};

export type ReferralPageData = {
  overview: ReferralOverview;
  invites: InviteRow[];
  rewardHistory: RewardHistoryRow[];
  poolBalance: number;
};

export async function getReferralPageData(
  userId: string,
  baseUrl: string,
): Promise<ReferralPageData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId, status: { not: "invalidated" } },
    include: {
      referred: {
        select: { email: true, displayName: true, emailVerified: true, kycTier: true },
      },
      ledgerTx: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Overview stats
  let pendingRewards = 0;
  let earnedRewards = 0;
  let activeReferrals = 0;

  for (const r of referrals) {
    const amt = Number(r.rewardAmount);
    if (r.status === "rewarded") {
      earnedRewards += amt;
      activeReferrals++;
    } else if (r.status === "registered") {
      pendingRewards += amt > 0 ? amt : 0;
      activeReferrals++;
    }
  }

  // Aggregate extra rewards (KYC bonus, deposit bonus) from ledger
  const extraRewards = await prisma.$queryRaw<[{ total: string }]>`
    SELECT COALESCE(SUM(le.amount), 0)::text AS total
    FROM ledger_entries le
    JOIN accounts a ON a.id = le."accountId"
    JOIN ledger_transactions lt ON lt.id = le."ledgerTransactionId"
    WHERE a."ownerType" = 'user'
      AND a."ownerId" = ${userId}
      AND a."assetCode" = 'REAL'
      AND lt.type = 'referral_reward'
      AND lt.status = 'completed'
  `;
  const lifetimeRewards = Number(extraRewards[0]?.total ?? 0);

  // Pool balance (for display only)
  const poolResult = await prisma.$queryRaw<[{ bal: string }]>`
    SELECT COALESCE(SUM(le.amount), 0)::text AS bal
    FROM ledger_entries le
    JOIN accounts a ON a.id = le."accountId"
    JOIN ledger_transactions lt ON lt.id = le."ledgerTransactionId"
    WHERE a."ownerType" = 'platform'
      AND a."ownerId" = 'rewards-pool'
      AND a."assetCode" = 'REAL'
      AND lt.status = 'completed'
  `;
  const poolBalance = Number(poolResult[0]?.bal ?? 0);

  // Invite table (direct level-1 referrals only for primary invite view)
  const invites: InviteRow[] = referrals
    .filter((r) => r.referralLevel === 1)
    .map((r) => ({
      referralId: r.id,
      displayName: r.referred?.displayName ?? null,
      email: maskEmail(r.referred?.email ?? ""),
      registeredAt: r.registeredAt,
      status: r.referred?.emailVerified
        ? r.referred.kycTier >= 2
          ? "KYC Verified"
          : "Email Verified"
        : "Pending Email",
      rewardStatus: r.status,
      rewardAmount: Number(r.rewardAmount),
      referralLevel: r.referralLevel,
    }));

  // Reward history: rewarded referrals only
  const rewardHistory: RewardHistoryRow[] = referrals
    .filter((r) => r.status === "rewarded" && r.ledgerTx)
    .map((r) => ({
      id: r.id,
      createdAt: r.ledgerTx!.createdAt,
      trigger: "Email Verified",
      amount: Number(r.rewardAmount),
      status: "completed",
      referredEmail: maskEmail(r.referred?.email ?? ""),
      referralLevel: r.referralLevel,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    overview: {
      code: user.referralCode,
      link: `${baseUrl}/auth/register?ref=${user.referralCode}`,
      totalInvites: referrals.filter((r) => r.referralLevel === 1).length,
      activeReferrals,
      pendingRewards,
      earnedRewards,
      lifetimeRewards,
    },
    invites,
    rewardHistory,
    poolBalance,
  };
}

// ── Admin queries ─────────────────────────────────────────────────────────────

export type ReferralAdminMetrics = {
  totalReferrals: number;
  totalRewarded: number;
  totalRewardAmount: number;
  poolBalance: number;
  suspiciousCount: number;
};

export type LeaderboardRow = {
  userId: string;
  email: string;
  displayName: string | null;
  totalReferrals: number;
  rewardedReferrals: number;
  totalEarned: number;
};

export type FraudRow = {
  ip: string;
  referralCount: number;
  referrerIds: string[];
  latestAt: Date | null;
};

export type AdminReferralData = {
  metrics: ReferralAdminMetrics;
  leaderboard: LeaderboardRow[];
  fraudQueue: FraudRow[];
};

export async function getAdminReferralData(): Promise<AdminReferralData> {
  // Metrics
  const [totalReferrals, rewardedRows] = await Promise.all([
    prisma.referral.count({ where: { status: { not: "invalidated" } } }),
    prisma.referral.aggregate({
      where: { status: "rewarded" },
      _count: { id: true },
      _sum: { rewardAmount: true },
    }),
  ]);

  const poolResult = await prisma.$queryRaw<[{ bal: string }]>`
    SELECT COALESCE(SUM(le.amount), 0)::text AS bal
    FROM ledger_entries le
    JOIN accounts a ON a.id = le."accountId"
    JOIN ledger_transactions lt ON lt.id = le."ledgerTransactionId"
    WHERE a."ownerType" = 'platform'
      AND a."ownerId" = 'rewards-pool'
      AND a."assetCode" = 'REAL'
      AND lt.status = 'completed'
  `;

  // Top 10 referrers
  const topReferrers = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { referralLevel: 1, status: { not: "invalidated" } },
    _count: { id: true },
    _sum: { rewardAmount: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const referrerIds = topReferrers.map((r) => r.referrerId);
  const referrerUsers = await prisma.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, email: true, displayName: true },
  });
  const userMap = new Map(referrerUsers.map((u) => [u.id, u]));

  const rewardedByReferrer = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { referrerId: { in: referrerIds }, status: "rewarded" },
    _count: { id: true },
    _sum: { rewardAmount: true },
  });
  const rewardedMap = new Map(rewardedByReferrer.map((r) => [r.referrerId, r]));

  const leaderboard: LeaderboardRow[] = topReferrers.map((r) => {
    const u = userMap.get(r.referrerId);
    const rewarded = rewardedMap.get(r.referrerId);
    return {
      userId: r.referrerId,
      email: u?.email ?? "",
      displayName: u?.displayName ?? null,
      totalReferrals: r._count.id,
      rewardedReferrals: rewarded?._count.id ?? 0,
      totalEarned: Number(rewarded?._sum.rewardAmount ?? 0),
    };
  });

  // Fraud queue: IPs with 3+ referrals in 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const suspiciousRows = await prisma.$queryRaw<
    { ip: string; cnt: bigint; referrer_ids: string; latest: Date | null }[]
  >`
    SELECT
      "clickIp" AS ip,
      COUNT(*) AS cnt,
      STRING_AGG(DISTINCT "referrerId"::text, ',') AS referrer_ids,
      MAX("createdAt") AS latest
    FROM referrals
    WHERE "clickIp" IS NOT NULL
      AND "createdAt" >= ${since}
    GROUP BY "clickIp"
    HAVING COUNT(*) >= 3
    ORDER BY cnt DESC
    LIMIT 50
  `;

  const fraudQueue: FraudRow[] = suspiciousRows.map((r) => ({
    ip: r.ip,
    referralCount: Number(r.cnt),
    referrerIds: r.referrer_ids?.split(",").filter(Boolean) ?? [],
    latestAt: r.latest,
  }));

  return {
    metrics: {
      totalReferrals,
      totalRewarded: rewardedRows._count.id,
      totalRewardAmount: Number(rewardedRows._sum.rewardAmount ?? 0),
      poolBalance: Number(poolResult[0]?.bal ?? 0),
      suspiciousCount: fraudQueue.length,
    },
    leaderboard,
    fraudQueue,
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}
