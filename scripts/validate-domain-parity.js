/**
 * Domain & Protocol Contract Validator
 *
 * Enforces the plan-to-package contract on the surfaces that can be compared
 * statically:
 *
 * 1. Every symbol exported by plan/schemas/domain.ts exists in packages/shared/src
 *    with the same declaration kind.
 * 2. Every domain interface matches its package counterpart in both directions:
 *    generics, heritage, property names, optionality, readonly and resolved types.
 * 3. Closed value sets ("as const" arrays) match enum.ts value-for-value, both ways.
 * 4. Branded IDs have a matching Zod brand schema and inferred type, both ways.
 * 5. The command payload registry covers COMMAND_TYPES exactly and every payload
 *    schema is strict.
 * 6. stateViewSchema mirrors StateView exactly, is strict, and public projections
 *    never expose exact-count fields.
 *
 * Scope: this validator checks source contracts only. Database rows, runtime config
 * values, map geometry and i18n catalogs are not covered here and need their own
 * checks. Exits 1 on any violation.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectAliasTexts, collectLiteralSets, loadPackageInputs } from "./lib/contract-inputs.js";
import {
  checkClosedSets,
  checkInterfaceParity,
  checkSymbolCoverage
} from "./lib/domain-parity-checks.js";
import {
  checkBrandedIds,
  checkCommandRegistry,
  checkStateView
} from "./lib/protocol-parity-checks.js";
import {
  collectExportedDeclarations,
  createTypeExpander,
  formatLocation,
  parseSourceFile,
  readBrandAlias
} from "./lib/ts-ast.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLAN_PATH = join(ROOT, "plan/schemas/domain.ts");
const SHARED_SRC = join(ROOT, "packages/shared/src");
const DOMAIN_DIR = join(SHARED_SRC, "domain");
const PROTOCOL_DIR = join(SHARED_SRC, "protocol");

const failures = [];

const report = {
  fail(message, node, details) {
    const location = node ? ` [${formatLocation(node)}]` : "";
    failures.push(`${message}${location}${details ? `\n${details}` : ""}`);
  },
  info(message) {
    console.log(`      ${message}`);
  },
  pass(message) {
    console.log(`✅ ${message}`);
  }
};

function collectPlanBrands(planDeclarations) {
  const brands = new Map();
  for (const [name, declaration] of planDeclarations) {
    const alias = declaration.kind === "type" ? readBrandAlias(declaration.node) : null;
    if (!alias) {
      continue;
    }
    if (alias.brand !== name) {
      report.fail(
        `Brand type "${name}" brands "${alias.brand}" instead of "${name}"`,
        declaration.node
      );
    }
    brands.set(name, { base: alias.base, node: declaration.node });
  }
  return brands;
}

function main() {
  console.log("=".repeat(79));
  console.log("WARGAME v1 — Domain & Protocol Contract Validator");
  console.log("=".repeat(79));

  const planDeclarations = collectExportedDeclarations(parseSourceFile(PLAN_PATH));
  const inputs = loadPackageInputs(SHARED_SRC, DOMAIN_DIR, PROTOCOL_DIR);
  const planBrands = collectPlanBrands(planDeclarations);
  const brandNames = new Set(planBrands.keys());
  const planInterfaces = new Map(
    [...planDeclarations].filter(([, declaration]) => declaration.kind === "interface")
  );
  const planSets = collectLiteralSets(planDeclarations);

  checkSymbolCoverage({
    planDeclarations,
    sharedDeclarations: inputs.sharedDeclarations,
    report
  });
  checkInterfaceParity({
    planInterfaces,
    domainDeclarations: inputs.domainDeclarations,
    planExpand: createTypeExpander(collectAliasTexts(planDeclarations), { skip: brandNames }),
    sharedExpand: createTypeExpander(collectAliasTexts(inputs.sharedDeclarations), {
      skip: brandNames
    }),
    report
  });
  checkClosedSets({
    planSets,
    protocolDeclarations: inputs.protocolEnums,
    report
  });
  checkBrandedIds({
    planBrands,
    idsDeclarations: inputs.protocolIds,
    report
  });
  checkCommandRegistry({
    planSets,
    commandDeclarations: inputs.protocolCommands,
    report
  });
  checkStateView({
    stateView: planInterfaces.get("StateView"),
    dtoDeclarations: inputs.protocolDtos,
    report
  });

  console.log(`\n${"=".repeat(79)}`);
  if (failures.length > 0) {
    console.error(`❌ CONTRACT AUDIT FAILED with ${failures.length} violation(s):`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(`${"=".repeat(79)}`);
    process.exit(1);
  }
  console.log("✅ CONTRACT AUDIT PASSED: plan and package agree on every checked surface.");
  console.log(`${"=".repeat(79)}`);
}

main();
