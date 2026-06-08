import { requireRole } from "@/lib/auth/guards";
import { getTonSettings } from "@/lib/ton/settings";
import { TonSettingsForm } from "@/components/ton/TonSettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "TON Settings — Admin" };

export default async function TonSettingsPage() {
  await requireRole("super_admin", "operator");

  const settings = await getTonSettings();

  const initial = {
    "ton.jetton_master": settings.jettonMaster,
    "ton.network": settings.network,
    "ton.api_key": settings.apiKey,
    "ton.deposit_address": settings.depositAddress,
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">TON Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure REAL Jetton and TonAPI connection settings.
        </p>
      </div>

      <TonSettingsForm initial={{ ...initial }} />

      <div className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Health Check
        </h2>
        <p className="text-sm text-gray-400">
          Verify TonAPI connectivity and Jetton accessibility at{" "}
          <a
            href="/api/ton/health"
            target="_blank"
            className="text-blue-400 hover:underline font-mono"
          >
            /api/ton/health
          </a>
          .
        </p>
      </div>
    </div>
  );
}
