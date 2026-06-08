import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getWithdrawalReviewData } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WithdrawalReviewActions } from "@/components/admin/WithdrawalReviewActions";
import { RealWithdrawalPayoutPanel } from "@/components/admin/RealWithdrawalPayoutPanel";
import { ASSETS } from "@/lib/wallet/assets";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { ChevronLeft, Wallet } from "lucide-react";

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

  const { transaction: tx, user, kycProfile, userRealBalance, tonHotWallet } = data;
  const meta = ASSETS[tx.assetCode as AssetCode];
  const amount = parseFloat(tx.amount);
  const isReal = tx.assetCode === "REAL";
  const awaitingPayout = isReal && tx.status === "approved";

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
          <p className="text-sm text-zinc-500 mt-1">
            {isReal ? "REAL Jetton Withdrawal (Manual Blockchain Payout)" : "Withdrawal Request"}
          </p>
        </div>
        <StatusBadge status={tx.status} className="text-sm" />
      </div>

      {/* REAL payout panel — shown when approved and awaiting on-chain send */}
      {awaitingPayout && (
        <RealWithdrawalPayoutPanel
          txId={tx.id}
          amount={tx.amount}
          destination={tx.destination}
          hotWallet={tonHotWallet}
          status={tx.status}
          chainTxHash={tx.chainTxHash}
        />
      )}

      {/* Completed REAL payout confirmation */}
      {isReal && tx.status === "completed" && (
        <RealWithdrawalPayoutPanel
          txId={tx.id}
          amount={tx.amount}
          destination={tx.destination}
          hotWallet={tonHotWallet}
          status={tx.status}
          chainTxHash={tx.chainTxHash}
        />
      )}

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
            ...(tx.chainTxHash
              ? [{ label: "Chain Tx Hash", value: tx.chainTxHash.slice(0, 20) + "…" }]
              : []),
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
          {isReal ? "User TON Wallet (Destination)" : "Destination"}
        </p>
        <p className="text-sm text-zinc-200 break-all font-mono">
          {tx.destination ?? "—"}
        </p>
        {isReal && (
          <p className="mt-2 text-xs text-zinc-600">
            Send REAL Jetton to this address from the platform hot wallet.
            Ensure the wallet supports Jetton tokens (TON Space, Tonkeeper, MyTonWallet).
          </p>
        )}
      </div>

      {/* User info + REAL balance */}
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

        {isReal && userRealBalance !== null && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">User REAL ledger balance (post-debit):</span>
            <span className="text-sm font-semibold text-amber-400 tabular-nums">
              {userRealBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} REAL
            </span>
          </div>
        )}
      </div>

      {/* Standard approve/reject actions — only shown for non-REAL or pre-approval REAL */}
      {!awaitingPayout && (
        <WithdrawalReviewActions
          txId={tx.id}
          currentStatus={tx.status}
          alreadySettled={!!tx.ledgerTxId}
        />
      )}

      {/* For REAL in pending/under_review: show standard actions with blockchain note */}
      {isReal && (tx.status === "pending" || tx.status === "under_review") && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500">
            Approving will debit the user&apos;s REAL ledger balance and move it to the withdrawal escrow.
            You will then need to manually send REAL from the platform hot wallet to the user&apos;s TON address
            and confirm the on-chain transaction hash here.
          </p>
        </div>
      )}
    </div>
  );
}
