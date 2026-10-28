# Oliver's Guide To Everything

A personal knowledge base for biotech and cancer research protocols.

## Structure

- `studio/` — Sanity Studio (standalone content management)
- `web/` — Next.js frontend deployed on Cloudflare Workers via `@opennextjs/cloudflare`

## Key Routes & Content Architecture

- `/` — **Victorian Frontispiece**: Assembles the Dual Hero Feature Grid (`homePage.featuredArticles` or auto-selected newest/featured dispatches), Popular Categories tarot-card carousel (driven by `chapter` documents with `/contents` category fallbacks), Mid-Page Motto Banner (`homePage.mottoBanner`, `subheading`, `intro`), Popular Media (`homePage.mediaChannels` with YouTube/TikTok/LinkedIn copperplate vignettes), and the "New & Recent" Chronicle Feed.
- `/contents` — **Master Table of Contents**: Displays ordered book chapters (`chapter.number` in Roman numerals) with nested articles (`article.chapterOrder`), an Appendix for standalone treatises, and URL-driven filtering (`?topic=slug`, `?scope=protocol|guide|article|research-note`, `?q=query`).
- `/[slug]` — **Article & Protocol Reader**: Renders individual research papers, guides, and laboratory protocols.
- `/sprites-preview` — **Living Victorian Design Folio**: Interactive catalog of all 28 `/sprites.svg` vector glyphs, copperplate etching plates (`/art/brand/`, `/art/chapters/`, `/art/media/`), typography tokens, and `@/components/ui` specimens.

## Caching Architecture, Invalidation & Purge Tooling

The application operates as a deterministic, edge-rendered publishing instrument designed for high-availability knowledge distribution within Cloudflare Free Tier budget limits. Pages and dispatches are served from Cloudflare Workers using a multi-tiered caching topology: Cloudflare Edge CDN, OpenNext KV incremental cache (`NEXT_INC_CACHE_KV`), D1 tag revalidations (`NEXT_TAG_CACHE_D1`), and downstream browser HTTP caches.

### 1. Deterministic HTML & ISR Cache Policy

Edge routing rules configured in `web/next.config.ts` enforce deterministic caching boundaries across all page responses while safeguarding live editorial previews:

| Content Class / Route | Cache-Control Header | Invalidation Mechanism | Rationale |
| :--- | :--- | :--- | :--- |
| **Public HTML & Pages** (`/`, `/contents`, `/[slug]`, `/[slug]/versions`, `/[slug]/v[n]`, `/sprites-preview`) | `public, max-age=600, s-maxage=604800, must-revalidate` | Cloudflare Edge 7d Revalidation / 14d Hard Expiry; On-demand Webhook Invalidation; Browser 10m TTL | Ensures near-instant global edge delivery from Cloudflare's cache while bounding browser latency to 10 minutes. Edge caches are purged immediately upon content publication. |
| **Draft Mode / Visual Editing** (`__prerender_bypass` cookie present) | `private, no-store` | Immediate live bypass | Prevents draft, preview, or unreleased research treatises from persisting in shared edge or browser caches. |
| **Hashed Static Assets** (`/_next/static/*`) | `public, max-age=31536000, immutable` | Content-hash cache busting | Immutable 1-year cache for fingerprinted CSS, JS, and font chunks (disabled in dev to preserve Fast Refresh). |
| **ISR Revalidate & Expiration Ceiling** | `export const revalidate = 604800;` (7 days) / `expireTime = 1209600;` (14 days) | Next.js ISR Background Revalidation & Hard Expiry | Revalidates in the background after 7 days; completely evicts / expires after 14 days (2 weeks). |

### 2. Full-Graph Webhook Invalidation (`POST /api/revalidate`)

Content published or mutated in Sanity Studio triggers atomic cache invalidations via `web/src/app/api/revalidate/route.ts`. The endpoint models the full publication dependency graph, reconciling references and invalidating all connected routes and cache tags.

#### Supported Triggers & Cascades

- **Articles (`_type: "article"`)**:
  - Automatically evicts Frontispiece (`/`) and Master Table of Contents (`/contents`).
  - Purges canonical dispatch reader (`/${slug}`) and version index (`/${slug}/versions`).
  - Purges all historical archival editions (`/${slug}/v1` through `/${slug}/v${versionNumber}`, bounded to 50 editions).
  - Handles slug alterations: invalidates both old (`previousSlug`) and newly assigned (`slug`) paths to prevent stale 404s.
  - Evicts tag `article:${slug}` and master tag `article`.
- **Archival Versions (`_type: "articleVersion"`)**:
  - Resolves parent article via payload reference (`articleSlug`, `article.slug`, or query via `articleRef`).
  - Invalidates parent dispatch reader (`/${slug}`), version index (`/${slug}/versions`), and specific snapshot route (`/${slug}/v${versionNumber}`).
  - Evicts tags `article:${slug}` and `articleVersion:${versionNumber}`.
- **Global Singletons & Taxonomies (`siteSettings`, `homePage`, `aboutPage`, `chapter`, `topic`)**:
  - Triggers site-wide layout flush via `revalidatePath("/", "layout")`.
  - Revalidates `/contents` and evicts taxonomy and layout cache tags (`chapter`, `topic`, `homePage`, `siteSettings`).
- **Master Flush (`{ purgeAll: true }`)**:
  - Evicts all registered tags (`sanity`, `article`, `articleVersion`, `chapter`, `topic`, `homePage`, `aboutPage`, `siteSettings`).
  - Flushes root layout (`/`, `"layout"`), frontispiece (`/`), and table of contents (`/contents`).

#### Authentication & Timing-Safe Security

All invalidation requests undergo constant-time verification using the Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`) to eliminate side-channel length-leak and timing attacks:
- **Sanity HMAC Webhooks**: Validates `sanity-webhook-signature` using `parseBody()` with `SANITY_REVALIDATE_SECRET`.
- **Direct Bearer / Header Token**: Authenticates manual or CLI operations via `Authorization: Bearer <secret>` or `x-revalidate-secret`.
- **Runtime Adaptability**: Employs `crypto.subtle.timingSafeEqual` in `workerd` (Cloudflare Workers runtime) with an automatic constant-time XOR bitwise fallback in Node.js / Vitest test environments.

### 3. Developer CLI Cache Purge Tooling (`npm run cache:purge`)

A zero-dependency developer utility (`web/scripts/purge-cache.mjs`) provides unified, multi-tiered cache eviction across local development and live Cloudflare production environments.

#### Commands

```bash
# Purge all remote production cache tiers (KV, D1, Next.js /api/revalidate, and Cloudflare Zone CDN)
npm run cache:purge

# Purge local development cache bindings
npm run cache:purge -- --local

# Dry-run: simulate all purge actions without executing deletions
npm run cache:purge -- --dry-run
```

#### Multi-Tier Purge Topology

The purge tool sequentially executes four cache clearance layers:

1. **Cloudflare KV Incremental Cache (`NEXT_INC_CACHE_KV`)**:
   Lists and bulk-deletes cached HTML and fetch fragments via Wrangler CLI (`wrangler kv key list` and `wrangler kv bulk delete`).
2. **Cloudflare D1 Tag Cache (`NEXT_TAG_CACHE_D1`)**:
   Truncates the revalidation index via Wrangler D1 (`DELETE FROM revalidations`) using non-interactive execution (`-y`).
3. **Next.js In-Memory & Tag Invalidation**:
   Dispatches an authenticated `{ purgeAll: true }` POST payload to `/api/revalidate`, resetting Next.js page controller layouts and master tags.
4. **Cloudflare Zone Edge CDN (Optional)**:
   Triggers a global `purge_everything` call against the Cloudflare Cache Purge API when `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` are configured.

## Development & Environment Setup

```bash
# 1. Enable git pre-push hooks once per clone
npm run prepare

# 2. Configure local environment secrets for Draft Mode / Visual Editing & Webhooks
cp web/.env.example web/.env.local
cp web/.dev.vars.example web/.dev.vars
# Populate SANITY_API_READ_TOKEN (Viewer token) and SANITY_REVALIDATE_SECRET in both files

# 3. Start the Studio (http://localhost:3333)
npm run dev:studio

# 4. Start the web app in a separate terminal (http://localhost:3000)
npm run dev:web
```

---

## Testing & Pre-Commit Protocol

**Rule:** Always run the relevant verification tier manually **before committing** changes, and allow the pre-push hook (`npm run verify`) to complete before pushing to `main` (which triggers Cloudflare Workers Builds).

### Which Command Should I Run Before Committing?

| What you changed | Required command before `git commit` | Typical runtime |
| :--- | :--- | :--- |
| **UI components, utilities, styles, or SVG sprites** (`web/src/`, `web/public/sprites.svg`) | `npm run check` | ~5s |
| **Sanity schemas or GROQ queries** (`studio/schemaTypes/`, `defineQuery` in `web/src/`) | `npm run typegen && npm run check` | ~8s |
| **Cloudflare / OpenNext / Next.js / build or deploy config** (`wrangler.jsonc`, `open-next.config.ts`, `next.config.ts`, `package.json`) | `npm run verify` | ~30–45s |
| **Before pushing to remote (`git push`)** | `npm run verify` *(also runs automatically via `.githooks/pre-push`)* | ~30–45s |

---

### Verification Tiers Explained

1. **Tier 1 — Static & Infrastructure Contract Checks (`npm run typecheck`, `npm run lint`, `web/tests/deployment-contract.test.ts`)**
   - TypeScript (`tsc --noEmit`) and ESLint across both `web/` and `studio/`.
   - **OpenNext ↔ Wrangler Binding Parity**: Ensures that if `open-next.config.ts` enables `kvIncrementalCache` or `d1NextTagCache`, `web/wrangler.jsonc` declares matching `NEXT_INC_CACHE_KV` / `NEXT_TAG_CACHE_D1` bindings with non-empty IDs.
   - **Worker Contract & Secrets Guard**: Verifies `WORKER_SELF_REFERENCE` matches the Worker `name`, `nodejs_compat` and Workers Observability (Logs + Traces) are enabled, `initOpenNextCloudflareForDev()` is guarded for development only, build scripts cannot recurse infinitely, and no secret tokens are hardcoded in `wrangler.jsonc` `vars`.

2. **Tier 2 — Unit, Component, Design System & Schema Drift Tests (`npm test`)**
   - **Design System Contract (`web/tests/design-system-contract.test.ts`)**: Verifies 1-to-1 parity between every `IconName` in `web/src/components/ui/Icon.tsx` and every `<symbol id>` in `web/public/sprites.svg`, plus CSS `@layer` cascade ordering (`reset, tokens, base, components, utilities`).
   - **Components & Pages (`web/tests/components-and-pages.test.tsx`)**: Tests `<Icon />`, `<HandDrawnArrow />` 5-variant rotation, `<SiteFooter />`, `<HomePage />`, `<ArticlePage />`, `generateStaticParams()`, and formatting utilities (`web/src/lib/format.ts`).
   - **Dynamic Sanity Schema & TypeGen Sync (`web/tests/sanity-schema-sync.test.ts`)**: Dynamically checks that every schema/field in `studio/schemaTypes/` is extracted into `studio/schema.json` and every `defineQuery()` in `web/src/` has a generated result type in `web/sanity.types.ts`.

3. **Tier 3 — Worker Build, Wrangler Dry-Run & Live `workerd` Smoke Test (`npm run test:smoke`)**
   - Runs `opennextjs-cloudflare build` and verifies `.open-next/worker.js` and static assets are produced.
   - Runs `wrangler deploy --dry-run` to validate Worker bindings and verify the gzipped Worker bundle stays below Cloudflare's `3072 KiB` (3 MiB) Free Tier limit.
   - Boots the compiled Worker locally inside Cloudflare's `workerd` runtime on an ephemeral port and runs live HTTP assertions (`GET /` → `200`, `GET /sprites.svg` → `200`, `GET /sprites-preview` → `200`, `GET /contents` → `200`, `GET /__non_existent_smoke_slug_404__` → `404`, `GET /api/draft-mode/disable` → `307`, `POST /api/revalidate` → `401`).
   - *Tip:* If `.open-next/worker.js` is already built and you only want to re-run the dry-run and `workerd` assertions without rebuilding Next.js, run `node web/scripts/smoke-test-worker.mjs --skip-build`.

### Git Pre-Push Hook

Enable the tracked `.githooks/pre-push` hook once per clone:

```bash
npm run prepare
```

*(If you are pushing a documentation-only or WIP branch and need to skip the full Worker build, run `SKIP_SMOKE=1 git push` to run only fast Tier 1 + Tier 2 checks.)*
