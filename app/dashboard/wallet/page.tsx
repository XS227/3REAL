import { requireAuth } from "@/lib/auth/guards";
import { getWalletPageData } from "@/lib/wallet/queries";
import { ASSET_ORDER, ASSETS } from "@/lib/wallet/assets";
import { AssetCard } from "@/components/wallet/AssetCard";
import { AccountExplorer } from "@/components/wallet/AccountExplorer";
import { getTonWallets } from "@/lib/ton/queries";
import { TonWalletBalances } from "@/components/ton/TonWalletBalances";
import Link from "next/link";
import { Wallet, Plus, Star, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await requireAuth();
  const [{ balances, accounts }, tonWallets] = await Promise.all([
    getWalletPageData(session.userId),
    getTonWallets(session.userId),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Wallet</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your asset balances derived from the internal ledger
        </p>
      </div>

      {/* Asset cards grid */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-600">
          Assets
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ASSET_ORDER.map((code) => (
            <AssetCard
              key={code}
              meta={ASSETS[code]}
              balance={balances[code]}
            />
          ))}
        </div>
      </section>

      {/* TON Wallets */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-600">
            TON Wallets
          </h2>
          <Link
            href="/dashboard/wallet/connect"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Connect Wallet
          </Link>
        </div>
        {tonWallets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-600">No TON wallets linked</p>
            <Link
              href="/dashboard/wallet/connect"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect a TON wallet
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {tonWallets.map((w) => {
              const hash = w.walletAddress.split(":")[1] ?? w.walletAddress;
              const short = hash.slice(0, 6) + "…" + hash.slice(-6);
              return (
                <li
                  key={w.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    w.isPrimary ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <Wallet className="h-4 w-4 shrink-0 text-zinc-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-zinc-200">{short}</code>
                      {w.isPrimary && (
                        <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                          <Star className="h-2.5 w-2.5" />
                          Primary
                        </span>
                      )}
                    </div>
                    <TonWalletBalances walletId={w.id} />
                    <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      {w.network} · verified {new Date(w.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/wallet/ton/${w.id}`}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Details
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Account explorer */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-600">
          Ledger Accounts
        </h2>
        <AccountExplorer accounts={accounts} />
      </section>
    </div>
  );
}
