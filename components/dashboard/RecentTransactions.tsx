import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import type { TransactionEntry } from "@/lib/dashboard/queries";

type Props = { transactions: TransactionEntry[] };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-zinc-800 text-zinc-400",
  under_review: "bg-amber-500/10 text-amber-400",
  approved: "bg-sky-500/10 text-sky-400",
  processing: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-800 text-zinc-500",
  failed: "bg-red-500/10 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  under_review: "Review",
  processing: "Processing",
  completed: "Done",
};

function fmtStatus(status: string): string {
  return STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentTransactions({ transactions }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">Recent Transactions</h2>
      </div>

      {transactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-600">No transactions yet</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {transactions.map((tx) => {
            const isDeposit = tx.type === "deposit";
            return (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isDeposit ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}
                >
                  {isDeposit ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 capitalize">
                    {tx.type} · {tx.assetCode}
                  </p>
                  {tx.paymentMethod && (
                    <p className="text-xs text-zinc-600 capitalize">
                      {tx.paymentMethod.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      isDeposit ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isDeposit ? "+" : "−"}
                    {parseFloat(tx.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {tx.assetCode}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        STATUS_STYLE[tx.status] ?? "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {fmtStatus(tx.status)}
                    </span>
                    <span className="text-[10px] text-zinc-600">{fmtDate(tx.createdAt)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
