"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  Users,
  BadgeCheck,
  Settings,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpRight },
  { href: "/dashboard/referrals", label: "Referrals", icon: Users, soon: true },
  { href: "/dashboard/kyc", label: "Verification", icon: BadgeCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, soon: true },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  const cls = `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
    ${active
      ? "bg-amber-500/10 text-amber-400"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
    }
    ${item.soon ? "pointer-events-none opacity-50" : ""}`;

  if (item.soon) {
    return (
      <div className={cls}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link href={item.href} className={cls} onClick={onClick}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

type Props = {
  email: string;
  role: string;
  children: React.ReactNode;
};

export function DashboardShell({ email, role, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = role === "super_admin" || role === "operator";

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-amber-400">
          3REAL
        </Link>
        <button
          className="rounded p-1 text-zinc-500 hover:text-zinc-300 md:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
            onClick={() => setOpen(false)}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        <div>
          <p className="truncate text-xs font-medium text-zinc-300">{email}</p>
          <p className="text-xs text-zinc-600 capitalize">{role.replace(/_/g, " ")}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="font-bold text-amber-400">
          3REAL
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            {sidebar}
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1 pt-14 md:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
