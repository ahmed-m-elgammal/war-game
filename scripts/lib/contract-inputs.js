/**
 * Shared input loading for repository contract validators.
 *
 * Owns file discovery, AST declaration indexing, alias-text collection and
 * literal-array extraction so individual check modules stay focused on policy
 * instead of filesystem or TypeScript plumbing.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { collectExportedDeclarations, parseSourceFile, readLiteralArray } from "./ts-ast.js";

export function listTypeScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [fullPath] : [];
  });
}

export function collectFromFiles(files) {
  const declarations = new Map();
  for (const file of files) {
    for (const [name, declaration] of collectExportedDeclarations(parseSourceFile(file))) {
      if (!declarations.has(name)) {
        declarations.set(name, declaration);
      }
    }
  }
  return declarations;
}

export function collectAliasTexts(declarations) {
  const aliases = new Map();
  for (const [name, declaration] of declarations) {
    if (declaration.kind === "type") {
      aliases.set(name, declaration.node.type.getText());
    }
  }
  return aliases;
}

export function collectLiteralSets(declarations) {
  const sets = new Map();
  for (const [name, declaration] of declarations) {
    if (declaration.kind !== "const") {
      continue;
    }
    const values = readLiteralArray(declaration.node.initializer);
    if (values) {
      sets.set(name, { values, node: declaration.node });
    }
  }
  return sets;
}

export function findArrayDifference(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return index;
    }
  }
  return -1;
}

export function loadPackageInputs(sharedSrc, domainDir, protocolDir) {
  return {
    sharedDeclarations: collectFromFiles(listTypeScriptFiles(sharedSrc)),
    domainDeclarations: collectFromFiles(listTypeScriptFiles(domainDir)),
    protocolEnums: collectFromFiles([join(protocolDir, "enums.ts")]),
    protocolIds: collectFromFiles([join(protocolDir, "ids.ts")]),
    protocolCommands: collectFromFiles([join(protocolDir, "commands.ts")]),
    protocolDtos: collectFromFiles([join(protocolDir, "dtos.ts")])
  };
}
