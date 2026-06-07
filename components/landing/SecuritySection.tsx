import { BookOpen, Lock, FileSearch, ShieldCheck } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";

const ICON_MAP = { BookOpen, Lock, FileSearch, ShieldCheck } as const;
type IconKey = keyof typeof ICON_MAP;

export function SecuritySection({ t }: { t: LandingDict["security"] }) {
  return (
    <section id="security" className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* 2 × 2 grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {t.pillars.map((pillar) => {
            const Icon = ICON_MAP[pillar.icon as IconKey];
            return (
              <div
                key={pillar.title}
                className="flex gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    {Icon && <Icon className="h-5 w-5" />}
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="mb-1.5 text-base font-semibold text-white">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
