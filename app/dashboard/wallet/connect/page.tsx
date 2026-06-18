import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { getTonWallets } from "@/lib/ton/queries";
import { ConnectWalletSection } from "@/components/ton/ConnectWalletSection";
import { ConnectedWallets } from "@/components/ton/ConnectedWallets";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConnectWalletPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].walletConnect;
  const wallets = await getTonWallets(session.userId);

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wallet"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          {t.backToWallet}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t.subtitle}
        </p>
      </div>

      {/* Linked wallets */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
          {t.linkedWalletsTitle} ({wallets.length})
        </h2>
        <ConnectedWallets wallets={wallets} t={t} lang={lang} />
      </section>

      {/* Connect flow */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
          {t.connectNewTitle}
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">{t.supportedWalletsLabel}</p>
            <p className="text-xs text-zinc-600">
              {t.supportedWalletsList}
            </p>
          </div>
          <ConnectWalletSection t={t} />
        </div>
      </section>

      {/* Security note */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-xs font-semibold text-zinc-400 mb-2">{t.howItWorksTitle}</h3>
        <ol className="space-y-1 text-xs text-zinc-600 list-decimal list-inside">
          {t.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
