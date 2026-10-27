# Engineering Backlog & Scoped Work Packages

This backlog structures the roadmap for **Oliver's Guide To Everything** into prioritized, self-contained work packages. It reflects the architecture decisions finalized with the Product Owner / Tech Lead and adheres to **Sanity Best Practices** (`.agents/skills/sanity-best-practices/`).

---

## Work Package Matrix & Sequencing

```mermaid
graph TD
    WP1[WP-1: OpenNext SSR & Cloudflare Runtime Baseline] --> WP2[WP-2: Sanity Live, Draft Mode & Data Access Layer]
    WP1 --> WP3[WP-3: Design System, CSS Architecture & Vector Sprite Sheet]
    WP2 --> WP4[WP-4: Content Modeling — Chapters, Articles & Taxonomies]
    WP3 --> WP5[WP-5: Core Victorian Component Kit & Generated Art]
    WP4 --> WP6[WP-6: Global Shell, Navigation & Book Table of Contents]
    WP5 --> WP6
    WP6 --> WP7[WP-7: Home Page Sections & Dynamic Feeds]
    WP6 --> WP8[WP-8: Scholarly Reader, Planned Links, APA7 Citations & PDF Engine]
    WP8 --> WP8B[WP-8B: Store Norske Leksikon Versioning, Snapshot Engine & Visual Diffs]
    WP8B --> WP8C[WP-8C: Cache Policy, Full Revalidation & CLI Purge]
    WP8C --> WP8D[WP-8D: Site Operations Hub, Worker 503 Killswitch & WIP Banner]
    WP8C --> WP8E[WP-8E: Studio Onboarding Ergonomics, Editable Dates & Mutable Snapshots]
    WP8D --> WP8F[WP-8F: Two-Lane Asset Cleanup, Filled Cartouche & Byline Removal]
    WP8E --> WP9[WP-9: Studio Bibliography Pipeline & In-Text Citations]
    WP8F --> WP9
    WP8B --> WP10[WP-10: Client-Side Bookmarks, Local Storage & Utilities]
    WP9 --> WP10
    WP4 -. Future .-> WP11[WP-11: Word .docx Ingestion Tool]
    WP10 -. Future .-> WP12[WP-12: Social / Patreon Auth & Content Gating]
```

---

## Definition of Done (All Work Packages)

Every work package must satisfy the 3-tier verification gate before commit/push:
- **Code / UI / Styles / Sprites:** `npm run check` passes (`tsc --noEmit` + `eslint` across `web` and `studio`, plus Vitest unit and contract tests).
- **Sanity Schemas / GROQ Queries:** `npm run typegen && npm run check` passes (verified by dynamic schema and query sync tests in `web/tests/sanity-schema-sync.test.ts`).
- **Cloudflare / OpenNext / Build / Route Config:** `npm run verify` passes (`npm run check` + full OpenNext Worker build, `wrangler deploy --dry-run`, and live `workerd` HTTP smoke tests).

---

## WP-1: OpenNext SSR, Cloudflare Workers Runtime & Verification Baseline [COMPLETED]
* **Objective:** Establish the hybrid SSR/ISR deployment baseline on Cloudflare Workers using `@opennextjs/cloudflare` and enforce a 3-tier automated testing and pre-push verification pipeline (Decisions 004, 006, 007, 010).
* **Key Motivation:** Enables server-rendered routes and prepares for Draft Mode and webhook revalidation while preventing misconfigured builds or missing Worker bindings from reaching production.
* **Scope:**
  - Complete Next.js 16.4.x + `@opennextjs/cloudflare` + `wrangler.jsonc` baseline (`ASSETS`, `WORKER_SELF_REFERENCE`, `nodejs_compat`, Workers Observability logs & traces).
  - Configure `web/open-next.config.ts` with default `defineCloudflareConfig()` and `config.buildCommand = "npm run build:next"` (preventing build recursion and allowing deploys before KV/D1 provisioning).
  - Guard `initOpenNextCloudflareForDev()` in `web/next.config.ts` for development only.
  - Implement 3-tier verification framework:
    - Tier 1: Static analysis (`tsc` + `eslint` in `web` & `studio`) + OpenNext/Wrangler deployment contract validator (`web/src/lib/deployment-validator.ts`).
    - Tier 2: Vitest unit, component, design-system, and dynamic Sanity schema/TypeGen sync tests (`web/tests/`).
    - Tier 3: Live `workerd` runtime HTTP smoke test & Wrangler dry-run bundle check (`web/scripts/smoke-test-worker.mjs`).
  - Wire `.githooks/pre-push` and root `package.json` verification scripts.
* **Sanity Best Practice Alignment:**
  - Standalone Studio remains decoupled in `studio/`.
  - Next.js build no longer uses `output: "export"`.
* **Acceptance Criteria:**
  - [x] `web` builds cleanly with OpenNext without peer-dependency or recursion errors.
  - [x] `npm run verify` passes all static, unit, contract, dry-run, and live `workerd` HTTP smoke checks.
  - [x] Decision Log updated with documented premises (Decisions 004, 006, 007, 010).

---

## WP-2: Sanity Live, Draft Mode, Edge Cache Bindings & Data Access Layer [COMPLETED]
* **Objective:** Provision Cloudflare KV/D1 edge cache bindings and implement real-time draft preview plus fine-grained on-demand revalidation using `next-sanity` Live Content API.
* **Scope:**
  - **Provision & Bind Cloudflare Edge Cache:**
    - Provision Cloudflare KV namespace (`NEXT_INC_CACHE_KV`) and D1 database (`NEXT_TAG_CACHE_D1`) via Wrangler and add bindings to `web/wrangler.jsonc`.
    - Enable `kvIncrementalCache`, `d1NextTagCache`, `memoryQueue`, and `enableCacheInterception: true` in `web/open-next.config.ts` (validated by `deployment-contract.test.ts`).
    - Configure local secrets in `web/.dev.vars` and production secrets via `wrangler secret put` (`SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`).
  - Create unified Sanity live client: `web/src/sanity/live.ts` using `defineLive`:
    - Setup `sanityFetch` and `<SanityLive />` components.
    - Configure `serverToken` / `browserToken` with environment fallbacks.
  - Add Draft Mode route handler at `web/src/app/api/draft-mode/enable/route.ts` using `defineEnableDraftMode`.
  - Add Draft Mode exit route at `web/src/app/api/draft-mode/disable/route.ts`.
  - Mount `<SanityLive />` and conditional `<VisualEditing />` in `web/src/app/layout.tsx`.
  - Add GROQ webhook endpoint `web/src/app/api/revalidate/route.ts` using `parseBody` from `next-sanity/webhook` to handle instant revalidation on document publish/unpublish.
  - Configure Sanity Presentation Tool in `studio/sanity.config.ts` pointing at front-end preview URL.
  - Add unit and smoke tests covering `/api/revalidate` signature verification and draft-mode routes.
* **Sanity Best Practice Alignment:**
  - Strict data isolation: tokens never leaked into client bundles or `wrangler.jsonc` `vars`.
  - Use `stegaClean` for string fields controlling display logic; enforce `stega: false` for all metadata queries and `generateStaticParams`.
  - Always use `defineQuery` for all GROQ queries to guarantee TypeGen schema typing.
* **Acceptance Criteria:**
  - [x] Editing in Sanity Studio updates the preview iframe in real time.
  - [x] Publishing a document triggers the webhook and invalidates the D1/KV tag cache instantly.
  - [x] Public visitors receive pre-rendered cached pages without server overhead (`enableCacheInterception: true`).
  - [x] `npm run verify` passes with KV and D1 bindings active.

---

## WP-3: Design System, CSS Architecture & Vector Sprite Sheet [COMPLETED]
* **Objective:** Replace Tailwind CSS with a structured, modular Vanilla CSS architecture that enforces the Victorian copperplate etching aesthetic.
* **Scope:**
  - Remove Tailwind dependencies (`@tailwindcss/postcss`, `tailwindcss`, PostCSS config).
  - Establish CSS `@layer` hierarchy: `reset`, `tokens`, `base`, `components`, `utilities`.
  - Create `web/src/styles/tokens.css`:
    - Full antique parchment and ink color scale (`--parchment`, `--parchment-light`, `--ink`, `--sepia-mid`, etc.).
    - Typography tokens (Cormorant Garamond scale, line-heights, tracking).
    - Ornate border variables, drop-shadows, and layout geometry (`--paper-max-width: 1180px`).
  - Create `web/src/styles/base.css`:
    - Centered paper sheet floating over a warm dark desk canvas (`#23201c` / `#2e2a25`).
    - Subtle paper texture, drop-shadows, and double-line engraved outer bevels.
    - Responsive mobile layout collapses desk margin to 0 for edge-to-edge reading.
  - Create master SVG sprite sheet `web/public/sprites.svg`:
    - Victorian ornaments, corner flourishes, four-point stars (`✦`), diamond indicators (`◆`), cartouches, arrows, and emblems.
    - Vector `<symbol>` definitions with `currentColor` inheritance for zero-flicker cached rendering.
    - Reusable `<Icon />` component in `web/src/components/ui/Icon.tsx`.
  - Implement 5-variant CSS selector rotation (`:nth-child(5n + x)`) for subtle natural variance in dividers, bullets, arrows, and cards.
* **Acceptance Criteria:**
  - [x] Clean separation: zero Tailwind in build.
  - [x] All icons and flourishes load from a single cached `/sprites.svg` request.
  - [x] Visual layout renders as a centered parchment sheet over a warm desk background (collapsing to edge-to-edge on mobile).

---

## WP-4: Content Modeling — Chapters, Articles & Taxonomies [COMPLETED]
* **Objective:** Restructure Sanity schemas to model the publication as a scientific book with ordered chapters, out-of-order article publishing, and topic filtering.
* **Scope:**
  - **New Document Type:** `chapter` (`studio/schemaTypes/chapter.ts`):
    - `title` (string, required)
    - `number` (number, required, sorted order)
    - `slug` (slug, source: `title`, required)
    - `summary` (text, 2-3 lines)
    - `vignette` (image with hotspot/crop, etching art)
  - **New Document Type:** `topic` (`studio/schemaTypes/topic.ts`):
    - `name` (string, required)
    - `symbol` (string, 2-letter elemental abbreviation, e.g., `[ Ca ]`, `[ Pr ]`)
    - `slug` (slug, required)
    - `description` (string)
  - **Refactor Document Type:** `article` (`studio/schemaTypes/article.ts`):
    - `contentType`: string list (`article`, `guide`, `protocol`, `research-note`).
    - `chapter`: reference to `chapter` (`type: 'reference', to: [{ type: 'chapter' }]`).
    - `chapterOrder`: number (ordering within chapter).
    - `topics`: array of references to `topic` (`of: [defineArrayMember({ type: 'reference', to: [{ type: 'topic' }] })]`).
    - `featured`: boolean (for landing page showcase).
    - `coverEtching`: image with hotspot & caption.
    - `downloadablePdfs`: array of file objects with title, description, and file asset.
    - `body`: Portable Text with custom block types (figure callouts, annotated terms, formula/reagents).
  - **Refactor Singleton:** `homePage` (`studio/schemaTypes/homePage.ts`):
    - Add references to featured articles, media channels (YouTube, TikTok, LinkedIn), and motto banner copy.
  - **Studio Structure Customization (`studio/src/structure.ts`):**
    - Group by: `Home Page (Singleton)`, `Divider`, `Chapters & Content`, `Topics / Taxonomies`, `Divider`, `Bibliography`.
  - Run `sanity typegen generate` to sync TypeScript definitions into `web/sanity.types.ts`.
* **Sanity Best Practice Alignment:**
  - Schema defines **what content is**, not how it is styled (`references/schema.md`).
  - Use `defineType`, `defineField`, and `defineArrayMember` strictly.
  - Let Sanity generate document `_id`s; enforce singletons purely via Studio structure (`references/studio-structure.md`).
  - No direct video files stored in Sanity assets; links/embeds only.
* **Acceptance Criteria:**
  - [x] Studio displays intuitive navigation with singletons at the top.
  - [x] Articles can be organized under chapters and tagged with elemental topics.
  - [x] Generated TypeScript types accurately reflect all schema changes without manual casting.

---

## WP-5: Core Victorian Component Kit & Generated Art [COMPLETED]
* **Objective:** Build reusable React components with scoped CSS Modules and produce initial copperplate-etched illustrations.
* **Scope:**
  - **Component Library (`web/src/components/ui/`):**
    - `EtchedFrame`: Box container with ornate engraved borders and corner flourishes.
    - `StarDivider`: Horizontal engraved rule with centered 4-point star `✦` or diamond `◆`.
    - `ElementalPill`: Periodic-table category badge (`[ CA ]`, `[ TE ]`) with hover states.
    - `CopperplateButton`: Ornate action button with engraved arrow (`Read Article →`).
    - `EtchedFigure`: Image container with antique caption cartouche and leader lines.
  - **Art Generation Asset Pipeline:**
    - Generate Victorian copperplate etching assets for:
      - Chapter banners (Microscopy, Alchemy/Reagents, Biological Specimens, Lab Apparatus).
      - Media vignettes (Vintage Projector for YouTube, Pocket Lens/Specimen for TikTok, Leather Folio for LinkedIn).
      - Eye insignia and Oliver's Cartouche Logo.
    - Store SVG/PNG assets in `web/public/art/` or upload to Sanity as default vignettes.
* **Acceptance Criteria:**
  - [x] Reusable components styled via CSS Modules without CSS leaks.
  - [x] High-res etching art assets ready and integrated into components.

---

## WP-6: Global Shell, Navigation & Book Table of Contents [COMPLETED]
* **Objective:** Build the global navigation header, elemental quick-filter pill row, and the book-style Master Table of Contents.
* **Scope:**
  - **Global Header (`web/src/components/GlobalHeader.tsx`):**
    - Engraved oval cartouche logo ("Oliver's Guide to Everything").
    - Search input field with attached scope filter.
    - Utility icons: Home (`⌂`), Bookmarks (`🔖`), Settings (`⚙`).
    - Elemental topic pill row (`[ CA ] [ TE ] [ GO ] [ RI ] [ ES ]...`).
  - **Book Index / Table of Contents Page (`web/src/app/contents/page.tsx` or overlay):**
    - Shows all chapters in numbered sequence with Roman numerals and vignettes.
    - Displays published articles nested under their respective chapters.
    - Smooth navigation to article slugs.
    - Standalone treatises section in Appendix.
    - Full search query, scope dropdown, and topic filter support.
  - Update `SiteFooter` with full Victorian rule and responsive navigation links (Register, Table of Contents, Contact, QnA, About).
* **Acceptance Criteria:**
  - [x] Responsive header adapts gracefully to mobile screens with collapsible drawer.
  - [x] Clicking an elemental pill filters articles by that topic on Home and Contents.
  - [x] Book chapters display their nested pages clearly in order.
  - [x] All 3 verification tiers (`npm run check` and `npm run verify`) pass.

---

## WP-7: Home Page Sections & Dynamic Feeds [COMPLETED]
* **Objective:** Assemble the complete Victorian newspaper/journal landing page based on client mockups.
* **Scope:**
  - **Dual Hero Feature Grid:** Two ornate engraved cards showcasing the latest guide and featured protocol.
  - **Popular Categories Carousel / Grid:** Tarot-style portrait cards with circular engraved vignettes.
  - **Mid-Page Decorative Motto Banner:** Full-width etched landscape banner with *"Knowledge for a More Curious World"*.
  - **Popular Media Section:** Vintage etched cards linking to Oliver's YouTube, TikTok, and LinkedIn presence.
  - **"New & Recent" Chronicle Feed:** Compact row feed with etched thumbnails, elemental tags, and publication dates.
* **Sanity Best Practice Alignment:**
  - Data fetched via a single optimized GROQ query using `defineQuery` with field projections.
  - Image URLs built via `@sanity/image-url` specifying exact dimensions, modern WebP/AVIF formats, and automatic quality.
* **Acceptance Criteria:**
  - [x] Matches the aesthetic feel of the high-fidelity mockups in `.files/`.
  - [x] All homepage sections are manageable through the `homePage` singleton document in Sanity Studio.

---

## WP-8: Scholarly 3-Column Reader, Planned Links, APA7 Citations & Paged-Media PDF [COMPLETED]
* **Objective:** Implement the three-column scholarly journal reading layout, dynamic anchor Table of Contents, resilient internal and planned links, visitor-facing APA7/BibTeX citation generator, Dublin Core metadata, and Paged-Media PDF export engine (Decision 015).
* **Scope:**
  - **Left Column:** Sticky collapsible Table of Contents with active heading observer (H2/H3), anchor sanitization with `stegaClean`, and faint copperplate margin watermark.
  - **Center Column (Main Reader):**
    - Drop caps on opening paragraphs (`.drop-cap`).
    - Justified body text with hyphenation controls.
    - Custom Portable Text serializers:
      - Section headings with stable sanitized `id` anchors for the TOC.
      - Scientific figures (`figureCallout`), reagent boxes (`formulaReagents`), and pull-quotes.
      - Annotated scientific terms (`annotatedTerm`).
      - Rich `internalLink` mark component: dynamically links to resolved articles, chapters, and topics via GROQ, or renders Victorian "In prep" flourishes (`Centrifugation✦`) and tooltip for planned treatises without broken links or 404s.
    - Reader footer: "Last updated" timestamp, author attribution, and anchor slot for Store Norske Leksikon version history and references.
  - **Right Column (Scholarly Utilities & Media):**
    - **APA7 / BibTeX Citation Generator & Modal:** `[ 📜 Cite Protocol ]` generating copyable APA 7th Edition citation and BibTeX record targeting the persistent edition URL (`/[slug]/v{N}/`).
    - **Downloadable PDFs widget:** Direct download links for curated Sanity file attachments (`[ 📄 Protocol Summary • 2.4 MB 📥 ]`).
    - **Paged-Media PDF Engine:** `[ ⎙ Save / Export PDF ]` button invoking the Victorian `@media print` CSS engine with `<PrintHeader>` and `<PrintFooter>` blocks injecting print date, version number, canonical URL, and A4 running folios.
    - Sticky floating figure annotations.
  - **Selected Images Gallery:** Multi-column grid of scientific illustrations with engraved borders and captions.
  - **Metadata Engine & Studio Configuration:** Dublin Core (`DC.*`) and Google Scholar (`citation_*`) metadata injection via Next.js `generateMetadata` on `/[slug]`. Configurable from either `homePage` or the new `aboutPage` singleton in Sanity Studio (`resolveSiteMetadata`).
* **Sanity Best Practice Alignment:**
  - Custom Portable Text components pass props safely and preserve `_key` values for click-to-edit.
  - Heading slugs sanitized with `stegaClean` so DOM IDs match Table of Contents anchor links in draft mode.
  - Schema extension: Add `internalLink` mark annotation to `article.body` with dual-mode support (`resolved` reference vs `planned` title).
  - Singletons `homePage` and `aboutPage` provide unified metadata fallback for authors and publishers.
* **Acceptance Criteria:**
  - [x] Table of Contents automatically tracks scroll position.
  - [x] Internal links resolve reliably without breaking on slug changes; planned links display informative hover states.
  - [x] Visitors can copy a valid APA7 citation and BibTeX record citing the article's edition.
  - [x] Printing or saving to PDF produces a clean, paginated scientific document with print timestamp, version number, and no web UI clutter.
  - [x] Dublin Core and Google Scholar meta tags render in page `<head>`.
  - [x] General metadata can be configured by Oliver in Sanity Studio from either the Home Page or About & Author Settings.
  - [x] PDFs are downloadable directly from Sanity asset storage.
  - [x] Typography renders with the elegance of an antique medical journal.

---

## WP-8B: Protocol Versioning History, Snapshot Engine & Visual Diffs (Store Norske Leksikon Model) [COMPLETED]
* **Objective:** Implement full editorial version control, Content Lake snapshot archival, persistent immutable routing (`/[slug]/v{N}/`), and an interactive visual diff viewer based on the Store Norske Leksikon reference model (Decisions 015, 016).
* **Scope:**
  - **Sanity Content Model for Versioning:**
    - New Document Type `articleVersion` (`studio/schemaTypes/articleVersion.ts`):
      - `article`: reference to parent `article`.
      - `versionNumber`: integer (`1, 2, 3...`).
      - `publishedAt`: datetime (immutable timestamp of this edition).
      - `changeSummary`: string (e.g. *"Adjusted annealing temperature; added control step"*).
      - `snapshotTitle`, `snapshotContentType`, `snapshotSummary`, `snapshotCoverEtching`, `snapshotBody` (frozen Portable Text data).
    - Refactor `article` schema (`studio/schemaTypes/article.ts`):
      - Version control fieldset: `versionNumber` (integer), `isNewEdition` (boolean), `versionChangelog` (text).
      - Typo fixes, minor formatting, and link tweaks update in-place without bumping `versionNumber`.
      - Toggling `isNewEdition: true` increments the version number and records a new `articleVersion` snapshot.
  - **Routes & Immutable Archival Pages:**
    - Historical edition route: `web/src/app/[slug]/[version]/page.tsx` (e.g., `/crispr-knockout/v1/`).
    - Archival alert banner on historical versions: *"You are viewing an archival edition (Version 1) of this protocol recorded on [Date]. [Return to current live edition →]"*.
    - Edge Caching: Cloudflare Workers serves historical editions with `Cache-Control: public, max-age=31536000, immutable` in `web/next.config.ts`.
  - **Version History & Visual Diff Viewer (`web/src/app/[slug]/versions/page.tsx` & `VersionHistoryDiffViewer.tsx`):**
    - Timeline listing all historical editions with dates, authors, and changelog notes.
    - Zero-dependency LCS word & block diff engine (`web/src/lib/diff.ts`).
    - Interactive text diff viewer comparing two editions, rendering additions and deletions in copperplate ink and parchment tones with inline and side-by-side modes.
* **Sanity Best Practice Alignment:**
  - Immutable historical documents are first-class Sanity documents queryable via standard GROQ CDN, avoiding native History API rate limits and 30-day retention pruning.
* **Acceptance Criteria:**
  - [x] Oliver can make minor typo edits without triggering version increments.
  - [x] Publishing a new edition creates a permanent snapshot and increments the version.
  - [x] Historical permalinks (`/[slug]/v1/`) render the frozen snapshot reliably with immutable edge caching *(superseded in WP-8C by bounded revalidating caching)*.
  - [x] The visual diff view highlights changes between protocol editions clearly in inline and side-by-side modes.

---

## WP-8C: Deterministic Cache Policy, Full-Graph Revalidation & Manual Cache Purge
* **Objective:** Eliminate stuck edge/browser caches, bound maximum cache lifetime to 7 days (10 minutes in browser), fix cross-document webhook invalidation, and give operators a one-command full-cache nuke (Decisions 007, 015, 016).
* **Key Motivation:** Directly resolves the root cause of the caching incident where 1-year `immutable` headers and partial path revalidation prevented edits and global metadata changes from propagating.
* **Scope:**
  - **HTML & ISR Cache Policy (`web/next.config.ts`):**
    - Remove `Cache-Control: public, max-age=31536000, immutable` from `/:slug/v:version(\\d+)` routes.
    - Configure HTML responses to emit `Cache-Control: public, max-age=600, s-maxage=604800, must-revalidate` (`private, no-store` when Draft Mode is active; hashed `/_next/static/*` assets retain immutable caching).
    - Enforce a 7-day (`604800`s) upper bound on ISR/data caching so no cached entry lives longer than one week.
  - **Full-Graph Webhook Revalidation (`web/src/app/api/revalidate/route.ts`):**
    - On `article` publish/update/unpublish: revalidate `/`, `/contents`, `/${slug}`, `/${slug}/versions`, and all `/${slug}/v{1..versionNumber}` routes (including previous slug on slug changes).
    - On `articleVersion` publish/update/delete: resolve parent `article->slug.current` + `versionNumber` and revalidate `/${slug}/v${versionNumber}` and `/${slug}/versions`.
    - On global singleton (`siteSettings`, `homePage`, `aboutPage`) or taxonomy (`chapter`, `topic`) change: invoke `revalidatePath("/", "layout")` so shared metadata and navigation refresh everywhere.
    - Support an authenticated `{ purgeAll: true }` payload on `/api/revalidate` (verified via `SANITY_REVALIDATE_SECRET` using constant-time Web Crypto comparison).
  - **Developer CLI Cache Purge (`npm run cache:purge`):**
    - Add `web/scripts/purge-cache.mjs` wired to root `package.json`:
      1. Lists and bulk-deletes all keys in `NEXT_INC_CACHE_KV` via Wrangler.
      2. Clears `revalidations` rows in `NEXT_TAG_CACHE_D1` via Wrangler D1 execute.
      3. Triggers `{ purgeAll: true }` against `/api/revalidate` (and calls Cloudflare Zone CDN `purge_everything` if `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` are configured).
* **Sanity & Cloudflare Best Practice Alignment:**
  - Separates short client-side `max-age` (`600`s) from edge `s-maxage` (`604800`s) with `must-revalidate`.
  - Uses constant-time Web Crypto secret comparison (`workers-best-practices`).
* **Acceptance Criteria:**
  - [ ] No HTML route emits `immutable` or browser `max-age > 600`, and no server/edge cache TTL exceeds `604800` (7 days).
  - [ ] Updating an article, archival snapshot, or global singleton invalidates all dependent routes (`/contents`, `/[slug]`, `/[slug]/versions`, `/[slug]/v{N}`).
  - [ ] Running `npm run cache:purge` from the dev environment deterministically wipes KV, D1 tag state, and edge cache.
  - [ ] Unit tests cover `/api/revalidate` path/layout invalidation and `{ purgeAll: true }`; `npm run verify` passes.

---

## WP-8D: Unified Site Operations Hub, Worker 503 Killswitch & Dismissible WIP Banner
* **Objective:** Provide a single "Site Settings & Operations" singleton at the top of Sanity Studio featuring an instant Worker-level `503` Maintenance Mode killswitch, one-click cache purge, and a session-dismissible Work-in-Progress top banner (Decision 018).
* **Key Motivation:** Restores operational confidence with an emergency brake that runs ahead of OpenNext `enableCacheInterception: true` while still allowing editors to preview fixes in Sanity Draft Mode.
* **Scope:**
  - **Unified `siteSettings` Singleton (`studio/schemaTypes/siteSettings.ts` & `studio/src/structure/index.ts`):**
    - Placed #1 at the top of Sanity Studio (`Site Settings & Operations`), organized into clear tabs/fieldsets:
      1. **Operations & Status:** `maintenanceMode` (boolean), `maintenanceTitle` & `maintenanceMessage` (customizable copy), `wipBannerEnabled` (boolean, default `true`), and `wipBannerText` (string).
      2. **Cache Control:** Custom Studio action/pane button (`Purge All Website Caches`) calling `/api/revalidate` with `{ purgeAll: true }`.
      3. **Global Publication & Scholarly Metadata:** Consolidates `siteTitle`, `authorName`, `authorAffiliation`, `publisher`, `siteDescription`, `canonicalDomain`, and `contactEmail`. Update `resolveSiteMetadata` (`web/src/sanity/siteSettings.ts`) to prioritize `siteSettings` with non-breaking fallback to `aboutPage` / `homePage`, and remove duplicate metadata clutter from `homePage` / `aboutPage`.
  - **Outer Cloudflare Worker Killswitch Wrapper (`web/worker.ts`):**
    - Wrap `.open-next/worker.js` so incoming requests evaluate `site:ops:maintenance` in `NEXT_INC_CACHE_KV` **before** OpenNext cache interception runs.
    - **Dual Trigger (Webhook + CLI):** Publishing `siteSettings` updates the KV flag immediately via webhook; `npm run site:maintenance -- on|off` writes the KV key directly via Wrangler so the killswitch works even if Sanity is unreachable.
    - **Styled Victorian `503` Folio & Preview Bypass:** Public page routes receive HTTP `503 Service Unavailable` (`Cache-Control: no-store, must-revalidate`, `Retry-After: 3600`) rendering a self-contained Victorian parchment maintenance notice. Automatically bypasses `/api/revalidate`, `/api/draft-mode/*`, static `/art/*` & `/sprites.svg` assets, and active Next.js Draft Mode preview sessions (`__prerender_bypass`).
    - Update `validateDeploymentConfig` (`web/src/lib/deployment-validator.ts`) and `web/scripts/smoke-test-worker.mjs` to validate the wrapper contract and smoke-test `503` behavior in `workerd`.
  - **Session-Dismissible WIP Top Banner (`web/src/components/WipBanner.tsx`):**
    - High-visibility Victorian notice bar rendered above `GlobalHeader` when `wipBannerEnabled` is true.
    - Dismissible per browser session (`sessionStorage` keyed to a hash of `wipBannerText` so updated notices re-appear), accessible (`role="region"`), and hidden in `@media print` so exported PDFs stay clean.
* **Sanity & Cloudflare Best Practice Alignment:**
  - Enforces singletons strictly via Studio Structure (`S.document().documentId('siteSettings')`) per `sanity-best-practices`.
  - Uses native Worker KV binding directly at the outer fetch handler with zero external REST round-trips (`workers-best-practices`).
* **Acceptance Criteria:**
  - [ ] Toggling Maintenance Mode ON in Studio (or running `npm run site:maintenance -- on`) causes all public routes (including previously cached KV pages) to return `503` with the Victorian maintenance folio.
  - [ ] Sanity Presentation / Draft Mode previews remain accessible to editors while `503` mode is active.
  - [ ] WIP disclaimer banner stands out at the top of the viewport, dismisses cleanly for the session, and is hidden in `@media print`.
  - [ ] `npm run typegen && npm run verify` passes all static, schema-sync, and live `workerd` smoke tests.

---

## WP-8E: Sanity Studio Onboarding Ergonomics, Editable Dates & Mutable Snapshots
* **Objective:** Simplify the Article editing experience in Sanity Studio for Oliver, unlock publication/recording dates, and enable direct editing or deletion of historical `articleVersion` snapshots (Decisions 015, 016).
* **Key Motivation:** Eliminates the dual-snapshot buttons and top-of-form version toggles that tripped up onboarding and prevented fixing dates or typos in past editions.
* **Scope:**
  - **Streamline Article Editor (`studio/schemaTypes/article.ts`):**
    - Organize into three tabs: `Content & Media` (default), `Chapter & Topics`, and `Versioning & Archival`.
    - Move `isNewEdition`, `versionChangelog`, and `versionNumber` into `Versioning & Archival` so authors opening an article immediately see `Title`, `Slug`, `Content Type`, `Published / Recorded Date`, `Summary`, and `Body`.
  - **Consolidate Publish Action (`studio/sanity.config.ts` & `studio/src/actions/publishWithSnapshot.ts`):**
    - Unmount the duplicate `RecordVersionSnapshotAction` so only the unified Publish button exists.
  - **Unlock Editable Dates (`publishedAt`):**
    - Remove `readOnly: true` from `publishedAt` (*"Published / Recorded Date"*) on `article` and keep `publishedAt` editable on `articleVersion`.
    - Minor edits preserve whatever `publishedAt` date is set; publishing with `isNewEdition: true` updates `publishedAt` to `now` automatically (while remaining freely editable afterward).
  - **Editable & Recoverable Historical Snapshots (`studio/src/components/ArticleHistoryView.tsx`):**
    - Add a direct **"Edit Snapshot in Studio"** button (`IntentLink` to `edit` the `articleVersion` document) on each historical card in the `Version History & Snapshots` tab, and update outdated empty-state instructions.
    - Unlock `versionNumber` recovery (or provide a safe sync action in `ArticleHistoryView`) so deleting an accidental snapshot allows rolling back `versionNumber` cleanly.
* **Sanity Best Practice Alignment:**
  - Uses field groups (`groups`) to declutter primary authoring workflows (`references/schema.md`).
* **Acceptance Criteria:**
  - [ ] Opening an Article in Studio presents core writing fields first, with a single Publish button and version controls tucked in `Versioning & Archival`.
  - [ ] Editors can freely edit `publishedAt` on both live articles and historical snapshots; minor edits do not overwrite manual dates.
  - [ ] Editors can open and edit any `articleVersion` directly from the Article's `Version History & Snapshots` tab to fix typos/formatting, and changes propagate to `/[slug]/v{N}` and `/[slug]/versions`.
  - [ ] `npm run typegen && npm run check` passes.

---

## WP-8F: Two-Lane Asset Cleanup, Filled Cartouche Emblem & Author Byline Removal
* **Objective:** Formalize the Two-Lane Asset Architecture, upgrade the top banner cartouche and utility icons to match the filled copperplate aesthetic of the reference render, and remove visible *"Penned by"* bylines across web pages (Decisions 015, 017).
* **Key Motivation:** Resolves visual polish gaps in the header banner, removes redundant author text on a single-author compendium, and eliminates confusing empty brand-asset fields in Sanity Studio.
* **Scope:**
  - **Two-Lane Asset Cleanup (`studio/schemaTypes/homePage.ts` & `web/src/app/page.tsx`):**
    - Remove the `logo` image field from `homePage` schema so brand emblems remain strictly version-controlled in `web/public/art/brand/` and served via Workers Static Assets (`ASSETS`).
    - Remove the duplicate visible `<header className={styles.mastheadBar}>` block below `GlobalHeader` on `HomePage` (preserving accessible page `<h1>` semantics).
  - **Filled Banner Cartouche & Header Icons (`web/public/art/brand/olivers-cartouche.svg`, `web/public/sprites.svg`, `web/src/components/GlobalHeader.tsx`, `web/src/components/GlobalHeader.module.css`):**
    - Re-illustrate `olivers-cartouche.svg` to match `.files/b08bf2a6-135d-4773-91f8-07ad9c0e1853.jpg`: curved `<textPath>` lettering for *"Oliver's Guide"* and *"Everything"*, shaded copperplate iris/eye center medallion around *"to"*, filled pointed side wings, and top/bottom four-point star finials.
    - Refine `GlobalHeader` layout so the cartouche renders at full prominence alongside the search bar and elemental pill row (collapsing gracefully on mobile), and fill the header utility glyphs (`home`, `bookmark-ribbon`, `gear`) in `sprites.svg` for solid engraved weight.
  - **Remove Visible *"Penned by"* Bylines Across Web Pages:**
    - Remove `— Penned by {author}` and footer `• Penned by {author}` from `web/src/app/[slug]/page.tsx` and `web/src/app/[slug]/[version]/page.tsx`, plus `— Penned by` / `by {author}` in `web/src/app/[slug]/versions/page.tsx` and `web/src/components/VersionHistoryDiffViewer.tsx`.
    - Retain `authorName` in `<head>` metadata (`DC.creator`, `citation_author`), APA7/BibTeX citations (`CitationModal`), and `@media print` (`PrintHeader` / `PrintFooter`).
* **Sanity & Cloudflare Best Practice Alignment:**
  - Serves static brand vectors via Workers Static Assets (`ASSETS`) with zero Worker CPU overhead while reserving Sanity Asset CDN for editorial imagery and PDFs (Decision 017).
* **Acceptance Criteria:**
  - [ ] No visible *"Penned by"* text appears on `/[slug]`, `/[slug]/v{N}`, or `/[slug]/versions`, while `<head>` metadata, APA7 citations, and Print/PDF exports still include author attribution.
  - [ ] Top header displays the richly shaded, curved-text cartouche and filled icons matching the reference render, without a duplicate logo/title strip beneath it on `/`.
  - [ ] Component tests in `web/tests/components-and-pages.test.tsx` and `npm run typegen && npm run verify` pass.

---

## WP-9: Studio Bibliography Pipeline & Render-Time Citations
* **Objective:** Provide a fast workflow for Oliver's EndNote-exported BibTeX files, and render linked APA citations in articles.
* **Scope:**
  - **Sanity Schema for Citations (`studio/schemaTypes/citation.ts`):**
    - `citeKey` (string, e.g. `Smith2020`)
    - `authors` (array of strings)
    - `year` (number)
    - `title` (string)
    - `journal` (string)
    - `doi` / `url` (string)
    - `formattedApa` (string / html, pre-formatted via `citation-js`)
    - `lookupKeys` (array of strings, e.g. `["Smith 2020", "Smith et al. 2020"]`)
  - **Studio Bibliography Tool (`studio/src/tools/bibliography/`):**
    - Studio dashboard tool to drop an EndNote `.bib` file.
    - Parses entries with `citation-js`, calculates lookup keys, and upserts `citation` documents into Sanity via Sanity client mutations.
  - **Server-Side Citation Transform:**
    - During server rendering of the article body, scan text blocks for APA citation patterns (e.g. `(Smith et al., 2020)` or `Smith (2020)`).
    - Match normalized author-year keys against the article's bibliography store.
    - Inject interactive superscript or inline anchor links jumping to the `#references` section.
    - Render an alphabetical, formatted APA `References` list at the foot of the article.
  - **Studio Validation Inspector:**
    - Warning badge in the article editor if an in-text citation cannot be found in the current bibliography dataset.
* **Sanity Best Practice Alignment:**
  - Structured data in Content Lake rather than opaque binary blobs.
  - References normalized once on ingestion; rendering pipeline is pure read-only lookups.
* **Acceptance Criteria:**
  - Oliver uploads a `.bib` file in Sanity Studio; citations become available immediately.
  - In-text APA citations automatically link to the alphabetical reference list at the bottom of the article.
  - Unmatched citations are flagged to the author in the Studio.

---

## WP-10: Client-Side Bookmarks, Local Storage & Utilities
* **Objective:** Provide personal saving/bookmarking of guides and protocols without requiring a backend user account.
* **Scope:**
  - Top navigation ribbon icon (`[ 🔖 ]`) opens a slide-over panel of saved articles.
  - "Bookmark this Guide" button on article headers and card rows.
  - Bookmarks stored in browser `localStorage`.
  - Export bookmarks list as Markdown / JSON for Oliver's personal archival.
* **Acceptance Criteria:**
  - Bookmarks persist across sessions and page reloads.
  - No user accounts, database tables, or cookies required.

---

## Future / Parked Packages
- **WP-11 (Exploratory): `.docx` Word Document Ingestion Tool:** Sanity Studio tool to upload Word `.docx` files, converting headings and text to Portable Text and uploading embedded images directly to Sanity media assets.
- **WP-12: Social / Patreon Auth & Content Gating:** OAuth integration with Patreon / social identity providers to gate select premium protocols or high-resolution PDF downloads.
