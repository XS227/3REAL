import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDepositHistory } from "@/lib/deposits/queries";
import { DepositForm } from "@/components/deposits/DepositForm";
import { DepositHistory } from "@/components/deposits/DepositHistory";
import { ArrowDownLeft } from "lucide-react";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { ASSETS } from "@/lib/wallet/assets";

export const dynamic = "force-dynamic";

const VALID_ASSETS: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>;
}) {
  const [session, { asset: assetParam }] = await Promise.all([
    requireAuth(),
    searchParams,
  ]);

  const assetCode =
    VALID_ASSETS.find(
      (a) => a === (assetParam ?? "").toUpperCase(),
    ) ?? "REAL";

  const [user, deposits] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { emailVerified: true, kycTier: true, referralCode: true },
    }),
    getDepositHistory(session.userId),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Deposit</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Submit a deposit request. Funds are credited after manual admin approval.
        </p>
      </div>

      {/* Deposit form */}
      <DepositForm
        initialAsset={assetCode}
        kycTier={session.kycTier}
        emailVerified={user.emailVerified}
        referralCode={user.referralCode}
      />

      {/* Deposit history */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Your Deposits</h2>
        <DepositHistory deposits={deposits} />
      </div>
    </div>
  );
}
