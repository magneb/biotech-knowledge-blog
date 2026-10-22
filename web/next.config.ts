import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Server-rendered on Cloudflare Workers via @opennextjs/cloudflare (see DECISIONLOG 004/006).
// Pages are still prerendered and cached; Sanity webhooks revalidate them on publish.
const nextConfig: NextConfig = {};

export default nextConfig;

// Makes Cloudflare bindings (KV, D1, …) available to `next dev`.
initOpenNextCloudflareForDev();
