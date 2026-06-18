"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { DashboardDict } from "@/lib/i18n/dashboard";

interface Props {
  displayName: string | null;
  email: string;
  isGoogleAccount: boolean;
  t: DashboardDict["settings"];
}

function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      }`}
    >
      {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  );
}

export function DisplayNameForm({ displayName, t }: { displayName: string | null; t: DashboardDict["settings"] }) {
  const [name, setName] = useState(displayName ?? "");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "display_name", displayName: name || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? t.displayNameFailed });
      } else {
        setStatus({ type: "success", msg: t.displayNameUpdated });
      }
    } catch {
      setStatus({ type: "error", msg: t.networkError });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.displayNameLabel}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.displayNamePlaceholder}
          maxLength={128}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-600">{t.displayNameHint}</p>
      </div>
      {status && <Alert type={status.type} message={status.msg} />}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {saving ? t.saving : t.saveName}
      </button>
    </form>
  );
}

export function ChangePasswordForm({ isGoogleAccount, t }: { isGoogleAccount: boolean; t: DashboardDict["settings"] }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (isGoogleAccount) {
    return (
      <p className="text-sm text-zinc-500">
        {t.googleAccountNote}{" "}
        <a href="/auth/forgot-password" className="text-amber-400 hover:underline">
          {t.forgotPasswordLink}
        </a>
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (newPw !== confirm) {
      setStatus({ type: "error", msg: t.passwordsDontMatch });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword: current, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? t.passwordChangeFailed });
      } else {
        setStatus({ type: "success", msg: t.passwordChanged });
        setCurrent("");
        setNewPw("");
        setConfirm("");
      }
    } catch {
      setStatus({ type: "error", msg: t.networkError });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.currentPasswordLabel}</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-amber-500/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.newPasswordLabel}</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-amber-500/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-600">{t.newPasswordHint}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.confirmPasswordLabel}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/60 focus:outline-none"
        />
      </div>
      {status && <Alert type={status.type} message={status.msg} />}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {saving ? t.saving : t.changePassword}
      </button>
    </form>
  );
}

export function SettingsPage({ displayName, email, isGoogleAccount, t }: Props) {
  return (
    <div className="space-y-8 max-w-xl">
      {/* Profile section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">{t.profileSection}</h2>
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-400 mb-1">{t.emailLabel}</p>
          <p className="text-sm text-zinc-300 font-mono">{email}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{t.emailImmutableNote}</p>
        </div>
        <DisplayNameForm displayName={displayName} t={t} />
      </div>

      {/* Security section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">{t.securitySection}</h2>
        <ChangePasswordForm isGoogleAccount={isGoogleAccount} t={t} />
      </div>
    </div>
  );
}
