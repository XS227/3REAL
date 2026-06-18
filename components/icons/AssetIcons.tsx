import { Euro, Banknote } from "lucide-react";

/**
 * Simplified, generic renditions of well-known network marks (Toncoin
 * diamond, Tether circle) — not the exact corporate logo files, which don't
 * exist anywhere on this server, but recognizable stand-ins consistent with
 * the dark 3REAL theme. EUR/NOK/TRY use lucide's currency icons since no
 * logo applies to fiat bank transfers.
 *
 * RealIcon is intentionally separate from the platform Logo/LogoMark (which
 * now uses the real SETAEI ecosystem asset) — the REAL token icon and the
 * 3REAL platform brand mark are two different things.
 */
export function RealIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="real-token-grad" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#real-token-grad)" stroke="#f59e0b" strokeOpacity="0.5" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#fef3c7" strokeOpacity="0.3" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#fffbeb"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        R
      </text>
    </svg>
  );
}

export function TonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2 22 8 12 22 2 8 12 2Z" fill="#37AEF2" />
      <path d="M12 2 22 8H2L12 2Z" fill="#65C2F5" />
    </svg>
  );
}

export function UsdtIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#26A17B" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ₮
      </text>
    </svg>
  );
}

export function AssetIcon({ code, className = "h-4 w-4" }: { code: string; className?: string }) {
  switch (code) {
    case "REAL":
      return <RealIcon className={className} />;
    case "TON":
      return <TonIcon className={className} />;
    case "USDT":
      return <UsdtIcon className={className} />;
    case "EUR":
      return <Euro className={className} strokeWidth={2.5} />;
    case "NOK":
    case "TRY":
      return <Banknote className={className} strokeWidth={2} />;
    default:
      return null;
  }
}
