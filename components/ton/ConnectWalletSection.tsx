"use client";

import { useEffect, useRef, useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useRouter } from "next/navigation";
import { Wallet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

type Status = "idle" | "connecting" | "verifying" | "success" | "error";

export function ConnectWalletSection({ t }: { t: DashboardDict["walletConnect"] }) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Track whether we've already sent this proof to the backend
  const verifiedProofRef = useRef<string | null>(null);

  // On mount: fetch a challenge nonce and register it with TonConnect
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ton/challenge")
      .then((r) => r.json())
      .then(({ payload }: { payload: string }) => {
        if (cancelled) return;
        tonConnectUI.setConnectRequestParameters({
          state: "ready",
          value: { tonProof: payload },
        });
      })
      .catch(() => {
        if (!cancelled) setErrorMsg(t.initFailed);
      });
    return () => {
      cancelled = true;
    };
  }, [tonConnectUI]);

  // Watch for wallet connection with a valid ton_proof
  useEffect(() => {
    if (!wallet?.connectItems?.tonProof) return;
    const item = wallet.connectItems.tonProof;
    if (item.name !== "ton_proof") return;
    // TonProofItemReply is a discriminated union — only TonProofItemReplySuccess has .proof
    if (!("proof" in item)) return;

    // Deduplicate: only send once per proof payload
    const proofPayload = item.proof.payload;
    if (verifiedProofRef.current === proofPayload) return;
    verifiedProofRef.current = proofPayload;

    setStatus("verifying");
    setErrorMsg(null);

    fetch("/api/ton/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: wallet.account,
        proof: item.proof,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.reason ?? data.error ?? "Verification failed");
        }
        return data;
      })
      .then(() => {
        setStatus("success");
        router.refresh();
      })
      .catch((err: Error) => {
        setStatus("error");
        setErrorMsg(err.message);
        verifiedProofRef.current = null; // allow retry
      });
  }, [wallet, router]);

  function handleConnect() {
    setStatus("connecting");
    setErrorMsg(null);
    tonConnectUI.openModal();
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-300">{t.linkedSuccessTitle}</p>
          <p className="text-xs text-zinc-500">{t.linkedSuccessDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "error" && errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-300">{t.verificationFailed}</p>
            <p className="text-xs text-zinc-500">{errorMsg}</p>
          </div>
        </div>
      )}

      {status === "verifying" ? (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
          <p className="text-sm text-zinc-400">{t.verifyingProof}</p>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={status === "connecting"}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60 transition-colors"
        >
          {status === "connecting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          {t.connectButton}
        </button>
      )}

      <p className="text-xs text-zinc-600">
        {t.privacyNote}
      </p>
    </div>
  );
}
