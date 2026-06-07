import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("super_admin", "operator");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">3REAL</span>
            <span className="text-xs border rounded px-1.5 py-0.5 text-muted-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
