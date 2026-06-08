"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/kyc", label: "KYC Review", icon: BadgeCheck },
  { href: "/admin/deposits", label: "Deposits", icon: ArrowDownLeft },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/users", label: "Users", icon: Users },
];

type Props = { email: string; role: string; children: React.ReactNode };

export function AdminShell({ email, role, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xl font-bold tracking-tight text-amber-400">
            3REAL
          </Link>
          <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Admin
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
            <p className="text-xs text-zinc-600 capitalize">{role.replace(/_/g, " ")}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400">3REAL</span>
          <span className="rounded border border-red-500/30 bg-red-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-red-400">
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">{sidebar}</div>
        </>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1 pt-14 md:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
