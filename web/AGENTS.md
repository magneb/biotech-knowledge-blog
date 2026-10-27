<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Web Workspace Guidelines

## Frontend Aesthetics & Victorian Folio Design
- **Typography:** Use serif fonts (`var(--font-main)`) with editorial hierarchy. Avoid generic sans-serif fonts (Inter, Arial, Roboto).
- **Color & Theme:** Follow the Victorian letterpress / scholarly parchment aesthetic. Use semantic tokens defined in `src/styles/tokens.css` (`--parchment`, `--ink`, `--rust`, `--gold`, `--sepia`).
- **Victorian Embellishments:** Use etchings, copperplate borders, and star dividers from `src/components/ui/` (`EtchedFrame`, `StarDivider`, `HandDrawnArrow`, `ElementalPill`, `CopperplateButton`).
- **Icons & Graphics:** All icons must use SVG sprites (`/sprites.svg`). Do not introduce external icon packages (lucide-react, react-icons, heroicons).
- **Architecture & Modularity:**
  - Keep source files under 300 lines ceiling.
  - Decompose pages into Server Component entrypoints (`page.tsx`) and client filter/presentation wrappers (`*Frontispiece.tsx`, `*Compendium.tsx`).
  - Do not use top-level `await searchParams` on static routes (`/`, `/contents`) — use `<Suspense>` client wrappers with `useSearchParams()` to preserve Cloudflare Edge KV caching.
