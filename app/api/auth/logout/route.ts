import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guards";
import { SESSION_COOKIE } from "@/lib/auth/jwt";
import { audit, ipFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (session) {
    await audit({
      actorId: session.userId,
      targetId: session.userId,
      targetType: "user",
      action: "auth.logout",
      ipAddress: ipFromRequest(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
