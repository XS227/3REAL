import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TonConnectProvider } from "@/components/ton/TonConnectProvider";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  const unreadCount = await prisma.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return (
    <TonConnectProvider>
      <DashboardShell email={session.email} role={session.role} initialUnread={unreadCount}>
        {children}
      </DashboardShell>
    </TonConnectProvider>
  );
}
