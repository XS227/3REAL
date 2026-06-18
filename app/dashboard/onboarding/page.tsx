import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { resolveDashboardLang, dashboardDicts } from "@/lib/i18n/dashboard";
import { LogoMark } from "@/components/icons/Logo";
import { completeOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const [session, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].onboarding;
  const kycLabels = dashboardDicts[lang].dashboard.profileCard.kycTier;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { emailVerified: true, kycTier: true, referralCode: true, referredById: true },
  });

  const sections = [
    t.sections.real,
    t.sections.deposits,
    t.sections.withdrawals,
    t.sections.kycTier2,
    t.sections.betaLimits,
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <LogoMark className="h-6 w-6" />
        <h1 className="text-2xl font-bold text-zinc-100">{t.title}</h1>
      </div>
      <p className="text-sm text-zinc-500">{t.subtitle}</p>

      {/* Status summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {user.emailVerified && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-sm text-emerald-400">{t.emailVerifiedBadge}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <span className="text-sm text-zinc-400">{t.kycTierLabel}</span>
          <span className="text-sm font-medium text-zinc-200">
            {kycLabels[user.kycTier] ?? `Tier ${user.kycTier}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 sm:col-span-2">
          <span className="text-sm text-zinc-400">{t.referralCodeLabel}</span>
          <span className="rounded-md bg-zinc-800 px-2 py-1 font-mono text-sm font-semibold text-amber-400">
            {user.referralCode}
          </span>
        </div>
      </div>

      {user.referredById && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
          {t.referredNotice}
        </p>
      )}

      {/* Explainer sections */}
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{s.body}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/kyc"
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
        >
          {t.ctaCompleteKyc}
        </Link>
        <Link
          href="/dashboard/wallet"
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
        >
          {t.ctaViewWallet}
        </Link>
        <form action={completeOnboarding}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 sm:w-auto"
          >
            {t.ctaContinue}
          </button>
        </form>
      </div>
    </div>
  );
}
