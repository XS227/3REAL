import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { SettingsPage } from "@/components/dashboard/SettingsForm";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true, email: true, googleId: true, passwordHash: true },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your account preferences</p>
        </div>
      </div>

      <SettingsPage
        displayName={user.displayName}
        email={user.email}
        isGoogleAccount={!user.passwordHash}
      />
    </div>
  );
}
