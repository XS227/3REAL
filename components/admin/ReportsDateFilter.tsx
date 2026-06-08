"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Calendar } from "lucide-react";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "custom", label: "Custom" },
];

export function ReportsDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "30d";

  const setRange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", value);
      if (value !== "custom") {
        params.delete("from");
        params.delete("to");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const setCustomDate = useCallback(
    (key: "from" | "to", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => setRange(p.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            current === p.value
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          {p.label}
        </button>
      ))}
      {current === "custom" && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => setCustomDate("from", e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-amber-500/50 focus:outline-none"
          />
          <span className="text-xs text-zinc-600">–</span>
          <input
            type="date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => setCustomDate("to", e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-amber-500/50 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
