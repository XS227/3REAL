import { tonapiGet, toUrlAddress, TonApiError } from "./client";
import { toRawHash } from "./address";

const REAL_SYMBOL = "REAL";
const REAL_DECIMALS = 9;
const NANO = 10 ** REAL_DECIMALS;

// ── TonAPI v2 response shapes ─────────────────────────────────────────────────

type JettonInfo = {
  mintable: boolean;
  total_supply: string;
  metadata: {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    image?: string;
  };
};

type AccountInfo = {
  balance: string; // nanoTON as string
  status: "active" | "nonexist" | "frozen" | "uninit";
};

type JettonBalance = {
  balance: string; // raw Jetton units
  jetton: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image?: string;
  };
};

type JettonHistoryEvent = {
  event_id: string;
  timestamp: number;
  actions: Array<{
    type: string;
    status: string;
    JettonTransfer?: {
      sender?: { address: string; name?: string } | null;
      recipient?: { address: string; name?: string } | null;
      amount: string;
      comment?: string;
      jetton: {
        address: string;
        symbol: string;
        decimals: number;
      };
    };
  }>;
};

type JettonHistoryResponse = {
  events: JettonHistoryEvent[];
};

// ── Public types ──────────────────────────────────────────────────────────────

export type JettonMeta = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  image?: string;
};

export type OnChainBalances = {
  tonNano: bigint;         // raw nanoTON
  realNano: bigint;        // raw nano-REAL units
  ton: number;             // display value
  real: number;            // display value
  fetchedAt: string;       // ISO timestamp
};

export type JettonTransfer = {
  eventId: string;
  timestamp: number;
  direction: "in" | "out";
  amountNano: bigint;
  amount: number;
  counterparty: string | null;
  comment: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addressesMatch(a: string, b: string): boolean {
  return toRawHash(a) === toRawHash(b);
}

function fromNano(nano: string, decimals: number): number {
  const n = BigInt(nano);
  const d = 10 ** decimals;
  return Number(n) / d;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch and verify REAL Jetton metadata. Rejects fake Jettons. */
export async function verifyJettonMaster(
  master: string,
  apiKey?: string
): Promise<JettonMeta> {
  const url = toUrlAddress(master);
  const info = await tonapiGet<JettonInfo>(`/jettons/${url}`, apiKey);

  if (info.metadata.symbol !== REAL_SYMBOL) {
    throw new Error(
      `Jetton symbol mismatch: expected ${REAL_SYMBOL}, got ${info.metadata.symbol}`
    );
  }

  const decimals = parseInt(info.metadata.decimals, 10);
  if (decimals !== REAL_DECIMALS) {
    throw new Error(
      `Jetton decimals mismatch: expected ${REAL_DECIMALS}, got ${decimals}`
    );
  }

  return {
    address: master,
    name: info.metadata.name,
    symbol: info.metadata.symbol,
    decimals,
    totalSupply: fromNano(info.total_supply, decimals),
    image: info.metadata.image,
  };
}

/** Fetch on-chain TON + REAL balance for a wallet address. */
export async function getOnChainBalances(
  rawAddress: string,
  jettonMaster: string,
  apiKey?: string
): Promise<OnChainBalances> {
  const urlAddr = toUrlAddress(rawAddress);
  const urlMaster = toUrlAddress(jettonMaster);

  // Fetch both in parallel
  const [account, jettonBal] = await Promise.all([
    tonapiGet<AccountInfo>(`/accounts/${urlAddr}`, apiKey),
    tonapiGet<JettonBalance>(`/accounts/${urlAddr}/jettons/${urlMaster}`, apiKey).catch(
      (e: unknown) => {
        // 404 = wallet has no REAL balance — not an error
        if (e instanceof TonApiError && e.status === 404) return null;
        throw e;
      }
    ),
  ]);

  // Whitelist check: Jetton returned must match configured master
  if (jettonBal && !addressesMatch(jettonBal.jetton.address, jettonMaster)) {
    throw new Error("Jetton address mismatch — possible counterfeit token");
  }

  const tonNano = BigInt(account.balance ?? "0");
  const realNano = jettonBal ? BigInt(jettonBal.balance) : BigInt(0);

  return {
    tonNano,
    realNano,
    ton: Number(tonNano) / 1e9,
    real: Number(realNano) / NANO,
    fetchedAt: new Date().toISOString(),
  };
}

/** Fetch the 20 most recent REAL Jetton transfers for a wallet. */
export async function getJettonActivity(
  rawAddress: string,
  jettonMaster: string,
  limit = 20,
  apiKey?: string
): Promise<JettonTransfer[]> {
  const urlAddr = toUrlAddress(rawAddress);
  const urlMaster = toUrlAddress(jettonMaster);

  let data: JettonHistoryResponse;
  try {
    data = await tonapiGet<JettonHistoryResponse>(
      `/accounts/${urlAddr}/jettons/${urlMaster}/history?limit=${limit}`,
      apiKey
    );
  } catch (e) {
    if (e instanceof TonApiError && e.status === 404) return [];
    throw e;
  }

  const transfers: JettonTransfer[] = [];

  for (const event of data.events ?? []) {
    for (const action of event.actions ?? []) {
      if (action.type !== "JettonTransfer" || !action.JettonTransfer) continue;
      const jt = action.JettonTransfer;

      const senderRaw = jt.sender?.address ?? null;
      const recipientRaw = jt.recipient?.address ?? null;

      const isSender = senderRaw ? addressesMatch(senderRaw, rawAddress) : false;
      const direction: "in" | "out" = isSender ? "out" : "in";

      const counterparty = direction === "out" ? recipientRaw : senderRaw;

      const amountNano = BigInt(jt.amount);

      transfers.push({
        eventId: event.event_id,
        timestamp: event.timestamp,
        direction,
        amountNano,
        amount: Number(amountNano) / NANO,
        counterparty,
        comment: jt.comment ?? null,
      });
    }
  }

  return transfers;
}
