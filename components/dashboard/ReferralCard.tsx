import { Users, Gift, Clock } from "lucide-react";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { fmtAmount } from "@/lib/ledger/balance";
import type { ReferralStats } from "@/lib/dashboard/queries";

type Props = {
  referralCode: string;
  baseUrl: string;
  stats: ReferralStats;
};

export function ReferralCard({ referralCode, baseUrl, stats }: Props) {
  const referralLink = `${baseUrl}/auth/register?ref=${referralCode}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-300">Referral Program</h2>
      </div>

      {/* Code */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs text-zinc-500">Your referral code</p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-zinc-800 px-3 py-2 font-mono text-base font-bold tracking-wider text-amber-400">
            {referralCode}
          </span>
          <CopyButton text={referralCode} />
        </div>
      </div>

      {/* Link */}
      <div className="mb-5">
        <p className="mb-1.5 text-xs text-zinc-500">Referral link</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
            {referralLink}
          </span>
          <CopyButton text={referralLink} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Users className="h-3 w-3" />
            Invited
          </div>
          <p className="text-lg font-bold text-zinc-100">{stats.invitedCount}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Clock className="h-3 w-3" />
            Pending
          </div>
          <p className="text-lg font-bold text-amber-400 tabular-nums">
            {fmtAmount(stats.pendingRewards)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Gift className="h-3 w-3" />
            Earned
          </div>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">
            {fmtAmount(stats.earnedRewards)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-600">
        50 REAL per direct referral · 15 REAL per indirect
      </p>
    </div>
  );
}
