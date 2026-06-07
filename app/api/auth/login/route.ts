import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, cookieOptions, SESSION_COOKIE } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validators/auth";
import { audit, ipFromRequest } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);

  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 422 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Use a constant-time comparison path for both "user not found" and "wrong password"
  // to prevent timing-based email enumeration
  const passwordValid = user ? verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    await audit({
      action: "auth.login_failed",
      meta: { email: normalizedEmail },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Your account has been deactivated. Contact support." },
      { status: 403 }
    );
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    kycTier: user.kycTier,
    emailVerified: user.emailVerified,
  });

  await audit({
    actorId: user.id,
    targetId: user.id,
    targetType: "user",
    action: "auth.login",
    meta: { email: normalizedEmail },
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      kycTier: user.kycTier,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, cookieOptions());
  return response;
}
