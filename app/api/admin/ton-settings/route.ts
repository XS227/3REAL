import { NextRequest, NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { TON_SETTING_KEYS, TON_SETTING_DEFAULTS } from "@/lib/ton/settings";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jwt = await getSession();
  if (!jwt) return null;
  const session = await validateSession(jwt);
  if (!session) return null;
  if (session.role !== "super_admin" && session.role !== "operator") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: [...TON_SETTING_KEYS] }, ecosystemId: null },
    select: { key: true, value: true },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result: Record<string, string> = {};
  for (const k of TON_SETTING_KEYS) {
    result[k] = map[k] ?? TON_SETTING_DEFAULTS[k];
  }

  return NextResponse.json({ settings: result });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = new Set<string>(TON_SETTING_KEYS);
  const updates = Object.entries(body).filter(([k]) => allowed.has(k));

  if (!updates.length) {
    return NextResponse.json({ error: "No valid keys provided" }, { status: 400 });
  }

  await Promise.all(
    updates.map(async ([key, value]) => {
      const existing = await prisma.setting.findFirst({
        where: { key, ecosystemId: null },
        select: { id: true },
      });
      if (existing) {
        await prisma.setting.update({ where: { id: existing.id }, data: { value } });
      } else {
        await prisma.setting.create({ data: { key, value } });
      }
    })
  );

  return NextResponse.json({ ok: true, updated: updates.map(([k]) => k) });
}
