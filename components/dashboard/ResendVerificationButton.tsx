"use client";

import { useState } from "react";

type Props = {
  label: string;
  sendingLabel: string;
  sentMessage: string;
  failedMessage: string;
};

export function ResendVerificationButton({ label, sendingLabel, sentMessage, failedMessage }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function handleClick() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      setState(res.ok && data.emailSent ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-emerald-500">{sentMessage}</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "sending"}
        className="text-xs font-medium text-amber-400 hover:underline disabled:opacity-50"
      >
        {state === "sending" ? sendingLabel : label}
      </button>
      {state === "failed" && <p className="mt-1 text-xs text-red-400">{failedMessage}</p>}
    </div>
  );
}
