import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { audit, ipFromRequest } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);

  const rl = checkRateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Always return success — never reveal whether the email exists (enumeration protection)
  const GENERIC_SUCCESS = {
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json(GENERIC_SUCCESS);
  }

  const rawToken = await createAuthToken(user.id, "password_reset", ip);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

  await sendEmail(passwordResetEmail(email, resetUrl));

  await audit({
    actorId: user.id,
    targetId: user.id,
    targetType: "user",
    action: "auth.password_reset_requested",
    meta: { email },
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    ...GENERIC_SUCCESS,
    ...(process.env.NODE_ENV !== "production" && { devResetUrl: resetUrl }),
  });
}
