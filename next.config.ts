import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js App Router requires unsafe-inline for hydration scripts in production.
  // Tighten to nonce-based CSP post-beta.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // next/font/google self-hosts fonts at build time — data: covers font-face fallbacks
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  // wss: for Next.js HMR websocket in dev; 'self' covers prod
  "connect-src 'self' wss:",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
