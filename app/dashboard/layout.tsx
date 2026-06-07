import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">3REAL</span>
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
