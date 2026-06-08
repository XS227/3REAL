import { requireRole } from "@/lib/auth/guards";
import { getAdminMetrics, getRecentAdminActivity } from "@/lib/admin/queries";
import { Users, BadgeCheck, ArrowDownLeft, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "kyc.approved": "KYC Approved",
  "kyc.rejected": "KYC Rejected",
  "kyc.update_requested": "KYC Update Requested",
  "deposit.created": "Deposit Submitted",
  "deposit.approved": "Deposit Approved",
  "deposit.rejected": "Deposit Rejected",
};

function metaSummary(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  return Object.entries(meta as Record<string, unknown>)
    .filter(([k]) => !["txId", "profileId"].includes(k))
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const session = await requireRole("super_admin", "operator");
  const [metrics, activity] = await Promise.all([
    getAdminMetrics(),
    getRecentAdminActivity(20),
  ]);

  const metricCards = [
    {
      label: "Total Users",
      value: metrics.totalUsers,
      icon: Users,
      color: "text-zinc-400",
      bg: "bg-zinc-800/50",
    },
    {
      label: "Pending KYC",
      value: metrics.pendingKyc,
      icon: BadgeCheck,
      color: metrics.pendingKyc > 0 ? "text-amber-400" : "text-zinc-600",
      bg: metrics.pendingKyc > 0 ? "bg-amber-500/10" : "bg-zinc-800/50",
    },
    {
      label: "Pending Deposits",
      value: metrics.pendingDeposits,
      icon: ArrowDownLeft,
      color: metrics.pendingDeposits > 0 ? "text-amber-400" : "text-zinc-600",
      bg: metrics.pendingDeposits > 0 ? "bg-amber-500/10" : "bg-zinc-800/50",
    },
    {
      label: "Approved Today",
      value: metrics.approvedToday,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Rejected Today",
      value: metrics.rejectedToday,
      icon: XCircle,
      color: metrics.rejectedToday > 0 ? "text-red-400" : "text-zinc-600",
      bg: metrics.rejectedToday > 0 ? "bg-red-500/10" : "bg-zinc-800/50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Logged in as <span className="text-zinc-300">{session.email}</span> ·{" "}
          <span className="capitalize text-zinc-400">{session.role.replace(/_/g, " ")}</span>
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border border-zinc-800 ${bg} p-4`}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-medium text-zinc-300">Recent Admin Activity</h2>
        </div>

        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">No admin activity yet</p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </p>
                  {metaSummary(entry.meta) && (
                    <p className="text-xs text-zinc-600 mt-0.5">{metaSummary(entry.meta)}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-600 shrink-0">{fmtTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
