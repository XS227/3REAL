import { requireRole } from "@/lib/auth/guards";
import { runLedgerIntegrityCheck, getAccountBalances } from "@/lib/admin/reconciliation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Building2,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminReconciliationPage() {
  await requireRole("super_admin", "operator");

  const [integrity, balances] = await Promise.all([
    runLedgerIntegrityCheck(),
    getAccountBalances(),
  ]);

  const pass = integrity.status === "PASS";
  const assets = Object.entries(balances.grandTotalByAsset).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  // Group user balances by asset for summary
  const userByAsset: Record<string, number> = {};
  for (const r of balances.userBalances) {
    userByAsset[r.assetCode] = (userByAsset[r.assetCode] ?? 0) + r.balance;
  }

  // Group platform balances by ownerId
  const platformByOwner: Record<string, Record<string, number>> = {};
  for (const r of balances.platformBalances) {
    if (!platformByOwner[r.ownerId]) platformByOwner[r.ownerId] = {};
    platformByOwner[r.ownerId][r.assetCode] =
      (platformByOwner[r.ownerId][r.assetCode] ?? 0) + r.balance;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Reconciliation</h1>
        <p className="mt-1 text-sm text-zinc-500">Ledger integrity verification and balance audit</p>
      </div>

      {/* Integrity check result */}
      <div
        className={`flex items-start gap-4 rounded-xl border p-5 ${
          pass
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {pass ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          ) : (
            <XCircle className="h-7 w-7 text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-2xl font-bold tracking-wide ${
                pass ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {integrity.status}
            </span>
            <span className="text-sm text-zinc-500">Ledger Integrity Check</span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {integrity.totalTransactionsChecked.toLocaleString()} completed transactions verified ·{" "}
            {pass
              ? "All transactions balance to zero."
              : `${integrity.imbalancedCount} imbalanced transaction${integrity.imbalancedCount !== 1 ? "s" : ""} found — total imbalance ${fmt(integrity.totalImbalanceAmount)}`}
          </p>
        </div>
      </div>

      {/* Imbalanced transactions (only shown on FAIL) */}
      {!pass && integrity.imbalancedTransactions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-red-500/30 bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-red-500/20 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-medium text-red-300">Imbalanced Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">TX ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Entries</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Sum (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {integrity.imbalancedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-zinc-400">
                      {tx.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-300">{tx.type}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500">{fmtDate(tx.createdAt)}</td>
                    <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-400">
                      {tx.entryCount}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-red-400">
                      {fmt(tx.sumAmount, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grand total by asset (should be near zero for closed system) */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <Scale className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-300">System-Wide Balance by Asset</h2>
          <span className="text-xs text-zinc-600">Sum across all accounts (DR + CR = 0 expected)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Asset</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">User Total</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Platform Total</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Grand Total (Δ)</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {assets.map(([asset, grandTotal]) => {
                const userTotal = userByAsset[asset] ?? 0;
                const platformTotal = grandTotal - userTotal;
                const balanced = Math.abs(grandTotal) < 0.001;
                return (
                  <tr key={asset} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-zinc-300">{asset}</td>
                    <td className="px-5 py-3 text-right text-xs tabular-nums text-blue-400">
                      {fmt(userTotal)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs tabular-nums text-purple-400">
                      {fmt(platformTotal)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right text-xs font-bold tabular-nums ${
                        balanced ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {fmt(grandTotal, 6)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {balanced ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          OK
                        </span>
                      ) : (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          IMBALANCE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-zinc-600">
                    No account data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform account balances */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <Building2 className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-300">Platform Accounts</h2>
        </div>
        {Object.entries(platformByOwner).length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">No platform accounts</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Account</th>
                  {["REAL", "USDT", "TON", "EUR", "NOK"].map((a) => (
                    <th key={a} className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {Object.entries(platformByOwner).map(([owner, byAsset]) => (
                  <tr key={owner} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                        {owner}
                      </span>
                    </td>
                    {["REAL", "USDT", "TON", "EUR", "NOK"].map((a) => {
                      const bal = byAsset[a] ?? null;
                      return (
                        <td
                          key={a}
                          className={`px-5 py-3 text-right text-xs tabular-nums ${
                            bal === null
                              ? "text-zinc-700"
                              : bal < 0
                                ? "text-red-400"
                                : "text-zinc-300"
                          }`}
                        >
                          {bal === null ? "—" : fmt(bal)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User balances aggregate */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <User className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-300">User Aggregate Balances</h2>
          <span className="text-xs text-zinc-600">Sum across all user accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-600">Asset</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                  Total User Balance
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-600">
                  Account Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {Object.entries(userByAsset)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([asset, total]) => {
                  const count = balances.userBalances.filter((r) => r.assetCode === asset).length;
                  return (
                    <tr key={asset} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 text-xs font-bold text-zinc-300">{asset}</td>
                      <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-blue-400">
                        {fmt(total)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-500">
                        {count}
                      </td>
                    </tr>
                  );
                })}
              {Object.keys(userByAsset).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-zinc-600">
                    No user balances
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
        <h3 className="mb-2 text-xs font-semibold text-zinc-400">Integrity Check Methodology</h3>
        <ul className="space-y-1 text-xs text-zinc-600">
          <li>• Every completed LedgerTransaction is checked: Σ(ledger_entries.amount) must equal 0</li>
          <li>• Debit entries carry negative amounts, credit entries carry positive amounts</li>
          <li>• HAVING ABS(SUM) &gt; 0.000001 allows for floating-point epsilon tolerance</li>
          <li>• Grand total per asset across ALL accounts should equal 0 (closed double-entry system)</li>
          <li>• Platform rewards-pool balance reflects total REAL available for referral rewards</li>
          <li>• Runs on the live database — all figures are real-time</li>
        </ul>
      </div>
    </div>
  );
}
