import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
};

export async function getNotifications(
  userId: string,
  page = 0,
): Promise<{ notifications: NotificationItem[]; unreadCount: number; hasMore: boolean }> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        referenceId: true,
        referenceType: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const notifications = rows.slice(0, PAGE_SIZE).map((n) => ({
    ...n,
    type: n.type as string,
    createdAt: n.createdAt.toISOString(),
  }));

  return { notifications, unreadCount, hasMore };
}

export async function markOneRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
