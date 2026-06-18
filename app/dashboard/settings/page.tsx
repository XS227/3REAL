import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { SettingsPage } from "@/components/dashboard/SettingsForm";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].settings;

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
          <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t.subtitle}</p>
        </div>
      </div>

      <SettingsPage
        displayName={user.displayName}
        email={user.email}
        isGoogleAccount={!user.passwordHash}
        t={t}
      />
    </div>
  );
}
