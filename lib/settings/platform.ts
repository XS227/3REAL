import { prisma } from "@/lib/prisma";

// ── Global platform settings (ecosystemId = null) ─────────────────────────────

export const PLATFORM_SETTING_KEYS = [
  "platform.bank_name",
  "platform.ton_wallet",
  "platform.tron_wallet",
  "platform.eur_iban",
  "platform.eur_bic",
  "platform.nok_account",
  "platform.try_iban",
] as const;

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

export const PLATFORM_DEFAULTS: Record<PlatformSettingKey, string> = {
  "platform.bank_name": "3REAL Platform",
  "platform.ton_wallet": "",
  "platform.tron_wallet": "",
  "platform.eur_iban": "",
  "platform.eur_bic": "",
  "platform.nok_account": "",
  "platform.try_iban": "",
};

export type PlatformSettings = Record<PlatformSettingKey, string>;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...PLATFORM_SETTING_KEYS] }, ecosystemId: null },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<PlatformSettings>;
  return Object.fromEntries(
    PLATFORM_SETTING_KEYS.map((k) => [k, map[k] ?? PLATFORM_DEFAULTS[k]])
  ) as PlatformSettings;
}

// ── Ecosystem referral reward settings ────────────────────────────────────────

export const REFERRAL_SETTING_KEYS = [
  "referral.reward.level1",
  "referral.reward.level2",
  "referral.reward.kyc",
  "referral.reward.deposit",
] as const;

export type ReferralSettingKey = (typeof REFERRAL_SETTING_KEYS)[number];

export const REFERRAL_DEFAULTS: Record<ReferralSettingKey, number> = {
  "referral.reward.level1": 50,
  "referral.reward.level2": 15,
  "referral.reward.kyc": 25,
  "referral.reward.deposit": 10,
};

export type ReferralSettings = Record<ReferralSettingKey, number>;

export async function getReferralSettings(ecosystemId: string): Promise<ReferralSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...REFERRAL_SETTING_KEYS] }, ecosystemId },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    REFERRAL_SETTING_KEYS.map((k) => [k, Number(map[k] ?? REFERRAL_DEFAULTS[k])])
  ) as ReferralSettings;
}

// ── Upsert helper ─────────────────────────────────────────────────────────────

export async function upsertSetting(
  key: string,
  value: string,
  ecosystemId: string | null,
  updatedById?: string
) {
  const existing = await prisma.setting.findFirst({
    where: { key, ecosystemId: ecosystemId ?? null },
    select: { id: true },
  });
  if (existing) {
    await prisma.setting.update({
      where: { id: existing.id },
      data: { value, updatedById: updatedById ?? null },
    });
  } else {
    await prisma.setting.create({
      data: { key, value, ecosystemId: ecosystemId ?? null, updatedById: updatedById ?? null },
    });
  }
}
