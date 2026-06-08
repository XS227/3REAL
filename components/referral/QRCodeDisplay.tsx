"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

type Props = { value: string };

export function QRCodeDisplay({ value }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
      >
        <QrCode className="h-4 w-4" />
        QR Code
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
              Scan to register with your referral
            </p>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={value} size={200} level="M" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-lg bg-zinc-800 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
