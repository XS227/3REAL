import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getWithdrawalReviewData } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WithdrawalReviewActions } from "@/components/admin/WithdrawalReviewActions";
import { ASSETS } from "@/lib/wallet/assets";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WithdrawalReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("super_admin", "operator");
  const { id } = await params;
  const data = await getWithdrawalReviewData(id);
  if (!data) notFound();

  const { transaction: tx, user, kycProfile } = data;
  const meta = ASSETS[tx.assetCode as AssetCode];
  const amount = parseFloat(tx.amount);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/admin/withdrawals"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> Withdrawal Queue
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div
            className={`text-3xl font-bold tabular-nums ${meta?.accentClass ?? "text-zinc-200"}`}
          >
            -{amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{" "}
            {tx.assetCode}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Withdrawal Request</p>
        </div>
        <StatusBadge status={tx.status} className="text-sm" />
      </div>

      {/* Transaction details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Transaction Details
        </p>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Transaction ID", value: tx.id.slice(0, 16) + "…" },
            { label: "Submitted", value: fmtDateTime(tx.createdAt) },
            { label: "Ledger Settled", value: tx.ledgerTxId ? "Yes" : "No" },
            { label: "Admin Note", value: tx.adminNote ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="mt-0.5 text-sm text-zinc-200 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Destination */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-3">
          Destination
        </p>
        <p className="text-sm text-zinc-200 break-all font-mono">
          {tx.destination ?? "—"}
        </p>
      </div>

      {/* User info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-3">User</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Email", value: user.email },
            { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            { label: "KYC Tier", value: `Tier ${user.kycTier}` },
            { label: "KYC Status", value: kycProfile?.status ?? "No profile" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-0.5 text-sm text-zinc-200">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <WithdrawalReviewActions
        txId={tx.id}
        currentStatus={tx.status}
        alreadySettled={!!tx.ledgerTxId}
      />
    </div>
  );
}
