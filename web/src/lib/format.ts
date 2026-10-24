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

/**
 * Converts a positive integer into Roman numerals for Victorian chapter headings (e.g. 1 -> "I", 4 -> "IV").
 */
export function formatRomanNumeral(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return String(num);
  const romanMap: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let remaining = num;
  for (const [val, roman] of romanMap) {
    while (remaining >= val) {
      result += roman;
      remaining -= val;
    }
  }
  return result;
}
