import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

/**
 * Security headers sent with every response. A Content-Security-Policy is added once the
 * customer UI is built (it depends on Razorpay's checkout script).
 */
const securityHeaders = [
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
