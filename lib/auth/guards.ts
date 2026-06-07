import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, SESSION_COOKIE, type SessionPayload } from "./jwt";
import { prisma } from "@/lib/prisma";

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// DB-backed validation: checks sessionVersion, isActive, and returns fresh role/kycTier claims.
// Returns null on any mismatch — never throws.
export async function validateSession(session: SessionPayload): Promise<SessionPayload | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        sessionVersion: true,
        role: true,
        kycTier: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    // sessionVersion mismatch means the session was invalidated server-side
    // (password reset, forced logout, role change, or account deactivation)
    if (user.sessionVersion !== session.sessionVersion) return null;

    // Return fresh claims from DB — prevents stale role/kycTier in long-lived tokens
    return {
      userId: session.userId,
      email: session.email,
      role: user.role,
      kycTier: user.kycTier,
      emailVerified: user.emailVerified,
      sessionVersion: user.sessionVersion,
    };
  } catch {
    return null;
  }
}

// For server components — redirects to login on any session failure.
export async function requireAuth(): Promise<SessionPayload> {
  const jwtSession = await getSession();
  if (!jwtSession) redirect("/auth/login");

  const session = await validateSession(jwtSession);
  if (!session) redirect("/auth/login");

  return session;
}

// For server components — redirects to /dashboard if role not in allowed list.
export async function requireRole(...roles: string[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) redirect("/dashboard");
  return session;
}
