const STYLES: Record<string, string> = {
  pending: "bg-zinc-800 text-zinc-400",
  under_review: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  update_requested: "bg-orange-500/10 text-orange-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  processing: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-zinc-800 text-zinc-500",
  failed: "bg-red-500/10 text-red-500",
  active: "bg-emerald-500/10 text-emerald-400",
  inactive: "bg-zinc-800 text-zinc-500",
};

const LABELS: Record<string, string> = {
  under_review: "Under Review",
  update_requested: "Update Req.",
  completed: "Completed",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  processing: "Processing",
  cancelled: "Cancelled",
  failed: "Failed",
  active: "Active",
  inactive: "Inactive",
};

type Props = { status: string; className?: string };

export function StatusBadge({ status, className = "" }: Props) {
  const style = STYLES[status] ?? "bg-zinc-800 text-zinc-400";
  const label = LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
