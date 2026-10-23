import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockNotFound } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: mockFetch,
    config: () => ({ projectId: "9bx84ykf", dataset: "production" }),
  },
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import { HandDrawnArrow, Icon } from "@/components/ui/Icon";
import SiteFooter from "@/components/SiteFooter";
import HomePage from "@/app/page";
import ArticlePage, { generateStaticParams } from "@/app/[slug]/page";
import { formatCategory, formatDate } from "@/lib/format";

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
    expect(container.textContent).toContain("Oliver’s Guide To Everything");
  });

  it("omits footer nav when contactEmail is null or empty", async () => {
    mockFetch.mockResolvedValueOnce({ contactEmail: null });
    const ui = await SiteFooter();
    const { container } = render(ui);

    expect(container.querySelector("nav")).toBeNull();
    expect(container.textContent).toContain("Oliver’s Guide To Everything");
  });
});

describe("HomePage Server Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders fallback heading, tagline, and empty state when Sanity has no documents", async () => {
    mockFetch.mockResolvedValueOnce(null).mockResolvedValueOnce([]);
    const ui = await HomePage();
    const { container } = render(ui);

    expect(container.querySelector("h1")?.textContent).toBe(
      "Oliver’s Guide To Everything"
    );
    expect(container.textContent).toContain(
      "Biotech & cancer research protocols"
    );
    expect(container.textContent).toContain(
      "No articles yet — add some in the Studio."
    );
  });

  it("renders custom heading and article cards with rotating arrows", async () => {
    mockFetch
      .mockResolvedValueOnce({
        heading: "Custom Compendium",
        subheading: "Oncology & Assay Protocols",
        intro: null,
        logo: null,
      })
      .mockResolvedValueOnce([
        {
          _id: "art-1",
          title: "CRISPR-Cas9 Knockout Protocol",
          slug: { current: "crispr-knockout" },
          summary: "Step-by-step guide for mammalian cell lines.",
          category: "protocol",
          publishedAt: "2026-10-20T00:00:00Z",
        },
        {
          _id: "art-2",
          title: "Western Blot Troubleshooting",
          slug: { current: "western-blot" },
          summary: "Resolving high background and faint bands.",
          category: "research-note",
          publishedAt: "2026-10-21T00:00:00Z",
        },
      ]);

    const ui = await HomePage();
    const { container } = render(ui);

    expect(container.querySelector("h1")?.textContent).toBe(
      "Custom Compendium"
    );
    const cards = container.querySelectorAll("a.article-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("href")).toBe("/crispr-knockout");
    expect(cards[0].textContent).toContain("Protocol");
    expect(cards[0].textContent).toContain("Oct 20, 2026");
    expect(cards[1].getAttribute("href")).toBe("/western-blot");
    expect(cards[1].textContent).toContain("Research Note");
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

  it("renders article title, formatted category, date, and body when found", async () => {
    mockFetch.mockResolvedValueOnce({
      _id: "art-1",
      title: "Flow Cytometry Panel Design",
      category: "literature-review",
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
      "Literature Review"
    );
    expect(container.querySelector("time.paper-date")?.textContent).toBe(
      "October 22, 2026"
    );
    expect(container.querySelector(".paper-body")?.textContent).toContain(
      "Fluorophore spillover compensation principles."
    );
  });
});
