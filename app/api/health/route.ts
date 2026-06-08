import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs: number | null = null;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const healthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "3real",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus, latency_ms: dbLatencyMs },
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
