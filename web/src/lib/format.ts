/**
 * Formats a date string into a human-readable date (e.g. "Oct 22, 2026" or "October 22, 2026").
 */
export function formatDate(
  dateStr: string,
  monthStyle: "short" | "long" = "short"
): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: monthStyle,
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats a hyphenated category slug into Title Case words (e.g. "research-note" -> "Research Note").
 */
export function formatCategory(cat: string): string {
  return cat
    .trim()
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
