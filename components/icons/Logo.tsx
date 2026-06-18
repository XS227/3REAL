import Image from "next/image";

/**
 * Shared brand mark for 3REAL — uses the existing SETAEI ecosystem logo
 * asset (https://setalink.no/assets/logo/setalink-mark-256.png), mirrored
 * locally at public/logo/setalink-mark-256.png. Do not replace this with a
 * generated SVG; a real ecosystem asset already exists for this mark.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <Image
      src="/logo/setalink-mark-256.png"
      alt="3REAL"
      width={256}
      height={256}
      className={className}
    />
  );
}

export function Logo({
  className,
  markClassName = "h-7 w-7",
  textClassName = "text-xl",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={markClassName} />
      <span className={`font-black tracking-tight ${textClassName}`}>
        <span className="text-amber-400">3</span>
        <span className="text-white">REAL</span>
      </span>
    </span>
  );
}
