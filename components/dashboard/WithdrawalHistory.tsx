import { ArrowUpRight } from "lucide-react";
import type { WithdrawalRow } from "@/lib/withdrawals/queries";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  under_review: "bg-blue-500/10 text-blue-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  processing: "bg-cyan-500/10 text-cyan-400",
  completed: "bg-emerald-600/10 text-emerald-300",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-700/50 text-zinc-500",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WithdrawalHistory({ rows }: { rows: WithdrawalRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center">
        <ArrowUpRight className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-600">No withdrawal requests yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              {["Date", "Asset", "Amount", "Destination", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">
                  {fmtDate(row.createdAt)}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-zinc-200">
                  {row.assetCode}
                </td>
                <td className="px-5 py-3 text-sm tabular-nums text-zinc-200">
                  {parseFloat(row.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </td>
                <td className="px-5 py-3 text-sm text-zinc-500 max-w-[160px] truncate">
                  {row.destination ?? "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLES[row.status] ?? "bg-zinc-700/50 text-zinc-400"
                    }`}
                  >
                    {row.status.replace("_", " ")}
                  </span>
                  {row.adminNote && row.status === "rejected" && (
                    <p className="mt-0.5 text-[11px] text-red-400/80 truncate max-w-[160px]">
                      {row.adminNote}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
