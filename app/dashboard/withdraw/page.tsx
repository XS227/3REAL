import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getUserBalances } from "@/lib/ledger/balance";
import { getWithdrawalHistory } from "@/lib/withdrawals/queries";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import { cookies } from "next/headers";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { ArrowUpRight } from "lucide-react";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

const VALID_ASSETS: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>;
}) {
  const [session, { asset: assetParam }, cookieStore] = await Promise.all([
    requireAuth(),
    searchParams,
    cookies(),
  ]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].withdraw;

  const assetCode =
    VALID_ASSETS.find((a) => a === (assetParam ?? "").toUpperCase()) ?? "REAL";

  const [user, balances, withdrawals] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { emailVerified: true, kycTier: true },
    }),
    getUserBalances(session.userId),
    getWithdrawalHistory(session.userId),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpRight className="h-5 w-5 text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
        </div>
        <p className="text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      {/* Withdrawal form */}
      <WithdrawalForm
        initialAsset={assetCode}
        kycTier={session.kycTier}
        emailVerified={user.emailVerified}
        balances={balances}
      />

      {/* Withdrawal history */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">{t.yourWithdrawals}</h2>
        <WithdrawalHistory rows={withdrawals} />
      </div>
    </div>
  );
}
