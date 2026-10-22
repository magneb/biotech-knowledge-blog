import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Caching setup chosen for the Workers Free plan:
 * - KV for the incremental (page/data) cache — no payment method required, unlike R2.
 * - D1 for the tag cache — strongly consistent, so a publish → revalidateTag applies immediately.
 * - Memory queue — we only use on-demand revalidation (webhook), not time-based ISR.
 * - Cache interception — cached pages are served without booting the Next server,
 *   which keeps CPU time well under the Free plan's 10 ms limit.
 */
const config = defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});

config.buildCommand = "npm run build:next";

export default config;

