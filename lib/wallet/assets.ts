import type { AssetCode } from "@/lib/generated/prisma/enums";

export type AssetMeta = {
  code: AssetCode;
  name: string;
  symbol: string;
  decimals: number;
  networkLabel: string;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
};

export const ASSETS: Record<AssetCode, AssetMeta> = {
  REAL: {
    code: "REAL",
    name: "REAL Token",
    symbol: "REAL",
    decimals: 2,
    networkLabel: "TON Jetton",
    accentClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    ringClass: "ring-amber-500/20",
  },
  TON: {
    code: "TON",
    name: "Toncoin",
    symbol: "TON",
    decimals: 4,
    networkLabel: "The Open Network",
    accentClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/20",
    ringClass: "ring-sky-500/20",
  },
  USDT: {
    code: "USDT",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 2,
    networkLabel: "TRC-20",
    accentClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    ringClass: "ring-emerald-500/20",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimals: 2,
    networkLabel: "SEPA / Bank",
    accentClass: "text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    ringClass: "ring-blue-500/20",
  },
  NOK: {
    code: "NOK",
    name: "Norwegian Krone",
    symbol: "kr",
    decimals: 2,
    networkLabel: "Bank Transfer",
    accentClass: "text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/20",
    ringClass: "ring-violet-500/20",
  },
  TRY: {
    code: "TRY",
    name: "Turkish Lira",
    symbol: "₺",
    decimals: 2,
    networkLabel: "Bank Transfer",
    accentClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    ringClass: "ring-orange-500/20",
  },
};

export const ASSET_ORDER: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

export function getAsset(code: string): AssetMeta | null {
  return ASSETS[code.toUpperCase() as AssetCode] ?? null;
}

export function fmtAsset(amount: number, meta: AssetMeta): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
}
