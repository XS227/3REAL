import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTonSettings } from "@/lib/ton/settings";
import { getJettonActivity } from "@/lib/ton/jetton";
import { TonApiError } from "@/lib/ton/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(parseInt(limitParam ?? "20", 10) || 20, 50);

  const wallet = await prisma.tonWallet.findUnique({ where: { id } });
  if (!wallet || wallet.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await getTonSettings();

  try {
    const transfers = await getJettonActivity(
      wallet.walletAddress,
      settings.jettonMaster,
      limit,
      settings.apiKey || undefined
    );

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        eventId: t.eventId,
        timestamp: t.timestamp,
        direction: t.direction,
        amount: t.amount,
        amountNano: t.amountNano.toString(),
        counterparty: t.counterparty,
        comment: t.comment,
      })),
    });
  } catch (e) {
    if (e instanceof TonApiError) {
      return NextResponse.json(
        { error: "TonAPI error", detail: e.message },
        { status: 502 }
      );
    }
    throw e;
  }
}
