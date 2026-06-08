"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

type Props = {
  txId: string;
  currentStatus: string;
  alreadySettled: boolean;
};

type ActionState = "idle" | "rejecting" | "loading" | "done" | "error";

export function WithdrawalReviewActions({ txId, currentStatus, alreadySettled }: Props) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>("idle");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isReviewable = currentStatus === "pending" || currentStatus === "under_review";

  async function callApi(action: string, extraBody?: object) {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/withdrawals/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Action failed");
        setState("error");
        return;
      }
      setState("done");
      router.push("/admin/withdrawals");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (alreadySettled) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-400">
          This withdrawal has been settled in the ledger and cannot be modified.
        </p>
      </div>
    );
  }

  if (!isReviewable) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-500">
          This withdrawal is not in a reviewable state ({currentStatus}).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <p className="text-sm font-medium text-zinc-300">Review Actions</p>

      {state === "done" && (
        <p className="text-sm text-emerald-400">Action completed. Redirecting…</p>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {state === "rejecting" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Rejection Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this withdrawal is being rejected…"
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none resize-none"
          />
        </div>
      )}

      {state === "idle" && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">
            Approving will debit the user&apos;s ledger account and move funds to the withdrawal escrow. This cannot be undone.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => callApi("approve")}
          disabled={state === "loading" || state === "done"}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          {state === "loading" ? "Processing…" : "Approve & Debit"}
        </button>

        <button
          onClick={() => {
            if (state !== "rejecting") { setState("rejecting"); return; }
            if (!reason.trim()) return;
            callApi("reject", { reason: reason.trim() });
          }}
          disabled={state === "loading" || state === "done"}
          className="flex items-center gap-1.5 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XCircle className="h-4 w-4" />
          {state === "rejecting" ? "Confirm Reject" : "Reject"}
        </button>

        {state === "rejecting" && (
          <button
            onClick={() => { setState("idle"); setReason(""); }}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
