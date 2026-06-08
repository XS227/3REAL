import { prisma } from "@/lib/prisma";

// ── Date range helpers ────────────────────────────────────────────────────────

export type DateRange = { from: Date; to: Date; label: string };

export function parseDateRange(
  range: string,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  switch (range) {
    case "today": {
      const end = new Date(todayStart);
      end.setHours(23, 59, 59, 999);
      return { from: todayStart, to: end, label: "Today" };
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d, to: now, label: "Last 7 days" };
    }
    case "custom": {
      const f = customFrom ? new Date(customFrom) : todayStart;
      const t = customTo ? new Date(customTo + "T23:59:59") : now;
      return {
        from: f,
        to: t,
        label: `${f.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: d, to: now, label: "Last 30 days" };
    }
  }
}

// ── Report metrics ────────────────────────────────────────────────────────────

export type ReportMetrics = {
  totalUsers: number;
  verifiedUsers: number;
  newUsersInRange: number;
  pendingKyc: number;
  approvedKycInRange: number;
  totalDeposits: number;
  depositVolumeInRange: number;
  totalWithdrawals: number;
  withdrawalVolumeInRange: number;
  totalReferralRewardsInRange: number;
  realIssuedInRange: number;
  realRemainingInPool: number;
};

export async function getReportMetrics(dateRange: DateRange): Promise<ReportMetrics> {
  const { from, to } = dateRange;

  const [
    totalUsers,
    verifiedUsers,
    newUsersInRange,
    pendingKyc,
    approvedKycInRange,
    depositStats,
    withdrawalStats,
    referralRewardsCount,
    poolRows,
    issuedRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.kycProfile.count({ where: { status: { in: ["pending", "under_review"] } } }),
    prisma.kycProfile.count({
      where: { status: "approved", reviewedAt: { gte: from, lte: to } },
    }),
    prisma.transaction.aggregate({
      where: { type: "deposit", status: "completed", updatedAt: { gte: from, lte: to } },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "withdrawal", status: "approved", updatedAt: { gte: from, lte: to } },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.referral.count({
      where: { status: "rewarded", createdAt: { gte: from, lte: to } },
    }),
    prisma.$queryRaw<[{ bal: string }]>`
      SELECT COALESCE(SUM(le.amount), 0)::text AS bal
      FROM ledger_entries le
      JOIN accounts a ON le."accountId" = a.id
      JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
      WHERE a."ownerType"::text = 'platform'
        AND a."ownerId"    = 'rewards-pool'
        AND lt.status      = 'completed'
    `,
    prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(le.amount), 0)::text AS total
      FROM ledger_entries le
      JOIN accounts a        ON le."accountId"          = a.id
      JOIN ledger_transactions lt ON le."ledgerTransactionId" = lt.id
      WHERE lt.type          = 'referral_reward'
        AND lt.status        = 'completed'
        AND lt."createdAt"  >= ${from}
        AND lt."createdAt"  <= ${to}
        AND a."ownerType"::text = 'user'
    `,
  ]);

  return {
    totalUsers,
    verifiedUsers,
    newUsersInRange,
    pendingKyc,
    approvedKycInRange,
    totalDeposits: depositStats._count,
    depositVolumeInRange: Number(depositStats._sum?.amount ?? 0),
    totalWithdrawals: withdrawalStats._count,
    withdrawalVolumeInRange: Number(withdrawalStats._sum?.amount ?? 0),
    totalReferralRewardsInRange: referralRewardsCount,
    realIssuedInRange: Math.abs(Number(issuedRows[0]?.total ?? 0)),
    realRemainingInPool: Number(poolRows[0]?.bal ?? 0),
  };
}
