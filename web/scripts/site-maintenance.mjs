#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");

const isLocal = process.argv.includes("--local");
const targetFlag = isLocal ? "--local" : "--remote";

function log(step, msg) {
  console.log(`\x1b[36m[maintenance:${step}]\x1b[0m ${msg}`);
}

function fail(step, msg) {
  console.error(`\x1b[31m[maintenance:${step} ERROR]\x1b[0m ${msg}`);
  process.exit(1);
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const action = (args[0] || "status").toLowerCase();

const title =
  getArgValue("--title") || "Undergoing Scholarly Revision";
const message =
  getArgValue("--message") ||
  "The compendium is temporarily closed for cataloguing, binding, and archival preservation. Please return shortly.";

async function main() {
  log("init", `Executing maintenance action '${action}' (target: ${isLocal ? "LOCAL" : "REMOTE PRODUCTION"})...`);

  if (action === "on") {
    const payload = {
      enabled: true,
      title,
      message,
      updatedAt: new Date().toISOString(),
    };
    log("set", `Enabling maintenance mode in NEXT_INC_CACHE_KV: "${title}"`);
    try {
      execFileSync(
        "npx",
        [
          "wrangler",
          "kv",
          "key",
          "put",
          "--binding",
          "NEXT_INC_CACHE_KV",
          "site:ops:maintenance",
          JSON.stringify(payload),
          targetFlag,
        ],
        { cwd: WEB_ROOT, stdio: ["ignore", "pipe", "pipe"] }
      );
      log("done", "✓ Maintenance mode is now ACTIVE (HTTP 503 killswitch engaged).");
    } catch (err) {
      fail("set", `Failed to set maintenance mode in KV: ${err.message}`);
    }
  } else if (action === "off") {
    const payload = {
      enabled: false,
      title,
      message,
      updatedAt: new Date().toISOString(),
    };
    log("set", "Disabling maintenance mode in NEXT_INC_CACHE_KV...");
    try {
      execFileSync(
        "npx",
        [
          "wrangler",
          "kv",
          "key",
          "put",
          "--binding",
          "NEXT_INC_CACHE_KV",
          "site:ops:maintenance",
          JSON.stringify(payload),
          targetFlag,
        ],
        { cwd: WEB_ROOT, stdio: ["ignore", "pipe", "pipe"] }
      );
      log("done", "✓ Maintenance mode is now INACTIVE (normal site traffic restored).");
    } catch (err) {
      fail("set", `Failed to disable maintenance mode in KV: ${err.message}`);
    }
  } else if (action === "status") {
    log("get", "Querying site:ops:maintenance from NEXT_INC_CACHE_KV...");
    try {
      const raw = execFileSync(
        "npx",
        [
          "wrangler",
          "kv",
          "key",
          "get",
          "--binding",
          "NEXT_INC_CACHE_KV",
          "site:ops:maintenance",
          targetFlag,
        ],
        { cwd: WEB_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
      );

      if (!raw || raw.trim() === "") {
        console.log("\nStatus: INACTIVE (No KV flag configured)\n");
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { enabled: raw.trim().toLowerCase() === "true" };
      }

      const active = Boolean(parsed.enabled);
      console.log("\n════════════════════════════════════════════════════════════");
      console.log(` Status:       ${active ? "\x1b[31mACTIVE (503 MAINTENANCE)\x1b[0m" : "\x1b[32mINACTIVE (NORMAL BROWSING)\x1b[0m"}`);
      if (parsed.title) console.log(` Title:        ${parsed.title}`);
      if (parsed.message) console.log(` Message:      ${parsed.message}`);
      if (parsed.updatedAt) console.log(` Updated:      ${parsed.updatedAt}`);
      console.log("════════════════════════════════════════════════════════════\n");
    } catch (err) {
      if (err.message && (err.message.includes("404") || err.message.includes("not found"))) {
        console.log("\nStatus: INACTIVE (key not found in KV)\n");
      } else {
        fail("get", `Failed to query KV maintenance flag: ${err.message}`);
      }
    }
  } else {
    fail("usage", `Unknown action '${action}'. Valid actions: on, off, status.`);
  }
}

main().catch((err) => {
  console.error("Maintenance CLI failed:", err);
  process.exit(1);
});
