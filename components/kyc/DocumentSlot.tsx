"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, XCircle, Clock, FileText, X } from "lucide-react";
import type { KycDocumentRow } from "@/lib/kyc/queries";

export type DocConfig = {
  type: string;
  label: string;
  hint: string;
  required: boolean;
};

type Props = {
  config: DocConfig;
  existing?: KycDocumentRow;
  editable: boolean;
  onChange: (file: File | null) => void;
};

function DocStatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-amber-400">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

export function DocumentSlot({ config, existing, editable, onChange }: Props) {
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    setSelected(file);
    onChange(file);
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) handleFile(file);
  }

  function clearSelection() {
    setSelected(null);
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasApprovedDoc = existing?.status === "approved";
  const isReadOnly = editable === false || hasApprovedDoc;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-200">{config.label}</p>
            {config.required && (
              <span className="text-[10px] text-red-400 font-medium">Required</span>
            )}
            {!config.required && (
              <span className="text-[10px] text-zinc-600 font-medium">Optional</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{config.hint}</p>
        </div>
        {existing && <DocStatusBadge status={existing.status} />}
      </div>

      {/* Existing doc display */}
      {existing && !selected && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="flex-1 truncate text-xs text-zinc-400">
            {existing.fileName ?? "Document"}
          </span>
          <span className="text-xs text-zinc-600">v{existing.version}</span>
        </div>
      )}

      {/* Rejection reason for this doc */}
      {existing?.status === "rejected" && existing.rejectionReason && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-red-400">{existing.rejectionReason}</p>
        </div>
      )}

      {/* Upload zone — only shown when editable and doc not already approved */}
      {!isReadOnly && (
        <div
          className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer
            ${selected ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            name={config.type}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {selected ? (
            <div className="flex items-center justify-between gap-2">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-12 w-12 rounded object-cover shrink-0"
                />
              ) : (
                <FileText className="h-8 w-8 text-amber-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-xs font-medium text-zinc-200">{selected.name}</p>
                <p className="text-xs text-zinc-500">
                  {(selected.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Upload className="h-6 w-6 text-zinc-500" />
              <p className="text-xs text-zinc-400">
                {existing ? "Upload replacement" : "Click or drag to upload"}
              </p>
              <p className="text-[10px] text-zinc-600">JPG, PNG, WEBP, PDF · max 10 MB</p>
            </div>
          )}
        </div>
      )}

      {hasApprovedDoc && (
        <p className="text-xs text-emerald-500 mt-2">
          This document has been approved and cannot be replaced.
        </p>
      )}
    </div>
  );
}
