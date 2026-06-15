"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  Users,
  BadgeCheck,
  Settings,
  Shield,
  Bell,
  Menu,
  X,
  Languages,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import type { DashboardDict, Lang } from "@/lib/i18n/dashboard";

type Props = {
  email: string;
  role: string;
  initialUnread?: number;
  lang: Lang;
  t: DashboardDict;
  children: React.ReactNode;
};

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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
      aria-label="Switch language"
    >
      <Languages className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function DashboardShell({ email, role, initialUnread = 0, lang, t, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = role === "super_admin" || role === "operator";
  const rtl = lang === "fa";

  const NAV = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/wallet", label: t.nav.wallet, icon: Wallet },
    { href: "/dashboard/withdraw", label: t.nav.withdraw, icon: ArrowUpRight },
    { href: "/dashboard/referrals", label: t.nav.referrals, icon: Users },
    { href: "/dashboard/kyc", label: t.nav.verification, icon: BadgeCheck },
    { href: "/dashboard/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/dashboard/settings", label: t.nav.settings, icon: Settings, soon: true },
    { href: "/admin", label: t.nav.admin, icon: Shield, adminOnly: true },
  ];

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-amber-400">
          3REAL
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell initialUnread={initialUnread} />
          <button
            className="rounded p-1 text-zinc-500 hover:text-zinc-300 md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          const cls = `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${active ? "bg-amber-500/10 text-amber-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}
            ${item.soon ? "pointer-events-none opacity-50" : ""}`;

          if (item.soon) {
            return (
              <div key={item.href} className={cls}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {t.nav.soon}
                </span>
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={cls} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        <div>
          <p className="truncate text-xs font-medium text-zinc-300">{email}</p>
          <p className="text-xs text-zinc-600 capitalize">{role.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center justify-between">
          <LogoutButton label={t.user.logout} />
          <LangToggle lang={lang} label={t.lang.toggle} />
        </div>
      </div>
    </aside>
  );

  return (
    <div
      className="flex min-h-screen bg-zinc-950 text-white"
      dir={rtl ? "rtl" : "ltr"}
      style={rtl ? { fontFamily: "var(--font-vazirmatn), sans-serif" } : undefined}
    >
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="font-bold text-amber-400">
          3REAL
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell initialUnread={initialUnread} />
          <button
            onClick={() => setOpen(true)}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 ${rtl ? "md:right-0" : "md:left-0"}`}>
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
          <div className={`fixed inset-y-0 z-50 flex md:hidden ${rtl ? "right-0" : "left-0"}`}>
            {sidebar}
          </div>
        </>
      )}

      {/* Main */}
      <div className={`flex flex-1 flex-col ${rtl ? "md:pr-64" : "md:pl-64"}`}>
        <main className="flex-1 pt-14 md:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
