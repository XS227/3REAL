import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getAdminUserLedger } from "@/lib/admin/ledger";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const ASSETS = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

const TX_TYPE_COLOR: Record<string, string> = {
  deposit: "text-emerald-400",
  referral_reward: "text-amber-400",
  withdrawal: "text-blue-400",
  transfer: "text-purple-400",
  fee: "text-red-400",
  conversion: "text-orange-400",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SearchParams = { asset?: string; page?: string };

export default async function AdminUserLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("super_admin", "operator");
  const { id } = await params;
  const sp = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, displayName: true },
  });
  if (!user) notFound();

  const asset = ASSETS.includes(sp.asset?.toUpperCase() ?? "") ? sp.asset!.toUpperCase() : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { entries, total, pages } = await getAdminUserLedger(id, asset, page);

  const displayName = user.displayName ?? user.email;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/admin/users/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {displayName}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-5 w-5 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Ledger — {displayName}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} double-entry ledger entries</p>
        </div>
      </div>

      {/* Asset filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`?page=1`}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            !asset
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          }`}
        >
          All
        </Link>
        {ASSETS.map((a) => (
          <Link
            key={a}
            href={`?asset=${a}&page=1`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              asset === a
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {/* Entries table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-600">No ledger entries{asset ? ` for ${asset}` : ""}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Date", "Asset", "Amount", "TX Type", "TX Status", "Reference", "Note"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {entries.map((entry) => {
                  const positive = entry.amount >= 0;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-zinc-500 whitespace-nowrap">
                        {fmtDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-zinc-300">
                        {entry.assetCode}
                      </td>
                      <td className={`px-4 py-2.5 text-xs font-mono font-bold tabular-nums whitespace-nowrap ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-mono ${TX_TYPE_COLOR[entry.tx.type] ?? "text-zinc-400"}`}>
                          {entry.tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {entry.tx.status}
                      </td>
                      <td className="px-4 py-2.5 max-w-[180px]">
                        {entry.tx.referenceType ? (
                          <div>
                            <span className="text-xs text-zinc-600">{entry.tx.referenceType}</span>
                            {entry.tx.referenceId && (
                              <span className="block text-[10px] font-mono text-zinc-700">
                                {entry.tx.referenceId.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        ) : entry.tx.chainTxHash ? (
                          <span className="text-[10px] font-mono text-zinc-600 truncate block">
                            {entry.tx.chainTxHash.slice(0, 16)}…
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 max-w-[200px]">
                        <span className="text-xs text-zinc-600 truncate block">
                          {entry.tx.note ?? entry.accountName ?? "—"}
                        </span>
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
          <p className="text-zinc-600">Page {page} of {pages} · {total} entries</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(asset ? { asset } : {}), page: String(page - 1) }).toString()}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`?${new URLSearchParams({ ...(asset ? { asset } : {}), page: String(page + 1) }).toString()}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
