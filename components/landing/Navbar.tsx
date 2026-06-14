"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingDict } from "@/lib/i18n/en";
import type { LandingLang } from "@/lib/i18n";
import { LangSwitcher } from "@/components/landing/LangSwitcher";

export function Navbar({ t, lang }: { t: LandingDict["nav"]; lang: LandingLang }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center font-black text-xl tracking-tight select-none">
            <span className="text-amber-400">3</span>
            <span className="text-white">REAL</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {t.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <LangSwitcher current={lang} />
            {/* Auth is Google-only: CTAs go straight to the OAuth flow */}
            <a href="/api/auth/google">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                {t.cta.signIn}
              </Button>
            </a>
            <a href="/api/auth/google">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
              >
                {t.cta.register}
              </Button>
            </a>
          </div>

          {/* Mobile: language switcher + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <LangSwitcher current={lang} />
            <button
              className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-zinc-800 py-4">
            <nav className="flex flex-col gap-1 mb-4">
              {t.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800">
              <a href="/api/auth/google" onClick={() => setOpen(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  {t.cta.signIn}
                </Button>
              </a>
              <a href="/api/auth/google" onClick={() => setOpen(false)}>
                <Button
                  size="sm"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  {t.cta.register}
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
