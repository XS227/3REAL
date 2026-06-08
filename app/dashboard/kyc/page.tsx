import { requireAuth } from "@/lib/auth/guards";
import { getKycPageData } from "@/lib/kyc/queries";
import { KycStatusBanner } from "@/components/kyc/KycStatusBanner";
import { KycUploadForm } from "@/components/kyc/KycUploadForm";
import { BadgeCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

const KYC_TIER_BENEFITS: Record<number, string[]> = {
  2: [
    "Full deposit & withdrawal access",
    "Increased transaction limits",
    "Reduced platform fees",
    "Priority support",
  ],
};

function TierInfoCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-300">What you unlock at KYC Tier 2</h3>
      </div>
      <ul className="space-y-1.5">
        {KYC_TIER_BENEFITS[2].map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function KycPage() {
  const session = await requireAuth();
  const { profile, documents } = await getKycPageData(session.userId);

  const status = profile?.status ?? "not_started";
  const isEditable = !profile || status === "rejected" || status === "update_requested";
  const isApproved = status === "approved";
  const isLocked = status === "pending" || status === "under_review";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck className="h-5 w-5 text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Identity Verification</h1>
        </div>
        <p className="text-sm text-zinc-500">
          KYC (Know Your Customer) verification is required to unlock full platform functionality.
        </p>
      </div>

      {/* Status banner */}
      <KycStatusBanner
        status={status}
        rejectionReason={profile?.rejectionReason}
        reviewedAt={profile?.reviewedAt ?? undefined}
      />

      {/* Tier benefits info — show when not yet approved */}
      {!isApproved && <TierInfoCard />}

      {/* Upload form — shown when editable or when locked (read-only doc display) */}
      {!isApproved && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-200">
              {isEditable ? "Upload Documents" : "Submitted Documents"}
            </h2>
            {isLocked && (
              <p className="text-sm text-zinc-500 mt-0.5">
                Your documents are under review. You cannot make changes at this time.
              </p>
            )}
          </div>
          <KycUploadForm profile={profile} documents={documents} />
        </div>
      )}

      {/* Approved state */}
      {isApproved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-semibold text-emerald-300 mb-1">Verification Complete</h2>
          <p className="text-sm text-zinc-400">
            Your identity has been verified. You now have full access to all platform features.
          </p>
        </div>
      )}

      {/* Process explanation */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Verification Process</h3>
        <ol className="space-y-2">
          {[
            "Submit your identity documents using the form above.",
            "Our compliance team reviews your submission within 1–3 business days.",
            "You will be notified of the result. If updates are needed, you can re-submit.",
            "Once approved, your KYC tier is upgraded instantly.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-amber-400">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
