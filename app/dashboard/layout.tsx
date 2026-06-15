import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TonConnectProvider } from "@/components/ton/TonConnectProvider";
import { prisma } from "@/lib/prisma";
import { dashboardDicts, resolveDashboardLang } from "@/lib/i18n/dashboard";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();
  const cookieStore = await cookies();
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang];

  const unreadCount = await prisma.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return (
    <TonConnectProvider>
      <DashboardShell
        email={session.email}
        role={session.role}
        initialUnread={unreadCount}
        lang={lang}
        t={t}
      >
        {children}
      </DashboardShell>
    </TonConnectProvider>
  );
}
