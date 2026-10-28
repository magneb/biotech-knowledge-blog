import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

import {
  BOOKMARKS_STORAGE_KEY,
  getStoredBookmarks,
  saveBookmark,
  removeBookmark,
  toggleBookmark,
  clearAllBookmarks,
  isArticleBookmarked,
  formatBookmarksAsMarkdown,
  formatBookmarksAsJson,
  downloadFile,
  type BookmarkItem,
} from "@/lib/bookmarks";
import { BookmarksDrawer } from "@/components/BookmarksDrawer";
import { BookmarkButton } from "@/components/BookmarkButton";
import { HeaderUtilities } from "@/components/HeaderUtilities";
import { ArticleUtilities } from "@/components/ArticleUtilities";

describe("Client-Side Bookmarks Engine (WP-10)", () => {
  const sampleBookmark: Omit<BookmarkItem, "savedAt"> = {
    slug: "agarose-gel-electrophoresis",
    title: "Agarose Gel Electrophoresis Protocol",
    summary: "Standard protocol for separating DNA fragments by molecular size.",
    contentType: "Protocol",
    versionNumber: 2,
    publishedAt: "2026-10-25T12:00:00Z",
    topics: [{ name: "Molecular Biology", symbol: "Mb", slug: "molecular-biology" }],
  };

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("Storage and Mutations", () => {
    it("returns empty array when localStorage is empty or uninitialized", () => {
      expect(getStoredBookmarks()).toEqual([]);
    });

    it("handles corrupted or malformed JSON in localStorage gracefully without throwing", () => {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, "{not-valid-json::");
      expect(getStoredBookmarks()).toEqual([]);
    });

    it("saves a new bookmark item to localStorage and assigns a savedAt timestamp", () => {
      const items = saveBookmark(sampleBookmark);
      expect(items.length).toBe(1);
      expect(items[0].slug).toBe("agarose-gel-electrophoresis");
      expect(items[0].title).toBe("Agarose Gel Electrophoresis Protocol");
      expect(items[0].versionNumber).toBe(2);
      expect(items[0].savedAt).toBeDefined();

      const stored = getStoredBookmarks();
      expect(stored.length).toBe(1);
      expect(stored[0].slug).toBe("agarose-gel-electrophoresis");
    });

    it("prepends new bookmarks to the beginning of the list and updates existing entries", () => {
      saveBookmark(sampleBookmark);
      const secondBookmark: Omit<BookmarkItem, "savedAt"> = {
        slug: "crispr-cas9-targeting",
        title: "CRISPR-Cas9 sgRNA Design",
        contentType: "Guide",
      };
      const items = saveBookmark(secondBookmark);

      expect(items.length).toBe(2);
      expect(items[0].slug).toBe("crispr-cas9-targeting");
      expect(items[1].slug).toBe("agarose-gel-electrophoresis");

      // Updating the first one with new title
      const updated = saveBookmark({
        ...sampleBookmark,
        title: "Updated Electrophoresis Protocol",
      });
      expect(updated.length).toBe(2);
      expect(updated[0].slug).toBe("agarose-gel-electrophoresis");
      expect(updated[0].title).toBe("Updated Electrophoresis Protocol");
    });

    it("removes a bookmark by slug", () => {
      saveBookmark(sampleBookmark);
      expect(getStoredBookmarks().length).toBe(1);

      const items = removeBookmark("agarose-gel-electrophoresis");
      expect(items.length).toBe(0);
      expect(getStoredBookmarks()).toEqual([]);
    });

    it("toggles bookmark presence returning isSaved state and updated list", () => {
      const added = toggleBookmark(sampleBookmark);
      expect(added.isSaved).toBe(true);
      expect(added.items.length).toBe(1);
      expect(isArticleBookmarked("agarose-gel-electrophoresis")).toBe(true);

      const removed = toggleBookmark(sampleBookmark);
      expect(removed.isSaved).toBe(false);
      expect(removed.items.length).toBe(0);
      expect(isArticleBookmarked("agarose-gel-electrophoresis")).toBe(false);
    });

    it("clears all bookmarks completely", () => {
      saveBookmark(sampleBookmark);
      expect(getStoredBookmarks().length).toBe(1);

      clearAllBookmarks();
      expect(getStoredBookmarks()).toEqual([]);
    });
  });

  describe("Export Utilities (Markdown and JSON)", () => {
    it("formats bookmarks as a structured Markdown document with Victorian header", () => {
      const items: BookmarkItem[] = [
        {
          ...sampleBookmark,
          savedAt: "2026-10-28T10:00:00.000Z",
        },
      ];

      const md = formatBookmarksAsMarkdown(items, "https://oliversguidetoeverything.com");
      expect(md).toContain("# Oliver's Guide To Everything — Personal Reading Folio");
      expect(md).toContain("1. [Agarose Gel Electrophoresis Protocol](https://oliversguidetoeverything.com/agarose-gel-electrophoresis)");
      expect(md).toContain("- **Classification:** Protocol");
      expect(md).toContain("- **Edition:** v2");
      expect(md).toContain("- **Taxonomy:** [Mb] Molecular Biology");
      expect(md).toContain("- **Summary:** Standard protocol for separating DNA fragments by molecular size.");
      expect(md).toContain("- **Saved to Folio:** 2026-10-28T10:00:00.000Z");
    });

    it("handles empty bookmarks list in Markdown export gracefully", () => {
      const md = formatBookmarksAsMarkdown([]);
      expect(md).toContain("No protocols currently saved to the reading folio.");
    });

    it("formats bookmarks as clean indented JSON", () => {
      const items: BookmarkItem[] = [
        {
          ...sampleBookmark,
          savedAt: "2026-10-28T10:00:00.000Z",
        },
      ];

      const jsonStr = formatBookmarksAsJson(items);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].slug).toBe("agarose-gel-electrophoresis");
      expect(parsed[0].title).toBe("Agarose Gel Electrophoresis Protocol");
    });

    it("triggers client-side file download via synthetic blob and anchor click", () => {
      const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-blob");
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === "a") {
          el.click = clickMock;
        }
        return el;
      });

      downloadFile("# Sample Markdown", "test.md", "text/markdown");
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test-blob");
    });
  });

  describe("BookmarksDrawer Component", () => {
    it("does not render when isOpen is false", () => {
      const { container } = render(
        <BookmarksDrawer isOpen={false} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders empty state when opened with no saved bookmarks", () => {
      render(<BookmarksDrawer isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole("dialog", { name: /Personal Reading Folio/i })).toBeDefined();
      expect(screen.getByText("Reading Folio")).toBeDefined();
      expect(screen.getByText("Your Folio is Empty")).toBeDefined();
      expect(screen.getByText(/0 Protocols/i)).toBeDefined();
    });

    it("renders saved bookmarks list, edition badge, and action bar when bookmarks exist", () => {
      saveBookmark(sampleBookmark);

      render(<BookmarksDrawer isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText("Agarose Gel Electrophoresis Protocol")).toBeDefined();
      expect(screen.getByText("[Protocol]")).toBeDefined();
      expect(screen.getByText("v2")).toBeDefined();
      expect(screen.getByText("Export MD")).toBeDefined();
      expect(screen.getByText("Export JSON")).toBeDefined();
      expect(screen.getByText("Clear Folio")).toBeDefined();
    });

    it("closes drawer when clicking close button or pressing Escape", () => {
      const onClose = vi.fn();
      render(<BookmarksDrawer isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: /Close reading folio/i }));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("allows removing individual bookmark from drawer", () => {
      saveBookmark(sampleBookmark);

      render(<BookmarksDrawer isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("Agarose Gel Electrophoresis Protocol")).toBeDefined();

      const removeBtn = screen.getByRole("button", {
        name: /Remove Agarose Gel Electrophoresis Protocol from folio/i,
      });
      fireEvent.click(removeBtn);

      expect(screen.queryByText("Agarose Gel Electrophoresis Protocol")).toBeNull();
      expect(getStoredBookmarks().length).toBe(0);
    });

    it("clears all bookmarks when Clear Folio is confirmed", () => {
      saveBookmark(sampleBookmark);
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<BookmarksDrawer isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("Clear Folio"));

      expect(getStoredBookmarks().length).toBe(0);
      expect(screen.getByText("Your Folio is Empty")).toBeDefined();
    });
  });

  describe("BookmarkButton Component", () => {
    it("renders unbookmarked state and toggles to bookmarked on click", () => {
      render(
        <BookmarkButton
          variant="row"
          article={{
            slug: "agarose-gel",
            title: "Agarose Gel Protocol",
          }}
        />
      );

      const button = screen.getByRole("button", { name: /Bookmark Agarose Gel Protocol/i });
      expect(button.getAttribute("aria-pressed")).toBe("false");

      fireEvent.click(button);

      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(isArticleBookmarked("agarose-gel")).toBe(true);
      expect(button.getAttribute("title")).toContain("Remove");
    });

    it("renders header variant with visible label", () => {
      render(
        <BookmarkButton
          variant="header"
          article={{
            slug: "cell-culture",
            title: "Cell Culture Primer",
          }}
        />
      );

      expect(screen.getByText("Bookmark this Guide")).toBeDefined();

      fireEvent.click(screen.getByText("Bookmark this Guide"));
      expect(screen.getByText("Bookmarked in Folio")).toBeDefined();
    });

    it("stops event propagation so parent link is not triggered", () => {
      const parentClickMock = vi.fn();
      render(
        <div onClick={parentClickMock}>
          <BookmarkButton
            variant="row"
            article={{
              slug: "test-slug",
              title: "Test Protocol",
            }}
          />
        </div>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(parentClickMock).not.toHaveBeenCalled();
    });
  });

  describe("HeaderUtilities Integration", () => {
    it("displays badge count on ribbon icon when bookmarks are present and opens drawer on click", () => {
      saveBookmark(sampleBookmark);

      render(<HeaderUtilities />);

      const bookmarkRibbonBtn = screen.getByRole("button", {
        name: /Saved Bookmarks \(1\)/i,
      });
      expect(bookmarkRibbonBtn).toBeDefined();
      expect(screen.getByText("1")).toBeDefined();

      // Click ribbon button opens drawer
      fireEvent.click(bookmarkRibbonBtn);
      expect(screen.getByRole("dialog", { name: /Personal Reading Folio/i })).toBeDefined();
    });
  });

  describe("ArticleUtilities Integration", () => {
    it("reflects active bookmarked state and toggles protocol saving with toast notice", () => {
      render(
        <ArticleUtilities
          title="Western Blotting"
          slug="western-blot"
          versionNumber={1}
        />
      );

      const bookmarkBtn = screen.getByRole("button", { name: /Bookmark Protocol/i });
      expect(bookmarkBtn).toBeDefined();

      fireEvent.click(bookmarkBtn);

      // Successfully saved
      expect(isArticleBookmarked("western-blot")).toBe(true);
      expect(screen.getByText("Protocol Bookmarked")).toBeDefined();
      expect(screen.getByText("Remove from Folio")).toBeDefined();

      // Click again removes it
      fireEvent.click(screen.getByText("Remove from Folio"));
      expect(isArticleBookmarked("western-blot")).toBe(false);
      expect(screen.getByText("Bookmark Removed")).toBeDefined();
    });
  });
});
