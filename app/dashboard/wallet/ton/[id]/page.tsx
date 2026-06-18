import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTonSettings } from "@/lib/ton/settings";
import { getOnChainBalances, getJettonActivity } from "@/lib/ton/jetton";
import { TonApiError } from "@/lib/ton/client";
import type { JettonTransfer } from "@/lib/ton/jetton";
import { resolveDashboardLang, dashboardDicts, dateLocale, type Lang } from "@/lib/i18n/dashboard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function shortAddr(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatDate(ts: number, lang: Lang) {
  return new Date(ts * 1000).toLocaleString(dateLocale(lang));
}

export default async function TonWalletDetailPage({ params }: Props) {
  const { id } = await params;

  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
  if (!session) redirect("/auth/login");
  const lang = resolveDashboardLang(cookieStore.get("lang")?.value);
  const t = dashboardDicts[lang].walletTonDetail;

  const wallet = await prisma.tonWallet.findUnique({ where: { id } });
  if (!wallet || wallet.userId !== session.userId) notFound();

  const settings = await getTonSettings();
  const apiKey = settings.apiKey || undefined;

  let balances: { ton: number; real: number; fetchedAt: string } | null = null;
  let balanceError: string | null = null;
  let transfers: JettonTransfer[] = [];

  try {
    const b = await getOnChainBalances(wallet.walletAddress, settings.jettonMaster, apiKey);
    balances = { ton: b.ton, real: b.real, fetchedAt: b.fetchedAt };
  } catch (e) {
    balanceError = e instanceof TonApiError ? `TonAPI error: ${e.message}` : t.balanceFetchFailed;
  }

  try {
    transfers = await getJettonActivity(wallet.walletAddress, settings.jettonMaster, 20, apiKey);
  } catch {
    // activity is best-effort
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/wallet" className="text-gray-400 hover:text-white text-sm">
          ← {t.backToWallet}
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-xl font-bold text-white">{t.title}</h1>
        {wallet.isPrimary && (
          <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full">
            {t.primary}
          </span>
        )}
      </div>

      {/* Address card */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.address}</p>
        <p className="font-mono text-sm text-white break-all">{wallet.walletAddress}</p>
        <p className="text-xs text-gray-500 mt-2">
          {t.network}: <span className="text-gray-300">{wallet.network}</span>
          &nbsp;·&nbsp;{t.verified}:{" "}
          <span className="text-gray-300">
            {new Date(wallet.verifiedAt).toLocaleDateString(dateLocale(lang))}
          </span>
        </p>
      </div>

      {/* Balances */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.balances}
        </h2>
        {balanceError ? (
          <p className="text-sm text-red-400">{balanceError}</p>
        ) : balances ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-xs text-gray-500 mb-1">TON</p>
              <p className="text-2xl font-bold text-white font-mono">
                {balances.ton.toFixed(4)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-xs text-gray-500 mb-1">REAL</p>
              <p className="text-2xl font-bold text-blue-300 font-mono">
                {balances.real.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </p>
            </div>
            <p className="col-span-2 text-xs text-gray-600">
              {t.fetchedAt} {new Date(balances.fetchedAt).toLocaleTimeString(dateLocale(lang))}
            </p>
          </div>
        ) : null}
      </div>

      {/* Activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.activityTitle}
        </h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-gray-500">{t.noTransfers}</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{t.columns.date}</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{t.columns.type}</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">{t.columns.amount}</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden sm:table-cell">
                    {t.columns.counterparty}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transfers.map((transfer) => (
                  <tr key={transfer.eventId} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-300 text-xs">{formatDate(transfer.timestamp, lang)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${
                          transfer.direction === "in" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {transfer.direction === "in" ? `▼ ${t.directionIn}` : `▲ ${t.directionOut}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {transfer.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono hidden sm:table-cell">
                      {transfer.counterparty ? shortAddr(transfer.counterparty) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Link
          href="/dashboard/wallet/connect"
          className="text-sm text-gray-400 hover:text-white underline"
        >
          {t.manageWallets}
        </Link>
      </div>
    </div>
  );
}
