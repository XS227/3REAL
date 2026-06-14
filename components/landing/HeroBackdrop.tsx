"use client";

import { useEffect, useRef } from "react";

type FloatingToken = {
  symbol: string;
  glyph: string;
  /** Max parallax translation in px — sign flips direction, magnitude = depth */
  depth: number;
  /** Tailwind classes for absolute placement + visibility */
  position: string;
  /** Chip diameter in px */
  size: number;
  /** Accent classes: border / text / glow */
  accent: string;
  floatDuration: string;
  floatDelay: string;
  /** Slight blur on "far away" tokens for depth of field */
  far?: boolean;
};

const TOKENS: FloatingToken[] = [
  {
    symbol: "REAL",
    glyph: "R",
    depth: 34,
    position: "left-[6%] top-[26%] md:left-[12%]",
    size: 76,
    accent:
      "border-amber-400/40 text-amber-300 shadow-[0_0_45px_-5px_rgba(245,158,11,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.28),rgba(24,24,27,0.9))]",
    floatDuration: "9s",
    floatDelay: "0s",
  },
  {
    symbol: "TON",
    glyph: "◆",
    depth: -22,
    position: "right-[8%] top-[20%] md:right-[14%]",
    size: 64,
    accent:
      "border-sky-400/40 text-sky-300 shadow-[0_0_40px_-6px_rgba(56,189,248,0.4)] bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.22),rgba(24,24,27,0.9))]",
    floatDuration: "11s",
    floatDelay: "-3s",
  },
  {
    symbol: "BTC",
    glyph: "₿",
    depth: 16,
    position: "hidden md:flex right-[7%] bottom-[24%]",
    size: 56,
    accent:
      "border-orange-400/35 text-orange-300 shadow-[0_0_35px_-6px_rgba(251,146,60,0.35)] bg-[radial-gradient(circle_at_30%_30%,rgba(251,146,60,0.2),rgba(24,24,27,0.9))]",
    floatDuration: "10s",
    floatDelay: "-6s",
  },
  {
    symbol: "ETH",
    glyph: "Ξ",
    depth: -40,
    position: "hidden md:flex left-[9%] bottom-[28%]",
    size: 48,
    accent:
      "border-indigo-400/35 text-indigo-300 shadow-[0_0_30px_-6px_rgba(129,140,248,0.35)] bg-[radial-gradient(circle_at_30%_30%,rgba(129,140,248,0.2),rgba(24,24,27,0.9))]",
    floatDuration: "12s",
    floatDelay: "-2s",
    far: true,
  },
  {
    symbol: "USDT",
    glyph: "₮",
    depth: 48,
    position: "hidden lg:flex left-[26%] top-[14%]",
    size: 42,
    accent:
      "border-emerald-400/35 text-emerald-300 shadow-[0_0_28px_-6px_rgba(52,211,153,0.35)] bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.2),rgba(24,24,27,0.9))]",
    floatDuration: "8s",
    floatDelay: "-4s",
    far: true,
  },
  {
    symbol: "REAL",
    glyph: "R",
    depth: -52,
    position: "hidden lg:flex right-[24%] bottom-[16%]",
    size: 38,
    accent:
      "border-amber-400/30 text-amber-300/80 shadow-[0_0_24px_-6px_rgba(245,158,11,0.3)] bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.16),rgba(24,24,27,0.9))]",
    floatDuration: "13s",
    floatDelay: "-7s",
    far: true,
  },
];

/**
 * Animated hero backdrop: drifting glow orbs + floating token chips that
 * react to mouse movement and scroll (parallax). Pure decoration — all
 * elements are aria-hidden and pointer-events-none.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let mx = 0;
    let my = 0;
    let sy = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
      el.style.setProperty("--sy", sy.toFixed(1));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      schedule();
    };
    const onScroll = () => {
      sy = Math.min(window.scrollY, 900) / 10;
      schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Drifting glow orbs */}
      <div
        className="animate-glow-drift absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.14) 0%, transparent 65%)",
        }}
      />
      <div
        className="animate-glow-drift absolute -bottom-40 -left-40 h-[420px] w-[560px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(56,189,248,0.07) 0%, transparent 65%)",
          animationDelay: "-7s",
        }}
      />
      <div
        className="animate-glow-drift absolute -right-32 top-1/3 h-[380px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(129,140,248,0.06) 0%, transparent 65%)",
          animationDelay: "-4s",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 40%, black 30%, transparent 75%)",
        }}
      />

      {/* Floating token chips (parallax via --mx / --my / --sy) */}
      {TOKENS.map((token, i) => (
        <div
          key={`${token.symbol}-${i}`}
          className={`absolute flex ${token.position}`}
          style={{
            transform: `translate3d(calc(var(--mx, 0) * ${token.depth}px), calc(var(--my, 0) * ${token.depth}px + var(--sy, 0) * ${(token.depth / 8).toFixed(1)}px), 0)`,
            willChange: "transform",
          }}
        >
          <div
            className={`animate-hero-float flex flex-col items-center justify-center rounded-full border backdrop-blur-sm ${token.accent} ${token.far ? "opacity-60 blur-[1px]" : ""}`}
            style={{
              width: token.size,
              height: token.size,
              animationDuration: token.floatDuration,
              animationDelay: token.floatDelay,
            }}
          >
            <span
              className="font-black leading-none"
              style={{ fontSize: token.size * 0.34 }}
            >
              {token.glyph}
            </span>
            <span
              className="mt-0.5 font-semibold uppercase tracking-wider opacity-70"
              style={{ fontSize: Math.max(token.size * 0.12, 7) }}
            >
              {token.symbol}
            </span>
          </div>
        </div>
      ))}

      {/* Bottom fade into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-zinc-950" />
    </div>
  );
}
