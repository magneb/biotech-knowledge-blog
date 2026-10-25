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
  children?: Array<{ text?: string }>;
  title?: string;
  formulaNote?: string;
  items?: Array<{ name?: string; quantity?: string; note?: string }>;
  caption?: string;
  figureNumber?: string;
}

/**
 * Extracts normalized textual sections from Portable Text blocks.
 */
export function extractBlockSections(blocks: unknown[]): Array<{
  id: string;
  title: string;
  type: SectionDiff["type"];
  text: string;
}> {
  if (!Array.isArray(blocks)) return [];

  const sections: Array<{
    id: string;
    title: string;
    type: SectionDiff["type"];
    text: string;
  }> = [];

  let currentHeading = "Preamble & Methods";
  let sectionIndex = 0;

  for (const rawBlock of blocks) {
    if (!rawBlock || typeof rawBlock !== "object") continue;
    const block = rawBlock as PortableTextBlockLike;

    if (block._type === "block") {
      const isHeading = block.style === "h2" || block.style === "h3" || block.style === "h4";
      const text = extractPlainTextFromBlock(block);

      if (isHeading && text.trim()) {
        currentHeading = text.trim();
        sections.push({
          id: `heading-${sectionIndex++}`,
          title: currentHeading,
          type: "heading",
          text,
        });
      } else if (text.trim()) {
        sections.push({
          id: `para-${sectionIndex++}`,
          title: currentHeading,
          type: "paragraph",
          text,
        });
      }
    } else if (block._type === "formulaReagents") {
      const title = block.title || "Reagents & Apparatus";
      const note = block.formulaNote ? `\nNote: ${block.formulaNote}` : "";
      const items = Array.isArray(block.items)
        ? block.items
            .map((item) => `- ${item.name || "Item"}: ${item.quantity || "—"} (${item.note || "std"})`)
            .join("\n")
        : "";
      sections.push({
        id: `reagents-${sectionIndex++}`,
        title: `${currentHeading} — ${title}`,
        type: "reagents",
        text: `${title}${note}\n${items}`.trim(),
      });
    } else if (block._type === "figureCallout") {
      const figLabel = block.figureNumber ? `[${block.figureNumber}] ` : "";
      const caption = block.caption || "";
      sections.push({
        id: `figure-${sectionIndex++}`,
        title: `${currentHeading} — Figure`,
        type: "figure",
        text: `${figLabel}${caption}`.trim(),
      });
    }
  }

  return sections;
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
  const maxLen = Math.max(baseSections.length, targetSections.length);

  let totalWordsAdded = titleDiff.stats.wordsAdded + summaryDiff.stats.wordsAdded;
  let totalWordsRemoved = titleDiff.stats.wordsRemoved + summaryDiff.stats.wordsRemoved;
  let totalWordsUnchanged = titleDiff.stats.wordsUnchanged + summaryDiff.stats.wordsUnchanged;

  for (let k = 0; k < maxLen; k++) {
    const sA = baseSections[k];
    const sB = targetSections[k];

    if (sA && sB) {
      const diff = diffWords(sA.text, sB.text);
      sections.push({
        id: sB.id || sA.id,
        title: sB.title || sA.title,
        type: sB.type || sA.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsAdded += diff.stats.wordsAdded;
      totalWordsRemoved += diff.stats.wordsRemoved;
      totalWordsUnchanged += diff.stats.wordsUnchanged;
    } else if (sB) {
      // Added section in target
      const diff = diffWords("", sB.text);
      sections.push({
        id: sB.id,
        title: sB.title,
        type: sB.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsAdded += diff.stats.wordsAdded;
    } else if (sA) {
      // Removed section in target
      const diff = diffWords(sA.text, "");
      sections.push({
        id: sA.id,
        title: sA.title,
        type: sA.type,
        tokens: diff.tokens,
        stats: diff.stats,
      });
      totalWordsRemoved += diff.stats.wordsRemoved;
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
