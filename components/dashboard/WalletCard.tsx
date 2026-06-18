import { Wallet } from "lucide-react";
import { fmtAmount, type BalanceMap } from "@/lib/ledger/balance";
import type { DashboardDict } from "@/lib/i18n/dashboard";
import { AssetIcon } from "@/components/icons/AssetIcons";

type Props = {
  balances: BalanceMap;
  t: DashboardDict["dashboard"]["walletCard"];
  assetNames: Record<string, string>;
};

const ASSETS = [
  { code: "REAL", decimals: 2 },
  { code: "TON", decimals: 4 },
  { code: "USDT", decimals: 2 },
  { code: "EUR", decimals: 2 },
  { code: "NOK", decimals: 2 },
  { code: "TRY", decimals: 2 },
] as const;

export function WalletCard({ balances, t, assetNames }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">{t.title}</h2>
      </div>

      <ul className="divide-y divide-zinc-800">
        {ASSETS.map(({ code, decimals }) => {
          const b = balances[code];
          const total = b.available + b.pending;
          const hasPending = b.pending !== 0;

          return (
            <li key={code} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                  <AssetIcon code={code} className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{code}</p>
                  <p className="text-xs text-zinc-600">{assetNames[code]}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold tabular-nums ${total > 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                  {fmtAmount(total, decimals)}
                </p>
                {hasPending && (
                  <p className="text-xs text-amber-500 tabular-nums">
                    {fmtAmount(b.pending, decimals)} {t.pending}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
