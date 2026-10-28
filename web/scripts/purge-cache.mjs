#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");

const isLocal = process.argv.includes("--local");
const isDryRun = process.argv.includes("--dry-run");
const skipApi = process.argv.includes("--skip-api");
const skipCdn = process.argv.includes("--skip-cdn");
const targetFlag = isLocal ? "--local" : "--remote";

function log(step, msg) {
  console.log(`\x1b[35m[purge:${step}]\x1b[0m ${msg}`);
}
function fail(step, msg) {
  console.error(`\x1b[31m[purge:${step} ERROR]\x1b[0m ${msg}`);
  process.exit(1);
}

function loadEnvSecret() {
  if (process.env.SANITY_REVALIDATE_SECRET?.trim()) {
    return process.env.SANITY_REVALIDATE_SECRET.trim();
  }
  const candidateFiles = [
    path.join(WEB_ROOT, ".env.local"),
    path.join(WEB_ROOT, ".env"),
    path.join(WEB_ROOT, ".dev.vars"),
    path.resolve(WEB_ROOT, "..", ".env.local"),
    path.resolve(WEB_ROOT, "..", ".env"),
  ];
  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(
        /^SANITY_REVALIDATE_SECRET=["']?([^"'\r\n]+)["']?/m
      );
      if (match && match[1]) return match[1].trim();
    }
  }
  return undefined;
}

async function main() {
  log(
    "init",
    `Starting full cache purge (target: ${isLocal ? "LOCAL" : "REMOTE PRODUCTION"})...`
  );

  // Step 1: Bulk Purge Cloudflare KV (NEXT_INC_CACHE_KV)
  log("kv", "Listing keys in NEXT_INC_CACHE_KV...");
  try {
    if (isDryRun) {
      log(
        "kv",
        `[DRY-RUN] Would list and bulk delete keys in NEXT_INC_CACHE_KV (${targetFlag})`
      );
    } else {
      const listRaw = execFileSync(
        "npx",
        ["wrangler", "kv", "key", "list", "--binding", "NEXT_INC_CACHE_KV", targetFlag],
        { cwd: WEB_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
      );
      const keys = JSON.parse(listRaw);
      if (Array.isArray(keys) && keys.length > 0) {
        log("kv", `Found ${keys.length} key(s) in KV. Purging...`);
        const keyNames = keys.map((k) => k.name);
        const tmpFile = path.join(os.tmpdir(), `kv-purge-${Date.now()}.json`);
        fs.writeFileSync(tmpFile, JSON.stringify(keyNames));
        try {
          execFileSync(
            "npx",
            [
              "wrangler",
              "kv",
              "bulk",
              "delete",
              tmpFile,
              "--binding",
              "NEXT_INC_CACHE_KV",
              "--force",
              targetFlag,
            ],
            { cwd: WEB_ROOT, stdio: ["ignore", "pipe", "pipe"] }
          );
        } finally {
          if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        }
        log("kv", `Successfully wiped ${keys.length} keys from NEXT_INC_CACHE_KV.`);
      } else {
        log("kv", "NEXT_INC_CACHE_KV is already empty.");
      }
    }
  } catch (err) {
    fail("kv", `Failed to purge KV namespace: ${err.message}`);
  }

  // Step 2: Clear D1 Tag Cache (NEXT_TAG_CACHE_D1)
  log("d1", "Clearing revalidations table in NEXT_TAG_CACHE_D1...");
  try {
    if (isDryRun) {
      log(
        "d1",
        `[DRY-RUN] Would execute DELETE FROM revalidations in NEXT_TAG_CACHE_D1 (${targetFlag})`
      );
    } else {
      execFileSync(
        "npx",
        [
          "wrangler",
          "d1",
          "execute",
          "NEXT_TAG_CACHE_D1",
          targetFlag,
          "-y",
          "--command",
          "CREATE TABLE IF NOT EXISTS revalidations (tag TEXT NOT NULL, revalidatedAt INTEGER NOT NULL, stale INTEGER, expire INTEGER default NULL, UNIQUE(tag) ON CONFLICT REPLACE); DELETE FROM revalidations;",
        ],
        { cwd: WEB_ROOT, stdio: ["ignore", "pipe", "pipe"] }
      );
      log("d1", "Successfully cleared tag revalidations in NEXT_TAG_CACHE_D1.");
    }
  } catch (err) {
    fail("d1", `Failed to clear D1 tag cache: ${err.message}`);
  }

  // Step 3: Trigger Authenticated { purgeAll: true } on /api/revalidate
  if (!skipApi) {
    const targetUrl =
      process.env.REVALIDATE_URL ||
      (isLocal
        ? "http://127.0.0.1:3000/api/revalidate"
        : "https://oliversguidetoeverything.com/api/revalidate");
    const secret = loadEnvSecret();

    if (!secret) {
      log(
        "api",
        "WARNING: SANITY_REVALIDATE_SECRET not found in env or .env.local. Skipping /api/revalidate call."
      );
    } else {
      log("api", `Triggering { purgeAll: true } against ${targetUrl}...`);
      if (isDryRun) {
        log("api", `[DRY-RUN] Would POST { purgeAll: true } to ${targetUrl}`);
      } else {
        try {
          const res = await fetch(targetUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${secret}`,
              "x-revalidate-secret": secret,
            },
            body: JSON.stringify({ purgeAll: true }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Endpoint returned HTTP ${res.status}: ${errorText}`);
          }
          const data = await res.json();
          log(
            "api",
            `Successfully triggered layout and tag purge (response: ${JSON.stringify(data)})`
          );
        } catch (err) {
          log(
            "api",
            `WARNING: Could not reach ${targetUrl} (${err.message}). KV & D1 were purged successfully.`
          );
        }
      }
    }
  }

  // Step 4: Purge Cloudflare Zone CDN (Optional)
  if (!skipCdn && !isLocal) {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (zoneId && apiToken) {
      log("cdn", `Triggering purge_everything for Cloudflare Zone ${zoneId}...`);
      if (isDryRun) {
        log(
          "cdn",
          `[DRY-RUN] Would POST purge_everything to Cloudflare Zone API for ${zoneId}`
        );
      } else {
        try {
          const res = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ purge_everything: true }),
            }
          );
          const cdnData = await res.json();
          if (!cdnData.success) {
            log(
              "cdn",
              `Cloudflare Zone purge warning: ${JSON.stringify(cdnData.errors)}`
            );
          } else {
            log("cdn", "Cloudflare Zone CDN cache purged successfully.");
          }
        } catch (err) {
          log("cdn", `Cloudflare Zone purge error: ${err.message}`);
        }
      }
    } else {
      log(
        "cdn",
        "Skipping Cloudflare Zone CDN purge (CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set)."
      );
    }
  }

  log("complete", "All requested cache tiers purged successfully.");
}

main().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});
