import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDepositHistory } from "@/lib/deposits/queries";
import { getRealDepositHistory } from "@/lib/ton/deposits";
import { getTonSettings } from "@/lib/ton/settings";
import { getTonWallets } from "@/lib/ton/queries";
import { getPlatformSettings } from "@/lib/settings/platform";
import { buildDepositInstructions } from "@/lib/deposits/instructions";
import { DepositForm } from "@/components/deposits/DepositForm";
import { DepositHistory } from "@/components/deposits/DepositHistory";
import { RealDepositSection } from "@/components/ton/RealDepositSection";
import { cookies } from "next/headers";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { ArrowDownLeft } from "lucide-react";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

const VALID_ASSETS: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

export default async function DepositPage({
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
  const t = dashboardDicts[lang].deposit;

  const assetCode =
    VALID_ASSETS.find((a) => a === (assetParam ?? "").toUpperCase()) ?? "REAL";

  const isRealBlockchain = assetCode === "REAL";

  // Parallel data fetch — only load blockchain data when REAL is selected
  const [user, deposits, tonWallets, tonSettings, realDeposits, platformSettings] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { emailVerified: true, kycTier: true, referralCode: true },
    }),
    getDepositHistory(session.userId),
    isRealBlockchain ? getTonWallets(session.userId) : Promise.resolve([]),
    isRealBlockchain ? getTonSettings() : Promise.resolve(null),
    isRealBlockchain ? getRealDepositHistory(session.userId, 20) : Promise.resolve([]),
    getPlatformSettings(),
  ]);

  const depositInstructions = buildDepositInstructions(platformSettings);

  const depositAddress = tonSettings?.depositAddress ?? "";

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {isRealBlockchain ? t.autoCredit : t.manualApproval}
        </p>
      </div>

      {/* REAL asset: blockchain deposit flow */}
      {isRealBlockchain && depositAddress ? (
        <RealDepositSection
          depositAddress={depositAddress}
          walletCount={tonWallets.length}
          initialDeposits={realDeposits.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      ) : isRealBlockchain ? (
        /* No deposit address configured yet — fall through to manual form */
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-sm text-zinc-400">
            Automated REAL deposits are not yet configured. Use the manual form below to
            submit a deposit request.
          </p>
        </div>
      ) : null}

      {/* Non-REAL assets or fallback manual form */}
      {(!isRealBlockchain || !depositAddress) && (
        <DepositForm
          initialAsset={assetCode}
          kycTier={session.kycTier}
          emailVerified={user.emailVerified}
          referralCode={user.referralCode}
          instructions={depositInstructions}
        />
      )}

      {/* Deposit history (all assets except REAL blockchain — shown in RealDepositSection) */}
      {!isRealBlockchain && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">{t.yourDeposits}</h2>
          <DepositHistory deposits={deposits} />
        </div>
      )}

      {/* For REAL, show the full deposit history below the section */}
      {isRealBlockchain && deposits.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">{t.allHistory}</h2>
          <DepositHistory deposits={deposits} />
        </div>
      )}
    </div>
  );
}
