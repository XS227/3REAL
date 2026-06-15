import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  getPlatformSettings,
  getReferralSettings,
  REFERRAL_DEFAULTS,
} from "@/lib/settings/platform";
import { savePlatformSettings } from "./actions";
import { Settings, Gift, Building2, Save } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Admin" };

function SettingInput({
  name,
  label,
  value,
  placeholder,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

export default async function AdminSettingsPage() {
  await requireRole("super_admin");

  const ecosystem = await prisma.ecosystem.findUnique({ where: { code: "three_real" } });

  const [platform, referral] = await Promise.all([
    getPlatformSettings(),
    ecosystem
      ? getReferralSettings(ecosystem.id)
      : Promise.resolve(REFERRAL_DEFAULTS),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Platform Settings</h1>
      </div>

      <form action={savePlatformSettings} className="space-y-8">
        {/* Referral rewards */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Gift className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Referral Rewards</h2>
            <span className="text-xs text-zinc-600 ml-auto">Amounts in REAL tokens</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SettingInput
              name="referral.reward.level1"
              label="Direct referral (L1)"
              value={String(referral["referral.reward.level1"])}
              type="number"
              hint="Awarded when referred user verifies email"
            />
            <SettingInput
              name="referral.reward.level2"
              label="Indirect referral (L2)"
              value={String(referral["referral.reward.level2"])}
              type="number"
              hint="Awarded for each 2nd-level referral"
            />
            <SettingInput
              name="referral.reward.kyc"
              label="KYC completion bonus"
              value={String(referral["referral.reward.kyc"])}
              type="number"
              hint="Extra reward when referred user completes KYC"
            />
            <SettingInput
              name="referral.reward.deposit"
              label="First deposit bonus"
              value={String(referral["referral.reward.deposit"])}
              type="number"
              hint="Extra reward when referred user makes first deposit"
            />
          </div>
        </section>

        {/* Deposit / banking details */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Deposit Details</h2>
            <span className="text-xs text-zinc-600 ml-auto">Shown to users on the deposit page</span>
          </div>
          <div className="space-y-4">
            <SettingInput
              name="platform.bank_name"
              label="Bank / beneficiary name"
              value={platform["platform.bank_name"]}
              placeholder="3REAL Platform"
            />
            <div className="grid grid-cols-2 gap-4">
              <SettingInput
                name="platform.eur_iban"
                label="EUR IBAN"
                value={platform["platform.eur_iban"]}
                placeholder="DE00 0000 0000 0000 0000 00"
              />
              <SettingInput
                name="platform.eur_bic"
                label="EUR BIC / SWIFT"
                value={platform["platform.eur_bic"]}
                placeholder="XXXXXXXX"
              />
            </div>
            <SettingInput
              name="platform.nok_account"
              label="NOK account number"
              value={platform["platform.nok_account"]}
              placeholder="0000 00 00000"
            />
            <SettingInput
              name="platform.try_iban"
              label="TRY IBAN"
              value={platform["platform.try_iban"]}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            <SettingInput
              name="platform.ton_wallet"
              label="TON platform wallet (for TON deposits)"
              value={platform["platform.ton_wallet"]}
              placeholder="EQ..."
            />
            <SettingInput
              name="platform.tron_wallet"
              label="TRON wallet address (for USDT TRC-20 deposits)"
              value={platform["platform.tron_wallet"]}
              placeholder="T..."
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
