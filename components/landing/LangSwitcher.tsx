"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import type { LandingLang } from "@/lib/i18n";

export function LangSwitcher({ current }: { current: LandingLang }) {
  const router = useRouter();
  const next = current === "fa" ? "en" : "fa";

  function switchLang() {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button
      onClick={switchLang}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      aria-label={next === "fa" ? "تغییر زبان به فارسی" : "Switch language to English"}
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium">{next === "fa" ? "فارسی" : "EN"}</span>
    </button>
  );
}
