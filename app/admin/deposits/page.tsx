import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getDepositQueue } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ASSETS } from "@/lib/wallet/assets";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { ArrowDownLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank",
  usdt_trc20: "USDT TRC-20",
  ton: "TON",
  sepa: "SEPA",
  manual: "Manual",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDepositsPage() {
  await requireRole("super_admin", "operator");
  const queue = await getDepositQueue();

  const pending = queue.filter((r) => r.status === "pending" || r.status === "under_review");
  const other = queue.filter((r) => !["pending", "under_review"].includes(r.status));

  function Table({ title, rows, emptyText }: { title: string; rows: typeof queue; emptyText: string }) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">{emptyText}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {["User", "Asset / Amount", "Method", "Submitted", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rows.map((row) => {
                  const meta = ASSETS[row.assetCode as AssetCode];
                  return (
                    <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm text-zinc-200">{row.userEmail}</p>
                        <p className="text-xs text-zinc-600 font-mono">{row.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className={`text-sm font-semibold tabular-nums ${meta?.accentClass ?? "text-zinc-200"}`}>
                          +{parseFloat(row.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-zinc-500">{row.assetCode}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">
                        {row.paymentMethod ? (METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod) : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">
                        {fmtDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/deposits/${row.id}`}
                          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                        >
                          Review <ExternalLink className="h-3 w-3" />
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Deposit Review Queue</h1>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-zinc-950">
            {pending.length}
          </span>
        )}
      </div>

      <Table title="Awaiting Review" rows={pending} emptyText="No pending deposits." />
      {other.length > 0 && <Table title="Recent (Reviewed)" rows={other} emptyText="" />}
    </div>
  );
}
