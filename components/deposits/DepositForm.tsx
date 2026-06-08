"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ASSETS, ASSET_ORDER, fmtAsset } from "@/lib/wallet/assets";
import { DEPOSIT_INSTRUCTIONS, DEPOSIT_KYC_TIER, DEPOSIT_MINIMUMS } from "@/lib/deposits/instructions";
import { DepositInstructions } from "./DepositInstructions";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { CheckCircle, Upload, X, FileText, AlertCircle, Info } from "lucide-react";

type Props = {
  initialAsset: AssetCode;
  kycTier: number;
  emailVerified: boolean;
  referralCode: string;
};

function PermissionBanner({
  assetCode,
  kycTier,
  emailVerified,
}: {
  assetCode: AssetCode;
  kycTier: number;
  emailVerified: boolean;
}) {
  if (!emailVerified) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-300">Email not verified</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Verify your email address before making deposits.
          </p>
        </div>
      </div>
    );
  }

  const required = DEPOSIT_KYC_TIER[assetCode];
  if (kycTier < required) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-300">
            KYC Tier {required} required for {assetCode} deposits
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Complete identity verification to unlock deposits for this asset.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function DepositForm({ initialAsset, kycTier, emailVerified, referralCode }: Props) {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<AssetCode>(initialAsset);
  const [amount, setAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instruction = DEPOSIT_INSTRUCTIONS[selectedAsset];
  const requiredTier = DEPOSIT_KYC_TIER[selectedAsset];
  const minimum = DEPOSIT_MINIMUMS[selectedAsset];
  const meta = ASSETS[selectedAsset];
  const isEligible = emailVerified && kycTier >= requiredTier;

  function handleProofFile(file: File | null) {
    setProofFile(file);
    if (file && file.type.startsWith("image/")) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("assetCode", selectedAsset);
    fd.append("amount", amount);
    if (paymentRef.trim()) fd.append("paymentRef", paymentRef.trim());
    if (proofFile) fd.append("proof", proofFile);

    try {
      const res = await fetch("/api/deposits", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
        <h3 className="text-lg font-semibold text-emerald-300">Deposit Request Submitted</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Your request is pending review. You will be notified once it is processed.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setAmount("");
            setPaymentRef("");
            setProofFile(null);
            setProofPreview(null);
          }}
          className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline"
        >
          Submit another deposit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset selector */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-300">Select Asset</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ASSET_ORDER.map((code) => {
            const m = ASSETS[code];
            const active = selectedAsset === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSelectedAsset(code);
                  setAmount("");
                  setPaymentRef("");
                  setError(null);
                }}
                className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all
                  ${active
                    ? `${m.borderClass} ${m.bgClass} ring-1 ${m.ringClass}`
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
              >
                <span className={`text-sm font-bold ${active ? m.accentClass : "text-zinc-400"}`}>
                  {m.code}
                </span>
                <span className="mt-0.5 text-[10px] text-zinc-600">{m.networkLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permission check */}
      <PermissionBanner
        assetCode={selectedAsset}
        kycTier={kycTier}
        emailVerified={emailVerified}
      />

      {/* Instructions — always show so user knows what to do */}
      <DepositInstructions assetCode={selectedAsset} referenceCode={referralCode} />

      {/* Amount input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Amount{" "}
          <span className="text-zinc-600 font-normal">
            (minimum {minimum.toLocaleString()} {selectedAsset})
          </span>
        </label>
        <div className="relative">
          <input
            type="number"
            step="any"
            min={minimum}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`0.00`}
            disabled={!isEligible}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 pr-16 text-sm text-zinc-100
              placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${meta.accentClass}`}>
            {selectedAsset}
          </span>
        </div>
      </div>

      {/* Payment reference */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          {instruction.refLabel}{" "}
          {!instruction.refRequired && (
            <span className="text-zinc-600 font-normal">(optional)</span>
          )}
        </label>
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder={
            instruction.refLabel.toLowerCase().includes("hash")
              ? "0x… or TxHash…"
              : "Your payment reference"
          }
          disabled={!isEligible}
          required={instruction.refRequired}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100
            placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Proof upload */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          {instruction.proofLabel}{" "}
          <span className="text-zinc-600 font-normal">(optional)</span>
        </label>

        {proofFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5">
            {proofPreview ? (
              <img src={proofPreview} alt="proof preview" className="h-8 w-8 rounded object-cover" />
            ) : (
              <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-zinc-200">{proofFile.name}</p>
              <p className="text-xs text-zinc-500">{(proofFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => { setProofFile(null); setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="rounded p-1 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!isEligible}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700
              bg-zinc-800/50 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-400
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            Click to upload proof
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => handleProofFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isEligible || loading || !amount}
        className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-zinc-950
          hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Submitting…" : "Submit Deposit Request"}
      </button>

      <div className="flex items-start gap-2 text-xs text-zinc-600">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Deposits are processed manually. Ledger credit is applied only after admin approval.
      </div>
    </form>
  );
}
