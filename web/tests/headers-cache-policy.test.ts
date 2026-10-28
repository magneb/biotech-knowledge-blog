import { describe, expect, it } from "vitest";
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
      "/:path((?!api|_next|sprites\\.svg|art|favicon\\.ico).*)"
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
      "/:path((?!api|_next|sprites\\.svg|art|favicon\\.ico).*)"
    );
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
});
