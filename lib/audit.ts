import { prisma } from "@/lib/prisma";

interface AuditEntry {
  ecosystemId?: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  action: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Fire-and-forget — never throws; audit failures must not break the main flow.
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.activityLog.create as any)({
      data: {
        action: entry.action,
        ecosystemId: entry.ecosystemId ?? null,
        actorId: entry.actorId ?? null,
        targetId: entry.targetId ?? null,
        targetType: entry.targetType ?? null,
        meta: entry.meta ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to write activity log:", err);
  }
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
