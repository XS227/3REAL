"use client";

import { useTransition } from "react";
import { setUserActive, setUserRole } from "@/app/admin/users/actions";
import { UserCheck, UserX, ChevronDown } from "lucide-react";

type Role = "user" | "operator" | "super_admin";

const ROLE_LABEL: Record<Role, string> = {
  user: "User",
  operator: "Operator",
  super_admin: "Super Admin",
};

export function UserActiveToggle({
  userId,
  isActive,
  isSuperAdmin,
}: {
  userId: string;
  isActive: boolean;
  isSuperAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSuperAdmin) {
    return <span className="text-xs text-zinc-600">—</span>;
  }

  function toggle() {
    startTransition(async () => {
      await setUserActive(userId, !isActive);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
      }`}
    >
      {isActive ? (
        <>
          <UserX className="h-3 w-3" />
          {pending ? "…" : "Deactivate"}
        </>
      ) : (
        <>
          <UserCheck className="h-3 w-3" />
          {pending ? "…" : "Activate"}
        </>
      )}
    </button>
  );
}

export function UserRoleSelect({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return <span className="text-xs text-zinc-600">—</span>;
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as Role;
    startTransition(async () => {
      await setUserRole(userId, role);
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentRole}
        onChange={onChange}
        disabled={pending}
        className="appearance-none rounded-md border border-zinc-700 bg-zinc-800 py-1 pl-2.5 pr-7 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
      >
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-zinc-500" />
    </div>
  );
}
