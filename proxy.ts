import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/health",
];

const ADMIN_PATHS = ["/admin"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAdmin = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Verify the JWT in the Edge runtime using jose directly
  let payload: { userId: string; role: string } | null = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
      payload = p as { userId: string; role: string };
    } catch {
      // Invalid or expired — treat as unauthenticated
    }
  }

  // Redirect authenticated users away from auth pages
  if (payload && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect authenticated routes
  if (!isPublic && !payload) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes — require operator or super_admin role
  if (isAdmin && payload) {
    const role = payload.role as string;
    if (role !== "super_admin" && role !== "operator") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
