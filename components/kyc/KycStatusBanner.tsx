import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { dateLocale, type DashboardDict, type Lang } from "@/lib/i18n/dashboard";

type Props = {
  status: string;
  rejectionReason?: string | null;
  reviewedAt?: Date | null;
  t: DashboardDict["kyc"];
  lang: Lang;
};

type StatusConfig = {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  not_started: { icon: FileText, color: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700" },
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  under_review: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  approved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  update_requested: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
};

export function KycStatusBanner({ status, rejectionReason, reviewedAt, t, lang }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  const Icon = cfg.icon;
  const label = t.banner.labels[status] ?? t.banner.labels.not_started;
  const description = t.banner.descriptions[status] ?? t.banner.descriptions.not_started;

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold ${cfg.color}`}>{label}</p>
            {reviewedAt && (
              <p className="text-xs text-zinc-500">
                {reviewedAt.toLocaleDateString(dateLocale(lang), {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
          {rejectionReason && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs font-medium text-red-400 mb-1">{t.banner.reasonLabel}</p>
              <p className="text-sm text-red-300">{rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
