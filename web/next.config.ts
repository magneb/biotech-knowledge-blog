import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Server-rendered on Cloudflare Workers via @opennextjs/cloudflare (see DECISIONLOG 004/006/015).
// Pages are still prerendered and cached; Sanity webhooks revalidate them on publish.
// Historical archival versions (/[slug]/v{N}/) receive permanent immutable edge caching.
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
      {
        source: "/:slug/v:version(\\d+)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:slug/v:version(\\d+)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
