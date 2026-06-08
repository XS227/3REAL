import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TonConnectProvider } from "@/components/ton/TonConnectProvider";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  return (
    <TonConnectProvider>
      <DashboardShell email={session.email} role={session.role}>
        {children}
      </DashboardShell>
    </TonConnectProvider>
  );
}
