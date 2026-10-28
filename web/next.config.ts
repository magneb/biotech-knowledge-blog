import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Server-rendered on Cloudflare Workers via @opennextjs/cloudflare (see DECISIONLOG 004/006/007/015).
// Pages are prerendered and cached with bounded edge caching (10m browser, 7d edge);
// Sanity webhooks trigger full-graph revalidation on publish.
const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      // 1. Maintain immutable caching for hashed Next.js static assets
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 2. Draft Mode: emit private, no-store when preview bypass cookie is active
      {
        source: "/:path((?!api|_next|sprites\\.svg|art|favicon\\.ico).*)",
        has: [
          {
            type: "cookie",
            key: "__prerender_bypass",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store",
          },
        ],
      },
      // 3. Public HTML responses: bounded revalidating cache (10m browser, 7d edge)
      {
        source: "/:path((?!api|_next|sprites\\.svg|art|favicon\\.ico).*)",
        missing: [
          {
            type: "cookie",
            key: "__prerender_bypass",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=600, s-maxage=604800, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings (KV, D1, …) available to `next dev`.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
