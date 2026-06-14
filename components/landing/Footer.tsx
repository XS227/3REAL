import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";
import type { LandingLang } from "@/lib/i18n";
import { LangSwitcher } from "@/components/landing/LangSwitcher";

export function Footer({
  t,
  lang,
}: {
  t: LandingDict["footer"];
  lang: LandingLang;
}) {
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

            {/* SETAEI — ستائی */}
            <a
              href="https://setaei.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-baseline gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <span className="font-semibold tracking-wide">SETAEI</span>
              <span dir="rtl" lang="fa" className="font-fa text-base text-amber-400/90">
                ستائی
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 self-center opacity-60" />
            </a>

            {/* Language switcher */}
            <div className="mt-5">
              <LangSwitcher current={lang} />
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.items.map((item) => {
                  const external = item.href.startsWith("http");
                  return (
                    <li key={item.label}>
                      {external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          {item.label}
                          <ArrowUpRight className="h-3 w-3 opacity-50 rtl:-scale-x-100" />
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
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
