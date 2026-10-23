#!/usr/bin/env node
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");

const FREE_TIER_GZIP_LIMIT_KB = 3072; // 3 MiB Cloudflare Workers Free Plan limit
const skipBuild = process.argv.includes("--skip-build");

function log(step, msg) {
  console.log(`\x1b[36m[smoke:${step}]\x1b[0m ${msg}`);
}

function fail(step, msg) {
  console.error(`\x1b[31m[smoke:${step} FAILED]\x1b[0m ${msg}`);
  process.exit(1);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      const port = typeof address === "object" && address ? address.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for workerd at ${url} after ${timeoutMs}ms`);
}

async function main() {
  // 1. OpenNext Build
  const workerPath = path.join(WEB_ROOT, ".open-next/worker.js");
  if (!skipBuild || !fs.existsSync(workerPath)) {
    log("build", "Running opennextjs-cloudflare build...");
    execFileSync("npx", ["opennextjs-cloudflare", "build"], {
      cwd: WEB_ROOT,
      stdio: "inherit",
    });
  } else {
    log("build", "Skipping build (--skip-build set and .open-next/worker.js exists)");
  }

  if (!fs.existsSync(workerPath)) {
    fail("build", ".open-next/worker.js was not produced by build.");
  }

  const spritesAssetPath = path.join(WEB_ROOT, ".open-next/assets/sprites.svg");
  if (!fs.existsSync(spritesAssetPath)) {
    fail("build", ".open-next/assets/sprites.svg is missing from static assets output.");
  }

  // 2. Wrangler Dry-Run Packaging & Bundle Budget Check
  log("dry-run", "Validating Worker bundle and bindings with 'wrangler deploy --dry-run'...");
  const dryRunDir = path.join(WEB_ROOT, ".open-next/.dry-run");
  try {
    const dryRunOutput = execFileSync(
      "npx",
      ["wrangler", "deploy", "--dry-run", "--outdir", dryRunDir],
      {
        cwd: WEB_ROOT,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    // Check gzipped size from Wrangler output (e.g., "Total Upload: 4500.00 KiB / gzip: 950.00 KiB")
    const gzipMatch = dryRunOutput.match(/gzip:\s*([\d.]+)\s*KiB/i);
    if (gzipMatch) {
      const gzipKiB = parseFloat(gzipMatch[1]);
      log(
        "dry-run",
        `Worker bundle gzipped size: ${gzipKiB.toFixed(1)} KiB (Free Tier limit: ${FREE_TIER_GZIP_LIMIT_KB} KiB)`
      );
      if (gzipKiB > FREE_TIER_GZIP_LIMIT_KB) {
        fail(
          "dry-run",
          `Gzipped bundle (${gzipKiB} KiB) exceeds Cloudflare Free Tier limit (${FREE_TIER_GZIP_LIMIT_KB} KiB)!`
        );
      }
    } else {
      // Fallback: compute gzip size of dry-run worker.js
      const bundledWorker = path.join(dryRunDir, "worker.js");
      if (fs.existsSync(bundledWorker)) {
        const gzipBytes = zlib.gzipSync(fs.readFileSync(bundledWorker)).byteLength;
        const gzipKiB = gzipBytes / 1024;
        log("dry-run", `Dry-run worker.js gzipped size: ${gzipKiB.toFixed(1)} KiB`);
      }
    }

    if (!dryRunOutput.includes("env.ASSETS") || !dryRunOutput.includes("env.WORKER_SELF_REFERENCE")) {
      fail(
        "dry-run",
        `Wrangler dry-run output missing expected bindings (env.ASSETS / env.WORKER_SELF_REFERENCE):\n${dryRunOutput}`
      );
    }
    log("dry-run", "Wrangler dry-run packaging & binding validation succeeded.");
  } finally {
    fs.rmSync(dryRunDir, { recursive: true, force: true });
  }

  // 3. Live Runtime Smoke Test inside local workerd via Wrangler
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  log("runtime", `Booting compiled Worker in workerd on ${baseUrl}...`);

  const child = spawn(
    "npx",
    [
      "wrangler",
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--show-interactive-dev-session=false",
      "--log-level",
      "error",
    ],
    {
      cwd: WEB_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    }
  );

  let stderrBuf = "";
  child.stderr?.on("data", (chunk) => {
    stderrBuf += chunk.toString();
  });

  try {
    await waitForServer(`${baseUrl}/sprites.svg`);
    log("runtime", "workerd is up. Running HTTP smoke assertions...");

    // Assertion A: Static asset serving (/sprites.svg)
    const spriteRes = await fetch(`${baseUrl}/sprites.svg`);
    if (spriteRes.status !== 200) {
      fail("runtime", `GET /sprites.svg returned status ${spriteRes.status} (expected 200)`);
    }
    const spriteBody = await spriteRes.text();
    if (!spriteBody.includes('id="star-four-1"') || !spriteBody.includes('id="arrow-right-1"')) {
      fail("runtime", "GET /sprites.svg response did not contain expected SVG symbols.");
    }
    log("runtime", "✓ GET /sprites.svg -> 200 OK (SVG symbols verified)");

    // Assertion B: Home page SSR/prerendered route (/)
    const homeRes = await fetch(`${baseUrl}/`);
    if (homeRes.status !== 200) {
      fail("runtime", `GET / returned status ${homeRes.status} (expected 200)`);
    }
    const homeHtml = await homeRes.text();
    if (!homeHtml.includes("sheet-content") || !homeHtml.includes("Oliver")) {
      fail("runtime", "GET / HTML did not contain expected layout (.sheet-content / Oliver).");
    }
    log("runtime", "✓ GET / -> 200 OK (Victorian parchment layout verified)");

    // Assertion C: Sprites preview route (/sprites-preview)
    const previewRes = await fetch(`${baseUrl}/sprites-preview`);
    if (previewRes.status !== 200) {
      fail(
        "runtime",
        `GET /sprites-preview returned status ${previewRes.status} (expected 200)`
      );
    }
    log("runtime", "✓ GET /sprites-preview -> 200 OK");

    // Assertion D: Unknown article slug returns 404
    const notFoundRes = await fetch(`${baseUrl}/__non_existent_smoke_slug_404__`);
    if (notFoundRes.status !== 404) {
      fail(
        "runtime",
        `GET /__non_existent_smoke_slug_404__ returned status ${notFoundRes.status} (expected 404)`
      );
    }
    log("runtime", "✓ GET /__non_existent_smoke_slug_404__ -> 404 Not Found");

    log("done", "All Worker build, dry-run, and live runtime smoke checks passed!");
  } catch (err) {
    fail(
      "runtime",
      `${err instanceof Error ? err.message : String(err)}\nworkerd stderr:\n${stderrBuf}`
    );
  } finally {
    try {
      if (child.pid) {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {
      child.kill("SIGTERM");
    }
  }
}

main();
