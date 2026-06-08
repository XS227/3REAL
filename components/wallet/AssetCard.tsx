import Link from "next/link";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { AssetMeta } from "@/lib/wallet/assets";
import { fmtAsset } from "@/lib/wallet/assets";
import type { AssetBalance } from "@/lib/ledger/balance";

type Props = {
  meta: AssetMeta;
  balance: AssetBalance;
};

export function AssetCard({ meta, balance }: Props) {
  const total = balance.available + balance.pending;
  const hasFunds = total > 0;
  const hasPending = balance.pending !== 0;

  return (
    <div
      className={`group relative rounded-xl border ${meta.borderClass} bg-zinc-900 p-5 transition-all hover:ring-1 ${meta.ringClass}`}
    >
      {/* Asset identity */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div
            className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.bgClass}`}
          >
            <span className={`text-xs font-bold ${meta.accentClass}`}>
              {meta.symbol.length <= 3 ? meta.symbol : meta.code}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-200">{meta.name}</p>
          <p className="text-xs text-zinc-600">{meta.networkLabel}</p>
        </div>
        {hasPending && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            Pending
          </span>
        )}
      </div>

      {/* Total balance */}
      <p
        className={`mb-3 text-2xl font-bold tabular-nums ${hasFunds ? meta.accentClass : "text-zinc-700"}`}
      >
        {fmtAsset(total, meta)}
        <span className="ml-1.5 text-sm font-normal text-zinc-600">{meta.code}</span>
      </p>

      {/* Available / Pending split */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-zinc-950/50 px-3 py-2.5">
        <div>
          <p className="text-[10px] text-zinc-600">Available</p>
          <p className="text-xs font-semibold tabular-nums text-zinc-300">
            {fmtAsset(balance.available, meta)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600">Pending</p>
          <p
            className={`text-xs font-semibold tabular-nums ${hasPending ? "text-amber-400" : "text-zinc-600"}`}
          >
            {fmtAsset(balance.pending, meta)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/dashboard/wallet/${meta.code.toLowerCase()}`}
          className={`inline-flex items-center gap-1 text-xs font-medium ${meta.accentClass} opacity-60 transition-opacity group-hover:opacity-100`}
        >
          View details <ArrowRight className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/deposit?asset=${meta.code}`}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
          >
            <ArrowDownLeft className="h-3 w-3" />
            Deposit
          </Link>
          <Link
            href={`/dashboard/withdraw?asset=${meta.code}`}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
          >
            <ArrowUpRight className="h-3 w-3" />
            Withdraw
          </Link>
        </div>
      </div>
    </div>
  );
}
