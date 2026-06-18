"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

const ASSETS = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];
const STATUSES = ["pending", "under_review", "approved", "processing", "completed", "rejected", "cancelled"];

type Props = { t: DashboardDict["transactions"] };

export function TransactionFilters({ t }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, sp]
  );

  const selectCls =
    "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/60 focus:outline-none";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={sp.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className={selectCls}
        aria-label={t.filters.allTypes}
      >
        <option value="">{t.filters.allTypes}</option>
        <option value="deposit">{t.typeLabels.deposit}</option>
        <option value="withdrawal">{t.typeLabels.withdrawal}</option>
      </select>

      <select
        value={sp.get("asset") ?? ""}
        onChange={(e) => update("asset", e.target.value)}
        className={selectCls}
        aria-label={t.filters.allAssets}
      >
        <option value="">{t.filters.allAssets}</option>
        {ASSETS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        value={sp.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectCls}
        aria-label={t.filters.allStatuses}
      >
        <option value="">{t.filters.allStatuses}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t.status[s] ?? s.replace("_", " ")}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={sp.get("from") ?? ""}
        onChange={(e) => update("from", e.target.value)}
        className={selectCls + " text-zinc-400"}
        title={t.filters.fromDate}
        aria-label={t.filters.fromDate}
      />
      <input
        type="date"
        value={sp.get("to") ?? ""}
        onChange={(e) => update("to", e.target.value)}
        className={selectCls + " text-zinc-400"}
        title={t.filters.toDate}
        aria-label={t.filters.toDate}
      />

      {(sp.get("type") || sp.get("asset") || sp.get("status") || sp.get("from") || sp.get("to")) && (
        <button
          onClick={() => router.push("?")}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
        >
          {t.clearFilters}
        </button>
      )}
    </div>
  );
}
