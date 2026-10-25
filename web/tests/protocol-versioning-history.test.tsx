import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import HistoricalArticlePage, {
  generateMetadata as generateHistoricalMetadata,
  generateStaticParams as generateHistoricalStaticParams,
} from "@/app/[slug]/[version]/page";
import ArticleVersionsPage, {
  generateMetadata as generateVersionsMetadata,
  generateStaticParams as generateVersionsStaticParams,
} from "@/app/[slug]/versions/page";
import {
  VersionHistoryDiffViewer,
  type EditionRecord,
} from "@/components/VersionHistoryDiffViewer";
import { ArticleUtilities } from "@/components/ArticleUtilities";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock sanityFetch
const mockSanityData = {
  article: {
    _id: "art-crispr",
    title: "CRISPR-Cas9 Knockout Protocol",
    slug: "crispr-knockout",
    contentType: "protocol",
    summary: "Standard sgRNA design and ribonucleoprotein transfection.",
    versionNumber: 2,
    publishedAt: "2026-10-25T10:00:00Z",
    versionChangelog: "Updated annealing temperature to 58°C and added DMSO control step.",
    coverEtching: null,
    downloadablePdfs: null,
    chapter: { title: "Gene Editing", slug: "gene-editing", number: 2 },
    topics: [{ name: "CRISPR", symbol: "Cr", slug: "crispr" }],
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "s1",
            _type: "span",
            text: "Incubate sgRNA and Cas9 at 37°C for 30 minutes with DMSO control.",
          },
        ],
      },
    ],
  },
  snapshot: {
    _id: "snap-crispr-v1",
    versionNumber: 1,
    publishedAt: "2026-09-15T08:00:00Z",
    changeSummary: "Initial wet-lab formulation.",
    snapshotTitle: "CRISPR-Cas9 Knockout Protocol (Draft)",
    snapshotContentType: "protocol",
    snapshotSummary: "Initial formulation for sgRNA transfection.",
    snapshotCoverEtching: null,
    snapshotBody: [
      {
        _key: "sb1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "ss1",
            _type: "span",
            text: "Incubate sgRNA and Cas9 at 37°C for 20 minutes.",
          },
        ],
      },
    ],
  },
  snapshots: [
    {
      _id: "snap-crispr-v1",
      versionNumber: 1,
      publishedAt: "2026-09-15T08:00:00Z",
      changeSummary: "Initial wet-lab formulation.",
      snapshotTitle: "CRISPR-Cas9 Knockout Protocol (Draft)",
      snapshotContentType: "protocol",
      snapshotSummary: "Initial formulation for sgRNA transfection.",
      snapshotCoverEtching: null,
      snapshotBody: [
        {
          _key: "sb1",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "ss1",
              _type: "span",
              text: "Incubate sgRNA and Cas9 at 37°C for 20 minutes.",
            },
          ],
        },
      ],
    },
  ],
  settings: [
    {
      _type: "aboutPage",
      siteTitle: "Oliver's Guide To Everything",
      authorName: "Oliver Bugten",
      canonicalDomain: "https://oliversguidetoeverything.com",
      publisher: "The Victorian Laboratory Press",
    },
  ],
};

vi.mock("@/sanity/live", () => ({
  sanityFetch: vi.fn(
    async ({
      query,
      params,
    }: {
      query: string;
      params?: Record<string, unknown>;
    }) => {
    // 1. Static params queries
    if (query.includes("defined(slug.current)") && query.includes('"snapshots":')) {
      return {
        data: [
          {
            slug: "crispr-knockout",
            versionNumber: 2,
            snapshots: [{ versionNumber: 1 }],
          },
        ],
      };
    }
    if (query.includes("defined(slug.current)") && !query.includes('"snapshots":')) {
      return { data: [{ slug: "crispr-knockout" }] };
    }

    // 2. Historical article query (by version number)
    if (params?.versionNumber) {
      return {
        data: {
          article: mockSanityData.article,
          snapshot: params.versionNumber === 1 ? mockSanityData.snapshot : null,
          versionCount: 1,
          settings: mockSanityData.settings,
        },
      };
    }

    // 3. Article versions query
    if (query.includes('"snapshots":') && query.includes('"article":')) {
      return {
        data: {
          article: mockSanityData.article,
          snapshots: mockSanityData.snapshots,
          settings: mockSanityData.settings,
        },
      };
    }

    return { data: null };
  }),
  SanityLive: () => null,
}));

describe("Protocol Versioning History & Archival Pages (WP-8B)", () => {
  describe("Historical Edition Route (/[slug]/v[version]/)", () => {
    it("generates static params for all versions of published articles", async () => {
      const params = await generateHistoricalStaticParams();
      expect(params).toEqual(
        expect.arrayContaining([
          { slug: "crispr-knockout", version: "v1" },
          { slug: "crispr-knockout", version: "v2" },
        ])
      );
    });

    it("generates archival metadata with canonical targeting the live article and Dublin Core", async () => {
      const meta = await generateHistoricalMetadata({
        params: Promise.resolve({ slug: "crispr-knockout", version: "v1" }),
      });

      expect(meta.title).toContain("CRISPR-Cas9 Knockout Protocol (Draft) (Edition v1 Archival Record)");
      expect(meta.alternates?.canonical).toBe(
        "https://oliversguidetoeverything.com/crispr-knockout/"
      );
      expect(meta.other?.["DC.identifier"]).toBe(
        "https://oliversguidetoeverything.com/crispr-knockout/v1/"
      );
      expect(meta.other?.["DC.relation.isVersionOf"]).toBe(
        "https://oliversguidetoeverything.com/crispr-knockout/"
      );
      expect(meta.other?.["DC.type"]).toBe("Text.Protocol.Archival");
    });

    it("renders frozen snapshot data and Store Norske Leksikon archival banner for historical edition (v1)", async () => {
      const jsx = await HistoricalArticlePage({
        params: Promise.resolve({ slug: "crispr-knockout", version: "v1" }),
      });
      const { container } = render(jsx);

      // Verify Archival Alert Banner
      expect(container.textContent).toContain("Archival Edition Record");
      expect(container.textContent).toContain("Version 1");
      expect(container.textContent).toContain("This text is permanently preserved for wet-lab citation fidelity");
      expect(container.textContent).toContain("Return to current active edition (v2)");
      expect(container.textContent).toContain("Changelog Notes: Initial wet-lab formulation.");

      // Verify frozen snapshot content is rendered rather than live content
      expect(container.textContent).toContain("CRISPR-Cas9 Knockout Protocol (Draft)");
      expect(container.textContent).toContain("Incubate sgRNA and Cas9 at 37°C for 20 minutes.");

      // Verify breadcrumb back link
      const backLink = container.querySelector("a[href='/crispr-knockout']");
      expect(backLink).toBeDefined();
    });

    it("gracefully renders active edition when accessing its edition permalink (v2)", async () => {
      const jsx = await HistoricalArticlePage({
        params: Promise.resolve({ slug: "crispr-knockout", version: "v2" }),
      });
      const { container } = render(jsx);

      expect(container.textContent).toContain("Version 2");
      expect(container.textContent).toContain("This is currently the active edition of the treatise");
      expect(container.textContent).toContain("Incubate sgRNA and Cas9 at 37°C for 30 minutes with DMSO control.");
    });

    it("calls notFound when version param is malformed or invalid", async () => {
      await HistoricalArticlePage({
        params: Promise.resolve({ slug: "crispr-knockout", version: "invalid-version" }),
      });
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe("Version History & Timeline Page (/[slug]/versions/)", () => {
    it("generates static params for all articles", async () => {
      const params = await generateVersionsStaticParams();
      expect(params).toEqual([{ slug: "crispr-knockout" }]);
    });

    it("generates history metadata with canonical targeting /[slug]/versions/", async () => {
      const meta = await generateVersionsMetadata({
        params: Promise.resolve({ slug: "crispr-knockout" }),
      });

      expect(meta.title).toContain("Version History & Archival Diffs: CRISPR-Cas9 Knockout Protocol");
      expect(meta.alternates?.canonical).toBe(
        "https://oliversguidetoeverything.com/crispr-knockout/versions/"
      );
    });

    it("renders the edition timeline combining recorded snapshots and active edition", async () => {
      const jsx = await ArticleVersionsPage({
        params: Promise.resolve({ slug: "crispr-knockout" }),
      });
      const { container } = render(jsx);

      expect(container.textContent).toContain("Version History & Archival Diffs");
      expect(container.textContent).toContain("2 Recorded Editions");
      expect(container.textContent).toContain("Edition v2");
      expect(container.textContent).toContain("Current Active");
      expect(container.textContent).toContain("Edition v1");
      expect(container.textContent).toContain("Initial wet-lab formulation.");
      expect(container.textContent).toContain("Updated annealing temperature to 58°C and added DMSO control step.");
    });
  });

  describe("Interactive Visual Diff Viewer (VersionHistoryDiffViewer)", () => {
    const sampleEditions: EditionRecord[] = [
      {
        versionNumber: 2,
        publishedAt: "2026-10-25T10:00:00Z",
        changeSummary: "Added DMSO control and increased incubation time.",
        title: "Protocol (v2)",
        summary: "Summary for version 2.",
        body: [
          {
            _type: "block",
            style: "normal",
            children: [{ text: "Incubate cells with 5% DMSO for 45 minutes." }],
          },
        ],
        isCurrentActive: true,
      },
      {
        versionNumber: 1,
        publishedAt: "2026-09-15T08:00:00Z",
        changeSummary: "Initial version.",
        title: "Protocol (v1)",
        summary: "Summary for version 1.",
        body: [
          {
            _type: "block",
            style: "normal",
            children: [{ text: "Incubate cells for 30 minutes." }],
          },
        ],
        isCurrentActive: false,
      },
    ];

    it("renders timeline list and computes diff metrics between v1 and v2", () => {
      const { container } = render(
        <VersionHistoryDiffViewer
          slug="crispr-knockout"
          author="Oliver Bugten"
          editions={sampleEditions}
        />
      );

      // Verify diff header and metrics
      expect(container.textContent).toContain("Visual Edition Diff (v1 → v2)");
      expect(container.textContent).toContain("words added");
      expect(container.textContent).toContain("words removed");

      // Verify additions and deletions rendered as <ins> and <del>
      const insElements = container.querySelectorAll("ins");
      expect(insElements.length).toBeGreaterThan(0);
      expect(Array.from(insElements).some((el) => el.textContent?.includes("DMSO"))).toBe(true);

      const delElements = container.querySelectorAll("del");
      expect(delElements.length).toBeGreaterThan(0);
      expect(Array.from(delElements).some((el) => el.textContent?.includes("30"))).toBe(true);
    });

    it("toggles between Inline Diff and Side by Side mode", () => {
      const { container } = render(
        <VersionHistoryDiffViewer
          slug="crispr-knockout"
          author="Oliver Bugten"
          editions={sampleEditions}
        />
      );

      const sideBySideBtn = screen.getByRole("button", { name: /side by side/i });
      fireEvent.click(sideBySideBtn);

      expect(container.textContent).toContain("Base: Edition v1");
      expect(container.textContent).toContain("Target: Edition v2");

      const inlineBtn = screen.getByRole("button", { name: /inline diff/i });
      fireEvent.click(inlineBtn);

      expect(container.textContent).not.toContain("Base: Edition v1");
    });

    it("swaps base and target versions when swap button is clicked", () => {
      render(
        <VersionHistoryDiffViewer
          slug="crispr-knockout"
          author="Oliver Bugten"
          editions={sampleEditions}
        />
      );

      const swapBtn = screen.getByLabelText(/swap comparison order/i);
      fireEvent.click(swapBtn);

      expect(screen.getByText(/Visual Edition Diff \(v2 → v1\)/i)).toBeDefined();
    });
  });

  describe("Article Utilities Action Integration", () => {
    it("renders History & Diffs button pointing to /[slug]/versions/", () => {
      const { container } = render(
        <ArticleUtilities
          title="CRISPR Knockout"
          author="Oliver"
          versionNumber={2}
          slug="crispr-knockout"
        />
      );

      const historyLink = container.querySelector("a[href*='versions']");
      expect(historyLink).toBeDefined();
      expect(historyLink?.getAttribute("href")).toContain("/crispr-knockout/versions");
      expect(historyLink?.textContent).toContain("History & Diffs (v2)");
    });
  });
});
