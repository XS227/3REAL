import { requireAuth } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/notifications/queries";
import { NotificationsPageClient } from "@/components/dashboard/NotificationsPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications — 3REAL" };

export default async function NotificationsPage() {
  const session = await requireAuth();
  const data = await getNotifications(session.userId, 0);

  return <NotificationsPageClient initialData={data} />;
}
