import { BadgeCheck, Clock, Mail } from "lucide-react";
import type { InviteRow } from "@/lib/referral/queries";

type Props = { invites: InviteRow[] };

const STATUS_STYLES: Record<string, string> = {
  "KYC Verified": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Email Verified": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "Pending Email": "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const REWARD_STYLES: Record<string, string> = {
  rewarded: "text-emerald-400",
  registered: "text-amber-400",
  pending: "text-zinc-600",
  invalidated: "text-red-400",
};

const REWARD_LABEL: Record<string, string> = {
  rewarded: "Rewarded",
  registered: "Pending",
  pending: "Pending",
  invalidated: "Invalid",
};

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InviteTable({ invites }: Props) {
  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <Mail className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">No referrals yet</p>
        <p className="mt-1 text-xs text-zinc-700">
          Share your referral link to start earning REAL rewards
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Invite Tracking{" "}
          <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {invites.length}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">User</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Registered</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Status</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                Reward Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {invites.map((row) => (
              <tr key={row.referralId} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div>
                    {row.displayName && (
                      <p className="text-xs font-medium text-zinc-300">{row.displayName}</p>
                    )}
                    <p className="text-xs font-mono text-zinc-500">{row.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500">
                  {fmtDate(row.registeredAt)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[row.status] ?? "text-zinc-500 bg-zinc-800 border-zinc-700"}`}
                  >
                    {row.status === "KYC Verified" ? (
                      <BadgeCheck className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`text-xs font-medium ${REWARD_STYLES[row.rewardStatus] ?? "text-zinc-600"}`}
                  >
                    {REWARD_LABEL[row.rewardStatus] ?? row.rewardStatus}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs font-semibold tabular-nums text-zinc-300">
                  {row.rewardAmount > 0 ? `${row.rewardAmount} REAL` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
