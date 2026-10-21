# Backlog & Ideas

Unordered scratchpad for prospective tasks and ideas. Items here can be considered, expanded, or discarded freely before any architectural decisions are formalized into [DECISIONLOG.md](file:///home/magne/biotech-knowledge-blog/DECISIONLOG.md).

> **Reference Designs:** Analyzed from the client's sketches and mockups in [.files/](file:///home/magne/biotech-knowledge-blog/.files):
> - **Landing Page:** [Wireframe sketch](file:///home/magne/biotech-knowledge-blog/.files/19850915-512c-4279-b0fa-3f4b02d22a4d.jpg) & [High-fidelity render](file:///home/magne/biotech-knowledge-blog/.files/b08bf2a6-135d-4773-91f8-07ad9c0e1853.jpg)
> - **Article Detail Page:** [Wireframe sketch](file:///home/magne/biotech-knowledge-blog/.files/f35b1047-a9bb-4021-acf4-653b8af0a1d0.jpg) & [High-fidelity render](file:///home/magne/biotech-knowledge-blog/.files/e7f00038-126b-4444-a626-7c9be679f91b.jpg)
>
> *Note on Content:* The naval theme ("Big Boats", tall ships, ocean voyages) in the mockups is client placeholder copy. Real content will focus on biotech, cancer research protocols, lab guides, equipment, and research notes.

---

## 1. Reusable Component Set & Visual System

- [ ] **Core Victorian Component Kit**
  - Extract and standardize the recurring ornate visual elements from the drawings into a reusable component library:
    - **Cards & Containers:** Featured hero cards, tarot/portrait category cards, media cards, article feed rows, and sidebar download boxes.
    - **Borders & Frames:** Ornate copperplate border boxes, corner flourishes, and decorative header banners.
    - **Rules & Dividers:** Etched separator lines with 4-point star ornaments (`✦`), diamond indicators, and section breaks.
    - **Buttons & Pills:** Ornate action buttons with arrows, periodic-table style category pills (`[ CA ]`, `[ Te ]`, etc.).

- [ ] **Organic Hand-Drawn Variance (Simple Modulo / CSS Cycling)**
  - Provide ~5 subtle hand-drawn/engraved variations for recurring small elements (arrows `→`, bullets `◆`, corner accents, divider flourishes).
  - Implementation approach: Keep it dead simple with minimal code—use simple index looping (`variants[index % 5]`) or pure CSS `:nth-child(5n + x)` selectors.
  - Zero complex hashing, zero external libraries, and completely immune to SSR hydration mismatches.

- [ ] **SVG Symbol Sprite Sheet (`/sprites.svg`)**
  - Consolidate icons, arrows, and small etched vignettes into a single master SVG sprite sheet (`<svg><symbol id="arrow-1">...</symbol></svg>`).
  - Reference anywhere via `<svg><use href="/sprites.svg#arrow-1" /></svg>`.
  - Solves the McMaster-Carr goal cleanly:
    - Exactly 1 cached HTTP GET request shared across the entire site and across page navigations.
    - Eliminates micro-asset network roundtrips and asset loading flicker.
    - Vectors scale cleanly to any resolution without pixelation and inherit ink color via CSS `currentColor`.

---

## 2. Global Shell, Navigation & Aesthetic Foundations

- [ ] **Paper sheet on warm gray canvas**
  - Render the page as a centered, bordered parchment paper sheet floating over a warm gray desk background with subtle drop-shadows.
  - Maintain the Victorian copperplate etching styling (sepia/ink palette, star ornaments, intricate border frames).

- [ ] **Global Header Navigation**
  - **Logo:** Ornate engraved oval cartouche with "Oliver's Guide to Everything" (and eye insignia from sketch).
  - **Search & Scope:**
    - Wide central search input field `[ 🔍 Search... ]`.
    - Scoped category dropdown filter attached to search (e.g. `[ All ▾ ]` or category filter).
  - **Utility Actions (Top Right):**
    - Home button `[ ⌂ ]`
    - Bookmarks / Saved button `[ 🔖 ]`
    - Settings button `[ ⚙ ]`
    - Vertical rule `|` and `Log in` text link / modal trigger.
  - **Mobile / Hamburger toggle:** Include `[ ☰ ]` button on article/mobile layouts.
  - **Periodic-table category quick pills:**
    - Pill row below search spelling out "CATEGORIES" in chemical/elemental style badges: `[ CA ] [ Te ] [ Go ] [ Ri ] [ Es ] [ Na ] [ Sc ]`.

- [ ] **Global Footer** *(partially done — shared `SiteFooter` in root layout)*
  - [x] Thin rule with a centered four-point star ornament `✦`.
  - [x] Site name + copyright line (`Oliver's Guide To Everything · © YEAR`).
  - [x] `Contact` → `mailto:` from `homePage.contactEmail` in Sanity (hidden if empty).
  - [ ] Add remaining links as their pages/auth land: `Register | Log in | QnA | About`.

---

## 3. Landing / Home Page Components

- [ ] **Dual Featured Cards Grid (Hero Section)**
  - Two-column cards with ornate engraved border frames and decorative corner flourishes:
    - Card 1: `[ New ]` badge, title, excerpt, `[ Read Article → ]` action, and matching detailed copperplate etching illustration.
    - Card 2: `[ Featured Guide ]` badge, title, excerpt, `[ Explore Guide → ]` action, and scholarly etching.

- [ ] **"Popular Categories" Carousel**
  - Section heading: `✦ Popular Categories ────` with right-aligned `[ View All → ]`.
  - Horizontal card slider with prev/next buttons (`<` and `>`) and pagination indicator dots (`● ○ ○`).
  - Tarot / portrait-style framed category cards with circular engraved vignettes:
    - Protocols (Erlenmeyer flask)
    - Reagents (Apothecary chemical bottle)
    - Equipment (Vintage microscope)
    - Animals (Laboratory rat / rabbit)
    - Data & Analysis (Bar chart)
    - Guides (Open leather-bound book)

- [ ] **Mid-Page Decorative Motto Banner**
  - Full-width etched landscape banner (mountains/forest on left, celestial globe/foliage on right).
  - Headline: *"Knowledge for a More Curious World"*.
  - Subtitle: *"Practical guides, clear explanations, and real-world knowledge for curious minds everywhere."*

- [ ] **"Popular Media" Carousel**
  - Section heading: `✦ Popular Media ────` with `[ View All → ]`.
  - Horizontal slider with `<` and `>` controls and pagination dots.
  - Platform cards with vintage engraving paired with modern platform badges:
    - **YouTube:** Vintage movie projector etching, YouTube badge, channel summary, and `[ Watch on YouTube → ]` link.
    - **TikTok:** Etched smartphone with botanical specimen, TikTok badge, summary, and `[ Follow on TikTok → ]` link.
    - **LinkedIn:** Scholarly book stack etching, LinkedIn badge, summary, and `[ Connect on LinkedIn → ]` link.

- [ ] **"New" (Recent Articles & Guides) Feed**
  - Section heading: `✦ New ────` with `[ View All → ]`.
  - Compact row items featuring:
    - Etched square thumbnail.
    - Title and single-line summary.
    - Content type badge (e.g. `[ 📄 Article ]` or `[ 📄 Guide ]`).
    - Publication date.
    - Chevron `>` indicating navigation.

---

## 4. Article / Protocol Detail Page Architecture

- [ ] **Three-Column Asymmetric Article Layout**
  - Left column: Collapsible Table of Contents.
  - Center column: Main article body text.
  - Right column: Downloadable PDFs box + inline figure callouts.

- [ ] **Left Sidebar: Interactive Table of Contents ("Contents")**
  - Header: `Contents` with an interactive `[ Hide ]` / `[ Show ]` collapse button.
  - Section links with diamond bullets (e.g., `◆ Overview`, `◆ Protocol Steps`, `◆ Materials & Reagents`, `◆ Troubleshooting`).
  - Active section indicator with highlighted parchment background fill.
  - Faint antique copperplate watermark etched into the left margin.

- [ ] **Main Article Typography & Metadata**
  - Header: Large serif title, content type subtitle (`Protocol` / `Research Note`), star ornament dividers.
  - Lead abstract blockquote / intro text.
  - Section headers with star divider rules.
  - Drop caps, justified text, and academic journal formatting.

- [ ] **In-Text Interactive Annotations & Margin Callouts**
  - From sketch: Dotted underline or hover target on key terms/entities.
  - Popover / hovercard with extra definition, protocol note, or biographical details.
  - Margin callout figure with an engraved image, caption box, and a leader line pointing back to the text mention.

- [ ] **"Selected Images" Gallery**
  - Section title: `Selected images ✦`.
  - 3-column responsive grid of framed historical/scientific illustrations with captions underneath.

- [ ] **Right Sidebar: Downloadable "PDFs" Card**
  - Framed ornate container titled `PDFs`.
  - Item list displaying:
    - Document icon `[ 📄 ]`
    - Document title (e.g., `Protocol Summary`, `Complete Reagent Sheet`)
    - File format and size subtitle (e.g., `PDF • 2.4 MB`)
    - Download action icon button `[ 📥 ]`

---

## 5. Bibliography, Citations & Architecture Implications

- [ ] **BibTeX / EndNote import & APA citation rendering**
  - End-of-article `References ✦` section rendering numbered APA citations:
    - Format: `1. Author, A. A. (Year). Title of article. Journal Title, volume(issue), page numbers.`
  - In-text citation hot-swapping:
    - SSR / build-time pipeline to match citations in Portable Text.
    - Transform text citations into interactive jump links pointing down to the corresponding `References` item or opening a preview tooltip.
  - Bibliography ingestion pipeline for BibTeX and EndNote exports.
  - Storage: Sanity schema reference/entity vs. pre-rendered static assets.
  - *Architectural consequence:* Requires reviewing Decision 004/006 to move from static export (`output: "export"`) to dynamic SSR on Cloudflare Workers (e.g. `@opennextjs/cloudflare`).

---

## 6. Memberships, Bookmarks & Monetization (Gating)

- [ ] **Authentication & User Shell Integration**
  - Wireframe & mockup specify `Log in` (top nav & footer) and `Register` (footer).
  - Bookmark ribbon icon `[ 🔖 ]` in top nav suggests saving/favoriting articles and protocols.
  - Profile / settings icon `[ ⚙ ]` in top nav for member preferences.

- [ ] **Access Gating & Document Purchases**
  - Restricted access for select community members or paying customers.
  - Paywall or restricted download gating on select PDFs or specialized protocol pages.
