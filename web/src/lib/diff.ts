/**
 * Zero-dependency Word & Block Diff Engine for Scholarly Protocol Versioning
 *
 * Implements Longest Common Subsequence (LCS) diffing for words and blocks,
 * preserving whitespace and formatting for Victorian copperplate rendering.
 */

export type DiffChangeType = "added" | "removed" | "unchanged";

export interface DiffToken {
  type: DiffChangeType;
  value: string;
}

export interface DiffStats {
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
}

export interface SectionDiff {
  id: string;
  title: string;
  titleDiff?: DiffToken[];
  type: "heading" | "paragraph" | "reagents" | "figure" | "generic";
  tokens: DiffToken[];
  stats: DiffStats;
}

export interface TreatiseDiffResult {
  titleDiff: DiffToken[];
  summaryDiff: DiffToken[];
  contentTypeDiff?: {
    from?: string | null;
    to?: string | null;
    changed: boolean;
  };
  sections: SectionDiff[];
  stats: DiffStats;
  hasChanges: boolean;
}

/**
 * Splits text into alternating words and non-word separators (spaces, punctuation).
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Matches sequences of alphanumeric/hyphen characters or sequences of non-alphanumeric whitespace/punctuation
  const tokens: string[] = [];
  const regex = /([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF-]+)|(\s+|[^\w\s\u00C0-\u024F\u1E00-\u1EFF-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

function isWordToken(token: string): boolean {
  return /^[A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/.test(token);
}

/**
 * Computes Longest Common Subsequence (LCS) matrix for two token arrays.
 */
function computeLcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (a[i] === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  return dp;
}

/**
 * Reconstructs the diff from LCS table, prioritizing contiguous additions and deletions.
 */
function backtrackLcs(
  dp: number[][],
  a: string[],
  b: string[],
  i: number,
  j: number,
  out: DiffToken[]
): void {
  if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
    backtrackLcs(dp, a, b, i - 1, j - 1, out);
    out.push({ type: "unchanged", value: a[i - 1] });
  } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
    backtrackLcs(dp, a, b, i, j - 1, out);
    out.push({ type: "added", value: b[j - 1] });
  } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
    backtrackLcs(dp, a, b, i - 1, j, out);
    out.push({ type: "removed", value: a[i - 1] });
  }
}

/**
 * Merges contiguous tokens of the same type into cohesive tokens.
 */
function mergeContiguousTokens(tokens: DiffToken[]): DiffToken[] {
  if (tokens.length === 0) return [];

  const merged: DiffToken[] = [];
  let current = { ...tokens[0] };

  for (let k = 1; k < tokens.length; k++) {
    const next = tokens[k];
    if (next.type === current.type) {
      current.value += next.value;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Calculates word count statistics from diff tokens.
 */
export function calculateDiffStats(tokens: DiffToken[]): DiffStats {
  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsUnchanged = 0;

  for (const token of tokens) {
    const subWords = tokenizeWords(token.value).filter(isWordToken);
    const count = subWords.length;
    if (token.type === "added") wordsAdded += count;
    else if (token.type === "removed") wordsRemoved += count;
    else wordsUnchanged += count;
  }

  return { wordsAdded, wordsRemoved, wordsUnchanged };
}

/**
 * Diffs two plain text strings at word resolution.
 */
export function diffWords(textA: string = "", textB: string = ""): {
  tokens: DiffToken[];
  stats: DiffStats;
} {
  if (textA === textB) {
    const tokens: DiffToken[] = textA ? [{ type: "unchanged", value: textA }] : [];
    return { tokens, stats: calculateDiffStats(tokens) };
  }

  const tokensA = tokenizeWords(textA);
  const tokensB = tokenizeWords(textB);

  const dp = computeLcsTable(tokensA, tokensB);
  const rawDiff: DiffToken[] = [];
  backtrackLcs(dp, tokensA, tokensB, tokensA.length, tokensB.length, rawDiff);

  const merged = mergeContiguousTokens(rawDiff);
  const stats = calculateDiffStats(merged);

  return { tokens: merged, stats };
}

/**
 * Extracts plain text from a Portable Text block or block array.
 */
export function extractPlainTextFromBlock(block: unknown): string {
  if (!block || typeof block !== "object") return "";
  const b = block as { _type?: string; children?: Array<{ text?: string }>; text?: string };

  if (Array.isArray(b.children)) {
    return b.children.map((c) => c?.text || "").join("");
  }
  if (typeof b.text === "string") return b.text;
  return "";
}

interface PortableTextBlockLike {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: Array<{ text?: string }>;
  title?: string;
  formulaNote?: string;
  items?: Array<{ name?: string; quantity?: string; note?: string }>;
  caption?: string;
  figureNumber?: string;
}

/**
 * Extracts normalized textual sections from Portable Text blocks.
 * Headings (h2, h3, h4) establish genuine section boundaries.
 * All paragraphs, lists, and special blocks under a heading belong to that section.
 * If the treatise has introductory text before any heading, it is grouped as an intro section with an empty title.
 */
export function extractBlockSections(blocks: unknown[]): Array<{
  id: string;
  title: string;
  type: SectionDiff["type"];
  text: string;
}> {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  const rawSections: Array<{
    id: string;
    title: string;
    type: SectionDiff["type"];
    contentBlocks: string[];
  }> = [];

  let currentSection: {
    id: string;
    title: string;
    type: SectionDiff["type"];
    contentBlocks: string[];
  } = {
    id: "sec-0",
    title: "",
    type: "generic",
    contentBlocks: [],
  };

  let sectionCounter = 1;

  for (const rawBlock of blocks) {
    if (!rawBlock || typeof rawBlock !== "object") continue;
    const block = rawBlock as PortableTextBlockLike;

    if (block._type === "block") {
      const isHeading =
        block.style === "h2" || block.style === "h3" || block.style === "h4";
      const text = extractPlainTextFromBlock(block).trim();

      if (isHeading && text) {
        // If current section has any content or has a title, save it
        if (currentSection.contentBlocks.length > 0 || currentSection.title) {
          rawSections.push(currentSection);
        }
        // Start a new section establishing this heading boundary
        currentSection = {
          id: `sec-${sectionCounter++}`,
          title: text,
          type: "heading",
          contentBlocks: [],
        };
      } else if (text) {
        const line =
          block.listItem === "number"
            ? `1. ${text}`
            : block.listItem
              ? `• ${text}`
              : text;
        currentSection.contentBlocks.push(line);
      }
    } else if (block._type === "formulaReagents") {
      const title = block.title || "Reagents & Apparatus";
      const note = block.formulaNote ? `Note: ${block.formulaNote}` : "";
      const items = Array.isArray(block.items)
        ? block.items
            .map(
              (item) =>
                `- ${item.name || "Item"}: ${item.quantity || "—"} (${item.note || "std"})`
            )
            .join("\n")
        : "";
      const formatted = [title, note, items].filter(Boolean).join("\n");
      if (formatted.trim()) {
        currentSection.contentBlocks.push(formatted.trim());
      }
    } else if (block._type === "figureCallout") {
      const figLabel = block.figureNumber ? `[${block.figureNumber}] ` : "";
      const caption = block.caption || "";
      const formatted = `${figLabel}${caption}`.trim();
      if (formatted) {
        currentSection.contentBlocks.push(formatted);
      }
    }
  }

  // Push the final section if it has content or a title
  if (currentSection.contentBlocks.length > 0 || currentSection.title) {
    rawSections.push(currentSection);
  }

  return rawSections.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    text: s.contentBlocks.join("\n\n"),
  }));
}

/**
 * Compares two treatise editions and returns a complete, structured diff.
 */
export function diffTreatiseEditions(
  base: {
    title?: string | null;
    summary?: string | null;
    contentType?: string | null;
    body?: unknown[] | null;
  },
  target: {
    title?: string | null;
    summary?: string | null;
    contentType?: string | null;
    body?: unknown[] | null;
  }
): TreatiseDiffResult {
  const titleDiff = diffWords(base.title || "", target.title || "");
  const summaryDiff = diffWords(base.summary || "", target.summary || "");

  const contentTypeChanged = base.contentType !== target.contentType;
  const contentTypeDiff = {
    from: base.contentType,
    to: target.contentType,
    changed: contentTypeChanged,
  };

  const baseSections = extractBlockSections(base.body || []);
  const targetSections = extractBlockSections(target.body || []);

  const sections: SectionDiff[] = [];
  const usedBaseIndices = new Set<number>();

  let totalWordsAdded = titleDiff.stats.wordsAdded + summaryDiff.stats.wordsAdded;
  let totalWordsRemoved = titleDiff.stats.wordsRemoved + summaryDiff.stats.wordsRemoved;
  let totalWordsUnchanged = titleDiff.stats.wordsUnchanged + summaryDiff.stats.wordsUnchanged;

  for (let j = 0; j < targetSections.length; j++) {
    const sB = targetSections[j];
    let matchedBaseIndex = -1;

    // 1. Match by heading title if non-empty
    if (sB.title?.trim()) {
      matchedBaseIndex = baseSections.findIndex(
        (sA, i) =>
          !usedBaseIndices.has(i) &&
          sA.title?.trim().toLowerCase() === sB.title.trim().toLowerCase()
      );
    } else if (
      j === 0 &&
      baseSections.length > 0 &&
      !baseSections[0].title?.trim() &&
      !usedBaseIndices.has(0)
    ) {
      // Intro section at position 0
      matchedBaseIndex = 0;
    }

    // 2. If both have only 1 section (e.g. simple document with no headings or same structure)
    if (
      matchedBaseIndex === -1 &&
      targetSections.length === 1 &&
      baseSections.length === 1 &&
      !usedBaseIndices.has(0)
    ) {
      matchedBaseIndex = 0;
    }

    // 3. Fallback to positional match if base has an unused section at index j
    if (matchedBaseIndex === -1 && j < baseSections.length && !usedBaseIndices.has(j)) {
      matchedBaseIndex = j;
    }

    if (matchedBaseIndex !== -1) {
      usedBaseIndices.add(matchedBaseIndex);
      const sA = baseSections[matchedBaseIndex];
      const diff = diffWords(sA.text, sB.text);

      let titleDiffTokens: DiffToken[] | undefined;
      if (sA.title !== sB.title && (sA.title || sB.title)) {
        const td = diffWords(sA.title || "", sB.title || "");
        titleDiffTokens = td.tokens;
        totalWordsAdded += td.stats.wordsAdded;
        totalWordsRemoved += td.stats.wordsRemoved;
      }

      sections.push({
        id: sB.id || sA.id,
        title: sB.title || sA.title,
        titleDiff: titleDiffTokens,
        type: sB.type || sA.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsAdded += diff.stats.wordsAdded;
      totalWordsRemoved += diff.stats.wordsRemoved;
      totalWordsUnchanged += diff.stats.wordsUnchanged;
    } else {
      // Newly added section in target edition
      const diff = diffWords("", sB.text);
      sections.push({
        id: sB.id,
        title: sB.title,
        type: sB.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsAdded += diff.stats.wordsAdded;
      if (sB.title?.trim()) {
        totalWordsAdded += tokenizeWords(sB.title).filter(isWordToken).length;
      }
    }
  }

  // 4. Any remaining base sections were removed in target edition
  for (let i = 0; i < baseSections.length; i++) {
    if (!usedBaseIndices.has(i)) {
      const sA = baseSections[i];
      const diff = diffWords(sA.text, "");
      sections.push({
        id: sA.id,
        title: sA.title,
        type: sA.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsRemoved += diff.stats.wordsRemoved;
      if (sA.title?.trim()) {
        totalWordsRemoved += tokenizeWords(sA.title).filter(isWordToken).length;
      }
    }
  }

  const hasChanges =
    totalWordsAdded > 0 || totalWordsRemoved > 0 || contentTypeChanged;

  return {
    titleDiff: titleDiff.tokens,
    summaryDiff: summaryDiff.tokens,
    contentTypeDiff,
    sections,
    stats: {
      wordsAdded: totalWordsAdded,
      wordsRemoved: totalWordsRemoved,
      wordsUnchanged: totalWordsUnchanged,
    },
    hasChanges,
  };
}
