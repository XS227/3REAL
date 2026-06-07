import { requireAuth } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard/queries";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { EcosystemCards } from "@/components/dashboard/EcosystemCards";

export default async function DashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData(session.userId);
  const { user, balances, referralStats, recentActivity, recentTransactions, kycProfile } = data;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const displayName = user.displayName ?? user.email.split("@")[0];

  const kycLabel: Record<number, string> = {
    0: "Not verified",
    1: "Email tier",
    2: "ID verified",
    3: "Full KYC",
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-zinc-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Quick status chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              user.emailVerified
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-700 bg-zinc-800 text-zinc-500"
            }`}
          >
            {user.emailVerified ? "Email verified" : "Email unverified"}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
            KYC: {kycLabel[user.kycTier] ?? `Tier ${user.kycTier}`}
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 capitalize">
            {user.role.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Main grid: balance + profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceCard real={balances.REAL} />
        </div>
        <div>
          <ProfileCard
            emailVerified={user.emailVerified}
            kycTier={user.kycTier}
            twoFaEnabled={user.twoFaEnabled}
            kycProfile={kycProfile}
          />
        </div>
      </div>

      {/* Wallet + referral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WalletCard balances={balances} />
        </div>
        <div>
          <ReferralCard
            referralCode={user.referralCode}
            baseUrl={baseUrl}
            stats={referralStats}
          />
        </div>
      </div>

      {/* Ecosystem */}
      <EcosystemCards />

      {/* Activity + transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} />
        <RecentActivity entries={recentActivity} />
      </div>
    </div>
  );
}
