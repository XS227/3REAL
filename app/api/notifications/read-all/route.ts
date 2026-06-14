import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { markAllRead } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

export async function PATCH() {
  const session = await requireAuth();
  await markAllRead(session.userId);
  return NextResponse.json({ ok: true });
}
