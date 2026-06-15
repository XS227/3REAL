import { prisma } from "@/lib/prisma";
import { sendEmail, kycApprovedEmail, kycRejectedEmail, kycUpdateRequestedEmail, depositApprovedEmail, depositRejectedEmail, withdrawalApprovedEmail, withdrawalRejectedEmail, referralRewardEmail } from "@/lib/email";
import type { NotificationType } from "@/lib/generated/prisma/enums";

export type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
};

// Fire-and-forget — never throws; notification failures must not break the main flow.
export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        referenceId: payload.referenceId ?? null,
        referenceType: payload.referenceType ?? null,
        channel: "in_app",
        deliveryStatus: "sent",
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
  }

  // Send transactional email alongside the in-app notification (fire-and-forget)
  sendTransactionalEmail(payload).catch((err) => {
    console.error("[notifications] Failed to send email for", payload.type, err);
  });
}

async function sendTransactionalEmail(payload: NotificationPayload): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true },
  });
  if (!user) return;

  const to = user.email;
  const body = payload.body;

  // Extract structured data from the notification body using simple heuristics.
  // Each service sets body text with the key numbers embedded — parse them back.
  let emailOpts: { to: string; subject: string; html: string; text?: string } | null = null;

  switch (payload.type) {
    case "kyc_approved": {
      // body: "... approved. You are now verified at Tier X."
      const tier = parseInt(body.match(/Tier (\d)/)?.[1] ?? "2", 10);
      emailOpts = kycApprovedEmail(to, tier);
      break;
    }
    case "kyc_rejected": {
      // body: "... rejected. Reason: <reason>"
      const reason = body.replace(/^.*Reason:\s*/i, "");
      emailOpts = kycRejectedEmail(to, reason);
      break;
    }
    case "kyc_update_requested": {
      const reason = body.replace(/^.*Reason:\s*/i, "");
      emailOpts = kycUpdateRequestedEmail(to, reason);
      break;
    }
    case "deposit_approved": {
      // body: "Your deposit of X ASSET has been approved..."
      const m = body.match(/deposit of ([\d.]+) ([A-Z]+)/);
      if (m) emailOpts = depositApprovedEmail(to, parseFloat(m[1]), m[2]);
      break;
    }
    case "deposit_rejected": {
      // body: "Your deposit of X ASSET was rejected. Reason: <reason>"
      const m = body.match(/deposit of ([\d.]+) ([A-Z]+).*Reason:\s*(.*)/);
      if (m) emailOpts = depositRejectedEmail(to, parseFloat(m[1]), m[2], m[3]);
      break;
    }
    case "withdrawal_approved": {
      // body: "Your withdrawal of X ASSET has been approved..."
      const m = body.match(/withdrawal of ([\d.]+) ([A-Z]+)/);
      if (m) emailOpts = withdrawalApprovedEmail(to, parseFloat(m[1]), m[2]);
      break;
    }
    case "withdrawal_rejected": {
      // body: "Your withdrawal of X ASSET was rejected. Reason: <reason>"
      const m = body.match(/withdrawal of ([\d.]+) ([A-Z]+).*Reason:\s*(.*)/);
      if (m) emailOpts = withdrawalRejectedEmail(to, parseFloat(m[1]), m[2], m[3]);
      break;
    }
    case "referral_reward": {
      // body: "You earned X REAL..."
      const m = body.match(/([\d.]+) REAL/);
      if (m) emailOpts = referralRewardEmail(to, parseFloat(m[1]));
      break;
    }
    default:
      return;
  }

  if (emailOpts) {
    await sendEmail(emailOpts);
  }
}
