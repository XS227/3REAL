import { requireRole } from "@/lib/auth/guards";
import { getAdminReferralData } from "@/lib/referral/queries";
import {
  Gift,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Coins,
} from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminReferralsPage() {
  await requireRole("super_admin", "operator");
  const { metrics, leaderboard, fraudQueue } = await getAdminReferralData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Referral Program</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Reward totals, leaderboard, and fraud signals
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {[
          {
            label: "Total Referrals",
            value: metrics.totalReferrals,
            color: "text-zinc-100",
            icon: TrendingUp,
          },
          {
            label: "Rewarded",
            value: metrics.totalRewarded,
            color: "text-emerald-400",
            icon: Gift,
          },
          {
            label: "Total Issued",
            value: `${metrics.totalRewardAmount.toLocaleString()} REAL`,
            color: "text-amber-400",
            icon: Coins,
          },
          {
            label: "Pool Balance",
            value: `${metrics.poolBalance.toLocaleString()} REAL`,
            color: metrics.poolBalance < 50000 ? "text-red-400" : "text-emerald-400",
            icon: Coins,
          },
          {
            label: "Fraud Signals",
            value: metrics.suspiciousCount,
            color: metrics.suspiciousCount > 0 ? "text-amber-400" : "text-zinc-600",
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-medium text-zinc-300">Top Referrers</h2>
        </div>
        {leaderboard.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">No referrals yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">#</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">User</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Total Referrals
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Rewarded
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    REAL Earned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {leaderboard.map((row, i) => (
                  <tr key={row.userId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          i === 0
                            ? "text-amber-400"
                            : i === 1
                              ? "text-zinc-400"
                              : i === 2
                                ? "text-orange-600"
                                : "text-zinc-600"
                        }`}
                      >
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {row.displayName && (
                        <p className="text-xs font-medium text-zinc-300">{row.displayName}</p>
                      )}
                      <p className="text-xs text-zinc-500">{row.email}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-semibold tabular-nums text-zinc-300">
                      {row.totalReferrals}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-semibold tabular-nums text-emerald-400">
                      {row.rewardedReferrals}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-amber-400">
                      {row.totalEarned.toLocaleString()} REAL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fraud review queue */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-medium text-zinc-300">Suspicious IP Signals</h2>
          <span className="ml-1.5 text-xs text-zinc-600">3+ referrals from same IP in 24h</span>
        </div>
        {fraudQueue.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">
            No suspicious patterns detected in the last 24 hours
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">
                    Source IP
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Referral Count
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Distinct Referrers
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Latest Activity
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {fraudQueue.map((row) => {
                  const risk = row.referralCount >= 10 ? "High" : row.referralCount >= 5 ? "Medium" : "Low";
                  const riskColor =
                    risk === "High"
                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                      : risk === "Medium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-zinc-400 bg-zinc-700/20 border-zinc-700";
                  return (
                    <tr key={row.ip} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-300">{row.ip}</td>
                      <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-amber-400">
                        {row.referralCount}
                      </td>
                      <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-400">
                        {row.referrerIds.length}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-zinc-500">
                        {fmtDate(row.latestAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${riskColor}`}
                        >
                          {risk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Anti-fraud rules note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
        <h3 className="mb-2 text-xs font-semibold text-zinc-400">Active Anti-Fraud Rules</h3>
        <ul className="space-y-1 text-xs text-zinc-600">
          <li>• Self-referral blocked at registration (referrerId ≠ referredId enforced)</li>
          <li>• Duplicate email blocked at registration (unique email constraint)</li>
          <li>• Same-IP flag: 3+ referrals from same IP in 24h appear in the fraud queue above</li>
          <li>• Reward idempotency: each referral can only be rewarded once (ledgerTxId guard)</li>
          <li>• KYC and deposit bonuses: one per referred user (activity_log guard)</li>
          <li>• Rewards pool: rewards silently skipped if pool balance is depleted</li>
        </ul>
      </div>
    </div>
  );
}
