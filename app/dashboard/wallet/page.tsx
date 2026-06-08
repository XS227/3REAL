import { requireAuth } from "@/lib/auth/guards";
import { getWalletPageData } from "@/lib/wallet/queries";
import { ASSET_ORDER, ASSETS } from "@/lib/wallet/assets";
import { AssetCard } from "@/components/wallet/AssetCard";
import { AccountExplorer } from "@/components/wallet/AccountExplorer";

export default async function WalletPage() {
  const session = await requireAuth();
  const { balances, accounts } = await getWalletPageData(session.userId);

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
