import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { audit, ipFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Validation failed", errors }, { status: 422 });
  }

  const record = await consumeAuthToken(parsed.data.token, "password_reset");

  if (!record) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const passwordHash = hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  // Invalidate all other password reset tokens for this user
  await prisma.authToken.updateMany({
    where: { userId: record.userId, type: "password_reset", usedAt: null },
    data: { usedAt: new Date() },
  });

  await audit({
    actorId: record.userId,
    targetId: record.userId,
    targetType: "user",
    action: "auth.password_reset_completed",
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    success: true,
    message: "Password updated. You can now log in with your new password.",
  });
}
