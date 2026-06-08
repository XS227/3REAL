import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { unlinkTonWallet } from "@/lib/ton/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  const { id } = await params;

  const removed = await unlinkTonWallet(session.userId, id);
  if (!removed) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ?? null;

  await prisma.activityLog.create({
    data: {
      actorId: session.userId,
      targetId: id,
      targetType: "ton_wallet",
      action: "ton_wallet.disconnected",
      meta: { walletId: id },
      ipAddress: ip,
    },
  });

  return NextResponse.json({ ok: true });
}
