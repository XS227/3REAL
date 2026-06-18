import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard/queries";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { EcosystemCards } from "@/components/dashboard/EcosystemCards";
import { dashboardDicts, resolveDashboardLang } from "@/lib/i18n/dashboard";

export default async function DashboardPage() {
  const session = await requireAuth();
  const cookieStore = await cookies();
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang];

  const data = await getDashboardData(session.userId);
  const { user, balances, referralStats, recentActivity, recentTransactions, kycProfile } = data;

  if (!user.onboardedAt) {
    redirect("/dashboard/onboarding");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const displayName = user.displayName ?? user.email.split("@")[0];

  const dateLocale = lang === "fa" ? "fa-IR" : "en-US";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            {t.dashboard.welcomeBack}، {displayName}
          </h1>
          <p className="text-sm text-zinc-500">
            {new Date().toLocaleDateString(dateLocale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
            user.emailVerified
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-700 bg-zinc-800 text-zinc-500"
          }`}>
            {user.emailVerified ? t.dashboard.emailVerified : t.dashboard.emailUnverified}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
            {t.dashboard.kyc}: {t.dashboard.kycLabels[user.kycTier] ?? `Tier ${user.kycTier}`}
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 capitalize">
            {user.role.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Balance + profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceCard real={balances.REAL} t={t.dashboard.balanceCard} />
        </div>
        <div>
          <ProfileCard
            emailVerified={user.emailVerified}
            kycTier={user.kycTier}
            kycProfile={kycProfile}
            t={t.dashboard.profileCard}
          />
        </div>
      </div>

      {/* Wallet + referral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WalletCard balances={balances} t={t.dashboard.walletCard} assetNames={t.wallet.assets} />
        </div>
        <div>
          <ReferralCard
            referralCode={user.referralCode}
            baseUrl={baseUrl}
            stats={referralStats}
            t={t.dashboard.referralCard}
          />
        </div>
      </div>

      {/* Ecosystem */}
      <EcosystemCards t={t.dashboard.ecosystem} />

      {/* Activity + transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} t={t.dashboard.recentTransactions} lang={lang} />
        <RecentActivity entries={recentActivity} t={t.dashboard.recentActivity} lang={lang} />
      </div>
    </div>
  );
}
