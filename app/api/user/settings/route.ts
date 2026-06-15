import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, validateSession } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { audit, ipFromRequest } from "@/lib/audit";

const updateDisplayNameSchema = z.object({
  action: z.literal("display_name"),
  displayName: z.string().max(128).transform((v) => v.trim()).nullable(),
});

const changePasswordSchema = z.object({
  action: z.literal("password"),
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

const bodySchema = z.discriminatedUnion("action", [
  updateDisplayNameSchema,
  changePasswordSchema,
]);

export async function PATCH(req: NextRequest) {
  const ip = ipFromRequest(req);

  const jwtSession = await getSession();
  if (!jwtSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(jwtSession);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  if (parsed.data.action === "display_name") {
    const displayName = parsed.data.displayName || null;
    await prisma.user.update({
      where: { id: session.userId },
      data: { displayName },
    });
    await audit({
      actorId: session.userId,
      targetId: session.userId,
      targetType: "user",
      action: "user.display_name_updated",
      ipAddress: ip,
    });
    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "password") {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true, googleId: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.passwordHash || user.googleId) {
      return NextResponse.json(
        { error: "Password cannot be changed for Google-only accounts. Use the forgot password flow instead." },
        { status: 400 }
      );
    }

    const valid = verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newHash,
        sessionVersion: { increment: 1 },
      },
    });

    await audit({
      actorId: session.userId,
      targetId: session.userId,
      targetType: "user",
      action: "auth.password_changed",
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
