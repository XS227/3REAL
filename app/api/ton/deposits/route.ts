import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getRealDepositHistory } from "@/lib/ton/deposits";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAuth();
  const deposits = await getRealDepositHistory(session.userId);
  return NextResponse.json({ deposits });
}
