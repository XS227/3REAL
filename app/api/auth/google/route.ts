import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  googleConfigured,
  googleRedirectUri,
  buildGoogleAuthUrl,
  appOrigin,
  OAUTH_STATE_COOKIE,
} from "@/lib/auth/google";
import { checkRateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/auth/login?error=google_not_configured", appOrigin(req.nextUrl.origin))
    );
  }

  const ip = ipFromRequest(req);
  const rl = checkRateLimit(`google:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  // Carry post-login destination and optional referral code through the flow.
  const fromParam = req.nextUrl.searchParams.get("from") ?? "";
  const from =
    fromParam.startsWith("/") && !fromParam.startsWith("//") ? fromParam : "/dashboard";
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").trim().toUpperCase();

  const nonce = randomBytes(16).toString("hex");
  const state = nonce;

  const redirectUri = googleRedirectUri(appOrigin(req.nextUrl.origin));
  const response = NextResponse.redirect(buildGoogleAuthUrl(state, redirectUri));

  response.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ nonce, from, ref }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    }
  );

  return response;
}
