import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, SESSION_COOKIE, type SessionPayload } from "./jwt";

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

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}

export async function requireRole(
  ...roles: string[]
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) redirect("/dashboard");
  return session;
}
