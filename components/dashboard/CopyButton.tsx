"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({
  text,
  className,
  size = "sm",
}: {
  text: string;
  className?: string;
  size?: "xs" | "sm";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  const isXs = size === "xs";

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex shrink-0 items-center gap-1 rounded transition-colors
        ${isXs ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}
        ${copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        } ${className ?? ""}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className={isXs ? "h-2.5 w-2.5" : "h-3 w-3"} />
      ) : (
        <Copy className={isXs ? "h-2.5 w-2.5" : "h-3 w-3"} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
