import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { AssetMeta } from "@/lib/wallet/assets";
import { fmtAsset } from "@/lib/wallet/assets";
import type { AssetBalance } from "@/lib/ledger/balance";

type Props = {
  meta: AssetMeta;
  balance: AssetBalance;
};

export function AssetHeader({ meta, balance }: Props) {
  const total = balance.available + balance.pending;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/wallet"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" />
        Wallet
      </Link>

      <div className={`rounded-xl border ${meta.borderClass} ${meta.bgClass} p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bgClass} border ${meta.borderClass}`}
            >
              <span className={`text-lg font-bold ${meta.accentClass}`}>
                {meta.symbol.length <= 3 ? meta.symbol : meta.code}
              </span>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${meta.accentClass}`}>{meta.name}</h1>
              <p className="text-sm text-zinc-500">{meta.networkLabel}</p>
            </div>
          </div>

          {/* Total balance */}
          <div className="text-right">
            <p className="text-xs text-zinc-600 mb-1">Total Balance</p>
            <p className={`text-3xl font-bold tabular-nums ${meta.accentClass}`}>
              {fmtAsset(total, meta)}
              <span className="ml-2 text-base font-normal text-zinc-500">{meta.code}</span>
            </p>
          </div>
        </div>

        {/* Available / Pending row */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-800/60 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-600">Available</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-zinc-200">
              {fmtAsset(balance.available, meta)}{" "}
              <span className="text-xs text-zinc-600">{meta.code}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Pending</p>
            <p
              className={`mt-0.5 text-base font-semibold tabular-nums ${
                balance.pending !== 0 ? "text-amber-400" : "text-zinc-600"
              }`}
            >
              {fmtAsset(balance.pending, meta)}{" "}
              <span className="text-xs text-zinc-600">{meta.code}</span>
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-zinc-600">Network</p>
            <p className="mt-0.5 text-sm text-zinc-400">{meta.networkLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
