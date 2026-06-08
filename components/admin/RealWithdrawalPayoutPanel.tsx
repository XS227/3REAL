"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, Send } from "lucide-react";

type Props = {
  txId: string;
  amount: string;
  destination: string | null;
  hotWallet: string | null;
  status: string;
  chainTxHash: string | null;
};

export function RealWithdrawalPayoutPanel({
  txId,
  amount,
  destination,
  hotWallet,
  status,
  chainTxHash,
}: Props) {
  const router = useRouter();
  const [formChainHash, setFormChainHash] = useState("");
  const [formSentAmount, setFormSentAmount] = useState(amount);
  const [formNote, setFormNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState<"dest" | "hot" | null>(null);

  function copyToClipboard(text: string, key: "dest" | "hot") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/withdrawals/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_payout",
          chainTxHash: formChainHash.trim(),
          sentAmount: parseFloat(formSentAmount),
          adminNote: formNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Confirmation failed");
        return;
      }
      router.push("/admin/withdrawals");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "completed" && chainTxHash) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-500">
          Blockchain Payout Confirmed
        </p>
        <p className="text-sm text-zinc-400">
          This withdrawal was sent on-chain and the ledger has been settled.
        </p>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Chain Transaction Hash</p>
          <p className="font-mono text-xs text-emerald-400 break-all">{chainTxHash}</p>
        </div>
      </div>
    );
  }

  if (status !== "approved") {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-5">
      <p className="text-xs font-medium uppercase tracking-widest text-amber-400">
        Manual Blockchain Payout Required
      </p>

      <p className="text-sm text-zinc-400">
        This REAL withdrawal has been approved. The user's ledger has been debited.
        Send REAL from the platform hot wallet to the user's destination address,
        then confirm with the on-chain transaction hash below.
      </p>

      {/* Payout instructions */}
      <div className="space-y-3">
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 space-y-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Amount to Send</p>
            <p className="text-xl font-bold text-amber-400 tabular-nums">
              {parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 9 })} REAL
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1">Send To (User Destination)</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-zinc-200 break-all flex-1">
                {destination ?? "—"}
              </p>
              {destination && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(destination, "dest")}
                  className="shrink-0 text-zinc-500 hover:text-amber-400 transition-colors"
                  title="Copy destination"
                >
                  {copied === "dest" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1">Send From (Platform Hot Wallet)</p>
            {hotWallet ? (
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-zinc-200 break-all flex-1">{hotWallet}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(hotWallet, "hot")}
                  className="shrink-0 text-zinc-500 hover:text-amber-400 transition-colors"
                  title="Copy hot wallet"
                >
                  {copied === "hot" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-xs text-red-400">
                Hot wallet not configured — set it in Admin → TON Settings before sending.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation form */}
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Confirm Payout Sent
        </p>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            On-Chain Transaction Hash <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formChainHash}
            onChange={(e) => setFormChainHash(e.target.value)}
            placeholder="Paste the TON transaction hash…"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Amount Sent (REAL) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={formSentAmount}
            onChange={(e) => setFormSentAmount(e.target.value)}
            step="any"
            min="0"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-600">
            Must match the withdrawal amount ({parseFloat(amount).toLocaleString()} REAL).
          </p>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Admin Note</label>
          <input
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="e.g. Sent via Tonkeeper, 2026-06-08"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
            <p className="text-sm text-red-400">{errorMsg}</p>
          </div>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">
            This action is irreversible. It will clear the withdrawal escrow and mark the transaction as completed.
            Only confirm after verifying the on-chain transaction.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !formChainHash.trim()}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          {loading ? "Confirming…" : "Confirm Payout Sent"}
        </button>
      </form>
    </div>
  );
}
