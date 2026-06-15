import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { getUserBalances, fmtAmount } from "@/lib/ledger/balance";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserActiveToggle, UserRoleSelect } from "@/components/admin/UserActions";
import {
  User,
  ArrowLeft,
  ShieldCheck,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  ScrollText,
  CalendarDays,
  Mail,
  Globe,
} from "lucide-react";

export const dynamic = "force-dynamic";

const KYC_LABEL: Record<number, string> = {
  0: "Tier 0 — Unverified",
  1: "Tier 1 — Email Verified",
  2: "Tier 2 — ID Verified",
  3: "Tier 3 — Full KYC",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
      <span className="text-zinc-400">{icon}</span>
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("super_admin", "operator");
  const isSuperAdmin = session.role === "super_admin";

  const [user, balances] = await Promise.all([
    getAdminUserDetail(id),
    getUserBalances(id),
  ]);

  if (!user) notFound();

  const isUserSuperAdmin = user.role === "super_admin";
  const isSelf = user.id === session.userId;

  const ASSET_ORDER = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Users
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-zinc-100">
                {user.displayName ?? user.email}
              </h1>
              {user.displayName && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              )}
              <p className="flex items-center gap-1.5 text-xs text-zinc-600">
                <CalendarDays className="h-3 w-3" />
                Joined {fmtDate(user.createdAt)}
              </p>
              {user.googleId && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Globe className="h-3 w-3" />
                  Google-linked account
                </p>
              )}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 items-start">
            <StatusBadge status={user.isActive ? "active" : "inactive"} />
            <StatusBadge status={user.emailVerified ? "approved" : "pending"} />
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
              {KYC_LABEL[user.kycTier] ?? `Tier ${user.kycTier}`}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        {isSuperAdmin && (
          <div className="mt-5 pt-5 border-t border-zinc-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Role:</span>
              <UserRoleSelect
                userId={user.id}
                currentRole={user.role as "user" | "operator" | "super_admin"}
                isSelf={isSelf}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Account:</span>
              <UserActiveToggle
                userId={user.id}
                isActive={user.isActive}
                isSuperAdmin={isUserSuperAdmin}
              />
            </div>
          </div>
        )}
      </div>

      {/* Balances */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <SectionHeader icon={<Wallet className="h-4 w-4" />} title="Asset Balances" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ASSET_ORDER.map((code) => {
            const b = balances[code];
            return (
              <div key={code} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {code}
                </p>
                <p className="text-lg font-mono font-bold text-zinc-100">
                  {fmtAmount(b.available, code === "REAL" || code === "TON" ? 4 : 2)}
                </p>
                {b.pending !== 0 && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    +{fmtAmount(b.pending, 2)} pending
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KYC */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="KYC Profile" />
        {user.kycProfile ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={user.kycProfile.status} />
                <span className="text-xs text-zinc-500">
                  Tier {user.kycProfile.tierRequested} requested
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                Submitted: {fmtDate(user.kycProfile.createdAt)}
              </p>
              {user.kycProfile.reviewedAt && (
                <p className="text-xs text-zinc-600">
                  Reviewed: {fmtDate(user.kycProfile.reviewedAt)}
                </p>
              )}
              {user.kycProfile.rejectionReason && (
                <p className="text-xs text-red-400">
                  Rejection reason: {user.kycProfile.rejectionReason}
                </p>
              )}
            </div>
            <Link
              href={`/admin/kyc/${user.kycProfile.id}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              View KYC submission →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No KYC submission on file.</p>
        )}
      </div>

      {/* Referrals */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <SectionHeader icon={<Gift className="h-4 w-4" />} title="Referrals" />
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Referral Code</p>
            <p className="font-mono text-sm font-semibold text-amber-400">{user.referralCode}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Total Invited</p>
            <p className="text-lg font-bold text-zinc-100">{user.referralStats.invitedCount}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Lifetime Rewards</p>
            <p className="text-lg font-bold text-zinc-100">
              {fmtAmount(user.referralStats.earnedRewards, 2)}{" "}
              <span className="text-xs text-zinc-500">REAL</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent deposits & withdrawals — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposits */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <SectionHeader
            icon={<ArrowDownLeft className="h-4 w-4" />}
            title={`Deposits (last ${user.recentDeposits.length})`}
          />
          {user.recentDeposits.length === 0 ? (
            <p className="text-sm text-zinc-600">No deposits yet.</p>
          ) : (
            <div className="space-y-0 divide-y divide-zinc-800/60">
              {user.recentDeposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-zinc-200 font-mono">
                      {fmtAmount(Number(d.amount), 2)}{" "}
                      <span className="text-zinc-500">{d.assetCode}</span>
                    </p>
                    <p className="text-xs text-zinc-600">{fmtDateShort(d.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <Link
                      href={`/admin/deposits/${d.id}`}
                      className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                    >
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawals */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <SectionHeader
            icon={<ArrowUpRight className="h-4 w-4" />}
            title={`Withdrawals (last ${user.recentWithdrawals.length})`}
          />
          {user.recentWithdrawals.length === 0 ? (
            <p className="text-sm text-zinc-600">No withdrawals yet.</p>
          ) : (
            <div className="space-y-0 divide-y divide-zinc-800/60">
              {user.recentWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-zinc-200 font-mono">
                      {fmtAmount(Number(w.amount), 2)}{" "}
                      <span className="text-zinc-500">{w.assetCode}</span>
                    </p>
                    <p className="text-xs text-zinc-600">{fmtDateShort(w.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={w.status} />
                    <Link
                      href={`/admin/withdrawals/${w.id}`}
                      className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                    >
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <SectionHeader
          icon={<ScrollText className="h-4 w-4" />}
          title={`Activity Log (last ${user.recentActivity.length})`}
        />
        {user.recentActivity.length === 0 ? (
          <p className="text-sm text-zinc-600">No activity recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left">
                  {["Time", "Action", "IP", "Role"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {user.recentActivity.map((entry) => (
                  <tr key={entry.id} className="text-xs">
                    <td className="py-2 pr-4 text-zinc-500 whitespace-nowrap">
                      {fmtDate(entry.createdAt)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-zinc-300 whitespace-nowrap">
                      {entry.action}
                    </td>
                    <td className="py-2 pr-4 text-zinc-600 font-mono">
                      {entry.ipAddress ?? "—"}
                    </td>
                    <td className="py-2 text-zinc-600 truncate max-w-[180px]">
                      {entry.meta ? JSON.stringify(entry.meta).slice(0, 60) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
