import { useSyncExternalStore } from "react";

export interface BookmarkTopic {
  name?: string | null;
  symbol?: string | null;
  slug?: string | { current?: string | null } | null;
}

export interface BookmarkItem {
  slug: string;
  title: string;
  summary?: string | null;
  contentType?: string | null;
  publishedAt?: string | null;
  versionNumber?: number | null;
  topics?: BookmarkTopic[] | null;
  savedAt: string;
}

export const BOOKMARKS_STORAGE_KEY = "olivers_bookmarks_v1";
export const BOOKMARKS_EVENT = "olivers:bookmarks-changed";

export function getStoredBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to read bookmarks from localStorage:", err);
    return [];
  }
}

export function writeStoredBookmarks(items: BookmarkItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(BOOKMARKS_EVENT, { detail: items }));
  } catch (err) {
    console.warn("Unable to write bookmarks to localStorage:", err);
  }
}

export function saveBookmark(
  item: Omit<BookmarkItem, "savedAt">
): BookmarkItem[] {
  const existing = getStoredBookmarks();
  const filtered = existing.filter((b) => b.slug !== item.slug);
  const newItem: BookmarkItem = {
    ...item,
    topics: item.topics
      ? item.topics.map((t) => ({
          name: t.name,
          symbol: t.symbol,
          slug:
            typeof t.slug === "object" && t.slug !== null
              ? t.slug.current
              : (t.slug as string | null | undefined),
        }))
      : null,
    savedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...filtered];
  writeStoredBookmarks(updated);
  return updated;
}

export function removeBookmark(slug: string): BookmarkItem[] {
  const existing = getStoredBookmarks();
  const updated = existing.filter((b) => b.slug !== slug);
  writeStoredBookmarks(updated);
  return updated;
}

export function toggleBookmark(
  item: Omit<BookmarkItem, "savedAt">
): { isSaved: boolean; items: BookmarkItem[] } {
  const existing = getStoredBookmarks();
  const exists = existing.some((b) => b.slug === item.slug);
  if (exists) {
    const updated = removeBookmark(item.slug);
    return { isSaved: false, items: updated };
  }
  const updated = saveBookmark(item);
  return { isSaved: true, items: updated };
}

export function clearAllBookmarks(): void {
  writeStoredBookmarks([]);
}

export function isArticleBookmarked(slug: string, items?: BookmarkItem[]): boolean {
  const list = items || getStoredBookmarks();
  return list.some((b) => b.slug === slug);
}

export function formatBookmarksAsMarkdown(
  bookmarks: BookmarkItem[],
  siteUrl = "https://oliversguidetoeverything.com"
): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = [
    `# Oliver's Guide To Everything — Personal Reading Folio`,
    `*Archived on ${dateStr} • ${bookmarks.length} Saved Protocol${bookmarks.length === 1 ? "" : "s"}*`,
    "",
    "---",
    "",
  ];

  if (bookmarks.length === 0) {
    lines.push("*No protocols currently saved to the reading folio.*");
    lines.push("");
    return lines.join("\n");
  }

  bookmarks.forEach((item, index) => {
    const url = `${siteUrl}/${item.slug}`;
    lines.push(`### ${index + 1}. [${item.title}](${url})`);
    if (item.contentType) {
      lines.push(`- **Classification:** ${item.contentType}`);
    }
    if (item.versionNumber) {
      lines.push(`- **Edition:** v${item.versionNumber}`);
    }
    if (item.publishedAt) {
      lines.push(`- **Recorded:** ${item.publishedAt}`);
    }
    if (item.topics && item.topics.length > 0) {
      const topicSymbols = item.topics
        .map((t) => t.symbol ? `[${t.symbol}] ${t.name || ""}` : t.name)
        .filter(Boolean)
        .join(", ");
      if (topicSymbols) {
        lines.push(`- **Taxonomy:** ${topicSymbols}`);
      }
    }
    if (item.summary) {
      lines.push(`- **Summary:** ${item.summary}`);
    }
    lines.push(`- **Saved to Folio:** ${item.savedAt}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

export function formatBookmarksAsJson(bookmarks: BookmarkItem[]): string {
  return JSON.stringify(bookmarks, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Sync External Store Reactive Hook ──
let cachedBookmarks: BookmarkItem[] = [];
let cachedRaw: string | null = null;

function getBookmarksSnapshot(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = JSON.parse(raw);
      cachedBookmarks = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    cachedBookmarks = [];
  }
  return cachedBookmarks;
}

const SERVER_SNAPSHOT: BookmarkItem[] = [];
function getServerSnapshot(): BookmarkItem[] {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === BOOKMARKS_STORAGE_KEY || event.key === null) {
      cachedRaw = null;
      callback();
    }
  };

  const handleCustom = () => {
    cachedRaw = null;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(BOOKMARKS_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(BOOKMARKS_EVENT, handleCustom);
  };
}

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(
    subscribe,
    getBookmarksSnapshot,
    getServerSnapshot
  );

  return {
    bookmarks,
    count: bookmarks.length,
    isBookmarked: (slug: string) => bookmarks.some((b) => b.slug === slug),
    saveBookmark: (item: Omit<BookmarkItem, "savedAt">) => saveBookmark(item),
    removeBookmark: (slug: string) => removeBookmark(slug),
    toggleBookmark: (item: Omit<BookmarkItem, "savedAt">) => toggleBookmark(item),
    clearAllBookmarks: () => clearAllBookmarks(),
    exportAsMarkdown: () => {
      const dateStr = new Date().toISOString().split("T")[0];
      const md = formatBookmarksAsMarkdown(bookmarks);
      downloadFile(md, `olivers-reading-folio-${dateStr}.md`, "text/markdown;charset=utf-8");
    },
    exportAsJson: () => {
      const dateStr = new Date().toISOString().split("T")[0];
      const json = formatBookmarksAsJson(bookmarks);
      downloadFile(json, `olivers-reading-folio-${dateStr}.json`, "application/json;charset=utf-8");
    },
  };
}
