# Agent Instructions

## Decision Log

Read `DECISIONLOG.md` before making architectural or structural changes. Each entry records a decision, its date, and the premises that justified it. Do not revisit or reverse a decision unless:

- One or more of its stated premises have changed, or
- There is concrete new information suggesting the decision should be reconsidered

If you do revisit a decision, update the entry in `DECISIONLOG.md` with the new reasoning and date.

## Testing & Pre-Commit Protocol

Always run the relevant verification tier manually **before committing** any code or configuration changes:

1. **Code, UI components, styles, or SVG sprites (`web/src/`, `web/public/`):**
   - Run `npm run check` (runs `tsc --noEmit` and `eslint` in both `web/` and `studio/`, plus the Vitest unit and contract test suites).
2. **Sanity schemas or GROQ queries (`studio/schemaTypes/`, `defineQuery` in `web/src/`):**
   - Run `npm run typegen && npm run check` so `studio/schema.json` and `web/sanity.types.ts` stay in sync with schema and query changes.
3. **Cloudflare / OpenNext / Next.js / build or deploy config (`wrangler.jsonc`, `open-next.config.ts`, `next.config.ts`, `package.json`):**
   - Run `npm run verify` (runs `npm run check` followed by `npm run test:smoke`, which builds `.open-next/worker.js`, runs `wrangler deploy --dry-run`, and smoke-tests the live Worker inside `workerd`).
4. **Documentation, Markdown, and Agent Instructions (`*.md`, `AGENTS.md`, `DECISIONLOG.md`, `.agents/`):**
   - Verification suites may be safely skipped when changes are exclusively documentation, markdown notes, or agent instructions, as these changes do not affect runtime code or build output.

## Git Commit Attribution

When working on features or fixes, use a seperate branch, commit often and let the oerator approve the merge back to main. You are allowed to merge back to main but the operator apreciates you laying it out for him before we merge. 

## Sandbox Execution Notes

- **Runs cleanly inside Standard Sandbox (`BypassSandbox: false`):**
  - `npm run typegen`, `npm run check` (`tsc`, `eslint`, `vitest`), and read-only `git` commands (`git status`, `git log`, `git diff`).
- **Pre-Approved for Direct `BypassSandbox: true` (No Sandbox Retry Required):**
  You are explicitly authorized by the user to run the following commands **directly with `BypassSandbox: true`** on the first attempt without trying `BypassSandbox: false` first:
  1. **Git write operations** (`git checkout`, `git add`, `git commit`, `git merge`, `git branch`, `git push`, `git pull`) because `.git/` is mounted read-only inside the Linux sandbox.
  2. **Live `workerd` runtime smoke test** (`node web/scripts/smoke-test-worker.mjs --skip-build`) because the sandbox blocks local port binding needed by `wrangler dev --local`.
  3. **Next.js / Cloudflare Worker build** (`npm run build` or `npm --prefix web run build`) because Next.js Turbopack downloads Google Fonts (`fonts.googleapis.com`) across the network to compile font packages. Always run `npm run check` inside the sandbox first (`BypassSandbox: false`), then run `npm run build` and `node web/scripts/smoke-test-worker.mjs --skip-build` with `BypassSandbox: true`.
- **Discovering New `BypassSandbox: true` Commands:**
  Whenever a new command fails in Standard Sandbox Mode (`BypassSandbox: false`) and requires `BypassSandbox: true` to succeed, **briefly summarize for the user why the sandbox blocked it** (e.g., network access, port binding, or read-only path) and **ask the user if you should add that command to the Pre-Approved list above in `AGENTS.md`** so future sessions can skip the fail-retry loop.

## Project Context

- **Project:** Oliver's Guide To Everything — a personal knowledge base for biotech and cancer research protocols
- **Sanity Project ID:** 9bx84ykf | **Dataset:** production
- **Monorepo:** `studio/` (Sanity Studio, standalone) + `web/` (Next.js frontend)
- **Hosting target:** Cloudflare Workers via `@opennextjs/cloudflare`
