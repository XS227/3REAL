import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTonSettings } from "@/lib/ton/settings";
import { tonapiGet } from "@/lib/ton/client";

export const dynamic = "force-dynamic";

async function checkDb(): Promise<{ status: "ok" | "error"; latency_ms: number | null }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latency_ms: Date.now() - start };
  } catch {
    return { status: "error", latency_ms: null };
  }
}

async function checkTon(): Promise<{ status: "ok" | "error" }> {
  try {
    const settings = await getTonSettings();
    const apiKey = settings.apiKey || undefined;
    await tonapiGet<unknown>("/status", apiKey);
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

export async function GET() {
  const [db, ton] = await Promise.all([checkDb(), checkTon()]);

  const healthy = db.status === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "3real",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      services: {
        database: { status: db.status, latency_ms: db.latency_ms },
        ton: { status: ton.status },
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
