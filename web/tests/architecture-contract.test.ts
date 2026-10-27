import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const WEB_DIR = path.resolve(__dirname, "..");
const STUDIO_DIR = path.resolve(ROOT_DIR, "studio");

describe("Architecture Contract & Modularity Ratchets", () => {
  it("enforces a strict line count ceiling (<200 lines) on all Next.js route page controllers", () => {
    const pageFiles = [
      "src/app/page.tsx",
      "src/app/contents/page.tsx",
      "src/app/[slug]/page.tsx",
      "src/app/[slug]/[version]/page.tsx",
      "src/app/[slug]/versions/page.tsx",
    ];

    for (const relPath of pageFiles) {
      const fullPath = path.join(WEB_DIR, relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n").length;

      expect(
        lines,
        `Page controller ${relPath} exceeded 200 lines ceiling (found ${lines} lines). Decompose into client view/controller components.`
      ).toBeLessThan(200);
    }
  });

  it("enforces that no individual source file in web/src exceeds 550 lines", () => {
    function getSourceFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(getSourceFiles(full));
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          results.push(full);
        }
      }
      return results;
    }

    const srcFiles = getSourceFiles(path.join(WEB_DIR, "src"));
    for (const file of srcFiles) {
      const relPath = path.relative(WEB_DIR, file);
      const content = fs.readFileSync(file, "utf-8");
      const lineCount = content.split("\n").length;

      expect(
        lineCount,
        `Source file ${relPath} has ${lineCount} lines, exceeding the 550 lines maximum ceiling.`
      ).toBeLessThan(550);
    }
  });

  it("locks the web/package.json runtime dependencies to strictly 6 packages", () => {
    const pkgPath = path.join(WEB_DIR, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies || {});

    expect(deps.length).toBe(6);
    expect(deps.sort()).toEqual([
      "@opennextjs/cloudflare",
      "@sanity/image-url",
      "next",
      "next-sanity",
      "react",
      "react-dom",
    ]);
  });

  it("ensures public directory contains no unused Next.js boilerplate or stale static preview files", () => {
    const publicDir = path.join(WEB_DIR, "public");
    const forbiddenFiles = [
      "file.svg",
      "globe.svg",
      "next.svg",
      "vercel.svg",
      "window.svg",
      "sprites-preview.html",
    ];

    for (const forbidden of forbiddenFiles) {
      const fullPath = path.join(publicDir, forbidden);
      expect(
        fs.existsSync(fullPath),
        `Found forbidden boilerplate/stale file in public: ${forbidden}`
      ).toBe(false);
    }
  });

  it("verifies required architecture documentation and workspace agent rules exist", () => {
    const requiredFiles = [
      path.join(ROOT_DIR, "AGENTS.md"),
      path.join(ROOT_DIR, "DECISIONLOG.md"),
      path.join(WEB_DIR, "AGENTS.md"),
      path.join(STUDIO_DIR, "AGENTS.md"),
    ];

    for (const file of requiredFiles) {
      expect(fs.existsSync(file), `Expected ${file} to exist and be tracked`).toBe(true);
      const content = fs.readFileSync(file, "utf-8").trim();
      expect(content.length, `File ${file} should not be empty`).toBeGreaterThan(50);
    }
  });
});
