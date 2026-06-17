import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createAuthToken, generateReferralCode } from "@/lib/auth/tokens";
import { registerSchema } from "@/lib/validators/auth";
import { sendEmailSafe, verificationEmail } from "@/lib/email";
import { audit, ipFromRequest } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);

  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Validation failed", errors }, { status: 422 });
  }

  const { email, password, referralCode } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing account
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Generate unique referral code — retry on collision (extremely rare)
  let newReferralCode: string;
  let attempts = 0;
  do {
    newReferralCode = generateReferralCode();
    const conflict = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
    if (!conflict) break;
    attempts++;
  } while (attempts < 5);

  const passwordHash = hashPassword(password);

  // Resolve referrer if a code was provided
  let referrer: { id: string } | null = null;
  if (referralCode && referralCode.trim().length > 0) {
    referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim().toUpperCase() },
      select: { id: true },
    });
  }

  const ecosystem = await prisma.ecosystem.findUnique({ where: { code: "three_real" } });

  // Create user + referral record in one transaction
  const user = await prisma.$transaction(async (tx: any) => {
    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        referralCode: newReferralCode,
        referredById: referrer?.id ?? null,
      },
    });

    // Attribution: register the level-1 referral
    if (referrer && ecosystem) {
      await tx.referral.create({
        data: {
          ecosystemId: ecosystem.id,
          referrerId:  referrer.id,
          referredId:  created.id,
          code:        referralCode!.trim().toUpperCase(),
          referralLevel: 1,
          registeredAt: new Date(),
          clickAt: new Date(),
          clickIp: ip,
          status: "registered",
        },
      });

      // Level-2: was the referrer themselves referred?
      const referrerReferral = await tx.referral.findFirst({
        where: {
          referredId:   referrer.id,
          referralLevel: 1,
          status: { in: ["registered", "rewarded"] },
        },
      });
      if (referrerReferral) {
        await tx.referral.create({
          data: {
            ecosystemId:     ecosystem.id,
            referrerId:      referrerReferral.referrerId,
            referredId:      created.id,
            code:            referralCode!.trim().toUpperCase(),
            referralLevel:   2,
            parentReferralId: referrerReferral.id,
            registeredAt:    new Date(),
            clickAt:         new Date(),
            clickIp:         ip,
            status: "registered",
          },
        });
      }
    }

    return created;
  });

  // Create email verification token
  const rawToken = await createAuthToken(user.id, "email_verify", ip);
  // Use request Host header in dev so the URL matches whatever port Next.js picked
  const appUrl =
    process.env.NODE_ENV !== "production"
      ? `${req.nextUrl.protocol}//${req.headers.get("host") ?? "localhost:3000"}`
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}`;

  const emailSent = await sendEmailSafe(verificationEmail(normalizedEmail, verifyUrl));

  await audit({
    actorId: user.id,
    targetId: user.id,
    targetType: "user",
    action: "auth.register",
    meta: { email: normalizedEmail, hasReferral: !!referrer, emailSent },
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json(
    {
      success: true,
      emailSent,
      message: emailSent
        ? "Account created. Check your email to verify your address."
        : "Account created, but verification email could not be sent. Please contact support or try resend verification later.",
      // Dev helper — the email is logged to console; also surface URL here
      ...(process.env.NODE_ENV !== "production" && { devVerifyUrl: verifyUrl }),
    },
    { status: 201 }
  );
}
