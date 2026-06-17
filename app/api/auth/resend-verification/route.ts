import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, validateSession } from "@/lib/auth/guards";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmailSafe, verificationEmail } from "@/lib/email";
import { audit, ipFromRequest } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const jwtSession = await getSession();
  if (!jwtSession) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await validateSession(jwtSession);
  if (!session) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  if (session.emailVerified) {
    return NextResponse.json({ success: true, emailSent: false, message: "Email already verified." });
  }

  const rl = checkRateLimit(`resend-verify:${session.userId}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  const ip = ipFromRequest(req);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const rawToken = await createAuthToken(session.userId, "email_verify", ip);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}`;

  const emailSent = await sendEmailSafe(verificationEmail(user.email, verifyUrl));

  await audit({
    actorId: session.userId,
    targetId: session.userId,
    targetType: "user",
    action: "auth.resend_verification",
    meta: { emailSent },
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    success: true,
    emailSent,
    message: emailSent
      ? "Verification email sent. Check your inbox."
      : "We couldn't send the verification email right now. Please contact support or try again later.",
    ...(process.env.NODE_ENV !== "production" && { devVerifyUrl: verifyUrl }),
  });
}
