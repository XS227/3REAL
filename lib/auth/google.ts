import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google OAuth 2.0 / OpenID Connect helpers.
 *
 * Flow: GET /api/auth/google → Google consent → GET /api/auth/google/callback.
 * State is kept in a short-lived HTTP-only cookie to prevent CSRF.
 */

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export const OAUTH_STATE_COOKIE = "__3real_oauth_state";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Public origin of the app. Behind the nginx proxy `req.nextUrl.origin`
 * resolves to localhost:3020, so production must use NEXT_PUBLIC_APP_URL.
 */
export function appOrigin(requestOrigin: string): string {
  return process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin)
    : requestOrigin;
}

export function googleRedirectUri(requestOrigin: string): string {
  return `${appOrigin(requestOrigin)}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForIdToken(
  code: string,
  redirectUri: string
): Promise<string | null> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { id_token?: string };
  return data.id_token ?? null;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity | null> {
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}
