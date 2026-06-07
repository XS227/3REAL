import { CheckCircle, XCircle, Circle, User } from "lucide-react";
import type { KycSummary } from "@/lib/dashboard/queries";

type Props = {
  emailVerified: boolean;
  kycTier: number;
  twoFaEnabled: boolean;
  kycProfile: KycSummary;
};

type CheckItem = {
  label: string;
  done: boolean;
  sublabel?: string;
};

const KYC_TIER_LABEL: Record<number, string> = {
  0: "Not submitted",
  1: "Email tier",
  2: "ID verified",
  3: "Full KYC",
};

const KYC_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  update_requested: "Update required",
};

export function ProfileCard({ emailVerified, kycTier, twoFaEnabled, kycProfile }: Props) {
  const kycDone = kycTier >= 2;
  const kycSub = kycProfile
    ? KYC_STATUS_LABEL[kycProfile.status] ?? kycProfile.status
    : KYC_TIER_LABEL[kycTier];

  const items: CheckItem[] = [
    {
      label: "Email verified",
      done: emailVerified,
      sublabel: emailVerified ? "Verified" : "Check your inbox",
    },
    {
      label: "Identity verified",
      done: kycDone,
      sublabel: kycSub,
    },
    {
      label: "Two-factor authentication",
      done: twoFaEnabled,
      sublabel: twoFaEnabled ? "Enabled" : "Coming soon",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-medium text-zinc-300">Profile Completion</h2>
        <span className="ml-auto text-sm font-bold text-amber-400">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-3">
        {items.map(({ label, done, sublabel }) => (
          <li key={label} className="flex items-start gap-3">
            {done ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : sublabel === "Coming soon" ? (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
            )}
            <div>
              <p className={`text-sm font-medium ${done ? "text-zinc-200" : "text-zinc-400"}`}>
                {label}
              </p>
              {sublabel && (
                <p className={`text-xs ${done ? "text-zinc-500" : "text-zinc-600"}`}>
                  {sublabel}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
