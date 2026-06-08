"use client";

import { Download } from "lucide-react";

type Props = {
  type: "users" | "deposits" | "withdrawals" | "referrals" | "ledger";
  label: string;
};

export function ExportButton({ type, label }: Props) {
  const handleDownload = () => {
    const url = `/api/admin/exports?type=${type}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
