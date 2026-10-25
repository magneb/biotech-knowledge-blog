import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../..");
const STUDIO_SCHEMAS_DIR = path.join(REPO_ROOT, "studio/schemaTypes");

interface ParsedSchemaDefinition {
  exportName: string;
  name: string;
  fields: string[];
}

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extracts top-level `defineField({ name: '...' })` entries inside a `defineType`
 * root `fields: [...]` array by tracking bracket/brace nesting depth.
 */
function extractTopLevelFields(source: string): string[] {
  const fieldsStart = source.search(/\bfields\s*:\s*\[/);
  if (fieldsStart === -1) return [];

  const openBracketIdx = source.indexOf("[", fieldsStart);
  if (openBracketIdx === -1) return [];

  const fields: string[] = [];
  let bracketDepth = 0;
  let braceDepth = 0;

  let i = openBracketIdx;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "[") {
      bracketDepth++;
    } else if (ch === "]") {
      bracketDepth--;
      if (bracketDepth === 0) break;
    } else if (ch === "{") {
      braceDepth++;
    } else if (ch === "}") {
      braceDepth--;
    }

    // At top-level of `fields: [...]`, bracketDepth === 1 and braceDepth === 0
    if (
      bracketDepth === 1 &&
      braceDepth === 0 &&
      source.slice(i).startsWith("defineField")
    ) {
      const m = source
        .slice(i)
        .match(/^defineField\s*\(\s*\{\s*name:\s*['"]([^'"]+)['"]/);
      if (m) {
        fields.push(m[1]);
      }
    }
    i++;
  }

  return fields;
}

/**
 * Parses `studio/schemaTypes/*.ts` from source text without importing `studio/`
 * runtime modules into `web/` (which has no `sanity` dependency in Cloudflare CI).
 */
function parseStudioSchemas(): {
  registeredExports: string[];
  schemas: ParsedSchemaDefinition[];
} {
  const indexSource = fs.readFileSync(
    path.join(STUDIO_SCHEMAS_DIR, "index.ts"),
    "utf-8"
  );
  const arrayMatch = indexSource.match(/schemaTypes\s*=\s*\[([^\]]+)\]/);
  const registeredExports = arrayMatch
    ? arrayMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const schemas: ParsedSchemaDefinition[] = [];
  for (const entry of fs.readdirSync(STUDIO_SCHEMAS_DIR, {
    withFileTypes: true,
  })) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".ts") ||
      entry.name === "index.ts"
    ) {
      continue;
    }
    const source = fs.readFileSync(
      path.join(STUDIO_SCHEMAS_DIR, entry.name),
      "utf-8"
    );
    const typeHeaderMatch = source.match(
      /export\s+const\s+(\w+)\s*=\s*defineType\s*\(\s*\{[\s\S]*?name:\s*['"]([^'"]+)['"]/
    );
    if (!typeHeaderMatch) continue;

    const [, exportName, schemaName] = typeHeaderMatch;
    const fields = extractTopLevelFields(source);

    schemas.push({ exportName, name: schemaName, fields });
  }

  return { registeredExports, schemas };
}

describe("Sanity Studio Schemas, Client Config & Dynamic TypeGen Sync", () => {
  it("registers chapter, topic, article, homePage, and aboutPage schemas in studio/schemaTypes", () => {
    const { registeredExports, schemas } = parseStudioSchemas();
    expect(registeredExports).toEqual(
      expect.arrayContaining(["chapter", "topic", "article", "homePage", "aboutPage"])
    );

    const chapterSchema = schemas.find((s) => s.name === "chapter");
    expect(chapterSchema).toBeDefined();
    expect(chapterSchema?.fields).toEqual(
      expect.arrayContaining(["title", "number", "slug", "summary", "vignette"])
    );

    const topicSchema = schemas.find((s) => s.name === "topic");
    expect(topicSchema).toBeDefined();
    expect(topicSchema?.fields).toEqual(
      expect.arrayContaining(["name", "symbol", "slug", "description"])
    );

    const articleSchema = schemas.find((s) => s.name === "article");
    expect(articleSchema).toBeDefined();
    expect(articleSchema?.fields).toEqual(
      expect.arrayContaining([
        "title",
        "slug",
        "contentType",
        "summary",
        "chapter",
        "chapterOrder",
        "topics",
        "featured",
        "publishedAt",
        "coverEtching",
        "downloadablePdfs",
        "body",
      ])
    );
    expect(articleSchema?.fields).not.toContain("category");

    const homeSchema = schemas.find((s) => s.name === "homePage");
    expect(homeSchema).toBeDefined();
    expect(homeSchema?.fields).toEqual(
      expect.arrayContaining([
        "logo",
        "heading",
        "subheading",
        "intro",
        "featuredArticles",
        "mottoBanner",
        "mediaChannels",
        "contactEmail",
        "siteTitle",
        "authorName",
        "publisher",
      ])
    );

    const aboutSchema = schemas.find((s) => s.name === "aboutPage");
    expect(aboutSchema).toBeDefined();
    expect(aboutSchema?.fields).toEqual(
      expect.arrayContaining([
        "title",
        "authorName",
        "authorAffiliation",
        "bio",
        "portraitEtching",
        "siteTitle",
        "publisher",
        "siteDescription",
        "canonicalDomain",
        "contactEmail",
      ])
    );
  });

  it("organizes Studio Structure with Home Page singleton, About & Metadata singleton, Chapters & Content, Topics / Taxonomies, and bibliography slot", () => {
    const structureSource = fs.readFileSync(
      path.join(REPO_ROOT, "studio/src/structure/index.ts"),
      "utf-8"
    );

    expect(structureSource).toContain("documentId('homePage')");
    expect(structureSource).toContain("documentId('aboutPage')");
    expect(structureSource).toContain("Chapters & Content");
    expect(structureSource).toContain("Articles by Chapter");
    expect(structureSource).toContain("Topics / Taxonomies");
    expect(structureSource).toContain("<bibliography-slot>");
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

    const { registeredExports, schemas } = parseStudioSchemas();
    expect(schemas.length).toBeGreaterThan(0);

    for (const schemaDef of schemas) {
      expect(
        registeredExports,
        `Schema export '${schemaDef.exportName}' is defined in studio/schemaTypes but not registered in studio/schemaTypes/index.ts`
      ).toContain(schemaDef.exportName);

      const extracted = schemaJson.find((entry) => entry.name === schemaDef.name);
      expect(
        extracted,
        `Schema '${schemaDef.name}' is in studio/schemaTypes but missing from studio/schema.json. Run 'npm run typegen'.`
      ).toBeDefined();

      const extractedAttrs =
        extracted?.attributes ?? extracted?.value?.attributes ?? {};
      for (const fieldName of schemaDef.fields) {
        expect(
          extractedAttrs,
          `Field '${schemaDef.name}.${fieldName}' is missing from studio/schema.json. Run 'npm run typegen'.`
        ).toHaveProperty(fieldName);
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

  it("ensures web/ files never import TypeScript modules from ../studio/ (prevents CI typecheck failure when studio/node_modules is absent)", () => {
    const webFiles = [
      ...collectSourceFiles(path.join(REPO_ROOT, "web/src")),
      ...fs
        .readdirSync(path.join(REPO_ROOT, "web/tests"))
        .filter((f) => /\.(ts|tsx)$/.test(f))
        .map((f) => path.join(REPO_ROOT, "web/tests", f)),
    ];

    const studioImportPattern = new RegExp(
      String.raw`\b(?:from|import)\s+['"][^'"]*` + "studio/"
    );
    for (const file of webFiles) {
      const source = fs.readFileSync(file, "utf-8");
      const stripped = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      const hasStudioImport = studioImportPattern.test(stripped);
      expect(
        hasStudioImport,
        `File '${path.relative(REPO_ROOT, file)}' has an import referencing 'studio/'. In Cloudflare Workers Builds, 'studio/node_modules' is not installed, causing 'next build' TypeScript verification to fail with TS2307.`
      ).toBe(false);
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
