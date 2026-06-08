import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createChallenge } from "@/lib/ton/challenge";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAuth();
  const payload = createChallenge(session.userId);
  return NextResponse.json({ payload });
}
