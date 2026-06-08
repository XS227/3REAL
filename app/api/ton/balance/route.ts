import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTonSettings } from "@/lib/ton/settings";
import { getOnChainBalances } from "@/lib/ton/jetton";
import { TonApiError } from "@/lib/ton/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const wallet = await prisma.tonWallet.findUnique({ where: { id } });
  if (!wallet || wallet.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await getTonSettings();

  try {
    const balances = await getOnChainBalances(
      wallet.walletAddress,
      settings.jettonMaster,
      settings.apiKey || undefined
    );

    return NextResponse.json({
      ton: balances.ton,
      real: balances.real,
      tonNano: balances.tonNano.toString(),
      realNano: balances.realNano.toString(),
      fetchedAt: balances.fetchedAt,
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
