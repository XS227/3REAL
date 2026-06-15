"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const ASSETS = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];
const STATUSES = ["pending", "under_review", "approved", "processing", "completed", "rejected", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function TransactionFilters() {
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
        aria-label="Filter by type"
      >
        <option value="">All types</option>
        <option value="deposit">Deposit</option>
        <option value="withdrawal">Withdrawal</option>
      </select>

      <select
        value={sp.get("asset") ?? ""}
        onChange={(e) => update("asset", e.target.value)}
        className={selectCls}
        aria-label="Filter by asset"
      >
        <option value="">All assets</option>
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
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s] ?? s}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={sp.get("from") ?? ""}
        onChange={(e) => update("from", e.target.value)}
        className={selectCls + " text-zinc-400"}
        title="From date"
        aria-label="From date"
      />
      <input
        type="date"
        value={sp.get("to") ?? ""}
        onChange={(e) => update("to", e.target.value)}
        className={selectCls + " text-zinc-400"}
        title="To date"
        aria-label="To date"
      />

      {(sp.get("type") || sp.get("asset") || sp.get("status") || sp.get("from") || sp.get("to")) && (
        <button
          onClick={() => router.push("?")}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
