#!/usr/bin/env node
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
  console.log("🔍 Checking architecture constraints (No God Files + No Hardcoded Colors)...");
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
    `✅ Success: ${checkedCount} source files verified against God-File cap (≤${MAX_LOC} LOC) and color token rules with 0 errors.`
  );
}

checkRules();
