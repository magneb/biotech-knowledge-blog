/**
 * Citation generation utilities for APA 7th Edition and BibTeX.
 */

export interface CitationParams {
  title: string;
  author?: string;
  publishedAt?: string | null;
  versionNumber?: number | null;
  slug: string;
  baseUrl?: string;
}

/**
 * Returns the canonical permanent URL for a specific edition of an article.
 * Format: https://domain/[slug]/v{N}/
 */
export function getVersionPermalink(
  slug: string,
  versionNumber: number = 1,
  baseUrl: string = "https://oliversguide.com"
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const version = Math.max(1, Math.floor(versionNumber || 1));
  return `${cleanBase}/${cleanSlug}/v${version}/`;
}

/**
 * Generates an APA 7th Edition reference string for an archived/versioned online protocol or guide.
 *
 * Rule (APA 7 Section 10.3):
 * Author, A. A. (Year, Month Day). Title of work (Version X). In Title of Compendium. URL
 */
export function formatApa7Citation({
  title,
  author = "Oliver",
  publishedAt,
  versionNumber = 1,
  slug,
  baseUrl = "https://oliversguide.com",
}: CitationParams): string {
  const version = Math.max(1, Math.floor(versionNumber || 1));
  const permalink = getVersionPermalink(slug, version, baseUrl);

  let datePart = "n.d.";
  if (publishedAt) {
    const d = new Date(publishedAt);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
      const day = d.getUTCDate();
      datePart = `${year}, ${month} ${day}`;
    }
  }

  return `${author}. (${datePart}). ${title.trim()} (Version ${version}). In Oliver's Guide To Everything. ${permalink}`;
}

/**
 * Generates a clean BibTeX entry for LaTeX/Overleaf research integration.
 */
export function formatBibtexCitation({
  title,
  author = "Oliver",
  publishedAt,
  versionNumber = 1,
  slug,
  baseUrl = "https://oliversguide.com",
}: CitationParams): string {
  const version = Math.max(1, Math.floor(versionNumber || 1));
  const permalink = getVersionPermalink(slug, version, baseUrl);

  let year = "2026";
  if (publishedAt) {
    const d = new Date(publishedAt);
    if (!isNaN(d.getTime())) {
      year = String(d.getUTCFullYear());
    }
  }

  const safeSlug = slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15).toLowerCase();
  const citeKey = `${author.toLowerCase().replace(/[^a-z]/g, "")}${year}${safeSlug}`;

  return `@misc{${citeKey},
  author       = {${author}},
  title        = {${title.trim()} (Version ${version})},
  howpublished = {Oliver's Guide To Everything},
  year         = {${year}},
  url          = {${permalink}},
  note         = {Laboratory Protocol & Reference Guide}
}`;
}
