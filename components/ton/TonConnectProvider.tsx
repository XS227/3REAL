"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

const MANIFEST_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://3real.no") +
  "/.well-known/tonconnect-manifest.json";

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {children}
    </TonConnectUIProvider>
  );
}
