import { en, type LandingDict } from "./en";
import { fa } from "./fa";

export type LandingLang = "en" | "fa";

export const landingDicts: Record<LandingLang, LandingDict> = { en, fa };

export function resolveLandingLang(value: string | undefined): LandingLang {
  return value === "fa" ? "fa" : "en";
}

export type { LandingDict };
