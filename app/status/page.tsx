import { prisma } from "@/lib/prisma";
import { getTonSettings } from "@/lib/ton/settings";
import { tonapiGet } from "@/lib/ton/client";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "System Status — 3REAL" };

type ServiceStatus = "operational" | "degraded" | "down";

async function checkDb(): Promise<{ status: ServiceStatus; latencyMs: number | null }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: "operational", latencyMs: Date.now() - start };
  } catch {
    return { status: "down", latencyMs: null };
  }
}

async function checkTon(): Promise<{ status: ServiceStatus }> {
  try {
    const settings = await getTonSettings();
    await tonapiGet<unknown>("/status", settings.apiKey || undefined);
    return { status: "operational" };
  } catch {
    return { status: "degraded" };
  }
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "operational")
    return <CheckCircle className="h-5 w-5 text-emerald-400" />;
  if (status === "degraded")
    return <AlertCircle className="h-5 w-5 text-amber-400" />;
  return <XCircle className="h-5 w-5 text-red-400" />;
}

function StatusLabel({ status }: { status: ServiceStatus }) {
  const map: Record<ServiceStatus, { label: string; color: string }> = {
    operational: { label: "Operational", color: "text-emerald-400" },
    degraded: { label: "Degraded", color: "text-amber-400" },
    down: { label: "Down", color: "text-red-400" },
  };
  const { label, color } = map[status];
  return <span className={`text-sm font-medium ${color}`}>{label}</span>;
}

export default async function StatusPage() {
  const [db, ton] = await Promise.all([checkDb(), checkTon()]);

  const overall: ServiceStatus =
    db.status === "down" ? "down"
    : db.status === "degraded" || ton.status === "degraded" ? "degraded"
    : "operational";

  const services = [
    {
      name: "API & Web App",
      description: "Next.js application server",
      status: "operational" as ServiceStatus,
    },
    {
      name: "Database",
      description: "PostgreSQL — user data, ledger, transactions",
      status: db.status,
      meta: db.latencyMs != null ? `${db.latencyMs} ms` : undefined,
    },
    {
      name: "TON Network",
      description: "Blockchain connectivity for REAL deposits",
      status: ton.status,
    },
  ];

  const bannerBg =
    overall === "operational"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : overall === "degraded"
        ? "border-amber-500/20 bg-amber-500/10"
        : "border-red-500/20 bg-red-500/10";

  const bannerText =
    overall === "operational"
      ? "All systems operational"
      : overall === "degraded"
        ? "Partial system degradation"
        : "Major outage in progress";

  const bannerColor =
    overall === "operational" ? "text-emerald-300"
    : overall === "degraded" ? "text-amber-300"
    : "text-red-300";

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">System Status</h1>
          <p className="mt-2 text-sm text-zinc-500 flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toUTCString()}
          </p>
        </div>

        {/* Overall banner */}
        <div className={`rounded-xl border p-5 text-center ${bannerBg}`}>
          <div className="flex items-center justify-center gap-2">
            <StatusIcon status={overall} />
            <p className={`text-lg font-semibold ${bannerColor}`}>{bannerText}</p>
          </div>
        </div>

        {/* Service list */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">{svc.name}</p>
                <p className="text-xs text-zinc-600">{svc.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {svc.meta && (
                  <span className="text-xs text-zinc-600">{svc.meta}</span>
                )}
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={svc.status} />
                  <StatusLabel status={svc.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-700">
          Machine-readable health endpoint:{" "}
          <code className="text-zinc-500">/api/health</code>
        </p>
      </div>
    </div>
  );
}
