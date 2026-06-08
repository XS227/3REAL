import { requireRole } from "@/lib/auth/guards";
import { getReportMetrics, parseDateRange } from "@/lib/admin/reports";
import { ReportsDateFilter } from "@/components/admin/ReportsDateFilter";
import { ExportButton } from "@/components/admin/ExportButton";
import { Suspense } from "react";
import {
  Users,
  BadgeCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Coins,
  UserCheck,
  UserPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type SearchParams = { range?: string; from?: string; to?: string };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("super_admin", "operator");
  const sp = await searchParams;
  const dateRange = parseDateRange(sp.range ?? "30d", sp.from, sp.to);
  const metrics = await getReportMetrics(dateRange);

  const cards = [
    {
      label: "Total Users",
      value: fmt(metrics.totalUsers),
      sub: "All time",
      icon: Users,
      color: "text-zinc-300",
      border: "border-zinc-700",
    },
    {
      label: "Verified Users",
      value: fmt(metrics.verifiedUsers),
      sub: `${fmt(Math.round((metrics.verifiedUsers / Math.max(metrics.totalUsers, 1)) * 100))}% of total`,
      icon: UserCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "New Users",
      value: fmt(metrics.newUsersInRange),
      sub: dateRange.label,
      icon: UserPlus,
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Pending KYC",
      value: fmt(metrics.pendingKyc),
      sub: "In queue now",
      icon: BadgeCheck,
      color: metrics.pendingKyc > 0 ? "text-amber-400" : "text-zinc-600",
      border: metrics.pendingKyc > 0 ? "border-amber-500/20" : "border-zinc-700",
    },
    {
      label: "KYC Approved",
      value: fmt(metrics.approvedKycInRange),
      sub: dateRange.label,
      icon: BadgeCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Deposits",
      value: fmt(metrics.totalDeposits),
      sub: `${fmt(metrics.depositVolumeInRange, 2)} volume`,
      icon: ArrowDownLeft,
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Withdrawals",
      value: fmt(metrics.totalWithdrawals),
      sub: `${fmt(metrics.withdrawalVolumeInRange, 2)} volume`,
      icon: ArrowUpRight,
      color: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      label: "Referral Rewards",
      value: fmt(metrics.totalReferralRewardsInRange),
      sub: dateRange.label,
      icon: Gift,
      color: "text-orange-400",
      border: "border-orange-500/20",
    },
    {
      label: "REAL Issued",
      value: `${fmt(metrics.realIssuedInRange, 2)}`,
      sub: "Referral rewards · " + dateRange.label,
      icon: Coins,
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Pool Balance",
      value: `${fmt(metrics.realRemainingInPool, 2)} REAL`,
      sub: "Rewards pool",
      icon: Coins,
      color: metrics.realRemainingInPool < 50000 ? "text-red-400" : "text-emerald-400",
      border: metrics.realRemainingInPool < 50000 ? "border-red-500/20" : "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Operational metrics — <span className="text-zinc-400">{dateRange.label}</span>
          </p>
        </div>
      </div>

      {/* Date filter */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <Suspense>
          <ReportsDateFilter />
        </Suspense>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, sub, icon: Icon, color, border }) => (
          <div
            key={label}
            className={`rounded-xl border ${border} bg-zinc-900 p-4`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="mt-1 text-[11px] text-zinc-600 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* CSV exports */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-5">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">CSV Exports</h2>
        <div className="flex flex-wrap gap-3">
          <ExportButton type="users" label="Export Users" />
          <ExportButton type="deposits" label="Export Deposits" />
          <ExportButton type="withdrawals" label="Export Withdrawals" />
          <ExportButton type="referrals" label="Export Referrals" />
          <ExportButton type="ledger" label="Export Ledger" />
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">
          CSV exports include all records up to the current date and time. Ledger export is capped at 10,000 entries.
        </p>
      </div>
    </div>
  );
}
