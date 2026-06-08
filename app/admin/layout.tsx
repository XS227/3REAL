import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("super_admin", "operator");

  return (
    <AdminShell email={session.email} role={session.role}>
      {children}
    </AdminShell>
  );
}
