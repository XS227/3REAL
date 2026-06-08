import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { issueKycReward } from "@/lib/referral/engine";

export async function approveKYC(profileId: string, reviewerId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.kycProfile.findUniqueOrThrow({
      where: { id: profileId },
    });

    if (profile.status !== "pending" && profile.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    const now = new Date();

    await tx.kycProfile.update({
      where: { id: profileId },
      data: { status: "approved", reviewedById: reviewerId, reviewedAt: now },
    });

    // Upgrade user KYC tier and bump sessionVersion so stale tokens pick up fresh kycTier
    await tx.user.update({
      where: { id: profile.userId },
      data: {
        kycTier: profile.tierRequested,
        sessionVersion: { increment: 1 },
      },
    });

    await tx.kycDocument.updateMany({
      where: { kycProfileId: profileId, status: "pending" },
      data: { status: "approved", reviewedById: reviewerId, reviewedAt: now },
    });
  });

  const profile = await prisma.kycProfile.findUniqueOrThrow({ where: { id: profileId } });
  await audit({
    actorId: reviewerId,
    targetId: profile.userId,
    targetType: "user",
    action: "kyc.approved",
    meta: { profileId, tierGranted: profile.tierRequested },
  });
  await createNotification({
    userId: profile.userId,
    type: "kyc_approved",
    title: "Identity Verification Approved",
    body: `Your KYC submission has been approved. You are now verified at Tier ${profile.tierRequested}.`,
    referenceId: profileId,
    referenceType: "kyc_profile",
  });

  // Fire-and-forget referral bonus
  issueKycReward(profile.userId).catch(() => {});
}

export async function rejectKYC(
  profileId: string,
  reviewerId: string,
  reason: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.kycProfile.findUniqueOrThrow({ where: { id: profileId } });

    if (profile.status !== "pending" && profile.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    await tx.kycProfile.update({
      where: { id: profileId },
      data: {
        status: "rejected",
        rejectionReason: reason,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  });

  const profile = await prisma.kycProfile.findUniqueOrThrow({ where: { id: profileId } });
  await audit({
    actorId: reviewerId,
    targetId: profile.userId,
    targetType: "user",
    action: "kyc.rejected",
    meta: { profileId, reason },
  });
  await createNotification({
    userId: profile.userId,
    type: "kyc_rejected",
    title: "Identity Verification Rejected",
    body: `Your KYC submission was rejected. Reason: ${reason}`,
    referenceId: profileId,
    referenceType: "kyc_profile",
  });
}

export async function requestUpdate(
  profileId: string,
  reviewerId: string,
  reason: string,
  docIds?: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.kycProfile.findUniqueOrThrow({ where: { id: profileId } });

    if (profile.status !== "pending" && profile.status !== "under_review") {
      throw new Error("INVALID_STATE");
    }

    const now = new Date();

    await tx.kycProfile.update({
      where: { id: profileId },
      data: {
        status: "update_requested",
        rejectionReason: reason,
        reviewedById: reviewerId,
        reviewedAt: now,
      },
    });

    // Optionally flag specific documents that need replacement
    if (docIds && docIds.length > 0) {
      await tx.kycDocument.updateMany({
        where: { id: { in: docIds } },
        data: {
          status: "rejected",
          rejectionReason: reason,
          reviewedById: reviewerId,
          reviewedAt: now,
        },
      });
    }
  });

  const profile = await prisma.kycProfile.findUniqueOrThrow({ where: { id: profileId } });
  await audit({
    actorId: reviewerId,
    targetId: profile.userId,
    targetType: "user",
    action: "kyc.update_requested",
    meta: { profileId, reason, docIds },
  });
  await createNotification({
    userId: profile.userId,
    type: "kyc_update_requested",
    title: "Identity Verification — Update Required",
    body: `Your KYC submission requires an update. Reason: ${reason}`,
    referenceId: profileId,
    referenceType: "kyc_profile",
  });
}
