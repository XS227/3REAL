import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { setPrimaryWallet } from "@/lib/ton/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  const { id } = await params;

  const updated = await setPrimaryWallet(session.userId, id);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.activityLog.create({
    data: {
      actorId: session.userId,
      targetId: id,
      targetType: "ton_wallet",
      action: "ton_wallet.set_primary",
      meta: { walletId: id },
    },
  });

  return NextResponse.json({ ok: true });
}
