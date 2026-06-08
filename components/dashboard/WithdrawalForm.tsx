"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpRight, CheckCircle } from "lucide-react";
import { ASSETS, ASSET_ORDER } from "@/lib/wallet/assets";
import { WITHDRAWAL_CONFIG, WITHDRAWAL_MINIMUMS } from "@/lib/withdrawals/destinations";
import type { AssetCode } from "@/lib/generated/prisma/enums";

type Props = {
  initialAsset: AssetCode;
  kycTier: number;
  emailVerified: boolean;
  balances: Record<AssetCode, { available: number; pending: number }>;
};

type FormState = "idle" | "loading" | "success" | "error";

export function WithdrawalForm({ initialAsset, kycTier, emailVerified, balances }: Props) {
  const router = useRouter();
  const [asset, setAsset] = useState<AssetCode>(initialAsset);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const config = WITHDRAWAL_CONFIG[asset];
  const meta = ASSETS[asset];
  const minimum = WITHDRAWAL_MINIMUMS[asset];
  const available = balances[asset]?.available ?? 0;

  const notEligible = !emailVerified || kycTier < 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount.");
      setState("error");
      return;
    }
    if (amountNum < minimum) {
      setErrorMsg(`Minimum withdrawal is ${minimum} ${asset}.`);
      setState("error");
      return;
    }
    if (amountNum > available) {
      setErrorMsg(`Insufficient balance. Available: ${available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${asset}.`);
      setState("error");
      return;
    }
    if (!destination.trim()) {
      setErrorMsg("Please enter your destination address or bank details.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetCode: asset, amount: amountNum, destination: destination.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Withdrawal request failed.");
        setState("error");
        return;
      }
      setState("success");
      setAmount("");
      setDestination("");
      router.refresh();
      return;
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (notEligible) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-400">Withdrawals unavailable</p>
        </div>
        <p className="text-sm text-zinc-500">
          {!emailVerified
            ? "Verify your email address to enable withdrawals."
            : "Full KYC verification (tier 2) is required for all withdrawals. Complete your verification in the Verification section."}
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400">Withdrawal request submitted</p>
        </div>
        <p className="text-sm text-zinc-500">
          {asset === "REAL"
            ? "Your REAL withdrawal is pending admin review. Once approved, the admin will send REAL to your TON wallet and confirm the transaction. You will receive a notification when complete."
            : "Your request is pending admin review. You will receive a notification once it is processed."}
        </p>
        <button
          onClick={() => setState("idle")}
          className="text-sm text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset selector */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Asset
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ASSET_ORDER.map((code) => {
            const m = ASSETS[code];
            const bal = balances[code]?.available ?? 0;
            const selected = code === asset;
            return (
              <button
                key={code}
                type="button"
                onClick={() => { setAsset(code); setAmount(""); setDestination(""); setState("idle"); setErrorMsg(""); }}
                className={`flex flex-col items-center rounded-xl border p-3 transition-all ${
                  selected
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                }`}
              >
                <span className={`text-lg font-bold ${selected ? "text-amber-400" : m.accentClass}`}>
                  {m.symbol}
                </span>
                <span className="mt-1 text-[10px]">{code}</span>
                <span className="mt-0.5 text-[10px] text-zinc-600 tabular-nums">
                  {bal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available balance */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-zinc-500">Available balance</span>
        <span className={`text-sm font-semibold tabular-nums ${available > 0 ? meta.accentClass : "text-zinc-600"}`}>
          {available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {asset}
        </span>
      </div>

      {/* Amount */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Amount
          </label>
          <button
            type="button"
            onClick={() => setAmount(available.toString())}
            className="text-[11px] text-amber-500 hover:text-amber-400"
          >
            Max
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus-within:border-amber-500/50">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ${minimum}`}
            min={minimum}
            max={available}
            step="any"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <span className="shrink-0 text-sm font-medium text-zinc-500">{asset}</span>
        </div>
        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > available && (
          <p className="mt-1 text-xs text-red-400">Exceeds available balance</p>
        )}
      </div>

      {/* Destination fields */}
      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          {config.destinationLabel}
        </label>
        {config.destinationFields.map((field, i) => (
          <div key={field.id}>
            {config.destinationFields.length > 1 && (
              <p className="mb-1 text-xs text-zinc-500">{field.label}</p>
            )}
            <input
              type="text"
              value={i === 0 ? destination : ""}
              onChange={i === 0 ? (e) => setDestination(e.target.value) : undefined}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
            />
            {field.hint && <p className="mt-1 text-xs text-zinc-600">{field.hint}</p>}
          </div>
        ))}
        {config.destinationFields.length > 1 && (
          <p className="text-xs text-zinc-500">
            Note: For multi-field destinations (bank accounts), combine all details into the first field separated by commas. Full structured destination forms coming soon.
          </p>
        )}
      </div>

      {/* Asset note */}
      {config.note && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">{config.note}</p>
        </div>
      )}

      {/* Error */}
      {(state === "error") && errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "loading" || available <= 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        <ArrowUpRight className="h-4 w-4" />
        {state === "loading" ? "Submitting…" : "Request Withdrawal"}
      </button>
    </form>
  );
}
