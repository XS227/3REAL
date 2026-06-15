import { requireAuth } from "@/lib/auth/guards";
import { getReferralPageData } from "@/lib/referral/queries";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { InviteTable } from "@/components/referral/InviteTable";
import { RewardHistory } from "@/components/referral/RewardHistory";
import { EarningsCalculator } from "@/components/referral/EarningsCalculator";
import { QRCodeDisplay } from "@/components/referral/QRCodeDisplay";
import { cookies } from "next/headers";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { Gift, Users, Clock, TrendingUp, Coins } from "lucide-react";
import { fmtAmount } from "@/lib/ledger/balance";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="mb-1 text-xs font-medium text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color ?? "text-zinc-100"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-zinc-600">{sub}</p>}
    </div>
  );
}

export default async function ReferralsPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].referrals;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3003" : "https://3real.no");

  const data = await getReferralPageData(session.userId, baseUrl);
  const { overview, invites, rewardHistory, poolBalance } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard
          label={t.stats.totalInvites}
          value={overview.totalInvites}
          color="text-zinc-100"
        />
        <StatCard
          label={t.stats.activeReferrals}
          value={overview.activeReferrals}
          color="text-sky-400"
        />
        <StatCard
          label={t.stats.pending}
          value={`${fmtAmount(overview.pendingRewards)} REAL`}
          color="text-amber-400"
          sub={t.stats.awaitingActivity}
        />
        <StatCard
          label={t.stats.earned}
          value={`${fmtAmount(overview.earnedRewards)} REAL`}
          color="text-emerald-400"
          sub={t.stats.fromReferrals}
        />
        <StatCard
          label={t.stats.lifetimeReal}
          value={`${fmtAmount(overview.lifetimeRewards)} REAL`}
          color="text-amber-300"
          sub={t.stats.allReferralRewards}
        />
      </div>

      {/* Share tools + Pool info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Share card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-medium text-zinc-300">{t.shareTitle}</h2>
          </div>

          {/* Referral code */}
          <div className="mb-4">
            <p className="mb-2 text-xs text-zinc-500">{t.yourCode}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-zinc-800 px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-amber-400">
                {overview.code}
              </span>
              <CopyButton text={overview.code} />
            </div>
          </div>

          {/* Referral link */}
          <div className="mb-5">
            <p className="mb-2 text-xs text-zinc-500">{t.yourLink}</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate rounded-lg bg-zinc-800 px-3 py-2.5 text-xs text-zinc-400">
                {overview.link}
              </span>
              <CopyButton text={overview.link} />
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-2">
            <QRCodeDisplay value={overview.link} />
          </div>

          <div className="mt-4 rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
            <p className="font-medium text-zinc-400 mb-1">{t.howItWorks}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Friend registers with your code → pending</li>
              <li>Friend verifies email → <span className="text-amber-400">50 REAL</span> credited instantly</li>
              <li>Friend completes KYC → <span className="text-amber-400">+25 REAL</span> bonus</li>
              <li>Friend makes first deposit → <span className="text-amber-400">+10 REAL</span> bonus</li>
              <li>Friend refers others → you earn <span className="text-zinc-300">15 REAL</span> per (L2)</li>
            </ul>
          </div>
        </div>

        {/* Earnings calculator */}
        <EarningsCalculator />
      </div>

      {/* Invite tracking */}
      <InviteTable invites={invites} />

      {/* Reward history */}
      <RewardHistory rewards={rewardHistory} />

      {/* Pool info footer */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Coins className="h-3.5 w-3.5" />
          {t.poolBalance}
        </div>
        <span className="text-xs font-semibold tabular-nums text-zinc-400">
          {poolBalance.toLocaleString()} REAL
        </span>
      </div>
    </div>
  );
}
