"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p style={{ fontSize: "4rem", fontWeight: 900, color: "#f59e0b", margin: 0 }}>3REAL</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1.5rem" }}>
          Critical error
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#71717a", marginTop: "0.5rem", maxWidth: "24rem" }}>
          The application encountered a fatal error. Please refresh the page.
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#3f3f46", marginTop: "0.5rem" }}>
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={unstable_retry}
          style={{
            marginTop: "2rem",
            padding: "0.625rem 1.25rem",
            backgroundColor: "#f59e0b",
            color: "#09090b",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </body>
    </html>
  );
}
