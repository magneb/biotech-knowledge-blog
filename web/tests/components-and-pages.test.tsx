import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockSanityFetch, mockNotFound } = vi.hoisted(() => {
  const fetchFn = vi.fn();
  return {
    mockFetch: fetchFn,
    mockSanityFetch: vi.fn(async (...args: unknown[]) => ({
      data: await fetchFn(...args),
      sourceMap: null,
      tags: [],
    })),
    mockNotFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  };
});

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: mockFetch,
    config: () => ({ projectId: "9bx84ykf", dataset: "production" }),
  },
}));

vi.mock("@/sanity/live", () => ({
  sanityFetch: mockSanityFetch,
  SanityLive: () => null,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

import { HandDrawnArrow, Icon } from "@/components/ui/Icon";
import { HomeCarousel } from "@/components/HomeCarousel";
import SiteFooter from "@/components/SiteFooter";
import HomePage from "@/app/page";
import ArticlePage, { generateStaticParams } from "@/app/[slug]/page";
import { formatCategory, formatDate } from "@/lib/format";
import {
  buildSanityImageUrl,
  getArticleEtching,
  getChapterVignette,
  getMediaVignette,
} from "@/sanity/image";

describe("Formatting Utilities (format.ts)", () => {
  it("formats hyphenated categories into Title Case", () => {
    expect(formatCategory("research-note")).toBe("Research Note");
    expect(formatCategory("literature-review")).toBe("Literature Review");
    expect(formatCategory("protocol")).toBe("Protocol");
  });

  it("formats ISO dates deterministically in UTC", () => {
    expect(formatDate("2026-10-22T12:00:00Z", "short")).toBe("Oct 22, 2026");
    expect(formatDate("2026-10-22T12:00:00Z", "long")).toBe("October 22, 2026");
  });
});

describe("Victorian Icon & HandDrawnArrow Components", () => {
  it("renders an SVG referencing /sprites.svg#<name>", () => {
    const { container } = render(
      <Icon name="star-four" size={24} className="custom-star" />
    );
    const svg = container.querySelector("svg");
    const useEl = container.querySelector("use");

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("class")).toContain("icon-star-four");
    expect(svg?.getAttribute("class")).toContain("custom-star");
    expect(useEl?.getAttribute("href")).toBe("/sprites.svg#star-four");
  });

  it("rotates HandDrawnArrow across variants 1..5 based on index or explicit variant", () => {
    for (let i = 0; i < 10; i++) {
      const { container } = render(<HandDrawnArrow index={i} />);
      const useEl = container.querySelector("use");
      const expectedVariant = (i % 5) + 1;
      expect(useEl?.getAttribute("href")).toBe(
        `/sprites.svg#arrow-right-${expectedVariant}`
      );
    }

    const { container: explicit } = render(<HandDrawnArrow variant={4} />);
    expect(explicit.querySelector("use")?.getAttribute("href")).toBe(
      "/sprites.svg#arrow-right-4"
    );
  });
});

describe("SiteFooter Server Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders mailto link when contactEmail is configured in Sanity", async () => {
    mockFetch.mockResolvedValueOnce({ contactEmail: "oliver@example.org" });
    const ui = await SiteFooter();
    const { container, getByText } = render(ui);

    const link = getByText("Contact") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("mailto:oliver@example.org");
    expect(getByText("Table of Contents")).toBeDefined();
    expect(getByText("Register")).toBeDefined();
    expect(getByText("QnA")).toBeDefined();
    expect(getByText("About")).toBeDefined();
    expect(container.textContent).toContain("Oliver’s Guide To Everything");
  });

  it("renders Victorian navigation links and omits contact link when contactEmail is null or empty", async () => {
    mockFetch.mockResolvedValueOnce({ contactEmail: null });
    const ui = await SiteFooter();
    const { container, queryByText, getByText } = render(ui);

    expect(queryByText("Contact")).toBeNull();
    expect(getByText("Table of Contents")).toBeDefined();
    expect(getByText("Register")).toBeDefined();
    expect(container.textContent).toContain("Oliver’s Guide To Everything");
  });
});

describe("HomePage Server Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders fallback heading, tagline, hero cards, categories, motto banner, media channels, and empty state when Sanity has no documents", async () => {
    mockFetch.mockResolvedValueOnce({
      home: null,
      chapters: [],
      articles: [],
    });
    const ui = await HomePage();
    const { container } = render(ui);

    expect(container.querySelector("h1")?.textContent).toBe(
      "Oliver’s Guide To Everything"
    );
    expect(container.textContent).toContain(
      "Biotech & cancer research protocols"
    );
    expect(container.textContent).toContain(
      "Knowledge for a More Curious World"
    );
    expect(container.textContent).toContain("Popular Categories");
    expect(container.textContent).toContain("Popular Media");
    expect(container.textContent).toContain("YouTube");
    expect(container.textContent).toContain("TikTok");
    expect(container.textContent).toContain("LinkedIn");
    expect(container.textContent).toContain(
      "No articles yet — add some in the Studio."
    );
  });

  it("renders custom heading, dual hero cards, chapter tarot cards, motto banner, media channels, and chronicle feed", async () => {
    mockFetch.mockResolvedValueOnce({
      home: {
        heading: "Custom Compendium",
        subheading: "Oncology & Assay Protocols",
        intro: null,
        logo: null,
        mottoBanner: "Scientia Vincere Tenebras",
        featuredArticles: [
          {
            _id: "art-2",
            title: "Western Blot Troubleshooting",
            slug: { current: "western-blot" },
            summary: "Resolving high background and faint bands.",
            contentType: "guide",
            publishedAt: "2026-10-21T00:00:00Z",
          },
        ],
        mediaChannels: [
          {
            _key: "m1",
            platform: "youtube",
            title: "Oliver Lab YouTube",
            description: "Bench microscopy dispatches.",
            url: "https://youtube.com/@oliverlab",
          },
        ],
      },
      chapters: [
        {
          _id: "ch-1",
          title: "Optical Microscopy",
          number: 1,
          slug: { current: "optical-microscopy" },
          summary: "Compound lenses and specimen illumination.",
          vignette: null,
        },
      ],
      articles: [
        {
          _id: "art-1",
          title: "CRISPR-Cas9 Knockout Protocol",
          slug: { current: "crispr-knockout" },
          summary: "Step-by-step guide for mammalian cell lines.",
          contentType: "protocol",
          publishedAt: "2026-10-20T00:00:00Z",
          topics: [
            {
              _id: "t-1",
              name: "Genomics",
              symbol: "Ge",
              slug: { current: "genomics" },
            },
          ],
        },
        {
          _id: "art-2",
          title: "Western Blot Troubleshooting",
          slug: { current: "western-blot" },
          summary: "Resolving high background and faint bands.",
          contentType: "research-note",
          publishedAt: "2026-10-21T00:00:00Z",
          topics: [],
        },
      ],
    });

    const ui = await HomePage();
    const { container } = render(ui);

    expect(container.querySelector("h1")?.textContent).toBe(
      "Custom Compendium"
    );
    expect(container.textContent).toContain("Scientia Vincere Tenebras");
    expect(container.textContent).toContain("Optical Microscopy");
    expect(container.textContent).toContain("Oliver Lab YouTube");

    const cards = container.querySelectorAll("a.article-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("href")).toBe("/crispr-knockout");
    expect(cards[0].textContent).toContain("Protocol");
    expect(cards[0].textContent).toContain("Oct 20, 2026");
    expect(cards[1].getAttribute("href")).toBe("/western-blot");
    expect(cards[1].textContent).toContain("Research Note");
  });

  it("filters chronicle feed when topic searchParam is provided", async () => {
    mockFetch.mockResolvedValueOnce({
      home: null,
      chapters: [],
      articles: [
        {
          _id: "art-1",
          title: "CRISPR-Cas9 Knockout Protocol",
          slug: { current: "crispr-knockout" },
          summary: "Step-by-step guide for mammalian cell lines.",
          contentType: "protocol",
          publishedAt: "2026-10-20T00:00:00Z",
          topics: [
            {
              _id: "t-1",
              name: "Genomics",
              symbol: "Ge",
              slug: { current: "genomics" },
            },
          ],
        },
        {
          _id: "art-2",
          title: "Western Blot Troubleshooting",
          slug: { current: "western-blot" },
          summary: "Resolving high background and faint bands.",
          contentType: "research-note",
          publishedAt: "2026-10-21T00:00:00Z",
          topics: [],
        },
      ],
    });

    const ui = await HomePage({
      searchParams: Promise.resolve({ topic: "genomics" }),
    });
    const { container } = render(ui);

    expect(container.textContent).toContain("Filtered Inscriptions");
    expect(container.textContent).toContain("[ Ge ] Genomics");
    const cards = container.querySelectorAll("a.article-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("href")).toBe("/crispr-knockout");
  });
});

describe("ArticlePage Server Component & generateStaticParams", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNotFound.mockClear();
  });

  it("returns placeholder [{ slug: '_' }] when no articles exist", async () => {
    mockFetch.mockResolvedValueOnce([]);
    const params = await generateStaticParams();
    expect(params).toEqual([{ slug: "_" }]);
  });

  it("returns article slugs when articles exist", async () => {
    mockFetch.mockResolvedValueOnce([{ slug: "pcr-guide" }]);
    const params = await generateStaticParams();
    expect(params).toEqual([{ slug: "pcr-guide" }]);
  });

  it("calls notFound() when article slug does not exist", async () => {
    mockFetch.mockResolvedValueOnce(null);
    await expect(
      ArticlePage({ params: Promise.resolve({ slug: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("renders article title, formatted contentType, date, and body when found", async () => {
    mockFetch.mockResolvedValueOnce({
      _id: "art-1",
      title: "Flow Cytometry Panel Design",
      contentType: "guide",
      publishedAt: "2026-10-22T00:00:00Z",
      body: [
        {
          _type: "block",
          _key: "b1",
          style: "normal",
          markDefs: [],
          children: [
            {
              _type: "span",
              _key: "s1",
              text: "Fluorophore spillover compensation principles.",
              marks: [],
            },
          ],
        },
      ],
    });

    const ui = await ArticlePage({
      params: Promise.resolve({ slug: "flow-cytometry" }),
    });
    const { container } = render(ui);

    expect(container.querySelector("h1.paper-title")?.textContent).toBe(
      "Flow Cytometry Panel Design"
    );
    expect(container.querySelector(".paper-category")?.textContent).toBe(
      "Guide"
    );
    expect(container.querySelector("time.paper-date")?.textContent).toBe(
      "October 22, 2026"
    );
    expect(container.querySelector(".paper-body")?.textContent).toContain(
      "Fluorophore spillover compensation principles."
    );
  });
});

describe("Sanity Image & Copperplate Etching Helpers (sanity/image.ts)", () => {
  it("resolves chapter vignettes and article etchings with deterministic copperplate fallbacks", () => {
    expect(buildSanityImageUrl(null, { width: 300 })).toBeNull();
    expect(
      buildSanityImageUrl(
        { asset: { url: "/art/chapters/microscopy.svg" } },
        { width: 300 }
      )
    ).toBe("/art/chapters/microscopy.svg");

    const microChapter = getChapterVignette({
      title: "Optical Microscopy",
      number: 1,
    });
    expect(microChapter.src).toBe("/art/chapters/microscopy.svg");

    const reagentArticle = getArticleEtching({
      title: "Buffer Preparation",
      contentType: "protocol",
    });
    expect(reagentArticle.src).toBe("/art/chapters/reagents.svg");

    expect(getMediaVignette("youtube").src).toBe("/art/media/projector.svg");
    expect(getMediaVignette("tiktok").src).toBe("/art/media/pocket-lens.svg");
    expect(getMediaVignette("linkedin").src).toBe(
      "/art/media/leather-folio.svg"
    );
  });
});

describe("HomeCarousel Client Component", () => {
  it("updates active pagination dot when Next/Previous buttons or dots are clicked", () => {
    const { getByLabelText } = render(
      <HomeCarousel ariaLabel="Popular Categories" dotCount={4}>
        <div>Slide Content</div>
      </HomeCarousel>
    );

    const dot1 = getByLabelText("Popular Categories page 1");
    const dot2 = getByLabelText("Popular Categories page 2");
    const nextBtn = getByLabelText("Next Popular Categories");

    expect(dot1.getAttribute("aria-selected")).toBe("true");
    fireEvent.click(nextBtn);
    expect(dot2.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(dot1);
    expect(dot1.getAttribute("aria-selected")).toBe("true");
  });
});
