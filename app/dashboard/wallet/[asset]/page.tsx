import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { getAsset } from "@/lib/wallet/assets";
import { getAssetDetailData } from "@/lib/wallet/queries";
import { AssetHeader } from "@/components/wallet/AssetHeader";
import { LedgerHistory } from "@/components/wallet/LedgerHistory";
import { AccountExplorer } from "@/components/wallet/AccountExplorer";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ asset: string }>;
}) {
  const { asset } = await params;
  const meta = getAsset(asset);
  if (!meta) notFound();

  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].wallet;

  const { balance, ledgerHistory, account } = await getAssetDetailData(
    session.userId,
    meta.code as AssetCode,
  );

  const accounts = account ? [account] : [];

  return (
    <div className="space-y-8">
      <AssetHeader meta={meta} balance={balance} t={t} />

      <LedgerHistory entries={ledgerHistory} meta={meta} t={t} lang={lang} />

      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-600">
          {t.accountExplorer}
        </h2>
        <AccountExplorer accounts={accounts} t={t} lang={lang} />
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
