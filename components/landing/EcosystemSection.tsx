import type { LandingDict } from "@/lib/i18n/en";

const BRAND_COLORS: Record<string, string> = {
  "3REAL": "text-amber-400",
  Shahnameh: "text-emerald-400",
  TrustAI: "text-sky-400",
  "SETAEI Pay": "text-violet-400",
};

const BRAND_BG: Record<string, string> = {
  "3REAL": "bg-amber-400",
  Shahnameh: "bg-emerald-400",
  TrustAI: "bg-sky-400",
  "SETAEI Pay": "bg-violet-400",
};

export function EcosystemSection({ t }: { t: LandingDict["ecosystem"] }) {
  return (
    <section id="ecosystem" className="bg-zinc-900/40 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.products.map((product) => (
            <div
              key={product.name}
              className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
                product.active
                  ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/8"
                  : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60"
              }`}
            >
              {/* Active dot */}
              {product.active && (
                <span className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              )}

              {/* Brand initial circle */}
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black text-zinc-950 ${
                  BRAND_BG[product.name] ?? "bg-zinc-600"
                }`}
              >
                {product.name[0]}
              </div>

              {/* Name + tag */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className={`text-lg font-bold ${BRAND_COLORS[product.name] ?? "text-white"}`}>
                  {product.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    product.active
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {product.tag}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-zinc-400">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
