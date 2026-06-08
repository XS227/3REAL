import { prisma } from "@/lib/prisma";

export const TON_SETTING_KEYS = [
  "ton.jetton_master",
  "ton.network",
  "ton.api_key",
] as const;

export const TON_SETTING_DEFAULTS: Record<string, string> = {
  "ton.jetton_master": "EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p",
  "ton.network": "mainnet",
  "ton.api_key": "",
};

export type TonSettings = {
  jettonMaster: string;
  network: string;
  apiKey: string;
};

export async function getTonSettings(): Promise<TonSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...TON_SETTING_KEYS] }, ecosystemId: null },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    jettonMaster:
      map["ton.jetton_master"] ?? TON_SETTING_DEFAULTS["ton.jetton_master"],
    network: map["ton.network"] ?? TON_SETTING_DEFAULTS["ton.network"],
    apiKey: map["ton.api_key"] ?? TON_SETTING_DEFAULTS["ton.api_key"],
  };
}
