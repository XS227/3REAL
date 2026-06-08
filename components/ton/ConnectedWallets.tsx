"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, ShieldCheck, Network } from "lucide-react";

type Wallet = {
  id: string;
  walletAddress: string;
  network: string;
  isPrimary: boolean;
  verifiedAt: Date | string;
};

function fmtAddr(addr: string) {
  const hash = addr.split(":")[1] ?? addr;
  return hash.slice(0, 6) + "…" + hash.slice(-6);
}

export function ConnectedWallets({ wallets }: { wallets: Wallet[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function disconnect(id: string) {
    if (!confirm("Remove this TON wallet from your account?")) return;
    setBusy(id);
    await fetch(`/api/ton/disconnect/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }

  async function setPrimary(id: string) {
    setBusy(id);
    await fetch(`/api/ton/set-primary/${id}`, { method: "PATCH" });
    router.refresh();
    setBusy(null);
  }

  if (wallets.length === 0) {
    return (
      <p className="text-sm text-zinc-600">No TON wallets linked yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {wallets.map((w) => (
        <li
          key={w.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            w.isPrimary
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-zinc-200">{fmtAddr(w.walletAddress)}</code>
              {w.isPrimary && (
                <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Star className="h-2.5 w-2.5" />
                  Primary
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <Network className="h-3 w-3" />
                {w.network}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Verified {new Date(w.verifiedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!w.isPrimary && (
              <button
                onClick={() => setPrimary(w.id)}
                disabled={busy === w.id}
                title="Set as primary"
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-500 hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50 transition-colors"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => disconnect(w.id)}
              disabled={busy === w.id}
              title="Remove wallet"
              className="rounded-lg border border-zinc-700 p-1.5 text-zinc-500 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
