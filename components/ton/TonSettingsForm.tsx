"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  "ton.jetton_master": string;
  "ton.network": string;
  "ton.api_key": string;
};

export function TonSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ton-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg({ ok: false, text: j.error ?? "Save failed" });
      } else {
        setMsg({ ok: true, text: "Settings saved." });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof Settings, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          REAL Jetton Master Address
        </label>
        <input
          type="text"
          value={form["ton.jetton_master"]}
          onChange={(e) => set("ton.jetton_master", e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="EQ..."
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          The on-chain address of the REAL Jetton master contract.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Network
        </label>
        <select
          value={form["ton.network"]}
          onChange={(e) => set("ton.network", e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="mainnet">mainnet</option>
          <option value="testnet">testnet</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          TonAPI Key
          <span className="ml-2 text-xs text-gray-500">(optional — free tier without key)</span>
        </label>
        <input
          type="password"
          value={form["ton.api_key"]}
          onChange={(e) => set("ton.api_key", e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Leave blank for unauthenticated access"
          autoComplete="off"
        />
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
