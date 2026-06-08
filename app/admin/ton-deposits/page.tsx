import { requireRole } from "@/lib/auth/guards";
import { getAllRealDepositsAdmin } from "@/lib/ton/deposits";
import { getTonSettings } from "@/lib/ton/settings";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "TON Deposits — Admin" };

type Props = { searchParams: Promise<{ page?: string }> };

function shortHash(h: string | null) {
  if (!h) return "—";
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function shortAddr(a: string | null) {
  if (!a) return "—";
  if (a.length <= 16) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

export default async function TonDepositsPage({ searchParams }: Props) {
  await requireRole("super_admin", "operator");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [data, settings] = await Promise.all([
    getAllRealDepositsAdmin(page),
    getTonSettings(),
  ]);

  const depositAddress = settings.depositAddress || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">TON — REAL Deposits</h1>
          <p className="mt-1 text-sm text-gray-400">
            Blockchain-verified REAL Jetton deposits. Auto-credited on detection.
          </p>
        </div>
        <Link
          href="/admin/ton-settings"
          className="text-xs text-blue-400 hover:underline"
        >
          TON Settings →
        </Link>
      </div>

      {/* Deposit address status */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          depositAddress
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}
      >
        {depositAddress ? (
          <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-medium ${
              depositAddress ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {depositAddress ? "Deposit address configured" : "Deposit address not configured"}
          </p>
          {depositAddress ? (
            <code className="text-xs text-gray-400 font-mono">{depositAddress}</code>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Set <code>ton.deposit_address</code> in{" "}
              <Link href="/admin/ton-settings" className="text-amber-400 underline">
                TON Settings
              </Link>{" "}
              to enable deposits.
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Deposits</p>
          <p className="text-2xl font-bold text-white">{data.total}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs text-gray-500 mb-1">This Page</p>
          <p className="text-2xl font-bold text-white">{data.rows.length}</p>
        </div>
      </div>

      {/* Table */}
      {data.rows.length === 0 ? (
        <p className="text-sm text-gray-500">No REAL deposits yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">User</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Amount (REAL)</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden md:table-cell">
                  From Wallet
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden lg:table-cell">
                  Chain Tx
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white truncate max-w-[140px]">{row.email}</p>
                    {row.displayName && (
                      <p className="text-xs text-gray-500 truncate max-w-[140px]">
                        {row.displayName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {parseFloat(row.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono hidden md:table-cell">
                    {shortAddr(row.fromAddress)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono hidden lg:table-cell">
                    {shortHash(row.chainTxHash)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      Credited
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              ← Prev
            </Link>
          )}
          <span className="text-gray-500">
            Page {page} of {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
