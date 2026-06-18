"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import Link from "next/link";
import type { NotificationItem } from "@/lib/notifications/queries";
import { dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";

type ApiResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
};

function typeIcon(type: string) {
  if (type.startsWith("kyc_")) return <ShieldCheck className="h-5 w-5 text-sky-400" />;
  if (type.startsWith("deposit_")) return <Coins className="h-5 w-5 text-emerald-400" />;
  if (type.startsWith("withdrawal_")) return <ArrowUpRight className="h-5 w-5 text-amber-400" />;
  if (type.startsWith("referral_")) return <Gift className="h-5 w-5 text-violet-400" />;
  return <Info className="h-5 w-5 text-zinc-400" />;
}

function typeHref(type: string): string | null {
  if (type.startsWith("kyc_")) return "/dashboard/kyc";
  if (type.startsWith("deposit_")) return "/dashboard/wallet";
  if (type.startsWith("withdrawal_")) return "/dashboard/withdraw";
  if (type.startsWith("referral_")) return "/dashboard/referrals";
  return null;
}

function timeAgo(iso: string, t: DashboardDict["notifications"], lang: Lang): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t.justNow;
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t.minutesAgo}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t.hoursAgo}`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ${t.daysAgo}`;
  return new Date(iso).toLocaleDateString(dateLocale(lang), { month: "short", day: "numeric" });
}

export function NotificationsPageClient({
  initialData,
  t,
  lang,
}: {
  initialData: ApiResponse;
  t: DashboardDict["notifications"];
  lang: Lang;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function loadMore() {
    const page = Math.floor(data.notifications.length / 20);
    setLoading(true);
    const res = await fetch(`/api/notifications?page=${page}`);
    const json: ApiResponse = await res.json();
    setLoading(false);
    setData((prev) => ({
      ...json,
      notifications: [...prev.notifications, ...json.notifications],
    }));
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    startTransition(() => {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    });
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    startTransition(() => {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    });
  }

  const { notifications, unreadCount, hasMore } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-zinc-400">
              {unreadCount} {t.unreadSuffix}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <CheckCheck className="h-4 w-4" />
            {t.markAllRead}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-zinc-700" />
            <p className="text-zinc-400">{t.empty}</p>
            <p className="text-sm text-zinc-600">{t.emptyDesc}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const href = typeHref(n.type);
            return (
              <div
                key={n.id}
                className={`relative flex gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/50 ${
                  !n.isRead ? "bg-zinc-800/30" : ""
                }`}
              >
                {/* Unread indicator */}
                {!n.isRead && (
                  <span className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}

                {/* Icon */}
                <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <Link href={href} className="group" onClick={() => !n.isRead && markOne(n.id)}>
                          <p className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">
                            {n.title}
                          </p>
                        </Link>
                      ) : (
                        <p className="font-medium text-zinc-100">{n.title}</p>
                      )}
                      {n.body && (
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{n.body}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-600">{timeAgo(n.createdAt, t, lang)}</p>
                    </div>

                    {/* Mark read */}
                    {!n.isRead && (
                      <button
                        onClick={() => markOne(n.id)}
                        className="shrink-0 rounded p-1.5 text-zinc-600 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                        title={t.markAllRead}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
          >
            {loading ? t.loading : t.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
