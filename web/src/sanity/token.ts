import fs from "node:fs";
import path from "node:path";

function readTokenFromFile(filename: string): string | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;

  try {
    const filePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), filename);
    if (!fs.existsSync(filePath)) return undefined;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^SANITY_API_READ_TOKEN=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {
    // Non-filesystem runtimes or missing files fallback cleanly
  }
  return undefined;
}

export function getSanityReadToken(): string | undefined {
  if (process.env.SANITY_API_READ_TOKEN?.trim()) {
    return process.env.SANITY_API_READ_TOKEN.trim();
  }

  // Fallback in dev/local environments if .env.local or .dev.vars was created/updated during runtime
  return readTokenFromFile(".env.local") || readTokenFromFile(".dev.vars");
}

export const token = getSanityReadToken();
