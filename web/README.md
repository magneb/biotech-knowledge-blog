# Oliver's Guide To Everything — Web (`web/`)

Next.js frontend deployed to Cloudflare Workers via `@opennextjs/cloudflare`.

## Commands

Run from either the repository root or `web/`:

```bash
# Local development server (http://localhost:3000)
npm run dev

# Fast static + unit + contract checks (run before committing UI/code changes)
npm run check

# Run Vitest unit & contract tests in watch mode
npm run test:watch

# Full OpenNext Worker build + Wrangler dry-run + live workerd HTTP smoke test
npm run test:smoke

# Complete pre-deploy verification gate (check + test:smoke)
npm run verify
```

See the root [README.md](../README.md) for the full pre-commit and pre-push testing protocol.
