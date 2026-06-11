"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

interface GoogleButtonProps {
  /** Post-login redirect target (path only) */
  from?: string;
  /** Referral code to attribute on first-time signup */
  referralCode?: string;
  label?: string;
}

export function GoogleButton({ from, referralCode, label = "Continue with Google" }: GoogleButtonProps) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (referralCode) params.set("ref", referralCode);
  const href = `/api/auth/google${params.size > 0 ? `?${params.toString()}` : ""}`;

  return (
    <a href={href} className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}>
      <GoogleIcon />
      {label}
    </a>
  );
}
