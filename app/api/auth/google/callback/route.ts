import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  googleConfigured,
  googleRedirectUri,
  exchangeCodeForIdToken,
  verifyGoogleIdToken,
  appOrigin,
  OAUTH_STATE_COOKIE,
} from "@/lib/auth/google";
import { hashPassword } from "@/lib/auth/password";
import { generateReferralCode } from "@/lib/auth/tokens";
import { signToken, cookieOptions, SESSION_COOKIE } from "@/lib/auth/jwt";
import { audit, ipFromRequest } from "@/lib/audit";
import { issueEmailVerifyReward } from "@/lib/referral/engine";

export const dynamic = "force-dynamic";

function loginError(origin: string, code: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/auth/login?error=${code}`, origin));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req.nextUrl.origin);
  if (!googleConfigured()) return loginError(origin, "google_not_configured");

  // CSRF check: state from Google must match the nonce in our cookie
  const stateParam = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!stateParam || !code || !stateCookie) return loginError(origin, "google_failed");

  let stateData: { nonce: string; from: string; ref: string };
  try {
    stateData = JSON.parse(stateCookie);
  } catch {
    return loginError(origin, "google_failed");
  }
  if (stateData.nonce !== stateParam) return loginError(origin, "google_failed");

  const from =
    stateData.from.startsWith("/") && !stateData.from.startsWith("//")
      ? stateData.from
      : "/dashboard";

  const idToken = await exchangeCodeForIdToken(code, googleRedirectUri(origin));
  if (!idToken) return loginError(origin, "google_failed");

  const identity = await verifyGoogleIdToken(idToken);
  if (!identity) return loginError(origin, "google_failed");

  const ip = ipFromRequest(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // 1) Existing Google-linked user
  let user = await prisma.user.findUnique({ where: { googleId: identity.sub } });
  let isNewUser = false;

  if (!user) {
    // 2) Existing email/password user — link the Google account
    const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });

    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: identity.sub,
          // Google has verified ownership of this exact email address
          ...(identity.emailVerified && !byEmail.emailVerified
            ? { emailVerified: true, kycTier: Math.max(byEmail.kycTier, 1), sessionVersion: { increment: 1 } }
            : {}),
          ...(byEmail.displayName ? {} : { displayName: identity.name }),
        },
      });

      await audit({
        actorId: user.id,
        targetId: user.id,
        targetType: "user",
        action: "auth.google_linked",
        meta: { email: identity.email },
        ipAddress: ip,
        userAgent,
      });
    } else {
      // 3) New user — register via Google
      isNewUser = true;

      let newReferralCode: string;
      let attempts = 0;
      do {
        newReferralCode = generateReferralCode();
        const conflict = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
        if (!conflict) break;
        attempts++;
      } while (attempts < 5);

      // No password login for Google accounts — random unguessable hash
      const passwordHash = hashPassword(randomBytes(32).toString("hex"));

      const referrer = stateData.ref
        ? await prisma.user.findUnique({
            where: { referralCode: stateData.ref },
            select: { id: true },
          })
        : null;
      const ecosystem = referrer
        ? await prisma.ecosystem.findUnique({ where: { code: "three_real" } })
        : null;

      user = await prisma.$transaction(async (tx: any) => {
        const created = await tx.user.create({
          data: {
            email: identity.email,
            passwordHash,
            googleId: identity.sub,
            referralCode: newReferralCode,
            referredById: referrer?.id ?? null,
            emailVerified: identity.emailVerified,
            kycTier: identity.emailVerified ? 1 : 0,
            displayName: identity.name,
          },
        });

        if (referrer && ecosystem) {
          const level1 = await tx.referral.create({
            data: {
              ecosystemId: ecosystem.id,
              referrerId: referrer.id,
              referredId: created.id,
              code: stateData.ref,
              referralLevel: 1,
              registeredAt: new Date(),
              clickAt: new Date(),
              clickIp: ip,
              status: "registered",
            },
          });

          const referrerReferral = await tx.referral.findFirst({
            where: {
              referredId: referrer.id,
              referralLevel: 1,
              status: { in: ["registered", "rewarded"] },
            },
          });
          if (referrerReferral) {
            await tx.referral.create({
              data: {
                ecosystemId: ecosystem.id,
                referrerId: referrerReferral.referrerId,
                referredId: created.id,
                code: stateData.ref,
                referralLevel: 2,
                parentReferralId: referrerReferral.id,
                registeredAt: new Date(),
                clickAt: new Date(),
                clickIp: ip,
                status: "registered",
              },
            });
          }
          void level1;
        }

        return created;
      });
      if (!user) return loginError(origin, "google_failed");

      await audit({
        actorId: user.id,
        targetId: user.id,
        targetType: "user",
        action: "auth.register",
        meta: { email: identity.email, provider: "google", hasReferral: !!referrer },
        ipAddress: ip,
        userAgent,
      });

      // Google-verified email counts as email verification for referral rewards
      if (identity.emailVerified) {
        issueEmailVerifyReward(user.id).catch(() => {});
      }
    }
  }

  if (!user) return loginError(origin, "google_failed");
  if (!user.isActive) return loginError(origin, "account_deactivated");

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
    sessionVersion: user.sessionVersion,
  });

  await audit({
    actorId: user.id,
    targetId: user.id,
    targetType: "user",
    action: "auth.login",
    meta: { email: user.email, provider: "google", newUser: isNewUser },
    ipAddress: ip,
    userAgent,
  });

  const response = NextResponse.redirect(new URL(from, origin));
  response.cookies.set(SESSION_COOKIE, token, cookieOptions());
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
