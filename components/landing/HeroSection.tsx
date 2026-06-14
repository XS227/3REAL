import { Suspense } from "react";
import {
  ArrowRight,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingDict } from "@/lib/i18n/en";
import {
  formatCompactUsd,
  formatUsdPrice,
  getRealTokenData,
} from "@/lib/landing/market";
import { HeroBackdrop } from "@/components/landing/HeroBackdrop";

async function HeroLiveStats({ t }: { t: LandingDict["hero"]["stats"] }) {
  const real = await getRealTokenData();

  const change = real.change30dUsd;
  const up = (change ?? 0) >= 0;
  const ChangeIcon = up ? TrendingUp : TrendingDown;

  const stats: {
    label: string;
    value: string;
    accent: string;
    icon?: LucideIcon;
  }[] = [
    {
      label: t.price,
      value: real.priceUsd !== null ? formatUsdPrice(real.priceUsd) : "—",
      accent: "text-amber-400",
    },
    {
      label: t.change30d,
      value:
        change !== null ? `${up ? "+" : ""}${change.toFixed(2)}%` : "—",
      accent: up ? "text-emerald-400" : "text-red-400",
      icon: change !== null ? ChangeIcon : undefined,
    },
    {
      label: t.holders,
      value:
        real.holders !== null
          ? real.holders.toLocaleString("en-US")
          : "—",
      accent: "text-white",
    },
    {
      label: t.mcap,
      value: real.mcapUsd !== null ? formatCompactUsd(real.mcapUsd) : "—",
      accent: "text-white",
    },
  ];

  return (
    <dl className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 backdrop-blur-sm sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-1 bg-zinc-950/80 px-4 py-4">
          <dd
            className={`flex items-center gap-1.5 text-lg font-black tabular-nums ${stat.accent}`}
            dir="ltr"
          >
            {stat.icon && <stat.icon className="h-4 w-4" />}
            {stat.value}
          </dd>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

function HeroStatsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 bg-zinc-950/80 px-4 py-4">
          <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-800/70" />
        </div>
      ))}
    </div>
  );
}

export function HeroSection({ t }: { t: LandingDict["hero"] }) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center"
    >
      <HeroBackdrop />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          {t.badge}
        </div>

        {/* Main title */}
        <h1 className="mb-5 text-8xl font-black leading-none tracking-tighter text-white sm:text-9xl md:text-[10rem]">
          {t.title}
        </h1>

        {/* Tagline */}
        <p className="mb-6 text-xl font-semibold tracking-wide text-amber-400 sm:text-2xl">
          {t.tagline}
        </p>

        {/* Description */}
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          {t.description}
        </p>

        {/* CTA row — sign-in goes straight to Google OAuth */}
        <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="/api/auth/google">
            <Button
              size="lg"
              className="h-12 bg-amber-500 px-8 text-base font-bold text-zinc-950 shadow-[0_0_30px_-8px_rgba(245,158,11,0.7)] hover:bg-amber-400"
            >
              {t.cta.primary}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </a>
          <a href="#market">
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-zinc-700 bg-transparent px-8 text-base text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              {t.cta.secondary}
            </Button>
          </a>
        </div>

        {/* Live REAL stats strip */}
        <Suspense fallback={<HeroStatsSkeleton />}>
          <HeroLiveStats t={t.stats} />
        </Suspense>
      </div>

      {/* Scroll nudge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-600">
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}
