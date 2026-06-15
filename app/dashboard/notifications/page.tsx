import { requireAuth } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/notifications/queries";
import { NotificationsPageClient } from "@/components/dashboard/NotificationsPage";
import { cookies } from "next/headers";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications — 3REAL" };

export default async function NotificationsPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].notifications;
  const data = await getNotifications(session.userId, 0);

  return <NotificationsPageClient initialData={data} t={t} />;
}
