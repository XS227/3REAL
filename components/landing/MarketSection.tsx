import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/en";
import {
  formatCompactUsd,
  formatUsdPrice,
  getMarketData,
  REAL_DYOR_URL,
  type MarketCoin,
  type RealToken,
} from "@/lib/landing/market";
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

function TickerStrip({
  coins,
  real,
  names,
  realName,
}: {
  coins: MarketCoin[];
  real: RealToken;
  names: LandingDict["market"]["assets"];
  realName: string;
}) {
  const entries: { key: string; symbol: string; name: string; price: string; change: number | null }[] = [];

  if (real.priceUsd !== null) {
    entries.push({
      key: "real",
      symbol: "REAL",
      name: realName,
      price: formatUsdPrice(real.priceUsd),
      change: real.change24hUsd,
    });
  }
  for (const c of coins) {
    entries.push({
      key: c.id,
      symbol: c.symbol,
      name: names[c.id],
      price: formatUsdPrice(c.priceUsd),
      change: c.change24h,
    });
  }

  if (entries.length === 0) return null;

  const items = entries.map((e) => (
    <span key={e.key} className="inline-flex items-center gap-2.5 px-8">
      <span className={`text-sm font-bold ${e.key === "real" ? "text-amber-400" : "text-white"}`}>
        {e.symbol}
      </span>
      <span className="text-xs text-zinc-500">{e.name}</span>
      <span className="text-sm font-semibold tabular-nums text-zinc-200">{e.price}</span>
      {e.change !== null && <ChangeBadge change={e.change} />}
    </span>
  ));

  return (
    <div
      dir="ltr"
      className="relative mb-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 py-3"
    >
      <div className="flex w-max animate-marquee">
        <div className="flex shrink-0 items-center">{items}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {items}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {items}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {items}
        </div>
      </div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent" />
    </div>
  );
}

function RealStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-zinc-200" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export async function MarketSection({ t }: { t: LandingDict["market"] }) {
  const { coins, real } = await getMarketData();
  const hasLiveData = coins.length > 0 || real.priceUsd !== null;

  return (
    <section id="market" className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {t.liveBadge}
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Live ticker */}
        <TickerStrip
          coins={coins}
          real={real}
          names={t.assets}
          realName={t.realCard.title}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* REAL/USD chart — live market price from dyor.io */}
          <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-zinc-900 p-5 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white" dir="ltr">
                  {t.chartTitle}
                </p>
                <p className="text-xs text-zinc-500">{t.chartSubtitle}</p>
              </div>
              <div className="text-right" dir="ltr">
                {real.priceUsd !== null && (
                  <>
                    <p className="text-2xl font-black tabular-nums text-amber-400">
                      {formatUsdPrice(real.priceUsd)}
                    </p>
                    {real.change24hUsd !== null && (
                      <ChangeBadge change={real.change24hUsd} />
                    )}
                  </>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {t.chartRangeLabel}
                </p>
              </div>
            </div>
            <div className="h-64 sm:h-72" dir="ltr">
              {real.chart.length > 0 ? (
                <MarketChart data={real.chart} name="REAL/USD" tiny />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  {t.unavailable}
                </div>
              )}
            </div>
          </div>

          {/* Right column: REAL stats + asset list */}
          <div className="flex flex-col gap-5">
            {/* REAL token stats */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-zinc-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-base font-bold text-white">{t.realCard.title}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  {t.realCard.liveLabel}
                </span>
              </div>

              <p className="mb-1 text-3xl font-black tabular-nums text-amber-400" dir="ltr">
                {real.priceUsd !== null ? formatUsdPrice(real.priceUsd) : "—"}
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-zinc-400" dir="ltr">
                {real.priceTon !== null && (
                  <span>{formatUsdPrice(real.priceTon).replace("$", "")} TON</span>
                )}
                {real.change7dUsd !== null && (
                  <span className="inline-flex items-center gap-1">
                    {t.realCard.change7d} <ChangeBadge change={real.change7dUsd} />
                  </span>
                )}
                {real.change30dUsd !== null && (
                  <span className="inline-flex items-center gap-1">
                    {t.realCard.change30d} <ChangeBadge change={real.change30dUsd} />
                  </span>
                )}
              </div>

              <div className="mb-4 space-y-2 border-t border-amber-500/15 pt-3">
                <RealStatRow
                  label={t.realCard.holders}
                  value={real.holders !== null ? real.holders.toLocaleString("en-US") : "—"}
                />
                <RealStatRow
                  label={t.realCard.marketCap}
                  value={real.mcapUsd !== null ? formatCompactUsd(real.mcapUsd) : "—"}
                />
                <RealStatRow
                  label={t.realCard.liquidity}
                  value={real.liquidityUsd !== null ? formatCompactUsd(real.liquidityUsd) : "—"}
                />
              </div>

              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t.realCard.note}</p>
              <a
                href={REAL_DYOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
              >
                {t.realCard.viewOnDyor}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Supported assets with live prices */}
            <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              {coins.length > 0 ? (
                <ul className="flex h-full flex-col justify-between gap-3">
                  {coins.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {c.symbol.slice(0, 3)}
                        </span>
                        <span className="text-sm text-zinc-300">{t.assets[c.id]}</span>
                      </div>
                      <div className="text-right" dir="ltr">
                        <p className="text-sm font-semibold tabular-nums text-white">
                          {formatUsdPrice(c.priceUsd)}
                        </p>
                        <ChangeBadge change={c.change24h} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  {t.unavailable}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasLiveData && (
          <p className="mt-5 text-center text-xs text-zinc-600">{t.sourceNote}</p>
        )}
      </div>
    </section>
  );
}
