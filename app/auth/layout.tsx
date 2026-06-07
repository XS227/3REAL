import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">3REAL</h1>
          <p className="text-muted-foreground mt-1 text-sm">Digital Asset Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
