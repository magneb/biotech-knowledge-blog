import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  formatApa7Citation,
  formatBibtexCitation,
  getVersionPermalink,
} from "@/lib/citation";
import { extractTocHeadings, slugifyHeading } from "@/lib/toc";
import { resolveSiteMetadata, DEFAULT_SITE_METADATA } from "@/sanity/siteSettings";
import { ArticleToc } from "@/components/ArticleToc";
import { ArticleClientLayout } from "@/components/ArticleClientLayout";
import { CitationModal } from "@/components/CitationModal";
import { PrintHeader, PrintFooter } from "@/components/PrintFolio";
import { ArticleUtilities } from "@/components/ArticleUtilities";
import { scholarlyPortableTextComponents } from "@/components/PortableTextComponents";
import { PortableText } from "next-sanity";
import { generateMetadata } from "@/app/[slug]/page";

// Mock sanityFetch for generateMetadata
vi.mock("@/sanity/live", () => ({
  sanityFetch: vi.fn(async () => ({
    data: {
      _id: "art-1",
      title: "Flow Cytometry Panel Design",
      slug: "flow-cytometry",
      contentType: "protocol",
      summary: "Principles of 12-color fluorophore panel selection.",
      versionNumber: 2,
      publishedAt: "2026-10-24T12:00:00Z",
      coverEtching: null,
      downloadablePdfs: null,
      chapter: { title: "Cytometry", slug: "cytometry", number: 4 },
      topics: [{ name: "Immunology", symbol: "Im", slug: "immunology" }],
      body: [],
    },
    sourceMap: null,
    tags: [],
  })),
  SanityLive: () => null,
}));

describe("Citation & Archival Permalink Utilities (lib/citation.ts)", () => {
  it("generates persistent edition permalinks in /[slug]/v{N}/ format", () => {
    expect(getVersionPermalink("crispr-cas9", 1)).toBe(
      "https://oliversguide.com/crispr-cas9/v1/"
    );
    expect(getVersionPermalink("flow-cytometry", 3)).toBe(
      "https://oliversguide.com/flow-cytometry/v3/"
    );
    // Defaults to v1 if version is missing or 0
    expect(getVersionPermalink("western-blot", 0)).toBe(
      "https://oliversguide.com/western-blot/v1/"
    );
  });

  it("formats APA 7th Edition citation citing the persistent edition URL", () => {
    const citation = formatApa7Citation({
      title: "Polymerase Chain Reaction Protocol",
      author: "Oliver",
      publishedAt: "2026-10-25T10:00:00Z",
      versionNumber: 2,
      slug: "pcr-protocol",
    });

    expect(citation).toBe(
      "Oliver. (2026, October 25). Polymerase Chain Reaction Protocol (Version 2). In Oliver's Guide To Everything. https://oliversguide.com/pcr-protocol/v2/"
    );
  });

  it("formats BibTeX entry for academic LaTeX users", () => {
    const bibtex = formatBibtexCitation({
      title: "Polymerase Chain Reaction Protocol",
      author: "Oliver",
      publishedAt: "2026-10-25T10:00:00Z",
      versionNumber: 2,
      slug: "pcr-protocol",
    });

    expect(bibtex).toContain("@misc{oliver2026pcrprotocol,");
    expect(bibtex).toContain("title        = {Polymerase Chain Reaction Protocol (Version 2)},");
    expect(bibtex).toContain("howpublished = {Oliver's Guide To Everything},");
    expect(bibtex).toContain("url          = {https://oliversguide.com/pcr-protocol/v2/},");
  });
});

describe("Metadata Settings Resolution (sanity/siteSettings.ts)", () => {
  it("falls back to default metadata when settings array is empty or undefined", () => {
    expect(resolveSiteMetadata(null)).toEqual(DEFAULT_SITE_METADATA);
    expect(resolveSiteMetadata([])).toEqual(DEFAULT_SITE_METADATA);
  });

  it("extracts custom metadata fields configured in homePage", () => {
    const settings = [
      {
        _type: "homePage",
        siteTitle: "Oliver's Bio-Archive",
        authorName: "Oliver Bugten, M.Sc.",
        authorAffiliation: "Laboratory of Experimental Oncology",
        publisher: "The Victorian Press",
        siteDescription: "Peer-reviewed cancer protocols.",
        canonicalDomain: "https://protocols.oliver.bio",
      },
    ];

    const resolved = resolveSiteMetadata(settings);
    expect(resolved.siteTitle).toBe("Oliver's Bio-Archive");
    expect(resolved.authorName).toBe("Oliver Bugten, M.Sc.");
    expect(resolved.authorAffiliation).toBe("Laboratory of Experimental Oncology");
    expect(resolved.publisher).toBe("The Victorian Press");
    expect(resolved.canonicalDomain).toBe("https://protocols.oliver.bio");
  });

  it("prioritizes aboutPage settings when present over homePage", () => {
    const settings = [
      {
        _type: "homePage",
        authorName: "Oliver",
        siteTitle: "Oliver's Guide",
      },
      {
        _type: "aboutPage",
        authorName: "Dr. Oliver",
        siteTitle: "Oliver's Definitive Treatise",
      },
    ];

    const resolved = resolveSiteMetadata(settings);
    expect(resolved.authorName).toBe("Dr. Oliver");
    expect(resolved.siteTitle).toBe("Oliver's Definitive Treatise");
  });
});

describe("Table of Contents Utilities (lib/toc.ts)", () => {
  it("slugifies heading titles into clean URL anchors", () => {
    expect(slugifyHeading("Reagents & Apparatus Formulation")).toBe(
      "reagents-apparatus-formulation"
    );
    expect(slugifyHeading("Step 1: Cell Lysis (4°C)")).toBe(
      "step-1-cell-lysis-4c"
    );
  });

  it("extracts h2 and h3 headings with deterministic unique IDs", () => {
    const sampleBody = [
      {
        _type: "block",
        style: "h2",
        children: [{ text: "Preparation of Buffers" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [{ text: "Normal paragraph text here." }],
      },
      {
        _type: "block",
        style: "h3",
        children: [{ text: "Lysis Buffer Preparation" }],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ text: "Preparation of Buffers" }], // Duplicate heading
      },
    ];

    const headings = extractTocHeadings(sampleBody);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({
      id: "preparation-of-buffers",
      text: "Preparation of Buffers",
      level: 2,
    });
    expect(headings[1]).toEqual({
      id: "lysis-buffer-preparation",
      text: "Lysis Buffer Preparation",
      level: 3,
    });
    // Duplicate title receives disambiguating suffix
    expect(headings[2]).toEqual({
      id: "preparation-of-buffers-1",
      text: "Preparation of Buffers",
      level: 2,
    });
  });
});

describe("Dublin Core & Google Scholar Metadata (generateMetadata)", () => {
  it("injects DC.* and citation_* tags targeting persistent edition URLs", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "flow-cytometry" }),
    });

    expect(meta.title).toBe(
      "Flow Cytometry Panel Design (Edition v2) — Oliver's Guide To Everything"
    );
    expect(meta.description).toBe("Principles of 12-color fluorophore panel selection.");
    expect(meta.alternates?.canonical).toBe("https://oliversguide.com/flow-cytometry/");

    const other = meta.other as Record<string, string>;
    expect(other["DC.title"]).toBe("Flow Cytometry Panel Design");
    expect(other["DC.creator"]).toBe("Oliver");
    expect(other["DC.type"]).toBe("Text.Protocol");
    expect(other["DC.identifier"]).toBe("https://oliversguide.com/flow-cytometry/v2/");
    expect(other["DC.relation.isVersionOf"]).toBe("https://oliversguide.com/flow-cytometry/");
    expect(other["DC.publisher"]).toBe("Oliver's Guide To Everything");

    expect(other["citation_title"]).toBe("Flow Cytometry Panel Design");
    expect(other["citation_author"]).toBe("Oliver");
    expect(other["citation_publication_date"]).toBe("2026-10-24");
    expect(other["citation_journal_title"]).toBe("Oliver's Guide To Everything");
    expect(other["citation_technical_report_number"]).toBe("Version 2");
  });
});

describe("Scholarly UI Components", () => {
  it("renders ArticleToc with navigation items and references link", () => {
    const headings = [
      { id: "intro", text: "Introduction", level: 2 },
      { id: "methods", text: "Experimental Methods", level: 2 },
    ];

    const { container } = render(
      <ArticleToc headings={headings} hasReferences />
    );

    expect(screen.getByText("Contents")).toBeDefined();
    expect(screen.getByText("Introduction")).toBeDefined();
    expect(screen.getByText("Experimental Methods")).toBeDefined();
    expect(screen.getByText("References & Citations")).toBeDefined();
    expect(container.querySelector("a[href='#intro']")).toBeDefined();
    expect(container.querySelector("a[href='#references']")).toBeDefined();
  });

  it("handles ArticleToc collapsible toggle and collapsed trigger", () => {
    const headings = [{ id: "intro", text: "Introduction", level: 2 }];
    const onToggle = vi.fn();

    const { rerender } = render(
      <ArticleToc
        headings={headings}
        isCollapsed={false}
        onToggle={onToggle}
      />
    );

    // Click Hide button
    const hideBtn = screen.getByRole("button", { name: /Hide Table of Contents/i });
    expect(hideBtn).toBeDefined();
    fireEvent.click(hideBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // Rerender as collapsed
    rerender(
      <ArticleToc
        headings={headings}
        isCollapsed={true}
        onToggle={onToggle}
      />
    );

    // Shows collapsed trigger
    const expandBtn = screen.getByRole("button", { name: /Expand Table of Contents/i });
    expect(expandBtn).toBeDefined();
    fireEvent.click(expandBtn);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("renders ArticleClientLayout toggling between expanded and collapsed layout modes", () => {
    const headings = [
      { id: "s1", text: "Section 1", level: 2 },
    ];

    const { container } = render(
      <ArticleClientLayout headings={headings} hasReferences>
        <main>Article Content</main>
      </ArticleClientLayout>
    );

    expect(screen.getByText("Contents")).toBeDefined();
    expect(screen.getByText("Article Content")).toBeDefined();

    // Toggle collapse
    const hideBtn = screen.getByRole("button", { name: /Hide Table of Contents/i });
    fireEvent.click(hideBtn);

    // Collapsed state renders
    expect(screen.getByRole("button", { name: /Expand Table of Contents/i })).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });

  it("renders PrintHeader and PrintFooter with generation date and version", () => {
    const { container } = render(
      <>
        <PrintHeader
          title="Northern Blotting Protocol"
          author="Oliver"
          contentType="protocol"
          publishedAt="2026-10-22T00:00:00Z"
          versionNumber={1}
          slug="northern-blotting"
        />
        <PrintFooter
          title="Northern Blotting Protocol"
          author="Oliver"
          publishedAt="2026-10-22T00:00:00Z"
          versionNumber={1}
          slug="northern-blotting"
        />
      </>
    );

    expect(container.textContent).toContain("Northern Blotting Protocol");
    expect(container.textContent).toContain("Edition v1");
    expect(container.textContent).toContain("Document retrieved & printed on");
    expect(container.textContent).toContain("Official Citation (APA 7th Edition)");
  });

  it("renders CitationModal with APA7, BibTeX, and permalink tabs", () => {
    const { container, rerender } = render(
      <CitationModal
        isOpen={false}
        onClose={vi.fn()}
        title="Centrifugation Guide"
        slug="centrifugation"
        versionNumber={1}
      />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <CitationModal
        isOpen={true}
        onClose={vi.fn()}
        title="Centrifugation Guide"
        slug="centrifugation"
        versionNumber={1}
      />
    );

    expect(screen.getByText("Cite this Protocol")).toBeDefined();
    expect(screen.getByText("APA 7th Edition")).toBeDefined();
    expect(screen.getByText("BibTeX")).toBeDefined();
    expect(screen.getByText("Permanent URL")).toBeDefined();

    // Click BibTeX tab
    fireEvent.click(screen.getByText("BibTeX"));
    expect(container.textContent).toContain("@misc{oliver2026centrifugation");
  });

  it("renders ArticleUtilities with cite button, print button, and PDF list", () => {
    const pdfs = [
      {
        title: "Worksheet 1.1",
        description: "Bench guide for buffer dilution",
        file: { asset: { url: "https://cdn.sanity.io/files/worksheet.pdf" } },
      },
    ];

    render(
      <ArticleUtilities
        title="Western Blotting"
        slug="western-blot"
        versionNumber={2}
        downloadablePdfs={pdfs}
      />
    );

    expect(screen.getByText("Cite Protocol (APA7)")).toBeDefined();
    expect(screen.getByText("Save as PDF Folio")).toBeDefined();
    expect(screen.getByText("Worksheet 1.1")).toBeDefined();
    expect(screen.getByText("Bench guide for buffer dilution")).toBeDefined();
  });
});

describe("Scholarly Portable Text Components", () => {
  it("renders headings with anchor IDs and drop cap on the opening paragraph", () => {
    const sampleContent = [
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "Long introductory text on genetics." }],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Reagents Required" }],
      },
      {
        _type: "block",
        style: "normal",
        markDefs: [
          {
            _key: "m1",
            _type: "internalLink",
            linkType: "resolved",
            doc: { _type: "article", slug: "crispr-cas9", title: "CRISPR-Cas9" },
          },
          {
            _key: "m2",
            _type: "internalLink",
            linkType: "planned",
            plannedTitle: "Western Blot Assay",
          },
        ],
        children: [
          { _type: "span", text: "Refer to " },
          { _type: "span", text: "CRISPR protocol", marks: ["m1"] },
          { _type: "span", text: " and planned " },
          { _type: "span", text: "Western Blot Assay", marks: ["m2"] },
        ],
      },
      {
        _type: "formulaReagents",
        title: "Lysis Reagents",
        items: [{ name: "Tris-HCl", quantity: "50 mM", note: "pH 7.4" }],
      },
    ];

    const { container } = render(
      <PortableText
        value={sampleContent}
        components={scholarlyPortableTextComponents}
      />
    );

    // Drop cap styling applies to first paragraph
    const firstP = container.querySelector(".first-paragraph");
    expect(firstP).toBeDefined();
    expect(firstP?.textContent).toContain("Long introductory text on genetics.");

    // Heading anchor test
    const h2 = container.querySelector("h2#reagents-required");
    expect(h2).toBeDefined();

    // Internal resolved link test
    const resolvedLink = container.querySelector("a[href='/crispr-cas9']");
    expect(resolvedLink?.textContent).toBe("CRISPR protocol");

    // Planned treatise ("Redlink") test
    const plannedSpan = container.querySelector("span[title*='Western Blot Assay']");
    expect(plannedSpan).toBeDefined();
    expect(plannedSpan?.textContent).toContain("Western Blot Assay✦");
    expect(plannedSpan?.getAttribute("title")).toBe(
      "Treatise in preparation: Western Blot Assay"
    );

    // Reagents container test
    expect(container.textContent).toContain("Lysis Reagents");
    expect(container.textContent).toContain("Tris-HCl");
    expect(container.textContent).toContain("50 mM");
  });
});
