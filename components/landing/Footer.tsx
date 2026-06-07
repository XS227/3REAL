import Link from "next/link";
import type { LandingDict } from "@/lib/i18n/en";

export function Footer({ t }: { t: LandingDict["footer"] }) {
  const cols = [t.links.platform, t.links.legal, t.links.ecosystem] as const;

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center font-black text-xl tracking-tight">
              <span className="text-amber-400">3</span>
              <span className="text-white">REAL</span>
            </Link>
            <p className="mt-3 text-sm text-amber-400/80 font-medium">{t.tagline}</p>
            <p className="mt-1 text-sm text-zinc-500">{t.description}</p>

            {/* Language selector placeholder */}
            <div className="mt-6 flex gap-2">
              {(["EN", "NO", "FA"] as const).map((lang) => (
                <button
                  key={lang}
                  disabled={lang !== "EN"}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    lang === "EN"
                      ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                      : "border-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                  title={lang !== "EN" ? "Coming soon" : undefined}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">{t.copyright}</p>
          <p className="text-xs text-zinc-700">
            Not a licensed financial institution. Not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
