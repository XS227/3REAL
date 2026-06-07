import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await requireRole("super_admin", "operator");

  const [userCount, pendingKyc] = await Promise.all([
    prisma.user.count(),
    prisma.kycProfile.count({ where: { status: "pending" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          Logged in as {session.email} ({session.role}).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-bold">{userCount}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending KYC</p>
          <p className="text-3xl font-bold">{pendingKyc}</p>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p className="font-medium">Full admin panel coming in Phase 6</p>
        <p className="text-sm mt-1">
          User management, KYC review, transaction monitoring, and settings will appear here.
        </p>
      </div>
    </div>
  );
}
