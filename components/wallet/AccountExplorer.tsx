import { Database } from "lucide-react";
import type { UserAccountSummary } from "@/lib/ledger/accounts";
import { ASSETS } from "@/lib/wallet/assets";

type Props = { accounts: UserAccountSummary[] };

function shortId(id: string): string {
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

const ACCOUNT_TYPE_STYLE: Record<string, string> = {
  asset: "bg-sky-500/10 text-sky-400",
  liability: "bg-emerald-500/10 text-emerald-400",
  equity: "bg-amber-500/10 text-amber-400",
  revenue: "bg-violet-500/10 text-violet-400",
  expense: "bg-red-500/10 text-red-400",
};

export function AccountExplorer({ accounts }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">Account Explorer</h2>
        <span className="ml-auto text-xs text-zinc-600">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</span>
      </div>

      {accounts.length === 0 ? (
        <div className="py-8 text-center">
          <Database className="mx-auto mb-3 h-8 w-8 text-zinc-800" />
          <p className="text-sm text-zinc-600">No ledger accounts yet</p>
          <p className="mt-1 text-xs text-zinc-700">
            Accounts are created automatically when your first transaction is settled
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-2 text-left text-xs font-medium text-zinc-600">Account ID</th>
                <th className="pb-2 text-left text-xs font-medium text-zinc-600">Asset</th>
                <th className="pb-2 text-left text-xs font-medium text-zinc-600">Type</th>
                <th className="pb-2 text-right text-xs font-medium text-zinc-600">Entries</th>
                <th className="pb-2 text-right text-xs font-medium text-zinc-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {accounts.map((account) => {
                const meta = ASSETS[account.assetCode];
                return (
                  <tr key={account.id}>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-zinc-400" title={account.id}>
                        {shortId(account.id)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${meta?.accentClass ?? "text-zinc-400"}`}>
                          {account.assetCode}
                        </span>
                        <span className="text-xs text-zinc-600">{meta?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          ACCOUNT_TYPE_STYLE[account.accountType] ?? "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {account.accountType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-xs tabular-nums text-zinc-400">
                        {account.entryCount}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-zinc-600">
                        {account.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
  );
}
