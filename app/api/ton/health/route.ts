import { NextResponse } from "next/server";
import { getTonSettings } from "@/lib/ton/settings";
import { tonapiGet, toUrlAddress } from "@/lib/ton/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type JettonMini = { metadata: { symbol: string } };

export async function GET() {
  const settings = await getTonSettings();
  const apiKey = settings.apiKey || undefined;
  const master = settings.jettonMaster;

  const results: Record<string, "ok" | "error"> = {};
  let allOk = true;

  // TonAPI connectivity
  try {
    await tonapiGet<{ status: string }>("/status", apiKey);
    results.tonapi = "ok";
  } catch (e) {
    logger.warn("TON health: TonAPI unreachable", { error: String(e) });
    results.tonapi = "error";
    allOk = false;
  }

  // Jetton master accessible
  try {
    const url = toUrlAddress(master);
    const j = await tonapiGet<JettonMini>(`/jettons/${url}`, apiKey);
    results.jetton = j.metadata?.symbol === "REAL" ? "ok" : "error";
    if (results.jetton !== "ok") allOk = false;
  } catch (e) {
    logger.warn("TON health: Jetton master unreachable", { error: String(e), master });
    results.jetton = "error";
    allOk = false;
  }

  return NextResponse.json(
    { ok: allOk, checks: results, jettonMaster: master, network: settings.network },
    { status: allOk ? 200 : 503 }
  );
}
