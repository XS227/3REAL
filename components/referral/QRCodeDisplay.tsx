"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

type Props = { value: string; t: DashboardDict["referrals"]["qr"] };

export function QRCodeDisplay({ value, t }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
      >
        <QrCode className="h-4 w-4" />
        {t.buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-center text-sm font-medium text-zinc-300">
              {t.scanPrompt}
            </p>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={value} size={200} level="M" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-lg bg-zinc-800 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
