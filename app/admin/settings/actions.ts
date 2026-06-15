"use server";

import { requireRole } from "@/lib/auth/guards";
import { upsertSetting } from "@/lib/settings/platform";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function savePlatformSettings(formData: FormData) {
  const session = await requireRole("super_admin");

  const entries = Array.from(formData.entries()) as [string, string][];

  for (const [key, value] of entries) {
    if (key.startsWith("platform.") || key.startsWith("referral.")) {
      await upsertSetting(
        key,
        value.trim(),
        key.startsWith("referral.") ? await getThreeRealEcoId() : null,
        session.userId
      );
    }
  }

  await audit({
    action: "admin.settings.updated",
    actorId: session.userId,
    meta: { keys: entries.map(([k]) => k) },
  });

  revalidatePath("/admin/settings");
}

let _ecoId: string | null = null;
async function getThreeRealEcoId(): Promise<string> {
  if (_ecoId) return _ecoId;
  const eco = await prisma.ecosystem.findUniqueOrThrow({ where: { code: "three_real" } });
  _ecoId = eco.id;
  return eco.id;
}
