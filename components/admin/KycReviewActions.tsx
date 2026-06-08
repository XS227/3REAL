"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, ChevronDown } from "lucide-react";

type Props = {
  profileId: string;
  currentStatus: string;
};

type ActionState = "idle" | "rejecting" | "updating" | "loading" | "done" | "error";

export function KycReviewActions({ profileId, currentStatus }: Props) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>("idle");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isReviewable = currentStatus === "pending" || currentStatus === "under_review";

  async function callApi(action: string, extraBody?: object) {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/kyc/${profileId}`, {
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
      router.push("/admin/kyc");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  function handleApprove() {
    callApi("approve");
  }

  function handleReject() {
    if (state !== "rejecting") { setState("rejecting"); return; }
    if (!reason.trim()) return;
    callApi("reject", { reason: reason.trim() });
  }

  function handleRequestUpdate() {
    if (state !== "updating") { setState("updating"); return; }
    if (!reason.trim()) return;
    callApi("request_update", { reason: reason.trim() });
  }

  if (!isReviewable) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">
          This application is not in a reviewable state ({currentStatus}).
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

      {/* Reason textarea — shown when rejecting or requesting update */}
      {(state === "rejecting" || state === "updating") && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            {state === "rejecting" ? "Rejection Reason" : "Update Required Reason"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain clearly what is missing or incorrect…"
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none resize-none"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Approve */}
        <button
          onClick={handleApprove}
          disabled={state === "loading" || state === "done"}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </button>

        {/* Reject */}
        <button
          onClick={handleReject}
          disabled={state === "loading" || state === "done"}
          className="flex items-center gap-1.5 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XCircle className="h-4 w-4" />
          {state === "rejecting" ? "Confirm Reject" : "Reject"}
        </button>

        {/* Request Update */}
        <button
          onClick={handleRequestUpdate}
          disabled={state === "loading" || state === "done"}
          className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <AlertTriangle className="h-4 w-4" />
          {state === "updating" ? "Confirm Request" : "Request Update"}
        </button>

        {/* Cancel reason input */}
        {(state === "rejecting" || state === "updating") && (
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
