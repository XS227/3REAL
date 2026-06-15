"use server";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireRole("super_admin");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) throw new Error("User not found");
  if (target.role === "super_admin") throw new Error("Cannot deactivate a super admin");

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: active,
      // Bump session version so any active sessions are invalidated immediately
      sessionVersion: { increment: 1 },
    },
  });

  await audit({
    action: active ? "admin.user.activated" : "admin.user.deactivated",
    actorId: session.userId,
    targetId: userId,
  });

  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: "user" | "operator" | "super_admin") {
  const session = await requireRole("super_admin");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) throw new Error("User not found");
  if (target.role === "super_admin" && session.userId !== userId)
    throw new Error("Cannot change role of another super admin");

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await audit({
    action: "admin.user.role_changed",
    actorId: session.userId,
    targetId: userId,
    meta: { role },
  });

  revalidatePath("/admin/users");
}
