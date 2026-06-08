import { requireRole } from "@/lib/auth/guards";
import { getAnalyticsData } from "@/lib/admin/analytics";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { Trophy, Zap, ArrowDownLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminAnalyticsPage() {
  await requireRole("super_admin", "operator");
  const data = await getAnalyticsData();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">30-day trends and top performers</p>
      </div>

      {/* Charts */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          30-Day Trends
        </h2>
        <AnalyticsCharts
          userGrowth={data.userGrowth}
          kycApprovals={data.kycApprovals}
          depositVolume={data.depositVolume}
          withdrawalVolume={data.withdrawalVolume}
          referralActivity={data.referralActivity}
        />
      </section>

      {/* Top lists grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Top referrers */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-medium text-zinc-300">Top Referrers</h2>
          </div>
          {data.topReferrers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">No data</p>
          ) : (
            <ul className="divide-y divide-zinc-800/40">
              {data.topReferrers.map((r, i) => (
                <li key={r.email} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`w-5 text-center text-xs font-bold tabular-nums ${
                      i === 0
                        ? "text-amber-400"
                        : i === 1
                          ? "text-zinc-400"
                          : i === 2
                            ? "text-orange-600"
                            : "text-zinc-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {r.displayName && (
                      <p className="truncate text-xs font-medium text-zinc-300">{r.displayName}</p>
                    )}
                    <p className="truncate text-xs text-zinc-500">{r.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold tabular-nums text-amber-400">
                      {r.realEarned.toLocaleString()} REAL
                    </p>
                    <p className="text-[10px] text-zinc-600">{r.totalReferrals} refs</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Most active users */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-medium text-zinc-300">Most Active Users</h2>
            <span className="text-xs text-zinc-600">Last 30 days</span>
          </div>
          {data.mostActiveUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">No data</p>
          ) : (
            <ul className="divide-y divide-zinc-800/40">
              {data.mostActiveUsers.map((u, i) => (
                <li key={u.email} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-center text-xs font-bold tabular-nums text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {u.displayName && (
                      <p className="truncate text-xs font-medium text-zinc-300">{u.displayName}</p>
                    )}
                    <p className="truncate text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-emerald-400">
                    {u.actions} actions
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Largest deposits */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
            <ArrowDownLeft className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-medium text-zinc-300">Largest Deposits</h2>
          </div>
          {data.largestDeposits.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">No data</p>
          ) : (
            <ul className="divide-y divide-zinc-800/40">
              {data.largestDeposits.map((d, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-center text-xs font-bold tabular-nums text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-zinc-500">{d.email}</p>
                    <p className="text-[10px] text-zinc-600">{fmtDate(d.date)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-blue-400">
                    {d.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {d.assetCode}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
