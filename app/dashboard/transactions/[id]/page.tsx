import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { getTransactionDetail } from "@/lib/transactions/detail";
import { resolveDashboardLang, dashboardDicts, dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function statusConfig(t: DashboardDict["transactionDetail"]): Record<string, { color: string; icon: React.ReactNode; label: string }> {
  return {
    pending: { color: "text-zinc-400 border-zinc-700 bg-zinc-800/50", icon: <Clock className="h-4 w-4" />, label: t.status.pending },
    under_review: { color: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: <Clock className="h-4 w-4" />, label: t.status.under_review },
    approved: { color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: <CheckCircle2 className="h-4 w-4" />, label: t.status.approved },
    processing: { color: "text-blue-400 border-blue-500/20 bg-blue-500/10", icon: <Clock className="h-4 w-4" />, label: t.status.processing },
    completed: { color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: <CheckCircle2 className="h-4 w-4" />, label: t.status.completed },
    rejected: { color: "text-red-400 border-red-500/20 bg-red-500/10", icon: <XCircle className="h-4 w-4" />, label: t.status.rejected },
    cancelled: { color: "text-zinc-500 border-zinc-700 bg-zinc-800/50", icon: <XCircle className="h-4 w-4" />, label: t.status.cancelled },
  };
}

function fmtDate(d: Date, lang: Lang) {
  return new Date(d).toLocaleString(dateLocale(lang), {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs font-medium text-zinc-500 shrink-0">{label}</span>
      <div className="text-right text-xs text-zinc-300">{children}</div>
    </div>
  );
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }, cookieStore] = await Promise.all([requireAuth(), params, cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].transactionDetail;

  const tx = await getTransactionDetail(id, session.userId);
  if (!tx) notFound();

  const isDeposit = tx.type === "deposit";
  const STATUS_CONFIG = statusConfig(t);
  const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
  const decimals = tx.assetCode === "REAL" || tx.assetCode === "TON" ? 4 : 2;

  const fmtAmt = (v: string, d = decimals) =>
    parseFloat(v).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: d,
    });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link
        href="/dashboard/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
        {t.backToTransactions}
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium mb-3 ${isDeposit ? "text-emerald-400" : "text-amber-400"}`}>
              {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              {isDeposit ? t.typeLabels.deposit : t.typeLabels.withdrawal}
            </div>
            <p className={`text-3xl font-bold font-mono tabular-nums ${isDeposit ? "text-emerald-400" : "text-amber-400"}`}>
              {isDeposit ? "+" : "−"}{fmtAmt(tx.amount)} <span className="text-lg text-zinc-400">{tx.assetCode}</span>
            </p>
            {parseFloat(tx.feeAmount) > 0 && (
              <p className="mt-1 text-xs text-zinc-600">
                {t.feePrefix} {fmtAmt(tx.feeAmount)} · {t.netPrefix} {fmtAmt(tx.netAmount ?? tx.amount)}
              </p>
            )}
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${statusCfg.color}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 pt-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t.detailsTitle}</h2>
        <Row label={t.rows.transactionId}>
          <span className="font-mono text-[11px] text-zinc-500">{tx.id}</span>
        </Row>
        <Row label={t.rows.submitted}>
          <span className="font-mono">{fmtDate(tx.createdAt, lang)}</span>
        </Row>
        <Row label={t.rows.lastUpdated}>
          <span className="font-mono">{fmtDate(tx.updatedAt, lang)}</span>
        </Row>
        {tx.paymentMethod && (
          <Row label={t.rows.paymentMethod}>
            <span className="capitalize">{tx.paymentMethod.replace(/_/g, " ")}</span>
          </Row>
        )}
        {tx.paymentRef && (
          <Row label={t.rows.paymentReference}>
            <span className="font-mono">{tx.paymentRef}</span>
          </Row>
        )}
        {tx.chainTxHash && (
          <Row label={t.rows.chainTxHash}>
            <span className="font-mono text-[11px] break-all">{tx.chainTxHash}</span>
          </Row>
        )}
        {tx.adminNote && (
          <Row label={t.rows.adminNote}>
            <span className="text-red-400">{tx.adminNote}</span>
          </Row>
        )}
        {tx.proofFilePath && (
          <Row label={t.rows.proofOfPayment}>
            <Link
              href={`/api/kyc/files/${tx.proofFilePath}`}
              className="inline-flex items-center gap-1 text-amber-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-3.5 w-3.5" />
              {t.viewProof}
            </Link>
          </Row>
        )}
      </div>

      {/* Ledger settlement */}
      {tx.ledgerTx ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 pt-4 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t.ledgerTitle}</h2>
          <Row label={t.settledAt}>
            <span className="font-mono">{fmtDate(tx.ledgerTx.createdAt, lang)}</span>
          </Row>
          {tx.ledgerTx.chainNetwork && (
            <Row label={t.network}>
              <span className="capitalize">{tx.ledgerTx.chainNetwork}</span>
            </Row>
          )}
          <div className="mt-4 space-y-2 pb-3">
            <p className="text-xs font-medium text-zinc-500">{t.journalEntries}</p>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">{t.columns.account}</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">{t.columns.amount}</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">{t.columns.asset}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {tx.ledgerTx.entries.map((entry) => {
                    const positive = entry.amount > 0;
                    const label = entry.accountLabel
                      ?? (entry.accountOwnerType === "user" ? t.yourAccount : `${t.platformPrefix} ${entry.accountOwnerId}`);
                    return (
                      <tr key={entry.id}>
                        <td className="px-3 py-2 text-zinc-400 font-mono">{label}</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                          {positive ? "+" : ""}{entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-500 font-bold">{entry.assetCode}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <p className="text-xs text-zinc-600">
            {tx.status === "pending" || tx.status === "under_review"
              ? t.pendingNote
              : tx.status === "rejected"
              ? t.rejectedNote
              : t.noLedgerNote}
          </p>
        </div>
      )}
    </div>
  );
}
