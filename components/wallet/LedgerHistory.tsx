import { ScrollText, ArrowDownLeft, ArrowUpRight, RefreshCw, Gift, Minus } from "lucide-react";
import type { AssetMeta } from "@/lib/wallet/assets";
import { fmtAsset } from "@/lib/wallet/assets";
import type { LedgerHistoryEntry } from "@/lib/wallet/queries";
import { dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";

type Props = {
  entries: LedgerHistoryEntry[];
  meta: AssetMeta;
  t: DashboardDict["wallet"];
  lang: Lang;
};

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400",
  pending: "bg-zinc-800 text-zinc-400",
  processing: "bg-blue-500/10 text-blue-400",
  rejected: "bg-red-500/10 text-red-400",
  reversed: "bg-amber-500/10 text-amber-400",
};

function TxIcon({ type, credit }: { type: string; credit: boolean }) {
  const base = "h-3.5 w-3.5";
  if (type === "referral_reward") return <Gift className={`${base} text-amber-400`} />;
  if (type === "conversion") return <RefreshCw className={`${base} text-violet-400`} />;
  if (type === "fee") return <Minus className={`${base} text-red-400`} />;
  if (credit) return <ArrowDownLeft className={`${base} text-emerald-500`} />;
  return <ArrowUpRight className={`${base} text-red-400`} />;
}

function fmtDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(dateLocale(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LedgerHistory({ entries, meta, t, lang }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">{t.ledgerHistory}</h2>
        <span className="ml-auto text-xs text-zinc-600">{entries.length} {t.entriesSuffix}</span>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center">
          <ScrollText className="mx-auto mb-3 h-8 w-8 text-zinc-800" />
          <p className="text-sm text-zinc-600">{t.noHistory}</p>
          <p className="mt-1 text-xs text-zinc-700">
            {t.noHistoryDesc}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {entries.map((entry) => {
            const isCredit = entry.amount > 0;
            const absAmount = Math.abs(entry.amount);

            return (
              <li key={entry.id} className="flex items-center gap-3 py-3.5">
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isCredit ? "bg-emerald-500/10" : "bg-zinc-800"
                  }`}
                >
                  <TxIcon type={entry.tx.type} credit={isCredit} />
                </div>

                {/* Type + note */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {t.txTypes[entry.tx.type] ?? entry.tx.type}
                  </p>
                  {entry.tx.note ? (
                    <p className="text-xs text-zinc-600 truncate">{entry.tx.note}</p>
                  ) : entry.tx.chainTxHash ? (
                    <p className="font-mono text-[10px] text-zinc-700 truncate">
                      {entry.tx.chainTxHash.slice(0, 20)}…
                    </p>
                  ) : null}
                  <p className="text-[10px] text-zinc-700">{fmtDate(entry.createdAt, lang)}</p>
                </div>

                {/* Amount + status */}
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      isCredit ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isCredit ? "+" : "−"}
                    {fmtAsset(absAmount, meta)}{" "}
                    <span className="text-xs text-zinc-600">{meta.code}</span>
                  </p>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      STATUS_STYLE[entry.tx.status] ?? "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {t.txStatus[entry.tx.status] ?? entry.tx.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
