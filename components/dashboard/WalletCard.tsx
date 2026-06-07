import { Wallet } from "lucide-react";
import { fmtAmount, type BalanceMap } from "@/lib/ledger/balance";

type Props = { balances: BalanceMap };

const ASSETS = [
  { code: "REAL", label: "REAL Token", symbol: "REAL", decimals: 2, accent: "text-amber-400" },
  { code: "TON", label: "Toncoin", symbol: "TON", decimals: 4, accent: "text-sky-400" },
  { code: "USDT", label: "Tether USD", symbol: "USDT", decimals: 2, accent: "text-emerald-400" },
  { code: "EUR", label: "Euro", symbol: "€", decimals: 2, accent: "text-blue-400" },
  { code: "NOK", label: "Norwegian Krone", symbol: "kr", decimals: 2, accent: "text-violet-400" },
  { code: "TRY", label: "Turkish Lira", symbol: "₺", decimals: 2, accent: "text-orange-400" },
] as const;

export function WalletCard({ balances }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">Wallet Summary</h2>
      </div>

      <ul className="divide-y divide-zinc-800">
        {ASSETS.map(({ code, label, symbol, decimals, accent }) => {
          const b = balances[code];
          const total = b.available + b.pending;
          const hasPending = b.pending !== 0;

          return (
            <li key={code} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                  <span className={`text-xs font-bold ${accent}`}>{symbol}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{code}</p>
                  <p className="text-xs text-zinc-600">{label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold tabular-nums ${total > 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                  {fmtAmount(total, decimals)}
                </p>
                {hasPending && (
                  <p className="text-xs text-amber-500 tabular-nums">
                    {fmtAmount(b.pending, decimals)} pending
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
