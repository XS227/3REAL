import { prisma } from "@/lib/prisma";
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
}
