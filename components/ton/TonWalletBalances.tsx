"use client";

import { useEffect, useState } from "react";

type Balances = {
  ton: number;
  real: number;
  fetchedAt: string;
};

export function TonWalletBalances({ walletId }: { walletId: string }) {
  const [data, setData] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ton/balance?id=${walletId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<Balances>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load balances");
        setLoading(false);
      });
  }, [walletId]);

  if (loading) {
    return (
      <div className="flex gap-4 text-sm text-gray-400 animate-pulse">
        <span>TON —.——</span>
        <span>REAL —.——</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-400">Balance unavailable</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-6 text-sm">
        <span className="text-gray-400">
          TON{" "}
          <span className="text-white font-mono font-medium">
            {data.ton.toFixed(4)}
          </span>
        </span>
        <span className="text-gray-400">
          REAL{" "}
          <span className="text-blue-300 font-mono font-medium">
            {data.real.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </span>
      </div>
      <p className="text-xs text-gray-600">
        Updated {new Date(data.fetchedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
