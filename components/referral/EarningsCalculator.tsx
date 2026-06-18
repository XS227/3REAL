"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

const L1_REWARD = 50;
const L2_REWARD = 15;

const ACTIVITY_MULTIPLIERS = [
  { l1: 1, l2: 0 },
  { l1: 1, l2: 0.7 },
  { l1: 1, l2: 1 },
];

type Props = { t: DashboardDict["referrals"]["calculatorConfig"] };

export function EarningsCalculator({ t }: Props) {
  const [directReferrals, setDirectReferrals] = useState(5);
  const [activityIndex, setActivityIndex] = useState(1);

  const activity = ACTIVITY_MULTIPLIERS[activityIndex] ?? ACTIVITY_MULTIPLIERS[1];
  const directEarnings = directReferrals * L1_REWARD * activity.l1;
  const indirectEarnings = directReferrals * 1.5 * L2_REWARD * activity.l2;
  const total = directEarnings + indirectEarnings;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-300">{t.title}</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {t.directReferralsLabel}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={100}
              value={directReferrals}
              onChange={(e) => setDirectReferrals(Number(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            <span className="w-10 text-right text-sm font-bold text-amber-400 tabular-nums">
              {directReferrals}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {t.activityLabel}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {t.activityOptions.map((label, i) => (
              <button
                key={label}
                onClick={() => setActivityIndex(i)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  activityIndex === i
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg bg-zinc-950/60 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">
            {t.directRewardsLabel} ({directReferrals} × {L1_REWARD} REAL)
          </span>
          <span className="font-semibold tabular-nums text-zinc-300">
            {directEarnings.toLocaleString()} REAL
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">
            {t.indirectRewardsLabel} (est. {L2_REWARD} REAL × avg 1.5)
          </span>
          <span className="font-semibold tabular-nums text-zinc-400">
            {Math.round(indirectEarnings).toLocaleString()} REAL
          </span>
        </div>
        <div className="border-t border-zinc-800 pt-3 flex justify-between">
          <span className="text-sm font-medium text-zinc-300">{t.estimatedTotal}</span>
          <span className="text-xl font-bold tabular-nums text-amber-400">
            {Math.round(total).toLocaleString()} REAL
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-zinc-600">
        {t.footerNote}
      </p>
    </div>
  );
}
