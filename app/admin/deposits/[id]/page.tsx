import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getDepositReviewData } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DepositReviewActions } from "@/components/admin/DepositReviewActions";
import { ASSETS } from "@/lib/wallet/assets";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { ChevronLeft, FileText, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  usdt_trc20: "USDT TRC-20",
  ton: "TON",
  sepa: "SEPA",
  manual: "Manual",
};

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DepositReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("super_admin", "operator");
  const { id } = await params;
  const data = await getDepositReviewData(id);
  if (!data) notFound();

  const { transaction: tx, user, kycProfile } = data;
  const meta = ASSETS[tx.assetCode as AssetCode];
  const amount = parseFloat(tx.amount);
  const isImage =
    tx.proofFilePath &&
    (tx.proofFilePath.endsWith(".jpg") ||
      tx.proofFilePath.endsWith(".jpeg") ||
      tx.proofFilePath.endsWith(".png") ||
      tx.proofFilePath.endsWith(".webp"));

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/admin/deposits"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> Deposit Queue
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={`text-3xl font-bold tabular-nums ${meta?.accentClass ?? "text-zinc-200"}`}>
            +{amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{" "}
            {tx.assetCode}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {tx.paymentMethod ? METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod : "—"}
          </p>
        </div>
        <StatusBadge status={tx.status} className="text-sm" />
      </div>

      {/* Transaction details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Transaction Details</p>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Transaction ID", value: tx.id.slice(0, 16) + "…" },
            { label: "Submitted", value: fmtDateTime(tx.createdAt) },
            { label: "Ledger Settled", value: tx.ledgerTxId ? "Yes" : "No" },
            { label: "Payment Method", value: tx.paymentMethod ? (METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod) : "—" },
            { label: "Payment Reference", value: tx.paymentRef ?? "—" },
            { label: "Admin Note", value: tx.adminNote ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="mt-0.5 text-sm text-zinc-200 break-words">{value}</dd>
            </div>
          ))}
        </dl>
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

      {/* Proof file */}
      {tx.proofFilePath && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-3">
            <p className="text-sm font-medium text-zinc-300">Payment Proof</p>
          </div>
          <div className="p-4">
            {isImage ? (
              <a
                href={`/api/kyc/files/${tx.proofFilePath}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/kyc/files/${tx.proofFilePath}`}
                  alt="Payment proof"
                  className="w-full max-h-72 rounded-lg object-contain bg-zinc-950 border border-zinc-800"
                />
              </a>
            ) : (
              <a
                href={`/api/kyc/files/${tx.proofFilePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-600"
              >
                <FileText className="h-5 w-5 text-zinc-500" />
                <span className="flex-1">Payment Proof Document</span>
                <ExternalLink className="h-4 w-4 text-zinc-500 shrink-0" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <DepositReviewActions
        txId={tx.id}
        currentStatus={tx.status}
        alreadySettled={!!tx.ledgerTxId}
      />
    </div>
  );
}
