import { ArrowDownLeft, Clock } from "lucide-react";
import type { DepositRow } from "@/lib/deposits/queries";
import { ASSETS } from "@/lib/wallet/assets";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";

type Props = { deposits: DepositRow[]; t: DashboardDict["deposit"]; lang: Lang };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-zinc-800 text-zinc-400",
  under_review: "bg-amber-500/10 text-amber-400",
  approved: "bg-sky-500/10 text-sky-400",
  processing: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-800 text-zinc-500",
};

function fmtDate(d: Date, lang: Lang) {
  return new Date(d).toLocaleDateString(dateLocale(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DepositHistory({ deposits, t, lang }: Props) {
  if (deposits.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <Clock className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">{t.noDepositsYet}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
        <Clock className="h-4 w-4 text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-300">{t.historyTitle}</h3>
        <span className="ml-auto text-xs text-zinc-600">
          {deposits.length} {deposits.length !== 1 ? t.requestsSuffix : t.requestSuffix}
        </span>
      </div>

      <ul className="divide-y divide-zinc-800/60">
        {deposits.map((dep) => {
          const meta = ASSETS[dep.assetCode as AssetCode];
          const amount = parseFloat(dep.amount);

          return (
            <li key={dep.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">
                  {t.depositLabel} · {dep.assetCode}
                </p>
                <p className="text-xs text-zinc-600">
                  {dep.paymentMethod ? t.paymentMethods[dep.paymentMethod] ?? dep.paymentMethod : "—"}
                  {dep.paymentRef ? ` · ${dep.paymentRef.slice(0, 16)}…` : ""}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${meta?.accentClass ?? "text-zinc-200"}`}>
                  +{amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: meta?.decimals ?? 2,
                  })}{" "}
                  {dep.assetCode}
                </p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      STATUS_STYLE[dep.status] ?? "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {t.status[dep.status] ?? dep.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">{fmtDate(dep.createdAt, lang)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
