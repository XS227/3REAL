"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";

type DepositRow = {
  id: string;
  amount: string;
  status: string;
  chainTxHash: string | null;
  paymentRef: string | null;
  createdAt: string;
};

type Props = {
  depositAddress: string;
  walletCount: number;
  initialDeposits: DepositRow[];
};

function shortHash(h: string) {
  if (h.length <= 16) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

function shortAddr(a: string) {
  if (a.length <= 16) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

export function RealDepositSection({ depositAddress, walletCount, initialDeposits }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ found: number; error?: string } | null>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>(initialDeposits);

  async function copyAddress() {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function checkForDeposit() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/ton/deposits/check", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setCheckResult({ found: 0, error: json.error ?? "Check failed" });
      } else {
        setCheckResult({ found: json.found });
        if (json.found > 0) {
          // Refresh deposit list
          const listRes = await fetch("/api/ton/deposits");
          if (listRes.ok) {
            const listJson = await listRes.json();
            setDeposits(listJson.deposits ?? []);
          }
          router.refresh();
        }
      }
    } catch {
      setCheckResult({ found: 0, error: "Network error" });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
        <h3 className="text-sm font-semibold text-blue-300 mb-3">How REAL deposits work</h3>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono shrink-0">1.</span>
            Connect a TON wallet on the{" "}
            <a href="/dashboard/wallet/connect" className="text-blue-400 underline">
              wallet page
            </a>
            .
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono shrink-0">2.</span>
            Send REAL Jetton from your connected wallet to the platform deposit address below.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono shrink-0">3.</span>
            Click <strong className="text-zinc-200">"Check for Deposit"</strong> — credits appear
            in seconds.
          </li>
        </ol>
        <p className="mt-3 text-xs text-zinc-500">
          Only transfers from verified linked wallets are accepted. Minimum: 1 REAL.
        </p>
      </div>

      {walletCount === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">No TON wallet connected</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              <a href="/dashboard/wallet/connect" className="text-amber-400 underline">
                Connect a TON wallet
              </a>{" "}
              before sending a deposit.
            </p>
          </div>
        </div>
      )}

      {/* Deposit address */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          Platform Deposit Address
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
          <code className="flex-1 text-sm font-mono text-zinc-200 break-all">
            {depositAddress}
          </code>
          <button
            onClick={copyAddress}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-zinc-600">
          Network: The Open Network (TON) · Asset: REAL Jetton only
        </p>
      </div>

      {/* Check button */}
      <div className="flex items-center gap-4">
        <button
          onClick={checkForDeposit}
          disabled={checking || walletCount === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking…" : "Check for Deposit"}
        </button>

        {checkResult && !checkResult.error && (
          <span
            className={`flex items-center gap-1.5 text-sm ${
              checkResult.found > 0 ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {checkResult.found > 0
              ? `${checkResult.found} deposit${checkResult.found > 1 ? "s" : ""} credited`
              : "No new deposits found"}
          </span>
        )}

        {checkResult?.error && (
          <span className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {checkResult.error}
          </span>
        )}
      </div>

      {/* Deposit history */}
      {deposits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent REAL Deposits</h3>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium hidden sm:table-cell">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium hidden md:table-cell">
                    Tx Hash
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {parseFloat(d.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono hidden sm:table-cell">
                      {d.paymentRef ? shortAddr(d.paymentRef) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {d.chainTxHash ? (
                        <span className="text-xs text-zinc-500 font-mono">
                          {shortHash(d.chainTxHash)}
                        </span>
                      ) : (
                        "—"
                      )}
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
        </div>
      )}

      {deposits.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Clock className="h-4 w-4" />
          No REAL deposits yet.
        </div>
      )}
    </div>
  );
}
