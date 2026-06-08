import { prisma } from "@/lib/prisma";

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export type AdminMetrics = {
  totalUsers: number;
  pendingKyc: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  approvedToday: number;
  rejectedToday: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    pendingKyc,
    pendingDeposits,
    pendingWithdrawals,
    approvedKycToday,
    rejectedKycToday,
    approvedDepositsToday,
    rejectedDepositsToday,
    approvedWithdrawalsToday,
    rejectedWithdrawalsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.kycProfile.count({ where: { status: { in: ["pending", "under_review"] } } }),
    prisma.transaction.count({
      where: { type: "deposit", status: { in: ["pending", "under_review"] } },
    }),
    prisma.transaction.count({
      where: { type: "withdrawal", status: { in: ["pending", "under_review"] } },
    }),
    prisma.kycProfile.count({
      where: { status: "approved", reviewedAt: { gte: todayStart } },
    }),
    prisma.kycProfile.count({
      where: { status: "rejected", reviewedAt: { gte: todayStart } },
    }),
    prisma.transaction.count({
      where: { type: "deposit", status: "completed", updatedAt: { gte: todayStart } },
    }),
    prisma.transaction.count({
      where: { type: "deposit", status: "rejected", updatedAt: { gte: todayStart } },
    }),
    prisma.transaction.count({
      where: { type: "withdrawal", status: "approved", updatedAt: { gte: todayStart } },
    }),
    prisma.transaction.count({
      where: { type: "withdrawal", status: "rejected", updatedAt: { gte: todayStart } },
    }),
  ]);

  return {
    totalUsers,
    pendingKyc,
    pendingDeposits,
    pendingWithdrawals,
    approvedToday: approvedKycToday + approvedDepositsToday + approvedWithdrawalsToday,
    rejectedToday: rejectedKycToday + rejectedDepositsToday + rejectedWithdrawalsToday,
  };
}

export type RecentAdminActivity = {
  id: string;
  action: string;
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  meta: unknown;
  createdAt: Date;
};

export async function getRecentAdminActivity(limit = 20): Promise<RecentAdminActivity[]> {
  const rows = await prisma.activityLog.findMany({
    where: {
      action: {
        in: [
          "kyc.approved",
          "kyc.rejected",
          "kyc.update_requested",
          "deposit.created",
          "deposit.approved",
          "deposit.rejected",
          "withdrawal.created",
          "withdrawal.approved",
          "withdrawal.rejected",
          "referral.reward_issued",
          "referral.kyc_reward_issued",
          "referral.deposit_reward_issued",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      actorId: true,
      targetId: true,
      targetType: true,
      meta: true,
      createdAt: true,
    },
  });

  return rows;
}

// ── KYC queue ─────────────────────────────────────────────────────────────────

export type AdminKycQueueItem = {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  tierRequested: number;
  submittedAt: Date;
  reviewedAt: Date | null;
};

export async function getKycQueue(): Promise<AdminKycQueueItem[]> {
  const rows = await prisma.kycProfile.findMany({
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { email: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.user.email,
    status: r.status,
    tierRequested: r.tierRequested,
    submittedAt: r.submittedAt,
    reviewedAt: r.reviewedAt,
  }));
}

export type AdminKycReviewData = {
  profile: {
    id: string;
    status: string;
    tierRequested: number;
    rejectionReason: string | null;
    submittedAt: Date;
    reviewedAt: Date | null;
    reviewedByEmail: string | null;
  };
  user: {
    id: string;
    email: string;
    kycTier: number;
    emailVerified: boolean;
    createdAt: Date;
  };
  documents: {
    id: string;
    docType: string;
    fileName: string | null;
    filePath: string;
    mimeType: string | null;
    status: string;
    rejectionReason: string | null;
    version: number;
    createdAt: Date;
  }[];
};

export async function getKycReviewData(profileId: string): Promise<AdminKycReviewData | null> {
  const profile = await prisma.kycProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { id: true, email: true, kycTier: true, emailVerified: true, createdAt: true } },
      reviewedBy: { select: { email: true } },
      documents: {
        orderBy: [{ docType: "asc" }, { version: "desc" }],
        select: {
          id: true,
          docType: true,
          fileName: true,
          filePath: true,
          mimeType: true,
          status: true,
          rejectionReason: true,
          version: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    profile: {
      id: profile.id,
      status: profile.status,
      tierRequested: profile.tierRequested,
      rejectionReason: profile.rejectionReason,
      submittedAt: profile.submittedAt,
      reviewedAt: profile.reviewedAt,
      reviewedByEmail: profile.reviewedBy?.email ?? null,
    },
    user: profile.user,
    documents: profile.documents,
  };
}

// ── Deposit queue ─────────────────────────────────────────────────────────────

export type AdminDepositQueueItem = {
  id: string;
  userId: string;
  userEmail: string;
  assetCode: string;
  amount: string;
  paymentMethod: string | null;
  status: string;
  createdAt: Date;
};

export async function getDepositQueue(): Promise<AdminDepositQueueItem[]> {
  const rows = await prisma.transaction.findMany({
    where: { type: "deposit" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.user.email,
    assetCode: r.assetCode,
    amount: r.amount.toString(),
    paymentMethod: r.paymentMethod,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export type AdminDepositReviewData = {
  transaction: {
    id: string;
    assetCode: string;
    amount: string;
    status: string;
    paymentMethod: string | null;
    paymentRef: string | null;
    proofFilePath: string | null;
    adminNote: string | null;
    createdAt: Date;
    ledgerTxId: string | null;
  };
  user: {
    id: string;
    email: string;
    kycTier: number;
    emailVerified: boolean;
  };
  kycProfile: { status: string; tierRequested: number } | null;
};

export async function getDepositReviewData(
  txId: string,
): Promise<AdminDepositReviewData | null> {
  const tx = await prisma.transaction.findUnique({
    where: { id: txId, type: "deposit" },
    include: {
      user: {
        select: { id: true, email: true, kycTier: true, emailVerified: true },
        include: { kycProfile: { select: { status: true, tierRequested: true } } },
      },
    },
  });

  if (!tx) return null;

  return {
    transaction: {
      id: tx.id,
      assetCode: tx.assetCode,
      amount: tx.amount.toString(),
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      paymentRef: tx.paymentRef,
      proofFilePath: tx.proofFilePath,
      adminNote: tx.adminNote,
      createdAt: tx.createdAt,
      ledgerTxId: tx.ledgerTxId,
    },
    user: {
      id: tx.user.id,
      email: tx.user.email,
      kycTier: tx.user.kycTier,
      emailVerified: tx.user.emailVerified,
    },
    kycProfile: tx.user.kycProfile,
  };
}

// ── User list ─────────────────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  kycTier: number;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
};

// ── Withdrawal queue ──────────────────────────────────────────────────────────

export type AdminWithdrawalQueueItem = {
  id: string;
  userId: string;
  userEmail: string;
  assetCode: string;
  amount: string;
  destination: string | null;
  status: string;
  createdAt: Date;
};

export async function getWithdrawalQueue(): Promise<AdminWithdrawalQueueItem[]> {
  const rows = await prisma.transaction.findMany({
    where: { type: "withdrawal" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.user.email,
    assetCode: r.assetCode,
    amount: r.amount.toString(),
    destination: r.paymentRef,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export type AdminWithdrawalReviewData = {
  transaction: {
    id: string;
    assetCode: string;
    amount: string;
    status: string;
    destination: string | null;
    adminNote: string | null;
    createdAt: Date;
    ledgerTxId: string | null;
  };
  user: {
    id: string;
    email: string;
    kycTier: number;
    emailVerified: boolean;
  };
  kycProfile: { status: string; tierRequested: number } | null;
};

export async function getWithdrawalReviewData(
  txId: string,
): Promise<AdminWithdrawalReviewData | null> {
  const tx = await prisma.transaction.findUnique({
    where: { id: txId, type: "withdrawal" },
    include: {
      user: {
        select: { id: true, email: true, kycTier: true, emailVerified: true },
        include: { kycProfile: { select: { status: true, tierRequested: true } } },
      },
    },
  });

  if (!tx) return null;

  return {
    transaction: {
      id: tx.id,
      assetCode: tx.assetCode,
      amount: tx.amount.toString(),
      status: tx.status,
      destination: tx.paymentRef,
      adminNote: tx.adminNote,
      createdAt: tx.createdAt,
      ledgerTxId: tx.ledgerTxId,
    },
    user: {
      id: tx.user.id,
      email: tx.user.email,
      kycTier: tx.user.kycTier,
      emailVerified: tx.user.emailVerified,
    },
    kycProfile: tx.user.kycProfile,
  };
}

export async function getAdminUserList(limit = 200): Promise<AdminUserRow[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      kycTier: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  });
  return rows;
}

// ── Audit log (paginated) ──────────────────────────────────────────────────────

export type AuditLogEntry = {
  id: string;
  action: string;
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  ipAddress: string | null;
  meta: unknown;
  createdAt: Date;
};

export async function getAuditLog(page: number, pageSize = 50): Promise<{
  entries: AuditLogEntry[];
  total: number;
}> {
  const skip = (page - 1) * pageSize;
  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        action: true,
        actorId: true,
        targetId: true,
        targetType: true,
        ipAddress: true,
        meta: true,
        createdAt: true,
      },
    }),
    prisma.activityLog.count(),
  ]);
  return { entries, total };
}
