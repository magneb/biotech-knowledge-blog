# Oliver's Guide To Everything

A personal knowledge base for biotech and cancer research protocols.

## Structure

- `studio/` — Sanity Studio (standalone content management)
- `web/` — Next.js frontend deployed on Cloudflare Workers via `@opennextjs/cloudflare`

## Development

```bash
# Enable git hooks once per clone
npm run prepare

# Start the Studio (http://localhost:3333)
npm run dev:studio

# Start the web app in a separate terminal (http://localhost:3000)
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
   - Boots the compiled Worker locally inside Cloudflare's `workerd` runtime on an ephemeral port and runs live HTTP assertions (`GET /` → `200`, `GET /sprites.svg` → `200`, `GET /sprites-preview` → `200`, `GET /__non_existent_smoke_slug_404__` → `404`).

### Git Pre-Push Hook

Enable the tracked `.githooks/pre-push` hook once per clone:

```bash
npm run prepare
```

*(If you are pushing a documentation-only or WIP branch and need to skip the full Worker build, run `SKIP_SMOKE=1 git push` to run only fast Tier 1 + Tier 2 checks.)*
