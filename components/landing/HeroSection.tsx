import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingDict } from "@/lib/i18n/en";

export function HeroSection({ t }: { t: LandingDict["hero"] }) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center"
    >
      {/* Radial amber glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(245,158,11,0.13) 0%, transparent 65%)",
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

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

        {/* CTA row */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/register">
            <Button
              size="lg"
              className="h-12 bg-amber-500 px-8 text-base font-bold text-zinc-950 hover:bg-amber-400"
            >
              {t.cta.primary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#ecosystem">
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-zinc-700 px-8 text-base text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              {t.cta.secondary}
            </Button>
          </a>
        </div>
      </div>

      {/* Scroll nudge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-600">
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}
