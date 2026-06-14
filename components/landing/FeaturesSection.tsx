import { Wallet2, Users, ShieldCheck, BadgeCheck, Coins, Bot } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";

const ICON_MAP = {
  Wallet: Wallet2,
  Users,
  ShieldCheck,
  BadgeCheck,
  Coins,
  Bot,
} as const;

type IconKey = keyof typeof ICON_MAP;

export function FeaturesSection({ t }: { t: LandingDict["features"] }) {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Feature grid — 1 col → 2 col → 3 col, last item centred on 3-col */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, i) => {
            const Icon = ICON_MAP[item.icon as IconKey];
            // Last item (index 4 of 5) spans 2 cols at lg to stay centred on 3-col grid
            const spanClass =
              i === t.items.length - 1 && t.items.length % 3 !== 0
                ? "sm:col-span-2 lg:col-span-1 lg:col-start-2"
                : "";

            return (
              <div
                key={item.title}
                className={`group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-800/70 ${spanClass}`}
              >
                {/* Icon */}
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 transition-colors group-hover:bg-amber-500/15">
                  {Icon && <Icon className="h-5 w-5" />}
                </div>

                <h3 className="mb-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
