import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { getTransactionHistory } from "@/lib/transactions/history";
import { TransactionFilters } from "@/components/dashboard/TransactionFilters";
import { resolveDashboardLang, dashboardDicts, dateLocale, type Lang } from "@/lib/i18n/dashboard";
import { ArrowDownLeft, ArrowUpRight, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-zinc-400 bg-zinc-800 border-zinc-700",
  under_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  cancelled: "text-zinc-500 bg-zinc-800 border-zinc-700",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
};

function fmtDate(d: Date, lang: Lang) {
  return new Date(d).toLocaleString(dateLocale(lang), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtAmount(amount: string, decimals = 2) {
  return parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

type SearchParams = {
  type?: string;
  asset?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [session, sp, cookieStore] = await Promise.all([requireAuth(), searchParams, cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].transactions;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const filters: import("@/lib/transactions/history").TxHistoryFilters = {};
  if (sp.type === "deposit" || sp.type === "withdrawal") filters.type = sp.type;
  if (sp.asset) filters.assetCode = sp.asset;
  if (sp.status) filters.status = sp.status;
  if (sp.from) filters.from = new Date(sp.from);
  if (sp.to) filters.to = new Date(sp.to + "T23:59:59");

  const { rows, total, pages } = await getTransactionHistory(session.userId, filters, page);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} {t.totalSuffix}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <Suspense>
          <TransactionFilters t={t} />
        </Suspense>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-600 text-sm">{t.noMatch}</p>
            <Link href="/dashboard/transactions" className="mt-2 block text-xs text-amber-400 hover:underline">
              {t.clearFilters}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {[t.columns.date, t.columns.type, t.columns.asset, t.columns.amount, t.columns.status, t.columns.reference, ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rows.map((tx) => {
                  const isDeposit = tx.type === "deposit";
                  const decimals = tx.assetCode === "REAL" || tx.assetCode === "TON" ? 4 : 2;
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap font-mono">
                        {fmtDate(tx.createdAt, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            isDeposit ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {isDeposit ? t.typeLabels.deposit : t.typeLabels.withdrawal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-zinc-300">
                        {tx.assetCode}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono tabular-nums text-zinc-200">
                        {isDeposit ? "+" : "−"}{fmtAmount(tx.amount, decimals)}
                        {parseFloat(tx.feeAmount) > 0 && (
                          <span className="ml-1 text-zinc-600">
                            ({t.feePrefix} {fmtAmount(tx.feeAmount, 2)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            STATUS_COLOR[tx.status] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"
                          }`}
                        >
                          {t.status[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="truncate block text-xs font-mono text-zinc-600">
                          {tx.paymentRef ?? "—"}
                        </span>
                        {tx.adminNote && (
                          <span className="block text-[10px] text-red-400 truncate">
                            {tx.adminNote}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/transactions/${tx.id}`}
                          className="text-xs text-zinc-600 hover:text-amber-400 transition-colors"
                        >
                          {t.viewLink}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-600">
            {t.pagePrefix} {page} {t.ofPage} {pages} · {total} {t.totalSuffix}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                {t.previous}
              </Link>
            )}
            {page < pages && (
              <Link
                href={`?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                {t.next}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
