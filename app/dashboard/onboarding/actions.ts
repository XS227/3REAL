"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function completeOnboarding() {
  const session = await requireAuth();

  await prisma.user.update({
    where: { id: session.userId },
    data: { onboardedAt: new Date() },
  });

  const headerList = await headers();
  await audit({
    actorId: session.userId,
    targetId: session.userId,
    targetType: "user",
    action: "user.onboarding_completed",
    ipAddress: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? "unknown",
    userAgent: headerList.get("user-agent") ?? undefined,
  });

  redirect("/dashboard");
}
