#!/usr/bin/env node
/**
 * Game Config Gate
 *
 * Validates every approved config document under
 * packages/shared/config/game-config against the strict GameConfig schema and
 * the decision register in plan/tasks.json. A document must be `approved`,
 * cite only approved decisions, and produce a stable SHA-256 content hash.
 *
 * Zero documents is valid while the balance decisions in plan/03 §20.3 are
 * still open. The gate never invents or defaults a missing value.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_DIR = join(ROOT, "packages/shared/config/game-config");
const TASKS_PATH = join(ROOT, "plan/tasks.json");
const DIST_ENTRY = join(ROOT, "packages/shared/dist/config/game-config/index.js");

async function loadValidator() {
  if (!existsSync(DIST_ENTRY)) {
    throw new Error(
      `Compiled config module not found at ${DIST_ENTRY}. Run 'pnpm --filter @wargame/shared build' first.`
    );
  }
  return import(pathToFileURL(DIST_ENTRY).href);
}

function readDecisionRegister() {
  const tasks = JSON.parse(readFileSync(TASKS_PATH, "utf8"));
  return Array.isArray(tasks.decisions) ? tasks.decisions : [];
}

function readDocuments() {
  if (!existsSync(CONFIG_DIR)) {
    throw new Error(`Config document directory not found at ${CONFIG_DIR}`);
  }
  return readdirSync(CONFIG_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();
}

async function main() {
  console.log("🔍 Validating approved game config documents...");
  const { validateConfigDocument, computeConfigHash, formatConfigIssues } = await loadValidator();
  const decisions = readDecisionRegister();
  const files = readDocuments();
  const failures = [];
  const pins = new Map();

  for (const file of files) {
    let document;
    try {
      document = JSON.parse(readFileSync(join(CONFIG_DIR, file), "utf8"));
    } catch (error) {
      failures.push(`${file}: invalid JSON (${error.message})`);
      continue;
    }

    const result = validateConfigDocument(document, decisions);
    if (!result.ok) {
      failures.push(`${file}:\n${formatConfigIssues(result.issues)}`);
      continue;
    }

    const hash = await computeConfigHash(result.config);
    const previous = pins.get(result.config.configVersion);
    if (previous !== undefined && previous !== hash) {
      failures.push(
        `${file}: configVersion "${result.config.configVersion}" already pinned to a different hash`
      );
      continue;
    }
    pins.set(result.config.configVersion, hash);
    console.log(`✅ ${file} — configVersion ${result.config.configVersion} — sha256 ${hash}`);
  }

  if (failures.length > 0) {
    console.error(`❌ CONFIG GATE FAILED with ${failures.length} violation(s):`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("ℹ️  No approved config documents yet; seed values are pending P0-E1-T3.");
  }
  console.log(`✅ CONFIG GATE PASSED: ${files.length} document(s) validated.`);
}

main().catch((error) => {
  console.error(`❌ CONFIG GATE FAILED: ${error.message}`);
  process.exit(1);
});
