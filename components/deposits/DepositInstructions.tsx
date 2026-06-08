import { Copy, AlertTriangle, Info } from "lucide-react";
import type { AssetCode } from "@/lib/generated/prisma/enums";
import { DEPOSIT_INSTRUCTIONS } from "@/lib/deposits/instructions";
import { CopyButton } from "@/components/dashboard/CopyButton";

type Props = { assetCode: AssetCode; referenceCode: string };

export function DepositInstructions({ assetCode, referenceCode }: Props) {
  const instr = DEPOSIT_INSTRUCTIONS[assetCode];

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm font-medium text-zinc-300">How to deposit {assetCode}</p>

      {/* Steps */}
      <ol className="space-y-2">
        {instr.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-amber-400">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {/* Bank / wallet details */}
      <div className="space-y-2 rounded-lg bg-zinc-950/60 p-4">
        {instr.details.map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-xs text-zinc-500">{label}</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate text-xs font-mono font-medium text-zinc-200">{value}</span>
              <CopyButton text={value} size="xs" />
            </div>
          </div>
        ))}

        {/* Reference code */}
        <div className="flex items-start justify-between gap-3 border-t border-zinc-800 pt-2 mt-2">
          <span className="shrink-0 text-xs text-zinc-500">Your Reference Code</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs font-bold text-amber-400">{referenceCode}</span>
            <CopyButton text={referenceCode} size="xs" />
          </div>
        </div>
      </div>

      {/* Warning / note */}
      {instr.note && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-300">{instr.note}</p>
        </div>
      )}
    </div>
  );
}
