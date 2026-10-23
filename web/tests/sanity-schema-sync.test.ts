import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { article } from "../../studio/schemaTypes/article";
import { homePage } from "../../studio/schemaTypes/homePage";
import { schemaTypes } from "../../studio/schemaTypes";

const REPO_ROOT = path.resolve(__dirname, "../..");

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Sanity Studio Schemas, Client Config & Dynamic TypeGen Sync", () => {
  it("registers core article and homePage schemas in studio/schemaTypes", () => {
    expect(schemaTypes).toEqual(expect.arrayContaining([article, homePage]));

    const articleFields = article.fields.map((f) => f.name);
    expect(articleFields).toEqual(
      expect.arrayContaining(["title", "slug", "body"])
    );

    const homeFields = homePage.fields.map((f) => f.name);
    expect(homeFields).toEqual(
      expect.arrayContaining(["heading", "subheading", "intro", "contactEmail"])
    );
  });

  it("dynamically verifies every schema and field in studio/schemaTypes is extracted into studio/schema.json", () => {
    const schemaJsonPath = path.join(REPO_ROOT, "studio/schema.json");
    expect(fs.existsSync(schemaJsonPath)).toBe(true);

    const schemaJson = JSON.parse(
      fs.readFileSync(schemaJsonPath, "utf-8")
    ) as Array<{
      name: string;
      type: string;
      attributes?: Record<string, unknown>;
      value?: { attributes?: Record<string, unknown> };
    }>;

    for (const schemaDef of schemaTypes) {
      const extracted = schemaJson.find((entry) => entry.name === schemaDef.name);
      expect(
        extracted,
        `Schema '${schemaDef.name}' is in studio/schemaTypes but missing from studio/schema.json. Run 'npm run typegen'.`
      ).toBeDefined();

      const extractedAttrs =
        extracted?.attributes ?? extracted?.value?.attributes ?? {};
      if ("fields" in schemaDef && Array.isArray(schemaDef.fields)) {
        for (const field of schemaDef.fields) {
          expect(
            extractedAttrs,
            `Field '${schemaDef.name}.${field.name}' is missing from studio/schema.json. Run 'npm run typegen'.`
          ).toHaveProperty(field.name);
        }
      }
    }
  });

  it("dynamically verifies every defineQuery() in web/src has a generated type in web/sanity.types.ts", () => {
    const typesPath = path.join(REPO_ROOT, "web/sanity.types.ts");
    expect(fs.existsSync(typesPath)).toBe(true);
    const typesContent = fs.readFileSync(typesPath, "utf-8");

    const srcFiles = collectSourceFiles(path.join(REPO_ROOT, "web/src"));
    const discoveredQueries: string[] = [];

    for (const file of srcFiles) {
      const source = fs.readFileSync(file, "utf-8");
      const matches = source.matchAll(
        /const\s+([A-Z0-9_]+)\s*=\s*defineQuery\s*\(/g
      );
      for (const match of matches) {
        discoveredQueries.push(match[1]);
      }
    }

    expect(discoveredQueries.length).toBeGreaterThan(0);
    for (const queryName of discoveredQueries) {
      expect(
        typesContent,
        `Query '${queryName}' is missing 'export type ${queryName}_RESULT' in web/sanity.types.ts. Run 'npm run typegen'.`
      ).toContain(`export type ${queryName}_RESULT =`);
    }
  });

  it("ensures web Sanity client and Studio config point to the same projectId and dataset", () => {
    const webClientSource = fs.readFileSync(
      path.join(REPO_ROOT, "web/src/sanity/client.ts"),
      "utf-8"
    );
    const studioConfigSource = fs.readFileSync(
      path.join(REPO_ROOT, "studio/sanity.config.ts"),
      "utf-8"
    );

    expect(webClientSource).toContain('projectId: "9bx84ykf"');
    expect(webClientSource).toContain('dataset: "production"');
    expect(studioConfigSource).toContain("projectId: '9bx84ykf'");
    expect(studioConfigSource).toContain("dataset: 'production'");
  });
});
