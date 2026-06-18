import { requireAuth } from "@/lib/auth/guards";
import { getKycPageData } from "@/lib/kyc/queries";
import { KycStatusBanner } from "@/components/kyc/KycStatusBanner";
import { KycUploadForm } from "@/components/kyc/KycUploadForm";
import { cookies } from "next/headers";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { BadgeCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].kyc;
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
          <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
        </div>
        <p className="text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      {/* Status banner */}
      <KycStatusBanner
        status={status}
        rejectionReason={profile?.rejectionReason}
        reviewedAt={profile?.reviewedAt ?? undefined}
        t={t}
        lang={lang}
      />

      {/* Tier benefits info — show when not yet approved */}
      {!isApproved && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-medium text-zinc-300">{t.whatUnlocked}</h3>
          </div>
          <ul className="space-y-1.5">
            {t.tier2Benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload form — shown when editable or when locked (read-only doc display) */}
      {!isApproved && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-200">
              {isEditable ? t.uploadTitle : t.submittedTitle}
            </h2>
            {isLocked && (
              <p className="text-sm text-zinc-500 mt-0.5">{t.underReviewNote}</p>
            )}
          </div>
          <KycUploadForm profile={profile} documents={documents} t={t} />
        </div>
      )}

      {/* Approved state */}
      {isApproved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-semibold text-emerald-300 mb-1">{t.approvedTitle}</h2>
          <p className="text-sm text-zinc-400">{t.approvedDesc}</p>
        </div>
      )}

      {/* Process explanation */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">{t.processTitle}</h3>
        <ol className="space-y-2">
          {t.processSteps.map((step, i) => (
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
