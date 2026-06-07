import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { verifyEmailSchema } from "@/lib/validators/auth";
import { audit, ipFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 422 });
  }

  const record = await consumeAuthToken(parsed.data.token, "email_verify");

  if (!record) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  if (record.user.emailVerified) {
    return NextResponse.json({ success: true, message: "Email already verified." });
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true, kycTier: 1 },
  });

  await audit({
    actorId: record.userId,
    targetId: record.userId,
    targetType: "user",
    action: "auth.email_verified",
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    success: true,
    message: "Email verified. You're now at KYC Tier 1.",
  });
}
