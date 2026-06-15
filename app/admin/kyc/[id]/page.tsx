import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getKycReviewData } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { KycReviewActions } from "@/components/admin/KycReviewActions";
import { ChevronLeft, FileText, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const DOC_LABELS: Record<string, string> = {
  id_front: "Passport",
  id_back: "National ID",
  selfie: "Selfie with Document",
  address_proof: "Proof of Address",
  bank_statement: "Bank Statement",
};

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DocumentCard({
  doc,
}: {
  doc: {
    id: string;
    docType: string;
    fileName: string | null;
    filePath: string;
    mimeType: string | null;
    status: string;
    rejectionReason: string | null;
    version: number;
    createdAt: Date;
  };
}) {
  const isImage = doc.mimeType?.startsWith("image/");
  const fileUrl = `/api/kyc/files/${doc.filePath}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {DOC_LABELS[doc.docType] ?? doc.docType}
          </p>
          <p className="text-xs text-zinc-600">v{doc.version} · {fmtDateTime(doc.createdAt)}</p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Preview */}
      <div className="p-4">
        {isImage ? (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={DOC_LABELS[doc.docType] ?? doc.docType}
              className="w-full max-h-64 rounded-lg object-contain bg-zinc-950 border border-zinc-800"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
                const msg = el.nextElementSibling as HTMLElement | null;
                if (msg) msg.style.display = "flex";
              }}
            />
            <div className="hidden items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
              <FileText className="h-5 w-5 shrink-0" />
              File missing — user must re-upload this document
            </div>
          </a>
        ) : (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-600"
          >
            <FileText className="h-5 w-5 text-zinc-500" />
            <span className="flex-1 truncate">{doc.fileName ?? "Document"}</span>
            <ExternalLink className="h-4 w-4 text-zinc-500 shrink-0" />
          </a>
        )}
      </div>

      {doc.rejectionReason && (
        <div className="border-t border-zinc-800 px-4 py-2">
          <p className="text-xs text-red-400">Rejection: {doc.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}

export default async function KycReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("super_admin", "operator");
  const { id } = await params;
  const data = await getKycReviewData(id);
  if (!data) notFound();

  const { profile, user, documents } = data;

  // Group docs by type, show all versions
  const docsByType = new Map<string, typeof documents>();
  for (const doc of documents) {
    const list = docsByType.get(doc.docType) ?? [];
    list.push(doc);
    docsByType.set(doc.docType, list);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/kyc"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> KYC Queue
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{user.email}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">KYC Tier {user.kycTier} · {user.emailVerified ? "Email verified" : "Email not verified"}</p>
        </div>
        <StatusBadge status={profile.status} className="text-sm" />
      </div>

      {/* Profile details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Submitted", value: fmtDateTime(profile.submittedAt) },
          { label: "Reviewed At", value: profile.reviewedAt ? fmtDateTime(profile.reviewedAt) : "—" },
          { label: "Reviewed By", value: profile.reviewedByEmail ?? "—" },
          { label: "Tier Requested", value: `Tier ${profile.tierRequested}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-0.5 text-sm text-zinc-200 break-words">{value}</p>
          </div>
        ))}
      </div>

      {/* Rejection reason (if any) */}
      {profile.rejectionReason && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-xs font-medium text-red-400 mb-0.5">Rejection / Update Reason</p>
          <p className="text-sm text-red-300">{profile.rejectionReason}</p>
        </div>
      )}

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Submitted Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-zinc-600">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from(docsByType.entries()).map(([docType, docs]) => (
              <div key={docType} className="space-y-2">
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <KycReviewActions profileId={profile.id} currentStatus={profile.status} />
    </div>
  );
}
