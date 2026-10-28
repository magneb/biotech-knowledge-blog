import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "../next.config";

const WEB_ROOT = path.resolve(__dirname, "..");

describe("HTML & ISR Cache Policy Contract (WP-8C)", () => {
  it("verifies next.config.ts headers configuration", async () => {
    const headers =
      typeof nextConfig.headers === "function" ? await nextConfig.headers() : [];

    // 1. No route emits immutable on versioned permalinks
    const versionHeaders = headers.find((h) => h.source.includes(":version"));
    expect(versionHeaders).toBeUndefined();

    // 2. Hashed static assets have immutable caching
    const staticRule = headers.find((h) => h.source === "/_next/static/:path*");
    expect(staticRule?.headers).toEqual(
      expect.arrayContaining([
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ])
    );

    // 3. Draft Mode emits private, no-store when preview bypass cookie is present
    const draftRule = headers.find(
      (h) => h.has?.some((has) => has.key === "__prerender_bypass")
    );
    expect(draftRule?.headers).toEqual(
      expect.arrayContaining([
        { key: "Cache-Control", value: "private, no-store" },
      ])
    );
    expect(draftRule?.source).toBe(
      "/:path((?!api(?:/|$)|_next(?:/|$)|sprites\\.svg$|art(?:/|$)|favicon\\.ico$).*)"
    );

    // 4. Public HTML emits 10m browser / 7d edge must-revalidate when preview bypass cookie is missing
    const publicHtmlRule = headers.find(
      (h) => h.missing?.some((m) => m.key === "__prerender_bypass")
    );
    expect(publicHtmlRule?.headers).toEqual(
      expect.arrayContaining([
        {
          key: "Cache-Control",
          value: "public, max-age=600, s-maxage=604800, must-revalidate",
        },
      ])
    );
    expect(publicHtmlRule?.source).toBe(
      "/:path((?!api(?:/|$)|_next(?:/|$)|sprites\\.svg$|art(?:/|$)|favicon\\.ico$).*)"
    );
  });

  it("enforces 2-week (1209600s) max cache expiration (expireTime) in next.config.ts", () => {
    expect(nextConfig.expireTime).toBe(1209600);
  });

  it("returns empty headers in development mode to prevent custom cache-control headers from breaking Turbopack", async () => {
    vi.stubEnv("NODE_ENV", "development");
    try {
      const headers =
        typeof nextConfig.headers === "function" ? await nextConfig.headers() : [];
      expect(headers).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("verifies headers route regex matches oncology slugs and excludes static assets / API routes", async () => {
    const headers =
      typeof nextConfig.headers === "function" ? await nextConfig.headers() : [];

    const draftRule = headers.find(
      (h) => h.has?.some((has) => has.key === "__prerender_bypass")
    );
    const publicHtmlRule = headers.find(
      (h) => h.missing?.some((m) => m.key === "__prerender_bypass")
    );

    expect(draftRule?.source).toBeDefined();
    expect(publicHtmlRule?.source).toBeDefined();

    // Next.js compiles source route patterns of the form `/:path((...))` into
    // `^(?:/(...))(?:/)?$` in routes-manifest.json
    const compileRouteRegex = (source: string) => {
      const pattern = source.replace(/^\/:path\((.*)\)$/, "^(?:/($1))(?:/)?$");
      return new RegExp(pattern);
    };

    const draftRegex = compileRouteRegex(draftRule!.source);
    const publicRegex = compileRouteRegex(publicHtmlRule!.source);

    // Finding 1 regression lock: Must match oncology slugs, standard pages, root, and version permalinks
    const matchingRoutes = [
      "/artemisinin-treatment",
      "/apixaban-protocol",
      "/articles",
      "/contents",
      "/",
      "/:slug/v1",
    ];

    // Must exclude static asset directories, API routes, and static root files
    const excludedRoutes = [
      "/art",
      "/art/microscopy.svg",
      "/api/revalidate",
      "/_next/static/foo.js",
      "/sprites.svg",
      "/favicon.ico",
    ];

    for (const route of matchingRoutes) {
      expect(
        draftRegex.test(route),
        `Expected draft rule regex to match '${route}'`
      ).toBe(true);
      expect(
        publicRegex.test(route),
        `Expected public HTML rule regex to match '${route}'`
      ).toBe(true);
    }

    for (const route of excludedRoutes) {
      expect(
        draftRegex.test(route),
        `Expected draft rule regex to exclude '${route}'`
      ).toBe(false);
      expect(
        publicRegex.test(route),
        `Expected public HTML rule regex to exclude '${route}'`
      ).toBe(false);
    }
  });

  it("enforces 7-day (604800s) upper bound ISR revalidation on layout and all page controllers", () => {
    const requiredFiles = [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/contents/page.tsx",
      "src/app/[slug]/page.tsx",
      "src/app/[slug]/[version]/page.tsx",
      "src/app/[slug]/versions/page.tsx",
      "src/app/sprites-preview/page.tsx",
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(WEB_ROOT, relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(
        content,
        `Expected ${relPath} to export const revalidate = 604800;`
      ).toMatch(/export\s+const\s+revalidate\s*=\s*604800\s*;/);
    }
  });

  it("verifies version reader footer copy does not reference immutable edge archival", () => {
    const versionsPagePath = path.join(
      WEB_ROOT,
      "src/app/[slug]/versions/page.tsx"
    );
    const content = fs.readFileSync(versionsPagePath, "utf-8");
    expect(content).toContain("<span>Official Versioned Record</span>");
    expect(content).not.toContain("<span>Immutable Permanent Edge Archival</span>");
  });

  it("verifies developer cache purge tooling is wired in package.json and web/package.json", () => {
    const rootPkg = JSON.parse(
      fs.readFileSync(path.resolve(WEB_ROOT, "..", "package.json"), "utf-8")
    );
    const webPkg = JSON.parse(
      fs.readFileSync(path.join(WEB_ROOT, "package.json"), "utf-8")
    );

    expect(rootPkg.scripts?.["cache:purge"]).toBe(
      "npm --prefix web run cache:purge --"
    );
    expect(webPkg.scripts?.["cache:purge"]).toBe(
      "node scripts/purge-cache.mjs"
    );

    const scriptPath = path.join(WEB_ROOT, "scripts", "purge-cache.mjs");
    expect(fs.existsSync(scriptPath)).toBe(true);
    const scriptContent = fs.readFileSync(scriptPath, "utf-8");
    expect(scriptContent).toContain("NEXT_INC_CACHE_KV");
    expect(scriptContent).toContain("NEXT_TAG_CACHE_D1");
    expect(scriptContent).toContain("purgeAll: true");

    // Finding 2 regression lock: Verify non-interactive "-y" flag is present in Wrangler D1 execution command
    expect(scriptContent).toContain('"-y"');
    expect(scriptContent).toMatch(
      /wrangler[\s\S]*?d1[\s\S]*?execute[\s\S]*?["']-y["']/
    );
  });
});
