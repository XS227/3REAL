import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  return (
    <DashboardShell email={session.email} role={session.role}>
      {children}
    </DashboardShell>
  );
}
