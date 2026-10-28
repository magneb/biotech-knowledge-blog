import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateDeploymentConfig,
  type ValidationInput,
  type WranglerConfig,
} from "@/lib/deployment-validator";

const WEB_ROOT = path.resolve(__dirname, "..");

function parseJsonc<T>(raw: string): T {
  const withoutComments = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutComments) as T;
}

function loadLiveConfig(): ValidationInput {
  const wranglerRaw = fs.readFileSync(
    path.join(WEB_ROOT, "wrangler.jsonc"),
    "utf-8"
  );
  const openNextSource = fs.readFileSync(
    path.join(WEB_ROOT, "open-next.config.ts"),
    "utf-8"
  );
  const nextConfigSource = fs.readFileSync(
    path.join(WEB_ROOT, "next.config.ts"),
    "utf-8"
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(WEB_ROOT, "package.json"), "utf-8")
  );
  const eslintConfigSource = fs.readFileSync(
    path.join(WEB_ROOT, "eslint.config.mjs"),
    "utf-8"
  );
  const workerPath = path.join(WEB_ROOT, "worker.ts");
  const workerSource = fs.existsSync(workerPath)
    ? fs.readFileSync(workerPath, "utf-8")
    : undefined;

  return {
    wranglerConfig: parseJsonc<WranglerConfig>(wranglerRaw),
    openNextSource,
    nextConfigSource,
    packageJson,
    eslintConfigSource,
    workerSource,
  };
}

describe("Deployment & Infrastructure Configuration Contract", () => {
  it("validates the live repository configuration without errors", () => {
    const live = loadLiveConfig();
    const errors = validateDeploymentConfig(live);
    expect(errors).toEqual([]);
  });

  it("enforces that wrangler.jsonc points 'main' to 'worker.ts' and worker.ts delegates to .open-next/worker.js", () => {
    const live = loadLiveConfig();
    expect(live.wranglerConfig.main).toBe("worker.ts");

    const badMain = validateDeploymentConfig({
      ...live,
      wranglerConfig: {
        ...live.wranglerConfig,
        main: "invalid-worker.js",
      },
    });
    expect(badMain).toEqual(
      expect.arrayContaining([expect.stringContaining("worker.ts")])
    );
  });

  it("catches missing KV and D1 bindings when open-next.config.ts uses kvIncrementalCache / d1NextTagCache (yesterday's crash #3)", () => {
    const live = loadLiveConfig();
    const brokenOpenNext = `
      import { defineCloudflareConfig } from "@opennextjs/cloudflare";
      import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
      import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
      const config = defineCloudflareConfig({
        incrementalCache: kvIncrementalCache,
        tagCache: d1NextTagCache,
      });
      config.buildCommand = "npm run build:next";
      export default config;
    `;

    const errors = validateDeploymentConfig({
      ...live,
      openNextSource: brokenOpenNext,
      wranglerConfig: {
        ...live.wranglerConfig,
        kv_namespaces: [],
        d1_databases: [],
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("NEXT_INC_CACHE_KV"),
        expect.stringContaining("NEXT_TAG_CACHE_D1"),
      ])
    );
  });

  it("passes when KV and D1 cache overrides are paired with valid wrangler.jsonc bindings", () => {
    const live = loadLiveConfig();
    const withCacheOpenNext = `
      import { defineCloudflareConfig } from "@opennextjs/cloudflare";
      import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
      import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
      const config = defineCloudflareConfig({
        incrementalCache: kvIncrementalCache,
        tagCache: d1NextTagCache,
      });
      config.buildCommand = "npm run build:next";
      export default config;
    `;

    const errors = validateDeploymentConfig({
      ...live,
      openNextSource: withCacheOpenNext,
      wranglerConfig: {
        ...live.wranglerConfig,
        kv_namespaces: [{ binding: "NEXT_INC_CACHE_KV", id: "kv-12345" }],
        d1_databases: [
          {
            binding: "NEXT_TAG_CACHE_D1",
            database_id: "d1-67890",
            database_name: "tag-cache",
          },
        ],
      },
    });

    expect(errors).toEqual([]);
  });

  it("catches unguarded initOpenNextCloudflareForDev() in next.config.ts (yesterday's crash #1a)", () => {
    const live = loadLiveConfig();
    const unguardedNextConfig = `
      import type { NextConfig } from "next";
      import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
      const nextConfig: NextConfig = {};
      export default nextConfig;
      initOpenNextCloudflareForDev();
    `;

    const errors = validateDeploymentConfig({
      ...live,
      nextConfigSource: unguardedNextConfig,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("initOpenNextCloudflareForDev()"),
      ])
    );
  });

  it("catches missing buildCommand or recursive build scripts (yesterday's crash #1b)", () => {
    const live = loadLiveConfig();
    const missingBuildCommand = `
      import { defineCloudflareConfig } from "@opennextjs/cloudflare";
      export default defineCloudflareConfig();
    `;

    const errors = validateDeploymentConfig({
      ...live,
      openNextSource: missingBuildCommand,
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining("buildCommand")])
    );
  });

  it("catches missing ESLint ignores for .open-next, .wrangler, and sanity.types.ts (yesterday's crash #2)", () => {
    const live = loadLiveConfig();
    const errors = validateDeploymentConfig({
      ...live,
      eslintConfigSource: `export default [{ ignores: [".next/**"] }];`,
    });

    expect(errors).toHaveLength(3);
    expect(errors.join("\n")).toContain(".open-next/**");
    expect(errors.join("\n")).toContain(".wrangler/**");
    expect(errors.join("\n")).toContain("sanity.types.ts");
  });

  it("catches mismatched WORKER_SELF_REFERENCE service name and missing nodejs_compat", () => {
    const live = loadLiveConfig();
    const errors = validateDeploymentConfig({
      ...live,
      wranglerConfig: {
        ...live.wranglerConfig,
        compatibility_flags: [],
        services: [
          {
            binding: "WORKER_SELF_REFERENCE",
            service: "wrong-worker-name",
          },
        ],
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("nodejs_compat"),
        expect.stringContaining("WORKER_SELF_REFERENCE.service"),
      ])
    );
  });

  it("catches secrets accidentally hardcoded in wrangler.jsonc vars", () => {
    const live = loadLiveConfig();
    const errors = validateDeploymentConfig({
      ...live,
      wranglerConfig: {
        ...live.wranglerConfig,
        vars: {
          SANITY_API_READ_TOKEN: "sk-secret-token-value",
          SANITY_REVALIDATE_SECRET: "my-webhook-secret",
          NEXT_PUBLIC_SANITY_DATASET: "production",
        },
      },
    });

    expect(errors).toHaveLength(2);
    expect(errors.join("\n")).toContain("SANITY_API_READ_TOKEN");
    expect(errors.join("\n")).toContain("SANITY_REVALIDATE_SECRET");
  });
});
