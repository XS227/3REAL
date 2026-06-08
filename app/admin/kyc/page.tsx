import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getKycQueue } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BadgeCheck, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminKycQueuePage() {
  await requireRole("super_admin", "operator");
  const queue = await getKycQueue();

  const pending = queue.filter((r) => r.status === "pending" || r.status === "under_review");
  const other = queue.filter((r) => !["pending", "under_review"].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-amber-400" />
        <h1 className="text-2xl font-bold text-zinc-100">KYC Review Queue</h1>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-zinc-950">
            {pending.length}
          </span>
        )}
      </div>

      {/* Pending table */}
      <QueueTable title="Awaiting Review" rows={pending} emptyText="All caught up — no pending KYC applications." />

      {/* Historical table */}
      {other.length > 0 && (
        <QueueTable title="Recent (Reviewed)" rows={other} emptyText="" />
      )}
    </div>
  );
}

function QueueTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: ReturnType<typeof getKycQueue> extends Promise<infer T> ? T : never;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                {["User", "Submitted", "Status", "Tier", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm text-zinc-200">{row.userEmail}</p>
                    <p className="text-xs text-zinc-600 font-mono">{row.userId.slice(0, 8)}…</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">
                    {fmtDate(row.submittedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400">
                    Tier {row.tierRequested}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/kyc/${row.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      Review <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
