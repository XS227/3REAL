import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { cookies } from "next/headers";
import { resolveAdminLang, adminDicts } from "@/lib/i18n/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, cookieStore] = await Promise.all([
    requireRole("super_admin", "operator"),
    cookies(),
  ]);
  const lang = resolveAdminLang(cookieStore.get("lang")?.value);
  const t = adminDicts[lang];

  return (
    <AdminShell email={session.email} role={session.role} lang={lang} t={t}>
      {children}
    </AdminShell>
  );
}
