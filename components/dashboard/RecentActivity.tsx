import { Activity } from "lucide-react";
import type { ActivityEntry } from "@/lib/dashboard/queries";

type Props = { entries: ActivityEntry[] };

const ACTION_LABEL: Record<string, string> = {
  "auth.register": "Registered account",
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.email_verified": "Email verified",
  "auth.password_reset_requested": "Password reset requested",
  "auth.password_reset": "Password reset",
  "auth.failed_login": "Failed sign-in attempt",
};

function formatAction(action: string): string {
  return ACTION_LABEL[action] ?? action.replace(/\./g, " › ");
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentActivity({ entries }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">Recent Activity</h2>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-600">No activity yet</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-zinc-300">{formatAction(entry.action)}</p>
                {entry.ipAddress && (
                  <p className="text-xs text-zinc-600">{entry.ipAddress}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-zinc-600">
                {timeAgo(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
