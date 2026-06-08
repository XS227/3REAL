import { NextRequest, NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { getAllRealDepositsAdmin } from "@/lib/ton/deposits";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jwt = await getSession();
  if (!jwt) return null;
  const session = await validateSession(jwt);
  if (!session) return null;
  if (session.role !== "super_admin" && session.role !== "operator") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const data = await getAllRealDepositsAdmin(page);
  return NextResponse.json(data);
}
