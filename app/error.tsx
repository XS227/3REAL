"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log to server-side error tracking when available
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-20 text-center text-zinc-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-100">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-zinc-700">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
