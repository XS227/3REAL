import { Activity } from "lucide-react";
import type { ActivityEntry } from "@/lib/dashboard/queries";
import { dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";

type Props = {
  entries: ActivityEntry[];
  t: DashboardDict["dashboard"]["recentActivity"];
  lang: Lang;
};

function timeAgo(date: Date, t: DashboardDict["dashboard"]["recentActivity"], lang: Lang): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${t.minutesAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${t.hoursAgo}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${t.daysAgo}`;
  return date.toLocaleDateString(dateLocale(lang), { month: "short", day: "numeric" });
}

export function RecentActivity({ entries, t, lang }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">{t.title}</h2>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-600">{t.noActivity}</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-zinc-300">
                  {t.actions[entry.action] ?? entry.action.replace(/\./g, " › ")}
                </p>
                {entry.ipAddress && (
                  <p className="text-xs text-zinc-600">{entry.ipAddress}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-zinc-600">
                {timeAgo(entry.createdAt, t, lang)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
