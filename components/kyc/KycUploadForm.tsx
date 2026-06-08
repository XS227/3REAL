"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentSlot, type DocConfig } from "./DocumentSlot";
import type { KycDocumentRow, KycProfileRow } from "@/lib/kyc/queries";
import { ShieldCheck } from "lucide-react";

const DOC_CONFIGS: DocConfig[] = [
  {
    type: "id_front",
    label: "Passport",
    hint: "Clear photo of the ID data page or passport photo page",
    required: true,
  },
  {
    type: "id_back",
    label: "National ID",
    hint: "Back side of national ID card (skip if using passport)",
    required: false,
  },
  {
    type: "selfie",
    label: "Selfie with Document",
    hint: "Hold your ID or passport next to your face — both must be clearly visible",
    required: true,
  },
  {
    type: "address_proof",
    label: "Proof of Address",
    hint: "Bank statement or utility bill issued within the last 3 months",
    required: true,
  },
];

type Props = {
  profile: KycProfileRow | null;
  documents: KycDocumentRow[];
};

function getEditableSlots(profile: KycProfileRow | null): string[] {
  if (!profile) return DOC_CONFIGS.map((d) => d.type);
  if (profile.status === "rejected") return DOC_CONFIGS.map((d) => d.type);
  if (profile.status === "update_requested") return DOC_CONFIGS.map((d) => d.type);
  return [];
}

export function KycUploadForm({ profile, documents }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const editableSlots = getEditableSlots(profile);
  const docMap = new Map(documents.map((d) => [d.docType, d]));

  function handleFileChange(docType: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [docType]: file ?? null }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    for (const config of DOC_CONFIGS) {
      const file = files[config.type];
      if (file) formData.append(config.type, file);
    }

    try {
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  const hasRequiredFiles = DOC_CONFIGS.filter((c) => c.required).every(
    (c) => {
      const existing = docMap.get(c.type);
      const isApproved = existing?.status === "approved";
      const hasNewFile = !!files[c.type];
      // Approved docs don't need re-upload; otherwise need a new file
      if (!editableSlots.includes(c.type)) return true;
      if (isApproved) return true;
      return hasNewFile || !!existing;
    },
  );

  const isResubmission = profile?.status === "rejected" || profile?.status === "update_requested";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DOC_CONFIGS.map((config) => (
          <DocumentSlot
            key={config.type}
            config={config}
            existing={docMap.get(config.type)}
            editable={editableSlots.includes(config.type)}
            onChange={(file) => handleFileChange(config.type, file)}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-zinc-600" />
          Documents are encrypted at rest and only reviewed by compliance staff.
        </div>
        <button
          type="submit"
          disabled={loading || !hasRequiredFiles}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950
            hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Submitting…"
            : isResubmission
              ? "Re-submit Application"
              : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
