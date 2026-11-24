import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * The only third party is Razorpay Checkout, loaded on demand by the "Add money" screen
 * (src/lib/payments/razorpay.ts): its script, the iframe it opens, the images it shows and the
 * calls it makes all need to be allowed, and nothing else does.
 *
 * `'unsafe-inline'` for scripts is Next.js's own bootstrap and streaming payload, which are
 * inline <script> tags; a nonce would mean rendering every page dynamically. In development
 * Next also needs `eval` and a websocket for hot reload - neither is allowed in production.
 */
const RAZORPAY = "https://*.razorpay.com";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com ${RAZORPAY}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${RAZORPAY}`,
  "font-src 'self' data:",
  `connect-src 'self' ${RAZORPAY}${isDev ? " ws: wss:" : ""}`,
  `frame-src ${RAZORPAY}`,
  `form-action 'self' ${RAZORPAY}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/** Security headers sent with every response. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
];

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone - what the Docker image runs (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The docs UI is private (see src/proxy.ts) - never index it.
      {
        source: "/v1/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

// Compiles the MDX pages in content/docs for the docs UI.
const withMDX = createMDX();

export default withMDX(nextConfig);
