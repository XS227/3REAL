import { requireRole } from "@/lib/auth/guards";
import { getAuditLog } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

type SearchParams = { page?: string };

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function metaStr(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  return JSON.stringify(meta);
}

function actionColor(action: string): string {
  if (action.includes("approved")) return "text-emerald-400";
  if (action.includes("rejected")) return "text-red-400";
  if (action.includes("reward")) return "text-amber-400";
  if (action.includes("login") || action.includes("register")) return "text-blue-400";
  return "text-zinc-400";
}

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("super_admin", "operator");
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const { entries, total } = await getAuditLog(page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Audit Log</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total.toLocaleString()} total entries · page {page} of {totalPages}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-600">
                    No entries yet
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap font-mono">
                      {fmtTime(e.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`font-mono text-xs ${actionColor(e.action)}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono">
                      {e.actorId ? e.actorId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono">
                      {e.targetId ? (
                        <>
                          <span className="text-zinc-600">{e.targetType ?? ""} </span>
                          {e.targetId.slice(0, 8)}…
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-600 font-mono whitespace-nowrap">
                      {e.ipAddress ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      {metaStr(e.meta) ? (
                        <span className="block truncate font-mono text-xs text-zinc-600">
                          {metaStr(e.meta)}
                        </span>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/audit-log?page=${page - 1}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                ← Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/audit-log?page=${page + 1}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
