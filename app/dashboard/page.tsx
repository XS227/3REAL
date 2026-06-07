import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      displayName: true,
      email: true,
      role: true,
      kycTier: true,
      emailVerified: true,
      referralCode: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Account</p>
          <p className="font-medium">{user?.email}</p>
          <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
        </div>

        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">KYC Tier</p>
          <p className="font-medium text-2xl">{user?.kycTier ?? 0}</p>
          <p className="text-sm text-muted-foreground">
            {user?.emailVerified ? "Email verified" : "Email not verified"}
          </p>
        </div>

        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Referral Code</p>
          <p className="font-mono font-medium">{user?.referralCode}</p>
          <p className="text-sm text-muted-foreground">Share to earn REAL rewards</p>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p className="font-medium">Wallet &amp; portfolio coming in Phase 5</p>
        <p className="text-sm mt-1">Token balances, deposits, and withdrawals will appear here.</p>
      </div>
    </div>
  );
}
