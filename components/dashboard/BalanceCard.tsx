import Link from "next/link";
import { TrendingUp, Clock } from "lucide-react";
import { fmtAmount, type AssetBalance } from "@/lib/ledger/balance";
import type { DashboardDict } from "@/lib/i18n/dashboard";

type Props = { real: AssetBalance; t: DashboardDict["dashboard"]["balanceCard"] };

export function BalanceCard({ real, t }: Props) {
  const total = real.available + real.pending;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-1 flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t.title}
        </p>
      </div>

      {/* Main amount */}
      <div className="my-4">
        <p className="text-4xl font-bold tabular-nums text-amber-400 sm:text-5xl">
          {fmtAmount(total, 2)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">REAL tokens</p>
      </div>

      {/* Available / Pending split */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-xs text-zinc-500">{t.available}</p>
            <p className="text-sm font-semibold tabular-nums text-zinc-100">
              {fmtAmount(real.available)} REAL
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-xs text-zinc-500">{t.pending}</p>
            <p className="text-sm font-semibold tabular-nums text-zinc-100">
              {fmtAmount(real.pending)} REAL
            </p>
          </div>
        </div>
      </div>

      {/* Deposit / Withdraw */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          href="/dashboard/deposit?asset=REAL"
          className="flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          {t.deposit}
        </Link>
        <button
          disabled
          className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-xs font-medium text-zinc-500 cursor-not-allowed"
        >
          {t.withdraw}
        </button>
      </div>
    </div>
  );
}
