# Backlog & Ideas Scratchpad

Unordered scratchpad for raw ideas, notes, and incoming feature requests.

> **Active Work Packages:** All roadmap items analyzed from the client sketches and discussions have been groomed and migrated into scoped, sequenced work packages adhering to Sanity Best Practices. See [BACKLOG.md](file:///home/magne/biotech-knowledge-blog/BACKLOG.md).
>
> Architectural decisions and revisions are documented in [DECISIONLOG.md](file:///home/magne/biotech-knowledge-blog/DECISIONLOG.md).

---

## Reference Designs

Analyzed from the client's sketches and mockups in [.files/](file:///home/magne/biotech-knowledge-blog/.files):
- **Landing Page:** [Wireframe sketch](file:///home/magne/biotech-knowledge-blog/.files/19850915-512c-4279-b0fa-3f4b02d22a4d.jpg) & [High-fidelity render](file:///home/magne/biotech-knowledge-blog/.files/b08bf2a6-135d-4773-91f8-07ad9c0e1853.jpg)
- **Article Detail Page:** [Wireframe sketch](file:///home/magne/biotech-knowledge-blog/.files/f35b1047-a9bb-4021-acf4-653b8af0a1d0.jpg) & [High-fidelity render](file:///home/magne/biotech-knowledge-blog/.files/e7f00038-126b-4444-a626-7c9be679f91b.jpg)

*(Note on Content: The naval theme in the mockups is placeholder copy; real content focuses on biotech protocols, lab guides, equipment, and research notes.)*

---

## Work Package Index (Migrated to [BACKLOG.md](file:///home/magne/biotech-knowledge-blog/BACKLOG.md))

The previously listed items have been consolidated into formal work packages:

- **Component Kit, Hand-Drawn Variance & Sprite Sheet (`/sprites.svg`):** Migrated to **WP-3** & **WP-5**.
- **Parchment on Desk Canvas, Global Header & Navigation:** Migrated to **WP-3** & **WP-6**.
- **Homepage Sections (Hero Cards, Carousels, Motto Banner, Feed):** Migrated to **WP-7**.
- **Article 3-Column Layout, Scroll TOC, Annotations & PDFs:** Migrated to **WP-8**.
- **EndNote / BibTeX Ingestion, Citation Table & APA References:** Migrated to **WP-9**.
- **Cloudflare Workers SSR / OpenNext Runtime & Revalidation:** Migrated to **WP-1** & **WP-2**.
- **Browser-Only Bookmarks Tray:** Migrated to **WP-10**.
- **Word `.docx` Ingestion Tool:** Migrated to **WP-11 (Future)**.
- **Social / Patreon Authentication & Content Gating:** Migrated to **WP-12 (Future)**.

---

## Incoming & Un-scoped Ideas

*(Drop new prospective ideas, raw notes, or exploratory questions here before formalizing into work packages)*

- [x] **Users should be able to generate APA7 citation with persistent link to versioned page (Must Have):** Formalized and incorporated into **WP-8**. Generates copyable APA7 and BibTeX citations targeting immutable version permalinks (`/[slug]/v{N}/`).
- [x] **Page versioning, Store Norske Leksikon model, changelog, and visual diffs (Nice to Have):** Formalized and sequenced as **WP-8B**. Separates minor editorial maintenance (typo fixes, link tweaks) from official scientific edition bumps (`isNewEdition`), preserving immutable snapshots in Sanity Content Lake (`articleVersion`).
- [x] **Links to other pages and unwritten/planned pages:** Formalized into **WP-8**. Portable Text `internalLink` mark supports resolving existing articles/chapters dynamically via GROQ while gracefully displaying "Treatise in preparation" Victorian glyphs for unwritten pages without 404ing.
- [x] **Dublin Core & Academic Crawler Metadata:** Formalized into **WP-8**. Injects Dublin Core (`DC.*`) and Google Scholar (`citation_*`) metadata into `<head>` for scholarly discovery and citation managers (Zotero/Mendeley).
- [x] **PDF Document Generation with Print Dates & Version Numbers:** Formalized into **WP-8**. 2-tier architecture featuring a bespoke Victorian `@media print` Paged-Media CSS engine (Tier 1) injecting print timestamps, version badges, and running folios, with optional Cloudflare Browser Rendering endpoint (Tier 2).
 

- Killswitch. Oliver wants a way to turn on maintinance mode site wide at the press of a button. i want to put this toggle in sanity studio so its less stuff for him to deal with, but i do welcome other ideas. So we want some sort of webhook that flips a KV to change a maintinance flag. Then when that has been published, and the webhook successfully activated, all pages should respond with or redirect to 503

- Forced cache invalidation. I need a way to clear the cache manually from my development environment. and by that i mean all the cache. Additionally i want better settings for cache, making sure nothing is cached more than a week, and that browser cache is not more than an hour. if there is a way to invalidate a users cache i want that too. 

- we need the ability to edit previous versions of the articles. we have a system for adding a new version/edition of articles, but we want a way to edit the old documents in case of spelling mistakes or formatting issues. 

- having the "penned by" on every single page is a bit obtuse. its great that the name is published in the metadata but i want to remove the penned by item. it also complicates the website since its fetched from a different page and cahced by cloudflare. 

- date fields for "recorded on" or the publish date must be editable in sanity studio

- work in progress disclaimer banner. in the top bar there should be a notice that stands out, indicating that the website is a work in progress.

- logos in the banner must be filled out. 