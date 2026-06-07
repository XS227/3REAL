import { NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jwtSession = await getSession();
  if (!jwtSession) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await validateSession(jwtSession);
  if (!session) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      kycTier: true,
      emailVerified: true,
      displayName: true,
      locale: true,
      referralCode: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
