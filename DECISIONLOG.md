# Decision Log

Decisions made during development and the premises behind them. Only revisit a decision if its premises have changed or new information warrants reconsideration.

---

## 001 — Monorepo layout: `studio/` + `web/`

**Date:** 2026-09-29
**Decision:** Keep the Sanity Studio standalone in `studio/` alongside the Next.js app in `web/`. Do not embed the Studio inside the Next.js app.
**Premises:**
- Simpler deployment — Studio and web app deploy independently
- Avoids Next.js bundling complexity with Studio dependencies
- Sanity recommends standalone Studio for new projects

---

## 002 — Bare minimum first, polish later

**Date:** 2026-09-29
**Decision:** Ship the simplest working integration (article schema, landing page, detail page) before adding Visual Editing, TypeGen types in components, SEO, or styling polish.
**Premises:**
- Need to validate the Sanity → Next.js → Cloudflare pipeline end-to-end first
- Automation setup is the next priority after the pipeline works
- Can iterate on schema and UI once content is flowing

---

## 003 — Landing page as a singleton document (`homePage`)

**Date:** 2026-09-29
**Decision:** Make the landing page heading, subheading, and intro editable via a `homePage` singleton in the Studio, with hardcoded fallbacks.
**Premises:**
- Oliver should be able to update the landing page without code changes
- Singleton pattern keeps it simple — one document, fixed ID, no list clutter

---

## 004 — Migrate from Static Export to OpenNext SSR on Cloudflare Workers (revised)

**Date:** 2026-10-22 (revised from 2026-09-29 static export)
**Decision:** Migrate from Next.js `output: "export"` to hybrid SSR/ISR using `@opennextjs/cloudflare`. Pages continue to be pre-rendered and cached at the edge, but runtime server functions now handle Draft Mode previews and on-demand cache revalidations.
**Premises:**
- Static export was locking down capabilities: publishing required a full multi-minute site rebuild, live draft preview in the Studio was impossible, and server-side citation linking was constrained.
- `@opennextjs/cloudflare` officially supports Next.js 16.4+ on the Cloudflare Workers runtime (`nodejs_compat`).
- Measured server bundle size is ~941 KB gzipped, well under Cloudflare's 3 MiB / 64 MiB script limits.
- Cache interception (`enableCacheInterception: true`) serves cached routes directly without booting the Next.js server, keeping execution well below the 10 ms CPU budget on the Workers Free tier.

---

## 005 — Scientific Book Content Model: `chapter`, `topic`, and `article.contentType` (revised)

**Date:** 2026-10-24 (revised from 2026-09-29 flat `category` string field)
**Decision:** Replace the flat `category` string field on `article` with `contentType` (`article`, `guide`, `protocol`, `research-note`) for document format classification, paired with reference-based `chapter` (`studio/schemaTypes/chapter.ts` with `number`, `slug`, `summary`, `vignette`) for book structure (`chapterOrder`) and `topics` (`studio/schemaTypes/topic.ts` with 2-letter elemental `symbol`, `name`, `slug`, `description`) for cross-cutting taxonomy filtering. Also enrich `article.body` Portable Text with scientific book blocks (`figureCallout`, `formulaReagents`) and inline `annotatedTerm` annotations.
**Premises:**
- Oliver structures the publication as a scientific compendium/book where chapters have an explicit numeric sequence (`chapter.number`) and articles can be published out of order (`article.chapter` + `article.chapterOrder`).
- Separating document format (`contentType`) from subject taxonomy (`topics` with periodic elemental badges like `[ Ca ]`, `[ Pr ]`) enables both format badges and multi-topic filtering.
- No legacy production data required preserving the old `category` field, allowing a clean cutover in WP-4.

---

## 006 — Cloudflare Workers with OpenNext adapter (revised)

**Date:** 2026-10-23 (revised from 2026-10-22 and 2026-09-30)
**Decision:** Deploy as a full Cloudflare Worker via `wrangler.jsonc` and `open-next.config.ts`. The worker entrypoint is `.open-next/worker.js`, static assets are served from `.open-next/assets`, and build command is `npm run build` (`opennextjs-cloudflare build`, delegating Next.js compilation to `npm run build:next`). Enable `kvIncrementalCache` (`NEXT_INC_CACHE_KV`), `d1NextTagCache` (`NEXT_TAG_CACHE_D1`), `memoryQueue`, and `enableCacheInterception: true` now that KV and D1 bindings are provisioned and bound in `wrangler.jsonc`.
**Premises:**
- Provides a native Worker environment with `nodejs_compat`, `global_fetch_strictly_public`, and Workers Observability (Logs + Traces) enabled.
- On 2026-10-23, `NEXT_INC_CACHE_KV` (`c9b40bfdfa0c4800936fbc8910bcf1a9`) and `NEXT_TAG_CACHE_D1` (`8380a4c0-3be8-42f1-8bf9-f4afc6f7a6ce`, `olivers-guide-tag-cache`) were provisioned via Wrangler and initialized with the `revalidations` table.
- Automated config contract tests enforce strict parity between `open-next.config.ts` overrides and `wrangler.jsonc` resource bindings so an unprovisioned cache adapter can never be pushed.

---

## 007 — Sanity CDN, Bounded Edge Caching & Full-Graph Revalidation (revised)

**Date:** 2026-10-28 (revised from 2026-10-27, 2026-10-22 and 2026-09-30)
**Decision:** Utilize `defineLive` / `sanityFetch` with Sanity CDN enabled at runtime, paired with a strict bounded HTML cache profile (`Cache-Control: public, max-age=600, s-maxage=604800, must-revalidate`; `private, no-store` in Draft Mode), `expireTime: 1209600` (14-day / 2-week hard shelf-life), full-graph path/layout webhook invalidation in `/api/revalidate`, and manual full-cache purge tooling (`npm run cache:purge` + authenticated `{ purgeAll: true }` endpoint).
**Premises:**
- Under OpenNext SSR with `kvIncrementalCache` and `d1NextTagCache`, unbounded or `immutable` HTML caching trapped accidental publications in visitor browsers (since HTTP provides no remote mechanism to evict a client's unexpired `max-age` cache) and kept server KV entries alive indefinitely when webhook tags did not match internal `defineLive` sync tags.
- Bounding browser HTML caching at 10 minutes (`max-age=600`), edge revalidation at 7 days (`s-maxage=604800, must-revalidate`), and hard cache expiration at 14 days (`expireTime: 1209600`) keeps repeat browsing snappy while guaranteeing stale content is evicted after 2 weeks if un-revalidated.
- In local development (`process.env.NODE_ENV === "development"`), custom Cache-Control headers are omitted so Next.js Turbopack development chunks are not permanently cached in browser disk caches.
- Expanding `/api/revalidate` to flush `/contents`, `/[slug]/versions`, `/[slug]/v{N}`, and site-wide layout caches (`revalidatePath("/", "layout")`) when global singletons (`siteSettings`, `homePage`, `aboutPage`) or taxonomies change eliminates cross-document staleness.
- Operators need a deterministic emergency cache flush (`npm run cache:purge` and Studio one-click purge) that clears KV, D1 tag records, and Cloudflare Zone CDN caches on demand.

---

## 008 — Victorian Parchment Design System

**Date:** 2026-09-30
**Decision:** Implemented a custom CSS design system mimicking an antique copperplate-etched book (sepia/ink palette on parchment backgrounds) using only one font (`Cormorant Garamond`).
**Premises:**
- The client specifically requested a vintage-engraving/arcane text aesthetic.
- A strong frontend aesthetics rule (`CLAUDE.md`) explicitly rejects generic "AI slop" (like Inter/Roboto fonts, generic Tailwind components, or purple gradients).
- Unifying under one serif font enforces typographic consistency.
- Articles are styled to mimic a single-column academic journal paper (drop caps, justified text, underlined section headers).

---

## 009 — Modular Vanilla CSS `@layer` Architecture & Vector Sprite Sheet

**Date:** 2026-10-22
**Decision:** Fully decoupled from Tailwind CSS and PostCSS, establishing a standard Vanilla CSS architecture organized across five explicit `@layer` tiers (`reset`, `tokens`, `base`, `components`, `utilities`) and delivering Victorian vector assets via a unified, zero-flicker cached SVG sprite sheet (`/sprites.svg`).
**Premises:**
- Tailwind CSS utility abstractions conflicted with bespoke Victorian book layout requirements (paper bevels, radial age gradients, complex nested pseudo-elements, `:nth-child` hand-drawn rotations).
- Explicit CSS `@layer` guarantees cascade predictability without specificity wars or `!important` hacks.
- Vector sprite sheet (`/sprites.svg` + `<use href="/sprites.svg#id" />`) with `currentColor` inheritance eliminates font-icon flicker, minimizes DOM node weight, and allows instant asset re-use.
- Floating book folio geometry (`max-width: 1180px` centered over `#23201c` desk canvas) gracefully collapses to edge-to-edge on mobile viewports (< 768px).

---

## 010 — Three-Tier Verification Framework & Local Pre-Push Gate

**Date:** 2026-10-23
**Decision:** Enforce a local 3-tier verification pipeline (`Static & Config Contracts` → `Vitest Unit/Component/Schema Tests` → `OpenNext Build + Wrangler Dry-Run + workerd HTTP Smoke Tests`) orchestrated from the root `package.json` and wired into a tracked Git pre-push hook (`.githooks/pre-push`).
**Premises:**
- Remote CI/CD is handled by Cloudflare Workers Builds on push; catching configuration mismatches (`open-next.config.ts` vs. `wrangler.jsonc`), recursive build scripts, lint failures on generated directories, or runtime Worker crashes locally before `git push` prevents broken deployments.
- Config contract tests statically verify OpenNext ↔ Wrangler binding parity (`ASSETS`, `WORKER_SELF_REFERENCE`, `NEXT_INC_CACHE_KV`, `NEXT_TAG_CACHE_D1`), `initOpenNextCloudflareForDev()` environment guards, SVG sprite symbol parity, and CSS `@layer` cascade order in milliseconds.
- Smoke tests execute `opennextjs-cloudflare build`, `wrangler deploy --dry-run`, and boot the compiled `.open-next/worker.js` in `workerd` to assert real HTTP responses (`200` on `/`, `200` + `Cache-Control` on `/sprites.svg`, `404` on unknown routes) and bundle size budgets.

---

## 011 — Core Victorian Component Kit with Scoped CSS Modules & Vector Art Pipeline

**Date:** 2026-10-24
**Decision:** Implement the core Victorian UI library (`EtchedFrame`, `StarDivider`, `ElementalPill`, `CopperplateButton`, `EtchedFigure`) using Next.js scoped CSS Modules (`*.module.css`) consuming design tokens from `tokens.css`, paired with an initial collection of high-resolution copperplate etching vector assets (`/art/chapters/`, `/art/media/`, `/art/brand/`).
**Premises:**
- Scoped CSS Modules prevent cross-component class name collisions and CSS leakage while directly inheriting the `@layer tokens` variables defined in Decision 009.
- Polymorphic components (e.g. `ElementalPill` and `CopperplateButton` rendering as links, buttons, or spans; `EtchedFrame` rendering as articles, sections, or divs) preserve accessible HTML semantics and clean keyboard navigation.
- High-resolution SVG vector etchings provide crisp, scale-independent copperplate cross-hatching and zero network round-trip overhead when deployed to Cloudflare Workers static assets.

---

## 012 — Global Shell, Navigation & Master Book Table of Contents Architecture

**Date:** 2026-10-24
**Decision:** Implemented the global navigation shell (`GlobalHeader`, `HeaderSearchForm`, `HeaderTopicPills`, `HeaderDrawer`, `HeaderUtilities`), the Victorian Master Table of Contents page (`/contents`), and topic filtering on Home and Contents using URL query params (`?topic=slug`, `?q=query`, `?scope=type`).
**Premises:**
- Presenting the Book Table of Contents both as a dedicated `/contents` reading page and as an interactive slide-out drawer (`☰`) accommodates both focused linear reading and fast contextual browsing without losing scroll position.
- URL search param filtering (`?topic=slug`, `?q=...`) provides shareable, bookmarkable deep links, is compatible with Cloudflare Workers SSR edge caching without bloating KV tag keys, and allows seamless reset via `[ ALL ✕ ]` elemental pills.
- The global header search form uses standard GET action submission with Victorian loupe and scope dropdown (`All`, `Protocols`, `Guides`, `Articles`, `Notes`), functioning with zero JavaScript dependency while client enhancers provide interactive responsive feedback.
- Resilient error handling (`.catch(() => ({ data: null }))`) around Sanity live fetch queries guarantees graceful degradation during offline builds, static prerendering of 404 pages, or transient edge network drops.

---

## 013 — Repository Quality Hardening, Living Design Folio & Presentation Tool Parity

**Date:** 2026-10-24
**Decision:** Hardened codebase quality and modularity across the monorepo: elevated `/sprites-preview` into a comprehensive living Victorian Design Folio and linked it directly in production navigation (`SiteFooter` and `HeaderDrawer`), wired complete Visual Editing / Presentation Tool preview locations in `studio/src/presentation/resolve.ts` (`/contents`, `chapter`, `topic`), resolved Presentation Tool draft-mode enabling by synchronizing Sanity Viewer read tokens in `web/.env.local` (and providing tracked `web/.env.example`), implemented automated fallback etching illustrations for chapter vignettes on `/contents` (`/art/chapters/microscopy.svg`, `specimens.svg`, `reagents.svg`, `apparatus.svg`), decoupled notice modal styling into a shared `NoticeToast` component, deduplicated search form and topic pill Suspense fallbacks, and expanded `workerd` smoke test coverage to verify `/contents`.
**Premises:**
- The component and asset showcase is a critical communication tool for benefactor review; making it easily discoverable in the production instance and showcasing the full collection of vector etchings, all 28 sprite glyphs, typography scale, and UI components maximizes transparency.
- Sanity Visual Editing requires preview locations for all managed schema types (`chapter`, `topic`, `article`, `homePage`) so content editors in the Presentation Tool can navigate to and preview changes across both the frontispiece and Master Table of Contents.
- When running Next.js in local development (`next dev`), `defineEnableDraftMode` and `sanityFetch` require `SANITY_API_READ_TOKEN` to validate draft-mode secrets. In addition to creating `web/.env.local`, adding `getSanityReadToken()` (`web/src/sanity/token.ts`) provides a graceful runtime fallback that inspects `.env.local` / `.dev.vars` dynamically in development if the process was started before env variables were populated.
- In `web/src/app/layout.tsx`, mounting `<VisualEditing />` when `isDraftMode || process.env.NODE_ENV === "development"` enables immediate comlink handshake with Sanity Studio's Presentation Tool iframe without timing out waiting for third-party cross-port cookie handshakes, while remaining completely dormant when viewed outside an iframe in a standard browser tab.
- Chapters without uploaded custom vignette assets in Sanity should not display blank headers; automatically mapping chapters by topic keywords or sequence order to authentic Victorian copperplate etchings ensures every chapter has a distinctive engraved plate.
- Cross-module CSS imports (`FooterNavLinks` importing `GlobalHeader.module.css`) violated component isolation; encapsulating notice toast logic and styling in `NoticeToast` enforces clean modular boundaries.
- Adding `/contents` to the live `workerd` smoke test suite ensures the primary book compendium route is verified on every build before push.

---

## 014 — Home Page Victorian Frontispiece Sections, Consolidated GROQ & Image URL Pipeline

**Date:** 2026-10-25
**Decision:** Assembled the 5-section Victorian frontispiece on `/` (`web/src/app/page.tsx`, `web/src/app/home.module.css`, `web/src/components/HomeCarousel.tsx`, and `web/src/sanity/image.ts`): Dual Hero Feature Grid, Popular Categories tarot-card carousel, Mid-Page Decorative Motto Banner, Popular Media carousel, and the "New & Recent" Chronicle Feed, powered by a single consolidated GROQ query (`HOME_PAGE_QUERY`) and centralized `@sanity/image-url` builder helpers.
**Premises:**
- Fetching `home` (`*[_id == "homePage"][0]`), `chapters`, and `articles` in a single `HOME_PAGE_QUERY` via `sanityFetch` eliminates parallel round-trips, ensures atomic snapshot consistency across all homepage sections, and generates unified TypeScript types via Sanity TypeGen.
- Centralizing `@sanity/image-url` transformations (`buildSanityImageUrl`, `getChapterVignette`, `getArticleEtching`, `getMediaVignette` in `web/src/sanity/image.ts`) enforces explicit dimensions, hotspot-aware cropping, and automatic WebP/AVIF negotiation across `/` and `/contents`, while providing deterministic Victorian copperplate SVG fallbacks when Sanity image fields are unpopulated.
- Combining curated Studio fields (`homePage.featuredArticles`, `homePage.mottoBanner`, `homePage.mediaChannels`, and `chapter` documents) with automatic fallbacks ensures the frontispiece is 100% manageable from Sanity Studio while always rendering a complete 2-card hero, 6-card tarot carousel, motto banner, and 3-channel media row even when individual Studio fields are empty.

---

## 015 — Scholarly Protocol Architecture: Editorial Versioning (`/[slug]/v{N}/`), Dublin Core Metadata, Planned Links, and Paged-Media PDF Engine (revised)

**Date:** 2026-10-27 (revised from 2026-10-25)
**Decision:** Established and refined the architectural framework for the scientific reading experience:
1. **Editorial Versioning Control & Routing (`/[slug]/v{N}/`):** Differentiate between minor editorial maintenance (typo fixes, link tweaks, styling adjustments) and major scientific protocol editions (`isNewEdition` toggle). Minor edits publish immediately in place with on-demand edge cache revalidation without bumping version numbers. New editions increment the version counter, record `articleVersion` snapshot documents in Sanity Content Lake, and are served at persistent permalinks (`/[slug]/v{N}/`, e.g. `https://oliversguidetoeverything.com/protocol-slug/v2/`). Rather than locking browsers for 1 year with `immutable`, archival routes share the bounded revalidating HTML cache policy (`Cache-Control: public, max-age=600, s-maxage=604800, must-revalidate`) and 14-day hard expiry (`expireTime: 1209600`) so editors can still amend typos, formatting, or accidental disclosures in historical `articleVersion` documents and immediately revalidate `/[slug]/v{N}/`.
2. **Visitor-Facing APA7 & BibTeX Citations:** Provide an interactive modal generating copyable APA 7th Edition and BibTeX citations targeting the canonical, persistent versioned URL on `https://oliversguidetoeverything.com`.
3. **Dublin Core & Google Scholar Metadata (Without Redundant Visible Bylines):** Inject academic meta tags (`DC.title`, `DC.creator`, `DC.date`, `DC.identifier`, `DC.relation.isVersionOf`, `citation_title`, `citation_author`, `citation_publication_date`, etc.) via Next.js `generateMetadata` and preserve author attribution in APA7 citations and Print/PDF headers, while omitting repetitive visible *"Penned by"* bylines across web reading views.
4. **Internal & Planned Treatise Links ("Wiki Redlinks"):** Introduce a dual-mode `internalLink` Portable Text mark annotation. Existing treatises resolve dynamically via GROQ references (preventing broken links if slugs change), while planned treatises in preparation render with distinctive Victorian copperplate flourishes, tooltips, and notice feedback without dead ends or 404s.
5. **Two-Tier PDF Generation Engine:** Implement Tier 1 as a native Paged-Media `@media print` CSS engine with `@page` styling, widow/orphan control, and dedicated `<PrintHeader>` / `<PrintFooter>` blocks injecting the generation timestamp, official version badge, and canonical link at 300+ DPI vector sharpness with zero server execution cost. Tier 2 provides an optional endpoint (`/[slug]/v{N}/pdf`) for direct binary stream downloads.
**Premises:**
- Biotech and oncology protocols require persistent version citations (`/[slug]/v{N}/`), while operational experience proved that 1-year `immutable` browser headers and strictly uneditable snapshots prevent correcting spelling mistakes, formatting errors, or accidental disclosures.
- Bounding browser cache to 10 minutes (`max-age=600`), Edge/KV cache revalidation to 7 days (`s-maxage=604800`, `must-revalidate`), and hard cache expiration to 14 days (`expireTime: 1209600`) preserves fast edge delivery while allowing immediate revalidation when a historical `articleVersion` is corrected in Sanity Studio.
- Sanity's native History API is not queryable via GROQ and prunes history after 30–90 days; Content Lake `articleVersion` documents guarantee permanent archival availability and direct editorial repairability.
- Because the entire publication is *Oliver's Guide To Everything*, displaying *"Penned by Oliver"* on every web page adds visual noise and cross-page cache coupling without adding reader value, whereas `<head>` metadata, citations, and printed PDFs still benefit from explicit authorship.
- Browser-based Paged-Media PDF generation ensures crisp vector rendering of Cormorant Garamond typography and copperplate SVG etchings with zero server latency or cold-start overhead.

**Implementation Status:** Completed across WP-8, WP-8B, WP-8C, WP-8E, and WP-8F with verified acceptance criteria (2026-10-28).

---

## 016 — Protocol Versioning Architecture: Automated Snapshot Publishing, Studio Onboarding Ergonomics, Archival Routing, and Visual Diff Engine (revised)

**Date:** 2026-10-27 (revised from 2026-10-25)
**Decision:** Refined the protocol versioning and Sanity Studio authoring workflow (WP-8B & WP-8E):
1. **Automated Publish-Time Snapshot Creation & Simplified Studio Onboarding (`publishWithSnapshot.ts` & `article.ts`):** Wrap Sanity's native publish action with a single unified `PublishWithSnapshotAction` (removing the duplicate `RecordVersionSnapshotAction` button). Move `isNewEdition`, `versionChangelog`, and `versionNumber` out of the top of the `Content & Media` form into a dedicated `Versioning & Archival` tab so authors immediately see `Title`, `Slug`, `Content Type`, and `Published / Recorded Date`. Unlock `publishedAt` so editors can freely set or backdate dates (preserved across minor edits; auto-updated to `now` only when publishing a New Official Edition).
2. **Editable & Resilient Archival Routing (`web/src/app/[slug]/[version]/page.tsx` & `ArticleHistoryView.tsx`):** Serve historical version permalinks (`/[slug]/v{N}/`) from `articleVersion` snapshots (with graceful fallback for `versionNum <= currentLiveVersion`) using `Cache-Control: public, max-age=600, s-maxage=604800, must-revalidate`. Expose direct **"Edit Snapshot in Studio"** links on every edition card in `ArticleHistoryView` and revalidate `/[slug]/v{N}/` and `/[slug]/versions` via webhook whenever an `articleVersion` is edited or pruned.
3. **Zero-Dependency Word & Block Diff Engine (`web/src/lib/diff.ts`):** Pure TypeScript Longest Common Subsequence (LCS) word and section diff algorithm computing additions, deletions, and statistical metrics without external runtime dependencies.
4. **Version History & Interactive Visual Diff Viewer (`web/src/app/[slug]/versions/page.tsx` & `VersionHistoryDiffViewer.tsx`):** Dedicated scholarly history page featuring a reverse-chronological timeline of editions, changelog messages, quick-view links, and inline / side-by-side diff modes.
5. **Cross-Navigation Integration & Clean Copy:** `[ 📜 History & Diffs (v{N}) ]` folio action buttons in `ArticleUtilities.tsx` and reader footer audit links on `/[slug]/` and `/[slug]/v{N}/`.
**Premises:**
- Placing four advanced versioning fields above `Title` and mounting two competing snapshot actions overwhelmed non-technical onboarding in Sanity Studio; isolating version controls in a dedicated tab with a single Publish button prevents accidental edition bumps.
- Editors must be able to manually set or adjust `publishedAt` ("Recorded on") dates and open historical `articleVersion` snapshots directly from the Article editor to fix typos or formatting mistakes without fighting `readOnly` locks or 1-year `immutable` browser caches.
- Pure TypeScript diffing keeps Cloudflare Worker script bundles well below the 3 MiB free tier limit while delivering instant client-side comparison between any two protocol editions.

**Implementation Status:** Completed in WP-8B and refined in WP-8E (commit `c61b8e4`, 2026-10-28) with tabbed authoring fieldsets, unified Publish action, mutable `publishedAt`, and direct IntentLink snapshot editing in `ArticleHistoryView`.

---

## 017 — Two-Lane Asset Architecture: Workers Static Assets for Brand Chrome, Sanity CDN for Editorial Media

**Date:** 2026-10-27
**Decision:** Enforce a strict two-lane separation for visual and file assets across the monorepo (WP-8F):
1. **Lane 1 — Brand Chrome, Logos, Icons & Fallback Plates (`web/public/` → Cloudflare Workers Static Assets `ASSETS`):** Store all UI vector art (`/sprites.svg`, `/art/brand/olivers-cartouche.svg`, `/art/brand/scientific-motto-banner.svg`, `/art/chapters/*.svg`, `/art/media/*.svg`) in Git under `web/public/` and serve via Cloudflare Workers Static Assets. Remove CMS brand-logo upload fields (`homePage.logo`) and duplicate frontispiece masthead strips.
2. **Lane 2 — Editorial Figures & Protocol Worksheets (Sanity Asset CDN `cdn.sanity.io`):** Keep article `coverEtching`, inline Portable Text `figureCallout` images, custom `chapter.vignette` overrides, and `downloadablePdfs` in Sanity Content Lake / Asset CDN, transformed via `@sanity/image-url` with deterministic Lane-1 SVG fallbacks when empty. Never store video files in Sanity `file` assets.
**Premises:**
- Cloudflare Workers Static Assets (`ASSETS` binding) already serves `web/public/` from Cloudflare's global edge at zero Worker compute cost, making Cloudflare R2 or Cloudflare Images unnecessary overhead for brand logos or UI assets.
- Hosting brand logos or UI icons in Sanity invites empty fields, aspect-ratio mismatches, and inability to use SVG `currentColor` or CSS design tokens.
- Conversely, editorial figures and protocol PDFs belong in Sanity Asset CDN so authors can drag-and-drop microscopy plates and bench worksheets inline while writing without developer Git commits, gaining built-in hotspot cropping, LQIP blur, WebP/AVIF negotiation, and content-addressed immutable asset URLs.

**Implementation Status:** Completed in WP-8F (commit `ec82669`, 2026-10-28) with `homePage.logo` removed, duplicate masthead strip removed, filled `olivers-cartouche.svg` + filled utility icons, and visible bylines removed across all web routes.

---

## 018 — Unified Site Operations Singleton (`siteSettings`) & Outer Worker 503 Maintenance Interception

**Date:** 2026-10-27
**Decision:** Consolidate operational controls and global publication metadata into a single `siteSettings` singleton placed first in Sanity Studio (`Site Settings & Operations`), and wrap `.open-next/worker.js` with an outer Cloudflare Worker entrypoint (`web/worker.ts`) to enforce instant `503` Maintenance Mode and a session-dismissible Work-in-Progress banner (WP-8D).
**Premises:**
- Because `enableCacheInterception: true` in `open-next.config.ts` serves cached pages straight from KV before Next.js middleware or layouts execute, a reliable site-wide `503` killswitch must evaluate a KV flag (`site:ops:maintenance`) at the outer Worker boundary before OpenNext runs.
- Dual activation paths — publishing `siteSettings` in Sanity Studio (via webhook) and running a local CLI command (`npm run site:maintenance -- on|off` writing directly to KV) — guarantee operators can pull the emergency brake both from Studio and when Sanity or webhooks are unavailable.
- Exempting `/api/revalidate`, `/api/draft-mode/*`, static brand assets, and valid Sanity Draft Mode preview sessions (`__prerender_bypass`) from the `503` curtain ensures editors can still preview and verify fixes in Sanity Presentation before reopening public access.
- Centralizing Maintenance Mode, the session-dismissible WIP top notice (`hidden` in `@media print`), one-click cache purge, and global scholarly metadata into one `siteSettings` singleton eliminates scattered settings across `homePage` and `aboutPage`.

**Implementation Status:** Completed in WP-8D (commit `8579462`, 2026-10-28) with unified `siteSettings` singleton, outer Worker `503` wrapper in `web/worker.ts`, `npm run site:maintenance` CLI, and session-dismissible `WipBanner`.

---

## 019 — Architecture Quality Ratchets, Static KV Pre-Rendering & Agent Customizations Tracking

**Date:** 2026-10-27
**Decision:** Adopt strict architecture quality ratchets and static KV edge caching practices across the monorepo:
1. **Track Agent Rules in Git:** Un-ignore `AGENTS.md` and `DECISIONLOG.md` in `.gitignore` (keeping `.agents/` gitignored to avoid repository bloat from vendor skills). Consolidate frontend styling rules into `web/AGENTS.md`, establish `studio/AGENTS.md`, prune unused Cloudflare/Vite skills (`k2`, `gateway-workers`, `agents-sdk`, `nextjs-on-cloudflare`), and maintain local custom skill `.agents/skills/olivers-architecture/SKILL.md`.
2. **Static Edge Pre-Rendering over Route Bailout:** Banish top-level `await searchParams` in Next.js Server Component page controllers (`/` and `/contents`). Wrap client search, scope, and topic filtering in `<Suspense>` client boundaries reading `useSearchParams()`. This preserves Next.js static HTML generation (`○`), maximizing Cloudflare Edge KV cache hits (<1ms Worker CPU) under Free Tier constraints while maintaining instant 0ms client-side filtering.
3. **Decomposition & Line Ceilings:** Limit source files to a strict 300-line ceiling (target <200 lines). Decompose monolithic route files into shared reader shells (`TreatiseReader.tsx`), presentation components (`HomeFrontispiece.tsx`, `ContentsCompendium.tsx`), and canonical queries (`web/src/sanity/queries.ts`).
4. **Architectural Contract Testing:** Enforce code health, max file line limits, dependency budgets (strictly 6 runtime dependencies in `web/package.json`), and public folder cleanliness via automated Vitest tests (`web/tests/architecture-contract.test.ts`).
**Premises:**
- Monolithic 890+ line route files violate single responsibility, hinder readability, and induce fragile regressions during feature additions.
- Reading dynamic query parameters directly on the server causes Next.js to classify routes as dynamic SSR (`ƒ`), bypassing Edge KV cache interception and consuming Cloudflare Worker CPU time on every hit, risking 10ms CPU timeouts and 100k daily request caps.
- Automated architectural test ratchets catch modularity erosion and dependency creep in CI/pre-commit verification before code merges to `main`.

---

## 020 — Client-Side Bookmarks Engine, Reading Folio Slide-Over & Archival Export (WP-10)

**Date:** 2026-10-28
**Decision:** Implement a zero-backend, privacy-first client-side bookmarking architecture:
1. **Sync External Store Reactive Storage (`web/src/lib/bookmarks.ts`):** Store personal bookmarks exclusively in browser `localStorage` under `olivers_bookmarks_v1` using React's `useSyncExternalStore`. This eliminates hydration mismatches (server snapshot returns empty `[]`), enables multi-tab synchronization (`window.addEventListener("storage")`), and provides instant in-tab re-renders across all components via custom dispatch events (`olivers:bookmarks-changed`) with zero database, zero cookies, zero user authentication, and zero third-party dependencies.
2. **Victorian Reading Folio Slide-Over (`BookmarksDrawer.tsx`):** Replace the placeholder button in `HeaderUtilities` with an accessible slide-over drawer panel displaying saved protocols, edition badges, taxonomy pills, and summaries, alongside a live badge counter on the top navigation ribbon icon (`[ 🔖 ]`).
3. **Pervasive 1-Click Saving (`BookmarkButton.tsx`):** Equip article headers (`TreatiseReader.tsx`), compendium card rows (`ContentsCompendium.tsx`), and recent chronicle feed cards (`HomeFrontispiece.tsx`) with dedicated bookmark toggle buttons. Buttons call `e.preventDefault()` and `e.stopPropagation()` and reside in relative row wrappers outside parent `<Link>` anchors to strictly preserve valid HTML5 DOM semantics without React nesting warnings.
4. **Scholarly Archival Export:** Provide one-click downloads for "Export MD" (formatted as a clean Victorian Markdown folio document) and "Export JSON" (pretty-printed structured data) utilizing standard client-side Blob and object URLs without server compute costs.
**Premises:**
- Wet-lab researchers, students, and bench scientists require quick offline access to their favorite protocols and references without creating accounts or risking session timeouts at the lab bench.
- Browser-only storage avoids GDPR/cookie banner mandates, external auth services (Patreon/social auth is reserved for WP-12), and database storage costs on Cloudflare D1/KV.
- Clean separation between anchor links and bookmark action buttons eliminates invalid DOM nesting (`<button>` inside `<a>`), preserving keyboard accessibility and screen-reader usability.

**Implementation Status:** Completed in WP-10 with 22 new unit/contract tests, 161 total passing tests across the monorepo, and verified workerd live smoke test.

