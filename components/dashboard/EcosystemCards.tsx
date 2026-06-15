import { Coins, BookOpen, Brain, CreditCard, ArrowRight } from "lucide-react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

const PRODUCTS = [
  {
    code: "3REAL",
    name: "3REAL Portal",
    tagline: "Manage your REAL token portfolio",
    icon: Coins,
    accent: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    active: true,
    href: "/dashboard",
  },
  {
    code: "SHAHNAMEH",
    name: "Shahnameh",
    tagline: "Culturally curated NFT marketplace",
    icon: BookOpen,
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    active: false,
    href: null,
  },
  {
    code: "TRUST_AI",
    name: "TrustAI",
    tagline: "AI-powered financial insights",
    icon: Brain,
    accent: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/5",
    active: false,
    href: null,
  },
  {
    code: "SETAEI_PAY",
    name: "SETAEI Pay",
    tagline: "Cross-border payment infrastructure",
    icon: CreditCard,
    accent: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    active: false,
    href: null,
  },
] as const;

export function EcosystemCards({ t }: { t: DashboardDict["dashboard"]["ecosystem"] }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium text-zinc-500 uppercase tracking-widest">
        {t.title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map(({ code, name, tagline, icon: Icon, accent, border, bg, active, href }) => (
          <div
            key={code}
            className={`relative rounded-xl border ${border} ${bg} p-5 transition-all ${
              active ? "ring-1 ring-amber-500/30" : "opacity-70"
            }`}
          >
            {active && (
              <span className="absolute right-3 top-3 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                {t.active}
              </span>
            )}
            {!active && (
              <span className="absolute right-3 top-3 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                {t.comingSoon}
              </span>
            )}

            <Icon className={`mb-3 h-6 w-6 ${accent}`} />
            <h3 className="font-semibold text-zinc-200">{name}</h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{tagline}</p>

            {active && href && (
              <a
                href={href}
                className={`mt-4 inline-flex items-center gap-1 text-xs font-medium ${accent} hover:underline`}
              >
                Open <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
