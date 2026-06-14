import { TrendingDown, TrendingUp } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";
import { formatUsdPrice, getMarketData } from "@/lib/landing/market";
import { MarketChart } from "@/components/landing/MarketChart";

function ChangeBadge({ change }: { change: number }) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
        up ? "text-emerald-400" : "text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {change.toFixed(2)}%
    </span>
  );
}

/** Lower-page market overview: TON 30-day chart + live cards for all assets. */
export async function MarketOverviewSection({
  t,
}: {
  t: LandingDict["marketOverview"];
}) {
  const { coins, tonChart } = await getMarketData();
  const ton = coins.find((c) => c.id === "ton");

  if (coins.length === 0 && tonChart.length === 0) return null;

  return (
    <section id="market-overview" className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* TON/USD chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white" dir="ltr">
                  {t.chartTitle}
                </p>
                <p className="text-xs text-zinc-500">{t.chartSubtitle}</p>
              </div>
              <div className="text-right" dir="ltr">
                {ton && (
                  <>
                    <p className="text-2xl font-black tabular-nums text-white">
                      {formatUsdPrice(ton.priceUsd)}
                    </p>
                    <ChangeBadge change={ton.change24h} />
                  </>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {t.chartRangeLabel}
                </p>
              </div>
            </div>
            <div className="h-64 sm:h-72" dir="ltr">
              {tonChart.length > 0 ? (
                <MarketChart data={tonChart} name="TON/USD" color="#38bdf8" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  {t.unavailable}
                </div>
              )}
            </div>
          </div>

          {/* Asset cards */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
            {coins.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                    {c.symbol.slice(0, 3)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{c.symbol}</p>
                    <p className="text-xs text-zinc-500">{t.assets[c.id]}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2" dir="ltr">
                  <p className="text-lg font-black tabular-nums text-white">
                    {formatUsdPrice(c.priceUsd)}
                  </p>
                  <ChangeBadge change={c.change24h} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
