#!/usr/bin/env node
/**
 * Architecture Rule Gate
 *
 * Enforces the 350-LOC cap, the single color-token source, and the purity of
 * @wargame/game-rules. The purity check allows runtime imports only from
 * relative modules or @wargame/shared, and rejects host-clock, random, Node,
 * and browser globals. Test files are exempt from the purity import rule
 * because they use Vitest, but production runtime files are not.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const MAX_LOC = 350;
const SCANNED_DIRS = ["apps", "packages"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Paths allowed to define raw colors (the design token layer only)
const COLOR_ALLOWLIST_PATTERNS = [
  "packages/ui/src/index.ts",
  "packages/ui/src/tokens/",
  ".test.ts",
  ".spec.ts"
];

const GAME_RULES_RUNTIME_PREFIX = "packages/game-rules/src/";
const GAME_RULES_ALLOWED_SPECIFIERS = new Set(["@wargame/shared"]);
const GAME_RULES_TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const STATIC_IMPORT_SPECIFIER =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_SPECIFIER = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
const GAME_RULES_FORBIDDEN_GLOBALS = [
  { pattern: /\bMath\.random\s*\(/, label: "Math.random()" },
  { pattern: /\bDate\.now\s*\(/, label: "Date.now()" },
  { pattern: /\bnew\s+Date\s*\(/, label: "new Date()" },
  { pattern: /\bperformance\.now\s*\(/, label: "performance.now()" },
  { pattern: /\bcrypto\.randomUUID\s*\(/, label: "crypto.randomUUID()" },
  {
    pattern: /\b(?:window|document|localStorage|sessionStorage|XMLHttpRequest)\b/,
    label: "browser global"
  },
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\bprocess\./, label: "Node process global" },
  { pattern: /\bBuffer\./, label: "Node Buffer global" },
  { pattern: /\brequire\s*\(/, label: "CommonJS require()" }
];

function getFiles(dir) {
  const fullDir = resolve(rootDir, dir);
  let results = [];
  try {
    const list = readdirSync(fullDir);
    for (const file of list) {
      if (file === "node_modules" || file === "dist" || file === ".turbo" || file === "coverage") {
        continue;
      }
      const fullPath = resolve(fullDir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(relative(rootDir, fullPath)));
      } else {
        results.push(relative(rootDir, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch {
    // Directory might not exist yet, ignore
  }
  return results;
}

function checkRules() {
  console.log(
    "🔍 Checking architecture constraints (No God Files + No Hardcoded Colors + Pure game-rules)..."
  );
  const errors = [];
  let checkedCount = 0;

  const colorRegex = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g;

  for (const dir of SCANNED_DIRS) {
    const files = getFiles(dir);

    for (const file of files) {
      const ext = extname(file);
      if (!ALLOWED_EXTS.has(ext)) {
        continue;
      }

      checkedCount++;
      const fullPath = resolve(rootDir, file);
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      // 1. Check max LOC (Cap limit: 350 lines)
      if (lines.length > MAX_LOC) {
        errors.push(
          `[GOD-FILE] ${file} exceeds ${MAX_LOC} LOC cap limit (${lines.length} lines). Break into smaller modules.`
        );
      }

      // 2. Check for hardcoded colors outside token layer
      const isAllowedColorFile = COLOR_ALLOWLIST_PATTERNS.some((pat) => file.includes(pat));
      if (!isAllowedColorFile) {
        lines.forEach((line, idx) => {
          // Skip comments
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            return;
          }
          const matches = line.match(colorRegex);
          if (matches) {
            errors.push(
              `[HARDCODED-COLOR] ${file}:${idx + 1} contains raw color "${matches.join(", ")}". Use semantic tokens from @wargame/ui.`
            );
          }
        });
      }

      // 3. Enforce pure game-rules runtime boundaries
      if (isGameRulesRuntimeFile(file)) {
        const code = stripComments(content);

        for (const specifier of collectImportSpecifiers(code)) {
          if (specifier.startsWith(".") || GAME_RULES_ALLOWED_SPECIFIERS.has(specifier)) {
            continue;
          }
          errors.push(
            `[GAME-RULES-BOUNDARY] ${file} imports "${specifier}". Runtime code may import only relative modules or @wargame/shared.`
          );
        }

        for (const rule of GAME_RULES_FORBIDDEN_GLOBALS) {
          if (rule.pattern.test(code)) {
            errors.push(
              `[GAME-RULES-DETERMINISM] ${file} uses ${rule.label}. Inject state, seeds, and timestamps instead.`
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Architecture check failed with ${errors.length} violation(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✅ Success: ${checkedCount} source files verified against God-File cap (≤${MAX_LOC} LOC), color token rules, and game-rules purity with 0 errors.`
  );
}

function isGameRulesRuntimeFile(file) {
  return file.startsWith(GAME_RULES_RUNTIME_PREFIX) && !GAME_RULES_TEST_FILE.test(file);
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function collectImportSpecifiers(code) {
  const specifiers = new Set();

  for (const pattern of [STATIC_IMPORT_SPECIFIER, DYNAMIC_IMPORT_SPECIFIER]) {
    for (const match of code.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return specifiers;
}

checkRules();
