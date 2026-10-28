export interface WranglerConfig {
  name?: string;
  main?: string;
  compatibility_date?: string;
  compatibility_flags?: string[];
  assets?: {
    directory?: string;
    binding?: string;
  };
  services?: Array<{
    binding?: string;
    service?: string;
  }>;
  kv_namespaces?: Array<{
    binding?: string;
    id?: string;
  }>;
  d1_databases?: Array<{
    binding?: string;
    database_id?: string;
    database_name?: string;
  }>;
  observability?: {
    enabled?: boolean;
    logs?: {
      enabled?: boolean;
      head_sampling_rate?: number;
    };
    traces?: {
      enabled?: boolean;
      head_sampling_rate?: number;
    };
  };
  vars?: Record<string, unknown>;
}

export interface ValidationInput {
  wranglerConfig: WranglerConfig;
  openNextSource: string;
  nextConfigSource: string;
  packageJson: {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  eslintConfigSource: string;
  workerSource?: string;
}

/**
 * Validates the OpenNext + Cloudflare Wrangler + Next.js deployment configuration
 * and returns a list of human-readable error messages (empty array if valid).
 */
export function validateDeploymentConfig(input: ValidationInput): string[] {
  const errors: string[] = [];
  const {
    wranglerConfig,
    openNextSource,
    nextConfigSource,
    packageJson,
    eslintConfigSource,
    workerSource,
  } = input;

  // 1. Wrangler core entrypoint and assets contract
  if (!wranglerConfig.name || wranglerConfig.name.trim() === "") {
    errors.push("wrangler.jsonc: missing top-level 'name'.");
  }

  if (
    wranglerConfig.main !== "worker.ts" &&
    wranglerConfig.main !== ".open-next/worker.js"
  ) {
    errors.push(
      `wrangler.jsonc: 'main' must be 'worker.ts' (found '${wranglerConfig.main ?? "undefined"}').`
    );
  }

  if (wranglerConfig.main === "worker.ts" && workerSource !== undefined) {
    if (!workerSource || workerSource.trim() === "") {
      errors.push("worker.ts: outer entrypoint file must not be empty.");
    } else if (!workerSource.includes(".open-next/worker.js")) {
      errors.push("worker.ts: must import or delegate to '.open-next/worker.js'.");
    }
  }

  if (wranglerConfig.assets?.directory !== ".open-next/assets") {
    errors.push(
      `wrangler.jsonc: 'assets.directory' must be '.open-next/assets' (found '${wranglerConfig.assets?.directory ?? "undefined"}').`
    );
  }

  if (wranglerConfig.assets?.binding !== "ASSETS") {
    errors.push(
      `wrangler.jsonc: 'assets.binding' must be 'ASSETS' (found '${wranglerConfig.assets?.binding ?? "undefined"}').`
    );
  }

  // 2. Compatibility date & flags
  if (
    !wranglerConfig.compatibility_date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(wranglerConfig.compatibility_date)
  ) {
    errors.push(
      "wrangler.jsonc: 'compatibility_date' must be a valid YYYY-MM-DD date string."
    );
  }

  const flags = wranglerConfig.compatibility_flags ?? [];
  if (!flags.includes("nodejs_compat")) {
    errors.push(
      "wrangler.jsonc: 'compatibility_flags' must include 'nodejs_compat' for OpenNext."
    );
  }

  // 3. WORKER_SELF_REFERENCE binding must exist and match worker name
  const selfRef = (wranglerConfig.services ?? []).find(
    (s) => s.binding === "WORKER_SELF_REFERENCE"
  );
  if (!selfRef) {
    errors.push(
      "wrangler.jsonc: 'services' must include a 'WORKER_SELF_REFERENCE' binding."
    );
  } else if (selfRef.service !== wranglerConfig.name) {
    errors.push(
      `wrangler.jsonc: 'WORKER_SELF_REFERENCE.service' ('${selfRef.service}') must match worker 'name' ('${wranglerConfig.name}').`
    );
  }

  // 4. Observability (Workers Logs & Traces per workers-best-practices)
  if (!wranglerConfig.observability?.enabled) {
    errors.push(
      "wrangler.jsonc: 'observability.enabled' should be set to true for production diagnostics."
    );
  }
  if (!wranglerConfig.observability?.traces?.enabled) {
    errors.push(
      "wrangler.jsonc: 'observability.traces.enabled' should be set to true (top-level observability.enabled alone does not enable traces)."
    );
  }

  // 5. OpenNext cache overrides ↔ Wrangler bindings parity
  // Strip comments before checking active code in open-next.config.ts
  const activeOpenNextCode = stripComments(openNextSource);

  if (activeOpenNextCode.includes("kvIncrementalCache")) {
    const kvBinding = (wranglerConfig.kv_namespaces ?? []).find(
      (kv) => kv.binding === "NEXT_INC_CACHE_KV"
    );
    if (!kvBinding || !kvBinding.id || kvBinding.id.trim() === "") {
      errors.push(
        "open-next.config.ts uses 'kvIncrementalCache', but wrangler.jsonc is missing a 'kv_namespaces' binding with binding='NEXT_INC_CACHE_KV' and a non-empty 'id'."
      );
    }
  }

  if (activeOpenNextCode.includes("d1NextTagCache")) {
    const d1Binding = (wranglerConfig.d1_databases ?? []).find(
      (d1) => d1.binding === "NEXT_TAG_CACHE_D1"
    );
    if (
      !d1Binding ||
      !d1Binding.database_id ||
      d1Binding.database_id.trim() === ""
    ) {
      errors.push(
        "open-next.config.ts uses 'd1NextTagCache', but wrangler.jsonc is missing a 'd1_databases' binding with binding='NEXT_TAG_CACHE_D1' and a non-empty 'database_id'."
      );
    }
  }

  // 6. Build command recursion check (package.json <-> open-next.config.ts)
  const scripts = packageJson.scripts ?? {};
  const buildScript = scripts.build ?? "";

  if (!buildScript.includes("opennextjs-cloudflare build")) {
    errors.push(
      "package.json: 'scripts.build' must run 'opennextjs-cloudflare build' so Cloudflare Workers Builds produces '.open-next/worker.js'."
    );
  } else {
    // Since `npm run build` runs `opennextjs-cloudflare build`, open-next.config.ts MUST override buildCommand
    // to a script that runs `next build` directly, otherwise `opennextjs-cloudflare build` will invoke `npm run build` infinitely.
    const buildCmdMatch = activeOpenNextCode.match(
      /buildCommand\s*[:=]\s*["'`]([^"'`]+)["'`]/
    );
    if (!buildCmdMatch) {
      errors.push(
        "open-next.config.ts: must explicitly set 'buildCommand' (e.g. 'npm run build:next') when package.json 'scripts.build' invokes 'opennextjs-cloudflare build' to prevent infinite build recursion."
      );
    } else {
      const configuredBuildCmd = buildCmdMatch[1].trim();
      if (
        configuredBuildCmd === "npm run build" ||
        configuredBuildCmd.includes("opennextjs-cloudflare build")
      ) {
        errors.push(
          `open-next.config.ts: 'buildCommand' ('${configuredBuildCmd}') causes infinite recursion with package.json 'scripts.build'.`
        );
      }
      const npmRunMatch = configuredBuildCmd.match(/^npm run ([a-zA-Z0-9:_-]+)$/);
      if (npmRunMatch) {
        const targetScriptName = npmRunMatch[1];
        const targetScript = scripts[targetScriptName];
        if (!targetScript) {
          errors.push(
            `open-next.config.ts: 'buildCommand' references 'npm run ${targetScriptName}', but '${targetScriptName}' is not defined in package.json scripts.`
          );
        } else if (targetScript.includes("opennextjs-cloudflare")) {
          errors.push(
            `package.json: script '${targetScriptName}' ('${targetScript}') must not invoke 'opennextjs-cloudflare' (causes build recursion).`
          );
        }
      }
    }
  }

  // 7. next.config.ts: initOpenNextCloudflareForDev() must be guarded by NODE_ENV === "development"
  const activeNextConfig = stripComments(nextConfigSource);
  if (activeNextConfig.includes("initOpenNextCloudflareForDev(")) {
    const hasDevGuard =
      /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*["']development["']\s*\)\s*\{[^}]*initOpenNextCloudflareForDev\s*\(/.test(
        activeNextConfig
      );
    if (!hasDevGuard) {
      errors.push(
        "next.config.ts: 'initOpenNextCloudflareForDev()' must be guarded inside 'if (process.env.NODE_ENV === \"development\")' so it does not execute during production builds."
      );
    }
  }

  // 8. ESLint ignore check for generated OpenNext / Wrangler / Sanity artifacts
  for (const requiredIgnore of [
    ".open-next/**",
    ".wrangler/**",
    "sanity.types.ts",
  ]) {
    if (!eslintConfigSource.includes(requiredIgnore)) {
      errors.push(
        `eslint.config.mjs: globalIgnores must include '${requiredIgnore}' so linting does not fail after builds or typegen.`
      );
    }
  }

  // 9. Guard against committing secrets inside wrangler.jsonc 'vars'
  const vars = wranglerConfig.vars ?? {};
  for (const [key, value] of Object.entries(vars)) {
    if (
      /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)/i.test(key) &&
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      errors.push(
        `wrangler.jsonc: secret-like variable '${key}' must not be hardcoded in 'vars'. Use 'npx wrangler secret put ${key}' and '.dev.vars' locally.`
      );
    }
  }

  return errors;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}
