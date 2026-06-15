"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BadgeCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Gift,
  Shield,
  Menu,
  X,
  BarChart2,
  TrendingUp,
  Scale,
  ScrollText,
  Gem,
  Coins,
  Languages,
  SlidersHorizontal,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Lang, AdminDict } from "@/lib/i18n/admin";

function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  function toggle() {
    const next = lang === "fa" ? "en" : "fa";
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
      aria-label="Switch language"
    >
      <Languages className="h-3 w-3" />
      {label}
    </button>
  );
}

type Props = { email: string; role: string; lang: Lang; t: AdminDict; children: React.ReactNode };

export function AdminShell({ email, role, lang, t, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rtl = lang === "fa";

  const NAV = [
    { href: "/admin", label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: "/admin/kyc", label: t.nav.kyc, icon: BadgeCheck },
    { href: "/admin/deposits", label: t.nav.deposits, icon: ArrowDownLeft },
    { href: "/admin/withdrawals", label: t.nav.withdrawals, icon: ArrowUpRight },
    { href: "/admin/referrals", label: t.nav.referrals, icon: Gift },
    { href: "/admin/users", label: t.nav.users, icon: Users },
    { href: "/admin/reports", label: t.nav.reports, icon: BarChart2 },
    { href: "/admin/analytics", label: t.nav.analytics, icon: TrendingUp },
    { href: "/admin/reconciliation", label: t.nav.reconciliation, icon: Scale },
    { href: "/admin/audit-log", label: t.nav.auditLog, icon: ScrollText },
    { href: "/admin/ton-deposits", label: t.nav.tonDeposits, icon: Coins },
    { href: "/admin/ton-settings", label: t.nav.tonSettings, icon: Gem },
    { href: "/admin/settings", label: t.nav.settings, icon: SlidersHorizontal },
  ];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xl font-bold tracking-tight text-amber-400">
            3REAL
          </Link>
          <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            {t.badge}
          </span>
        </div>
        <button
          className="rounded p-1 text-zinc-500 hover:text-zinc-300 md:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-300">{email}</p>
            <p className="text-xs text-zinc-600">{t.user.roles[role] ?? role.replace(/_/g, " ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton label={t.user.logout} />
          <LangToggle lang={lang} label={t.lang.toggle} />
        </div>
      </div>
    </aside>
  );

  return (
    <div className={`flex min-h-screen bg-zinc-950 text-white${rtl ? " font-[Vazirmatn,sans-serif]" : ""}`} dir={rtl ? "rtl" : "ltr"}>
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400">3REAL</span>
          <span className="rounded border border-red-500/30 bg-red-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-red-400">
            {t.badge}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar — right side in RTL */}
      <div className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 ${rtl ? "md:right-0" : "md:left-0"}`}>{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className={`fixed inset-y-0 z-50 flex md:hidden ${rtl ? "right-0" : "left-0"}`}>{sidebar}</div>
        </>
      )}

      {/* Main — padding flips in RTL */}
      <div className={`flex flex-1 flex-col ${rtl ? "md:pr-64" : "md:pl-64"}`}>
        <main className="flex-1 pt-14 md:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
