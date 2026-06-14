"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { Bell, X, Check, CheckCheck, Info, ShieldCheck, Coins, ArrowUpRight, Gift } from "lucide-react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
};

type ApiResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
};

function typeIcon(type: string) {
  if (type.startsWith("kyc_")) return <ShieldCheck className="h-4 w-4 text-sky-400" />;
  if (type.startsWith("deposit_")) return <Coins className="h-4 w-4 text-emerald-400" />;
  if (type.startsWith("withdrawal_")) return <ArrowUpRight className="h-4 w-4 text-amber-400" />;
  if (type.startsWith("referral_")) return <Gift className="h-4 w-4 text-violet-400" />;
  return <Info className="h-4 w-4 text-zinc-400" />;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function referenceHref(type: string, referenceType: string | null): string | null {
  if (type.startsWith("kyc_")) return "/dashboard/kyc";
  if (type.startsWith("deposit_")) return "/dashboard/wallet";
  if (type.startsWith("withdrawal_")) return "/dashboard/withdraw";
  if (type.startsWith("referral_")) return "/dashboard/referrals";
  return null;
}

export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const json: ApiResponse = await res.json();
    setData(json);
    setUnread(json.unreadCount);
  }, []);

  useEffect(() => {
    if (open && !data) fetchNotifications();
  }, [open, data, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    startTransition(() => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n,
              ),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev,
      );
      setUnread((u) => Math.max(0, u - 1));
    });
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    startTransition(() => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
              unreadCount: 0,
            }
          : prev,
      );
      setUnread(0);
    });
  }

  const notifications = data?.notifications ?? [];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-100">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const href = referenceHref(n.type, n.referenceType);
                  return (
                    <li
                      key={n.id}
                      className={`relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-900 ${
                        !n.isRead ? "bg-zinc-900/60" : ""
                      }`}
                    >
                      {/* Unread dot */}
                      {!n.isRead && (
                        <span className="absolute left-2 top-4 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}

                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {href ? (
                          <Link
                            href={href}
                            onClick={() => {
                              if (!n.isRead) markOne(n.id);
                              setOpen(false);
                            }}
                            className="block"
                          >
                            <p className="truncate text-sm font-medium text-zinc-100">{n.title}</p>
                            {n.body && (
                              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                          </Link>
                        ) : (
                          <>
                            <p className="truncate text-sm font-medium text-zinc-100">{n.title}</p>
                            {n.body && (
                              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                          </>
                        )}
                        <p className="mt-1 text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Mark read button */}
                      {!n.isRead && (
                        <button
                          onClick={() => markOne(n.id)}
                          className="mt-0.5 shrink-0 rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-zinc-800 px-4 py-2.5 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-zinc-500 transition-colors hover:text-amber-400"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
