export type MarketCoin = {
  id: "ton" | "btc" | "eth" | "usdt";
  symbol: string;
  priceUsd: number;
  change24h: number;
};

export type ChartPoint = {
  /** ISO timestamp (or YYYY-MM-DD for daily data) */
  date: string;
  price: number;
};

export type RealToken = {
  priceUsd: number | null;
  priceTon: number | null;
  change24hUsd: number | null;
  change7dUsd: number | null;
  change30dUsd: number | null;
  holders: number | null;
  mcapUsd: number | null;
  liquidityUsd: number | null;
  chart: ChartPoint[];
};

export type MarketData = {
  coins: MarketCoin[];
  tonChart: ChartPoint[];
  real: RealToken;
  fetchedAt: string;
};

const COINGECKO = "https://api.coingecko.com/api/v3";
const DYOR = "https://api.dyor.io/v1";

/** REAL jetton master contract on TON — https://dyor.io/token/<address> */
export const REAL_JETTON_ADDRESS =
  "EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p";
export const REAL_DYOR_URL = `https://dyor.io/token/${REAL_JETTON_ADDRESS}`;

const REVALIDATE_SECONDS = 300;

type SimplePriceResponse = Record<
  string,
  { usd: number; usd_24h_change: number }
>;

type MarketChartResponse = { prices: [number, number][] };

/** dyor.io encodes decimals as { value: "677", decimals: 11 } → 677e-11 */
type DyorAmount = { value: string; decimals: number };

type DyorJettonResponse = {
  details?: {
    price?: DyorAmount;
    priceUsd?: DyorAmount;
    holdersCount?: string;
    mcap?: DyorAmount;
    liquidityUsd?: DyorAmount;
  };
};

type DyorStatsResponse = {
  priceChange?: {
    usd?: Record<string, { changePercent?: number }>;
  };
};

type DyorChartResponse = {
  points?: { value: DyorAmount; time: string }[];
};

function dyorNumber(amount: DyorAmount | undefined): number | null {
  if (!amount || amount.value === undefined) return null;
  const n = Number(amount.value);
  if (!Number.isFinite(n)) return null;
  return n / 10 ** (amount.decimals ?? 0);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getCoins(): Promise<MarketCoin[]> {
  const ids = "the-open-network,bitcoin,ethereum,tether";
  const data = await fetchJson<SimplePriceResponse>(
    `${COINGECKO}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
  );
  if (!data) return [];

  const mapping: { id: MarketCoin["id"]; symbol: string; geckoId: string }[] = [
    { id: "ton", symbol: "TON", geckoId: "the-open-network" },
    { id: "btc", symbol: "BTC", geckoId: "bitcoin" },
    { id: "eth", symbol: "ETH", geckoId: "ethereum" },
    { id: "usdt", symbol: "USDT", geckoId: "tether" },
  ];

  return mapping.flatMap(({ id, symbol, geckoId }) => {
    const entry = data[geckoId];
    if (!entry || typeof entry.usd !== "number") return [];
    return [
      {
        id,
        symbol,
        priceUsd: entry.usd,
        change24h: entry.usd_24h_change ?? 0,
      },
    ];
  });
}

async function getTonChart(): Promise<ChartPoint[]> {
  const data = await fetchJson<MarketChartResponse>(
    `${COINGECKO}/coins/the-open-network/market_chart?vs_currency=usd&days=30&interval=daily`,
  );
  if (!data?.prices?.length) return [];

  return data.prices.map(([ts, price]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    price,
  }));
}

/** 30-day REAL/USD chart from dyor.io, downsampled to ~4h resolution. */
async function getRealChart(): Promise<ChartPoint[]> {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const qs = new URLSearchParams({
    currency: "usd",
    from: from.toISOString().slice(0, 19) + "Z",
    to: to.toISOString().slice(0, 19) + "Z",
  });
  const data = await fetchJson<DyorChartResponse>(
    `${DYOR}/jettons/${REAL_JETTON_ADDRESS}/price/chart?${qs}`,
  );
  if (!data?.points?.length) return [];

  // dyor returns newest-first hourly points; reverse and keep every 4th
  const asc = [...data.points].reverse();
  const sampled = asc.filter(
    (_, i) => i % 4 === 0 || i === asc.length - 1,
  );

  return sampled.flatMap((p) => {
    const price = dyorNumber(p.value);
    if (price === null) return [];
    return [{ date: p.time, price }];
  });
}

/** Live REAL token market data from dyor.io (price is set by the open market). */
async function getRealToken(): Promise<RealToken> {
  const [details, stats, chart] = await Promise.all([
    fetchJson<DyorJettonResponse>(`${DYOR}/jettons/${REAL_JETTON_ADDRESS}`),
    fetchJson<DyorStatsResponse>(`${DYOR}/jettons/${REAL_JETTON_ADDRESS}/stats`),
    getRealChart(),
  ]);

  const d = details?.details;
  const usdChange = stats?.priceChange?.usd;

  return {
    priceUsd: dyorNumber(d?.priceUsd),
    priceTon: dyorNumber(d?.price),
    change24hUsd: usdChange?.day?.changePercent ?? null,
    change7dUsd: usdChange?.week?.changePercent ?? null,
    change30dUsd: usdChange?.month?.changePercent ?? null,
    holders: d?.holdersCount ? Number(d.holdersCount) : null,
    mcapUsd: dyorNumber(d?.mcap),
    liquidityUsd: dyorNumber(d?.liquidityUsd),
    chart,
  };
}

export async function getMarketData(): Promise<MarketData> {
  const [coins, tonChart, real] = await Promise.all([
    getCoins(),
    getTonChart(),
    getRealToken(),
  ]);

  return {
    coins,
    tonChart,
    real,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getRealTokenData(): Promise<RealToken> {
  return getRealToken();
}

/* ---------------------------------------------------------------- */
/* Formatting helpers (shared by server + client components)         */
/* ---------------------------------------------------------------- */

const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";

function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((c) => SUBSCRIPT_DIGITS[Number(c)] ?? c)
    .join("");
}

/**
 * Format very small USD prices DEX-style: 6.77e-9 → "$0.0₈677"
 * (the subscript counts zeros between the decimal point and the
 * first significant digit). Falls back to plain formatting above 0.01.
 */
export function formatUsdPrice(price: number): string {
  if (!Number.isFinite(price)) return "—";
  if (price >= 1000)
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  if (price <= 0) return "$0";

  const zeros = Math.ceil(-Math.log10(price)) - 1;
  const significant = Math.round(price * 10 ** (zeros + 3));
  return `$0.0${toSubscript(zeros)}${significant}`;
}

export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
