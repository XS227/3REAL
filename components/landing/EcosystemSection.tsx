import { ArrowUpRight, Bot } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";

type Brand = "3real" | "shahnameh" | "trustai" | "pay";

const BRAND_TEXT: Record<Brand, string> = {
  "3real": "text-amber-400",
  shahnameh: "text-emerald-400",
  trustai: "text-sky-400",
  pay: "text-violet-400",
};

const BRAND_BG: Record<Brand, string> = {
  "3real": "bg-amber-400",
  shahnameh: "bg-emerald-400",
  trustai: "bg-sky-400",
  pay: "bg-violet-400",
};

const STATUS_STYLES = {
  flagship: {
    card: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
    tag: "bg-amber-500/20 text-amber-400",
    dot: "bg-amber-400",
  },
  live: {
    card: "border-emerald-500/30 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]",
    tag: "bg-emerald-500/20 text-emerald-400",
    dot: "bg-emerald-400",
  },
  soon: {
    card: "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60",
    tag: "bg-zinc-800 text-zinc-500",
    dot: null,
  },
} as const;

export function EcosystemSection({ t }: { t: LandingDict["ecosystem"] }) {
  return (
    <section id="ecosystem" className="bg-zinc-900/40 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Product cards — live products link out */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.products.map((product) => {
            const brand = product.brand as Brand;
            const styles = STATUS_STYLES[product.status as keyof typeof STATUS_STYLES];
            const external = Boolean(product.href);

            const card = (
              <div
                className={`relative flex h-full flex-col rounded-xl border p-6 transition-colors ${styles.card}`}
              >
                {/* Live dot */}
                {styles.dot && (
                  <span
                    className={`absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full ${styles.dot} rtl:left-4 rtl:right-auto`}
                  />
                )}

                {/* Brand initial circle */}
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black text-zinc-950 ${BRAND_BG[brand] ?? "bg-zinc-600"}`}
                >
                  {product.initial}
                </div>

                {/* Name + tag */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3
                    className={`inline-flex items-center gap-1 text-lg font-bold ${BRAND_TEXT[brand] ?? "text-white"}`}
                  >
                    {product.name}
                    {external && (
                      <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover/card:opacity-70 rtl:-scale-x-100" />
                    )}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles.tag}`}
                  >
                    {product.tag}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-zinc-400">{product.description}</p>
              </div>
            );

            return external ? (
              <a
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group/card"
              >
                {card}
              </a>
            ) : (
              <div key={product.name} className="group/card">
                {card}
              </div>
            );
          })}
        </div>

        {/* AI Trading Agents teaser */}
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-zinc-900 to-amber-500/[0.07] p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <Bot className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-white sm:text-2xl">
                  {t.aiAgents.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                  {t.aiAgents.badge}
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                {t.aiAgents.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
