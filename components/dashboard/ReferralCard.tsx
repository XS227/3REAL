import { Users, Gift, Clock } from "lucide-react";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { fmtAmount } from "@/lib/ledger/balance";
import type { ReferralStats } from "@/lib/dashboard/queries";
import type { DashboardDict } from "@/lib/i18n/dashboard";

type Props = {
  referralCode: string;
  baseUrl: string;
  stats: ReferralStats;
  t: DashboardDict["dashboard"]["referralCard"];
};

export function ReferralCard({ referralCode, baseUrl, stats, t }: Props) {
  const referralLink = `${baseUrl}/auth/register?ref=${referralCode}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-300">{t.title}</h2>
      </div>

      {/* Code */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs text-zinc-500">{t.yourCode}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-zinc-800 px-3 py-2 font-mono text-base font-bold tracking-wider text-amber-400">
            {referralCode}
          </span>
          <CopyButton text={referralCode} copyLabel={t.copyLink} copiedLabel={t.copied} />
        </div>
      </div>

      {/* Link */}
      <div className="mb-5">
        <p className="mb-1.5 text-xs text-zinc-500">{t.copyLink}</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
            {referralLink}
          </span>
          <CopyButton text={referralLink} copyLabel={t.copyLink} copiedLabel={t.copied} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Users className="h-3 w-3" />
            {t.invited}
          </div>
          <p className="text-lg font-bold text-zinc-100">{stats.invitedCount}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Clock className="h-3 w-3" />
            {t.pending}
          </div>
          <p className="text-lg font-bold text-amber-400 tabular-nums">
            {fmtAmount(stats.pendingRewards)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
            <Gift className="h-3 w-3" />
            {t.earned}
          </div>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">
            {fmtAmount(stats.earnedRewards)}
          </p>
        </div>
      </div>
    </div>
  );
}
