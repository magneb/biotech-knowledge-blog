import openNextHandler from "./.open-next/worker.js";
export * from "./.open-next/worker.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderVictorian503Response(title: string, message: string): Response {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} — Oliver's Guide To Everything</title>
  <style>
    :root {
      --parchment: #f4ead5;
      --desk: #23201c;
      --ink: #110a04;
      --sepia: #1f1208;
      --sepia-faint: #8a7560;
      --gold: #8b6914;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--desk);
      color: var(--ink);
      font-family: "Cormorant Garamond", "Palatino Linotype", Georgia, serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .sheet {
      background-color: var(--parchment);
      border: 3px double var(--sepia-faint);
      box-shadow: 0 20px 45px -12px rgba(8, 6, 4, 0.7), inset 0 0 25px rgba(139, 105, 20, 0.06);
      max-width: 640px;
      width: 100%;
      padding: 3rem 2.5rem;
      text-align: center;
    }
    .finial { color: var(--gold); font-size: 1.5rem; letter-spacing: 0.5em; margin-bottom: 1rem; }
    h1 {
      font-size: 2.2rem;
      font-weight: 600;
      color: var(--ink);
      line-height: 1.25;
      margin-bottom: 1.25rem;
      letter-spacing: 0.02em;
    }
    .rule {
      height: 1px;
      background: linear-gradient(to right, transparent, var(--sepia-faint), transparent);
      margin: 1.25rem auto;
      width: 80%;
    }
    p {
      font-size: 1.15rem;
      line-height: 1.65;
      color: var(--sepia);
      margin-bottom: 1.5rem;
    }
    .status-badge {
      display: inline-block;
      border: 1px solid var(--sepia-faint);
      padding: 0.25rem 0.75rem;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--sepia-faint);
      margin-bottom: 1.5rem;
    }
    .footer {
      font-size: 0.85rem;
      color: var(--sepia-faint);
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="finial">✦ ✦ ✦</div>
    <div class="status-badge">Notice of Maintenance &middot; HTTP 503</div>
    <h1>${safeTitle}</h1>
    <div class="rule"></div>
    <p>${safeMessage}</p>
    <div class="rule"></div>
    <div class="footer">Oliver's Guide To Everything &middot; Archival Preservation</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
      "Retry-After": "3600",
    },
  });
}

export interface WorkerEnv {
  NEXT_INC_CACHE_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
  [key: string]: unknown;
}

const worker = {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Static brand assets & Next.js static bundles bypass 503
    if (
      path === "/sprites.svg" ||
      path.startsWith("/art/") ||
      path.startsWith("/_next/static/") ||
      path === "/favicon.ico" ||
      path === "/robots.txt" ||
      path === "/sitemap.xml"
    ) {
      return openNextHandler.fetch(request, env, ctx);
    }

    // 2. Operational endpoints bypass 503
    if (path === "/api/revalidate" || path.startsWith("/api/draft-mode/")) {
      return openNextHandler.fetch(request, env, ctx);
    }

    // 3. Active Next.js Draft Mode preview sessions bypass 503
    const cookie = request.headers.get("cookie") || "";
    if (cookie.includes("__prerender_bypass") || cookie.includes("sanity-preview")) {
      return openNextHandler.fetch(request, env, ctx);
    }

    // 4. Evaluate site:ops:maintenance KV flag ahead of OpenNext cache interception
    if (env && env.NEXT_INC_CACHE_KV) {
      try {
        const raw = await env.NEXT_INC_CACHE_KV.get("site:ops:maintenance");
        if (raw) {
          let enabled = false;
          let title = "Undergoing Scholarly Revision";
          let message =
            "The compendium is temporarily closed for cataloguing, binding, and archival preservation. Please return shortly.";

          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "boolean") {
              enabled = parsed;
            } else if (typeof parsed === "object" && parsed !== null) {
              enabled = Boolean(parsed.enabled);
              if (parsed.title) title = String(parsed.title);
              if (parsed.message) message = String(parsed.message);
            }
          } catch {
            enabled = raw.trim().toLowerCase() === "true";
          }

          if (enabled) {
            return renderVictorian503Response(title, message);
          }
        }
      } catch (err) {
        console.error("Worker 503 killswitch KV check failed:", err);
      }
    }

    // 5. Normal traffic passes through to OpenNext
    return openNextHandler.fetch(request, env, ctx);
  },
};

export default worker;
