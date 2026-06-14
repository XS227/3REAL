import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const page = Number(new URL(req.url).searchParams.get("page") ?? "0");
  const data = await getNotifications(session.userId, isNaN(page) ? 0 : page);
  return NextResponse.json(data);
}
