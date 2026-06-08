import { Address } from "@ton/ton";

const TONAPI_BASE = "https://tonapi.io/v2";
const TIMEOUT_MS = 12_000;

export class TonApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "TonApiError";
  }
}

/** Convert any TON address to URL-safe friendly form (EQ…). */
export function toUrlAddress(addr: string): string {
  try {
    if (addr.startsWith("0:") || addr.startsWith("-1:")) {
      return Address.parseRaw(addr).toString({ urlSafe: true, bounceable: true });
    }
    // Already friendly — round-trip to normalise
    return Address.parseFriendly(addr).address.toString({ urlSafe: true, bounceable: true });
  } catch {
    return encodeURIComponent(addr);
  }
}

export async function tonapiGet<T>(path: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(`${TONAPI_BASE}${path}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body.error ?? body.message ?? msg;
    } catch {
      // ignore JSON parse error
    }
    throw new TonApiError(res.status, msg);
  }

  return res.json() as Promise<T>;
}
