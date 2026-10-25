/**
 * Heading and Table of Contents utilities for Portable Text bodies.
 */

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

/**
 * Creates a URL-friendly, deterministic DOM id from text.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts h2 and h3 headings from a Sanity Portable Text block array.
 */
export function extractTocHeadings(blocks: unknown[]): TocHeading[] {
  if (!Array.isArray(blocks)) return [];
  const headings: TocHeading[] = [];
  const seenIds = new Set<string>();

  for (const block of blocks) {
    if (
      block &&
      typeof block === "object" &&
      "_type" in block &&
      block._type === "block" &&
      "style" in block &&
      typeof block.style === "string"
    ) {
      const style = block.style;
      if (style === "h2" || style === "h3") {
        const level = style === "h2" ? 2 : 3;
        let text = "";
        if ("children" in block && Array.isArray(block.children)) {
          text = block.children
            .map((c) => (c && typeof c === "object" && "text" in c ? String(c.text) : ""))
            .join("");
        }
        text = text.trim();
        if (text) {
          let id = slugifyHeading(text);
          if (!id) id = `section-${headings.length + 1}`;
          let uniqueId = id;
          let counter = 1;
          while (seenIds.has(uniqueId)) {
            uniqueId = `${id}-${counter++}`;
          }
          seenIds.add(uniqueId);
          headings.push({ id: uniqueId, text, level });
        }
      }
    }
  }

  return headings;
}
