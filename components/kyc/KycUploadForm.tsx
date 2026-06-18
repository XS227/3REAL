"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentSlot, type DocConfig } from "./DocumentSlot";
import type { KycDocumentRow, KycProfileRow } from "@/lib/kyc/queries";
import type { DashboardDict } from "@/lib/i18n/dashboard";
import { ShieldCheck } from "lucide-react";

const DOC_TYPES = ["id_front", "id_back", "selfie", "address_proof"] as const;
const DOC_REQUIRED: Record<string, boolean> = {
  id_front: true,
  id_back: false,
  selfie: true,
  address_proof: true,
};

type Props = {
  profile: KycProfileRow | null;
  documents: KycDocumentRow[];
  t: DashboardDict["kyc"];
};

function getEditableSlots(profile: KycProfileRow | null): string[] {
  if (!profile) return [...DOC_TYPES];
  if (profile.status === "rejected") return [...DOC_TYPES];
  if (profile.status === "update_requested") return [...DOC_TYPES];
  return [];
}

export function KycUploadForm({ profile, documents, t }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const docConfigs: DocConfig[] = DOC_TYPES.map((type) => ({
    type,
    label: t.docLabels[type],
    hint: t.docHints[type],
    required: DOC_REQUIRED[type],
  }));

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
    for (const config of docConfigs) {
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
        setError(data.error ?? t.submissionFailed);
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError(t.networkError);
      setLoading(false);
    }
  }

  const hasRequiredFiles = docConfigs.filter((c) => c.required).every(
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
        {docConfigs.map((config) => (
          <DocumentSlot
            key={config.type}
            config={config}
            existing={docMap.get(config.type)}
            editable={editableSlots.includes(config.type)}
            onChange={(file) => handleFileChange(config.type, file)}
            t={t}
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
          {t.encryptedNote}
        </div>
        <button
          type="submit"
          disabled={loading || !hasRequiredFiles}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950
            hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? t.submitting
            : isResubmission
              ? t.resubmitApplication
              : t.submitApplication}
        </button>
      </div>
    </form>
  );
}
