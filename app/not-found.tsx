import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-8xl font-black text-amber-400 tabular-nums">404</p>
          <h1 className="mt-4 text-2xl font-bold text-zinc-100">Page not found</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              Go home
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
