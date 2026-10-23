import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = path.resolve(__dirname, "..");

describe("Design System, CSS Layer & SVG Sprite Sheet Contract", () => {
  it("ensures every IconName in Icon.tsx has a matching <symbol id> in public/sprites.svg and vice versa", () => {
    const iconSource = fs.readFileSync(
      path.join(WEB_ROOT, "src/components/ui/Icon.tsx"),
      "utf-8"
    );
    const spritesSvg = fs.readFileSync(
      path.join(WEB_ROOT, "public/sprites.svg"),
      "utf-8"
    );

    // Extract IconName union members from Icon.tsx
    const iconTypeBlockMatch = iconSource.match(
      /export type IconName\s*=([\s\S]*?);/
    );
    expect(iconTypeBlockMatch).not.toBeNull();
    const iconNames = Array.from(
      iconTypeBlockMatch![1].matchAll(/"([^"]+)"/g),
      (m) => m[1]
    ).sort();

    // Extract <symbol id="..."> from sprites.svg
    const symbolIds = Array.from(
      spritesSvg.matchAll(/<symbol\s+[^>]*id="([^"]+)"/g),
      (m) => m[1]
    ).sort();

    expect(iconNames.length).toBeGreaterThan(0);
    expect(iconNames).toEqual(symbolIds);
  });

  it("verifies CSS @layer cascade order and existence of all 5 style layer files", () => {
    const globalsCss = fs.readFileSync(
      path.join(WEB_ROOT, "src/app/globals.css"),
      "utf-8"
    );
    expect(globalsCss).toContain('@import "../styles/layers.css"');

    const layersCss = fs.readFileSync(
      path.join(WEB_ROOT, "src/styles/layers.css"),
      "utf-8"
    );
    expect(layersCss).toContain(
      "@layer reset, tokens, base, components, utilities;"
    );

    const expectedLayers = [
      "reset",
      "tokens",
      "base",
      "components",
      "utilities",
    ];
    for (const layer of expectedLayers) {
      expect(layersCss).toContain(`@import "./${layer}.css" layer(${layer});`);
      const layerFile = path.join(WEB_ROOT, `src/styles/${layer}.css`);
      expect(fs.existsSync(layerFile)).toBe(true);
      expect(fs.statSync(layerFile).size).toBeGreaterThan(50);
    }
  });

  it("verifies public/_headers configures immutable caching for /_next/static/*", () => {
    const headersFile = fs.readFileSync(
      path.join(WEB_ROOT, "public/_headers"),
      "utf-8"
    );
    expect(headersFile).toContain("/_next/static/*");
    expect(headersFile).toContain(
      "Cache-Control: public,max-age=31536000,immutable"
    );
  });
});
