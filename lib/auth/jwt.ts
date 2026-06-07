import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "__3real_session";
const JWT_EXPIRY = "7d";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  kycTier: number;
  emailVerified: boolean;
  sessionVersion: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters — generate with: openssl rand -hex 32");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SessionPayload;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };
}
