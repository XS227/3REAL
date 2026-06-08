import { Gift } from "lucide-react";
import type { RewardHistoryRow } from "@/lib/referral/queries";

type Props = { rewards: RewardHistoryRow[] };

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RewardHistory({ rewards }: Props) {
  if (rewards.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <Gift className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">No rewards earned yet</p>
        <p className="mt-1 text-xs text-zinc-700">
          Rewards are credited when your referrals verify their email
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Reward History{" "}
          <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {rewards.length}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Date</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">From</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Level</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Amount</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {rewards.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  {fmtDate(row.createdAt)}
                </td>
                <td className="px-5 py-3 text-xs font-mono text-zinc-400">
                  {row.referredEmail}
                </td>
                <td className="px-5 py-3 text-xs text-zinc-400">{row.trigger}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      row.referralLevel === 1
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    L{row.referralLevel}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-emerald-400">
                  +{row.amount} REAL
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    Credited
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
