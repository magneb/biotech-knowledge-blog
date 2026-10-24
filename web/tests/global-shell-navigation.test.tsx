import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

// Mock sanity live fetch
const mockFetch = vi.fn();
vi.mock("@/sanity/live", () => ({
  sanityFetch: (args: unknown) => mockFetch(args),
  SanityLive: () => null,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => {
    const rest = { ...props };
    delete rest.priority;
    delete rest.unoptimized;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...rest} />;
  },
}));

import { formatRomanNumeral } from "@/lib/format";
import GlobalHeader from "@/components/GlobalHeader";
import { HeaderDrawer } from "@/components/HeaderDrawer";
import { HeaderSearchForm } from "@/components/HeaderSearchForm";
import { HeaderTopicPills } from "@/components/HeaderTopicPills";
import ContentsPage from "@/app/contents/page";
import HomePage from "@/app/page";

describe("Victorian Roman Numeral Utility", () => {
  it("formats integers into Victorian Roman numerals", () => {
    expect(formatRomanNumeral(1)).toBe("I");
    expect(formatRomanNumeral(2)).toBe("II");
    expect(formatRomanNumeral(3)).toBe("III");
    expect(formatRomanNumeral(4)).toBe("IV");
    expect(formatRomanNumeral(5)).toBe("V");
    expect(formatRomanNumeral(8)).toBe("VIII");
    expect(formatRomanNumeral(9)).toBe("IX");
    expect(formatRomanNumeral(10)).toBe("X");
    expect(formatRomanNumeral(14)).toBe("XIV");
    expect(formatRomanNumeral(42)).toBe("XLII");
  });

  it("handles non-positive or invalid numbers gracefully", () => {
    expect(formatRomanNumeral(0)).toBe("0");
    expect(formatRomanNumeral(-5)).toBe("-5");
  });
});

describe("GlobalHeader Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders cartouche logo, drawer button, search form, utilities and elemental pills", async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        topics: [
          { _id: "t1", name: "Calcium", symbol: "Ca", slug: { current: "calcium" } },
          { _id: "t2", name: "Proteins", symbol: "Pr", slug: { current: "proteins" } },
        ],
        chapters: [
          {
            _id: "ch1",
            title: "Microscopy",
            number: 1,
            slug: { current: "microscopy" },
            articles: [
              { _id: "a1", title: "Electron Optics", slug: { current: "electron-optics" }, contentType: "protocol" },
            ],
          },
        ],
      },
    });

    const ui = await GlobalHeader();
    const { container, getByLabelText, getByText } = render(ui);

    // Cartouche logo
    const logoImg = container.querySelector("img[alt=\"Oliver's Guide to Everything\"]");
    expect(logoImg).toBeDefined();

    // Drawer button
    const drawerBtn = getByLabelText("Open Table of Contents navigation drawer");
    expect(drawerBtn).toBeDefined();

    // Search bar & scope
    expect(getByLabelText("Search the compendium")).toBeDefined();
    expect(getByLabelText("Filter search scope")).toBeDefined();

    // Utility shortcuts
    expect(getByText("Log in")).toBeDefined();

    // Topic pills
    expect(getByText("[CA]")).toBeDefined();
    expect(getByText("[PR]")).toBeDefined();
  });
});

describe("HeaderDrawer Client Component", () => {
  const chapters = [
    {
      _id: "ch1",
      title: "Microscopy & Imaging",
      number: 1,
      slug: { current: "microscopy" },
      articles: [
        { _id: "a1", title: "Confocal Fluorescence", slug: { current: "confocal" }, contentType: "protocol" },
      ],
    },
    {
      _id: "ch2",
      title: "Reagents & Buffers",
      number: 2,
      slug: { current: "reagents" },
      articles: [],
    },
  ];

  const topics = [
    { _id: "t1", name: "Calcium", symbol: "Ca", slug: { current: "calcium" } },
  ];

  it("opens modal drawer on button click and displays chapters and articles", () => {
    const { getByLabelText, getByText, queryByRole } = render(
      <HeaderDrawer chapters={chapters} topics={topics} />
    );

    expect(queryByRole("dialog")).toBeNull();

    const trigger = getByLabelText("Open Table of Contents navigation drawer");
    fireEvent.click(trigger);

    expect(queryByRole("dialog")).toBeDefined();
    expect(getByText("Compendium Index")).toBeDefined();
    expect(getByText("Cap. I:")).toBeDefined();
    expect(getByText("Microscopy & Imaging")).toBeDefined();
    expect(getByText("Confocal Fluorescence")).toBeDefined();
    expect(getByText("[CA]")).toBeDefined();

    // Close button
    const closeBtn = getByLabelText("Close Table of Contents drawer");
    fireEvent.click(closeBtn);
    expect(queryByRole("dialog")).toBeNull();
  });

  it("closes drawer when pressing Escape", () => {
    const { getByLabelText, queryByRole } = render(
      <HeaderDrawer chapters={chapters} topics={topics} />
    );

    fireEvent.click(getByLabelText("Open Table of Contents navigation drawer"));
    expect(queryByRole("dialog")).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(queryByRole("dialog")).toBeNull();
  });
});

describe("HeaderSearchForm Client Component", () => {
  it("renders search input, scope dropdown and submit button", () => {
    const { getByLabelText, getByRole } = render(<HeaderSearchForm />);
    const input = getByLabelText("Search the compendium") as HTMLInputElement;
    const select = getByLabelText("Filter search scope") as HTMLSelectElement;

    expect(input).toBeDefined();
    expect(input.placeholder).toContain("Search protocols");
    expect(select.value).toBe("all");
    expect(getByRole("search")).toBeDefined();
  });
});

describe("HeaderTopicPills Client Component", () => {
  it("renders elemental taxonomy pills with symbols", () => {
    const topics = [
      { _id: "t1", name: "Calcium Signaling", symbol: "Ca", slug: { current: "calcium-signaling" } },
      { _id: "t2", name: "Immunology", symbol: "Im", slug: { current: "immunology" } },
    ];

    const { getByText } = render(<HeaderTopicPills topics={topics} />);
    expect(getByText("[CA]")).toBeDefined();
    expect(getByText("[IM]")).toBeDefined();
  });
});

describe("ContentsPage Master Table of Contents", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const mockContentsData = {
    chapters: [
      {
        _id: "ch1",
        title: "Cellular Imaging",
        number: 1,
        slug: { current: "cellular-imaging" },
        summary: "Visualizing subcellular structures and dynamics.",
        vignette: {
          asset: { _id: "v1", url: "https://example.com/vignette.png" },
          alt: "Microscope etching",
        },
        articles: [
          {
            _id: "a1",
            title: "Super-Resolution STED Microscopy",
            slug: { current: "super-resolution-sted" },
            contentType: "protocol" as const,
            summary: "A practical step-by-step guide to laser beam alignment.",
            chapterOrder: 1,
            publishedAt: "2026-10-15T12:00:00Z",
            topics: [
              { _id: "t1", name: "Optics", symbol: "Op", slug: { current: "optics" } },
            ],
          },
        ],
      },
      {
        _id: "ch2",
        title: "Spectroscopy Methods",
        number: 2,
        slug: { current: "spectroscopy" },
        summary: "Light absorption and mass detection.",
        vignette: null,
        articles: [],
      },
    ],
    standaloneArticles: [
      {
        _id: "s1",
        title: "Universal Lab Safety Code",
        slug: { current: "lab-safety" },
        contentType: "guide" as const,
        summary: "Fundamental safety protocols across all chemical hoods.",
        publishedAt: "2026-09-01T10:00:00Z",
        topics: [],
      },
    ],
    topics: [
      { _id: "t1", name: "Optics", symbol: "Op", slug: { current: "optics" } },
    ],
  };

  it("renders book chapters, Roman numerals, vignette, and nested articles", async () => {
    mockFetch.mockResolvedValueOnce({ data: mockContentsData });

    const ui = await ContentsPage({});
    const { getByText, container } = render(ui);

    expect(getByText("Master Table of Contents")).toBeDefined();
    expect(getByText("Chapter I")).toBeDefined();
    expect(getByText("Cellular Imaging")).toBeDefined();
    expect(getByText("Super-Resolution STED Microscopy")).toBeDefined();
    expect(getByText("[Protocol]")).toBeDefined();
    expect(getByText("[OP]")).toBeDefined();
    expect(getByText("Chapter II")).toBeDefined();
    expect(getByText("Independent Treatises")).toBeDefined();
    expect(getByText("Universal Lab Safety Code")).toBeDefined();

    // Vignette image
    const vignette = container.querySelector("img[alt='Microscope etching']");
    expect(vignette).toBeDefined();
  });

  it("filters articles by text query param", async () => {
    mockFetch.mockResolvedValueOnce({ data: mockContentsData });

    const ui = await ContentsPage({
      searchParams: Promise.resolve({ q: "STED" }),
    });
    const { getByText, queryByText } = render(ui);

    expect(getByText("Showing results for:")).toBeDefined();
    expect(getByText("Super-Resolution STED Microscopy")).toBeDefined();
    // Standalone article should be filtered out
    expect(queryByText("Universal Lab Safety Code")).toBeNull();
  });

  it("filters articles by topic param", async () => {
    mockFetch.mockResolvedValueOnce({ data: mockContentsData });

    const ui = await ContentsPage({
      searchParams: Promise.resolve({ topic: "optics" }),
    });
    const { getByText, queryByText } = render(ui);

    expect(getByText("Super-Resolution STED Microscopy")).toBeDefined();
    expect(queryByText("Universal Lab Safety Code")).toBeNull();
  });

  it("renders empty state when filter matches no inscriptions", async () => {
    mockFetch.mockResolvedValueOnce({ data: mockContentsData });

    const ui = await ContentsPage({
      searchParams: Promise.resolve({ q: "nonexistent keyword xyz" }),
    });
    const { getByText } = render(ui);

    expect(getByText("No Inscriptions Found")).toBeDefined();
    expect(getByText("View Entire Compendium ✕")).toBeDefined();
  });
});

describe("HomePage Topic Filtering", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("filters articles on HomePage when topic param is supplied", async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: { heading: "Oliver's Guide", subheading: "Biotech", intro: null },
      })
      .mockResolvedValueOnce({
        data: [
          {
            _id: "1",
            title: "Article Alpha",
            slug: { current: "article-alpha" },
            contentType: "protocol",
            publishedAt: "2026-10-01",
            topics: [{ _id: "t1", name: "Calcium", symbol: "Ca", slug: { current: "ca" } }],
          },
          {
            _id: "2",
            title: "Article Beta",
            slug: { current: "article-beta" },
            contentType: "guide",
            publishedAt: "2026-10-02",
            topics: [{ _id: "t2", name: "Proteins", symbol: "Pr", slug: { current: "pr" } }],
          },
        ],
      });

    const ui = await HomePage({
      searchParams: Promise.resolve({ topic: "ca" }),
    });
    const { getByText, queryByText } = render(ui);

    expect(getByText("Filtered Inscriptions")).toBeDefined();
    expect(getByText("Article Alpha")).toBeDefined();
    expect(queryByText("Article Beta")).toBeNull();
    expect(getByText("[ Clear Filter ✕ ]")).toBeDefined();
  });
});
