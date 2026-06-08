import { prisma } from "@/lib/prisma";

export type DayPoint = { date: string; value: number };

export type TopReferrer = {
  email: string;
  displayName: string | null;
  totalReferrals: number;
  realEarned: number;
};

export type ActiveUser = {
  email: string;
  displayName: string | null;
  actions: number;
};

export type LargestDeposit = {
  email: string;
  amount: number;
  assetCode: string;
  date: Date;
};

export type AnalyticsData = {
  userGrowth: DayPoint[];
  kycApprovals: DayPoint[];
  depositVolume: DayPoint[];
  withdrawalVolume: DayPoint[];
  referralActivity: DayPoint[];
  topReferrers: TopReferrer[];
  mostActiveUsers: ActiveUser[];
  largestDeposits: LargestDeposit[];
};

type DayRow = { date: string; count: bigint };
type VolumeRow = { date: string; total: string };
type TopReferrerRow = { userId: string; email: string; displayName: string | null; totalReferrals: bigint; realEarned: string };
type ActiveUserRow = { email: string; displayName: string | null; actions: bigint };
type LargestDepositRow = { email: string; amount: string; assetCode: string; createdAt: Date };

// Returns 30 days of daily time-series data for the main charts.
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [
    userGrowthRows,
    kycRows,
    depositRows,
    withdrawalRows,
    referralRows,
    topReferrerRows,
    activeUserRows,
    largestDepositRows,
  ] = await Promise.all([

    // User registrations per day (last 30 days)
    prisma.$queryRaw<DayRow[]>`
      SELECT
        to_char(gs.d::date, 'YYYY-MM-DD') AS date,
        COUNT(u.id) AS count
      FROM generate_series(
        NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
      ) AS gs(d)
      LEFT JOIN users u ON u."createdAt"::date = gs.d::date
      GROUP BY gs.d::date
      ORDER BY gs.d::date
    `,

    // KYC approvals per day (last 30 days)
    prisma.$queryRaw<DayRow[]>`
      SELECT
        to_char(gs.d::date, 'YYYY-MM-DD') AS date,
        COUNT(k.id) AS count
      FROM generate_series(
        NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
      ) AS gs(d)
      LEFT JOIN kyc_profiles k
        ON k."reviewedAt"::date = gs.d::date
        AND k.status = 'approved'
      GROUP BY gs.d::date
      ORDER BY gs.d::date
    `,

    // Completed deposit volume per day (last 30 days)
    prisma.$queryRaw<VolumeRow[]>`
      SELECT
        to_char(gs.d::date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(t.amount), 0)::text AS total
      FROM generate_series(
        NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
      ) AS gs(d)
      LEFT JOIN transactions t
        ON t."updatedAt"::date = gs.d::date
        AND t.type = 'deposit'
        AND t.status = 'completed'
      GROUP BY gs.d::date
      ORDER BY gs.d::date
    `,

    // Approved withdrawal volume per day (last 30 days)
    prisma.$queryRaw<VolumeRow[]>`
      SELECT
        to_char(gs.d::date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(t.amount), 0)::text AS total
      FROM generate_series(
        NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
      ) AS gs(d)
      LEFT JOIN transactions t
        ON t."updatedAt"::date = gs.d::date
        AND t.type = 'withdrawal'
        AND t.status = 'approved'
      GROUP BY gs.d::date
      ORDER BY gs.d::date
    `,

    // Referral rewards issued per day (last 30 days)
    prisma.$queryRaw<DayRow[]>`
      SELECT
        to_char(gs.d::date, 'YYYY-MM-DD') AS date,
        COUNT(r.id) AS count
      FROM generate_series(
        NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day'
      ) AS gs(d)
      LEFT JOIN referrals r
        ON r."createdAt"::date = gs.d::date
        AND r.status = 'rewarded'
      GROUP BY gs.d::date
      ORDER BY gs.d::date
    `,

    // Top 10 referrers by total referrals
    prisma.$queryRaw<TopReferrerRow[]>`
      SELECT
        r."referrerId"        AS "userId",
        u.email,
        u."displayName",
        COUNT(r.id)           AS "totalReferrals",
        COALESCE(SUM(r."rewardAmount"), 0)::text AS "realEarned"
      FROM referrals r
      JOIN users u ON r."referrerId" = u.id
      GROUP BY r."referrerId", u.email, u."displayName"
      ORDER BY "totalReferrals" DESC
      LIMIT 10
    `,

    // Most active users (by activity_log entries in last 30 days)
    prisma.$queryRaw<ActiveUserRow[]>`
      SELECT
        u.email,
        u."displayName",
        COUNT(al.id) AS actions
      FROM activity_logs al
      JOIN users u ON al."actorId" = u.id
      WHERE al."createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.email, u."displayName"
      ORDER BY actions DESC
      LIMIT 10
    `,

    // 10 largest completed deposits
    prisma.$queryRaw<LargestDepositRow[]>`
      SELECT
        u.email,
        t.amount::text AS amount,
        t."assetCode"::text AS "assetCode",
        t."createdAt"
      FROM transactions t
      JOIN users u ON t."userId" = u.id
      WHERE t.type = 'deposit' AND t.status = 'completed'
      ORDER BY t.amount DESC
      LIMIT 10
    `,
  ]);

  return {
    userGrowth: userGrowthRows.map((r) => ({
      date: r.date,
      value: Number(r.count),
    })),
    kycApprovals: kycRows.map((r) => ({
      date: r.date,
      value: Number(r.count),
    })),
    depositVolume: depositRows.map((r) => ({
      date: r.date,
      value: Number(r.total),
    })),
    withdrawalVolume: withdrawalRows.map((r) => ({
      date: r.date,
      value: Number(r.total),
    })),
    referralActivity: referralRows.map((r) => ({
      date: r.date,
      value: Number(r.count),
    })),
    topReferrers: topReferrerRows.map((r) => ({
      email: r.email,
      displayName: r.displayName,
      totalReferrals: Number(r.totalReferrals),
      realEarned: Number(r.realEarned),
    })),
    mostActiveUsers: activeUserRows.map((r) => ({
      email: r.email,
      displayName: r.displayName,
      actions: Number(r.actions),
    })),
    largestDeposits: largestDepositRows.map((r) => ({
      email: r.email,
      amount: Number(r.amount),
      assetCode: r.assetCode,
      date: r.createdAt,
    })),
  };
}
