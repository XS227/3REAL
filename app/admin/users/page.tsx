import { requireRole } from "@/lib/auth/guards";
import { getAdminUserList } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserActiveToggle, UserRoleSelect } from "@/components/admin/UserActions";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

const KYC_LABEL: Record<number, string> = {
  0: "Tier 0",
  1: "Email Tier",
  2: "ID Verified",
  3: "Full KYC",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminUsersPage() {
  const session = await requireRole("super_admin", "operator");
  const users = await getAdminUserList();
  const isSuperAdmin = session.role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Users</h1>
        <span className="text-sm text-zinc-500">({users.length})</span>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                {["Email", "Role", "KYC", "Verified", "Status", "Joined", "Actions"].map((h) => (
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
              {users.map((user) => {
                const isUserSuperAdmin = user.role === "super_admin";
                const isSelf = user.id === session.userId;
                return (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-zinc-200">{user.email}</p>
                      {user.displayName && (
                        <p className="text-xs text-zinc-600">{user.displayName}</p>
                      )}
                    </td>

                    {/* Role — editable by super_admin, read-only otherwise */}
                    <td className="px-5 py-3">
                      {isSuperAdmin ? (
                        <UserRoleSelect
                          userId={user.id}
                          currentRole={user.role as "user" | "operator" | "super_admin"}
                          isSelf={isSelf}
                        />
                      ) : (
                        <span
                          className={`text-xs font-medium ${
                            user.role === "super_admin"
                              ? "text-red-400"
                              : user.role === "operator"
                                ? "text-amber-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {user.role === "super_admin"
                            ? "Super Admin"
                            : user.role === "operator"
                              ? "Operator"
                              : "User"}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-sm text-zinc-400">
                      {KYC_LABEL[user.kycTier] ?? `Tier ${user.kycTier}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={user.emailVerified ? "approved" : "pending"} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={user.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">
                      {fmtDate(user.createdAt)}
                    </td>

                    {/* Actions — only super_admin can toggle active */}
                    <td className="px-5 py-3">
                      {isSuperAdmin ? (
                        <UserActiveToggle
                          userId={user.id}
                          isActive={user.isActive}
                          isSuperAdmin={isUserSuperAdmin}
                        />
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
