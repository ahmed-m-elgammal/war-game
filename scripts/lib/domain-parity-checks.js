/**
 * Plan-to-package parity checks for domain symbols, interfaces and closed sets.
 *
 * Each check receives the report hooks owned by the CLI entry point and appends
 * failures without exiting. Checks never mutate inputs or read additional files.
 */

import { collectLiteralSets, findArrayDifference } from "./contract-inputs.js";
import { describeInterface } from "./ts-ast.js";

export function checkSymbolCoverage({ planDeclarations, sharedDeclarations, report }) {
  console.log("\n[1/6] Plan symbol coverage in packages/shared/src...");
  let localFailures = 0;
  const fail = (message, node, details) => {
    localFailures += 1;
    report.fail(message, node, details);
  };
  for (const [name, source] of planDeclarations) {
    const target = sharedDeclarations.get(name);
    if (!target) {
      fail(`Missing "${name}" (${source.kind}) in packages/shared/src`, source.node);
    } else if (target.kind !== source.kind) {
      fail(
        `Symbol "${name}" is ${source.kind} in plan but ${target.kind} in ${target.sourceFile.fileName}`,
        source.node
      );
    }
  }
  report.info(
    `${planDeclarations.size} plan symbols checked against ${sharedDeclarations.size} shared symbols.`
  );
  if (localFailures === 0) {
    report.pass(`All ${planDeclarations.size} plan symbols resolve to the same declaration kind.`);
  }
}

export function checkInterfaceParity({
  planInterfaces,
  domainDeclarations,
  planExpand,
  sharedExpand,
  report
}) {
  console.log("\n[2/6] Two-way interface parity (plan vs packages/shared/src/domain)...");
  for (const [name, source] of planInterfaces) {
    const target = domainDeclarations.get(name);
    if (!target || target.kind !== "interface") {
      report.fail(`Missing interface "${name}" in packages/shared/src/domain`, source.node);
      continue;
    }
    const sourceShape = describeInterface(source.node, planExpand);
    const targetShape = describeInterface(target.node, sharedExpand);
    if (JSON.stringify(sourceShape.typeParameters) !== JSON.stringify(targetShape.typeParameters)) {
      report.fail(
        `Interface ${name} type parameters differ`,
        source.node,
        `      plan: ${sourceShape.typeParameters.join(" | ")}\n      code: ${targetShape.typeParameters.join(" | ")}`
      );
    }
    if (JSON.stringify(sourceShape.heritage) !== JSON.stringify(targetShape.heritage)) {
      report.fail(
        `Interface ${name} heritage differs`,
        source.node,
        `      plan: ${sourceShape.heritage.join(" | ")}\n      code: ${targetShape.heritage.join(" | ")}`
      );
    }
    for (const [propertyName, sourceProperty] of sourceShape.properties) {
      const targetProperty = targetShape.properties.get(propertyName);
      if (!targetProperty) {
        report.fail(`Interface ${name} is missing property "${propertyName}"`, source.node);
        continue;
      }
      if (sourceProperty.optional !== targetProperty.optional) {
        report.fail(
          `Interface ${name}.${propertyName} optionality differs (plan ${sourceProperty.optional}, code ${targetProperty.optional})`,
          source.node
        );
      }
      if (sourceProperty.readonly !== targetProperty.readonly) {
        report.fail(
          `Interface ${name}.${propertyName} readonly differs (plan ${sourceProperty.readonly}, code ${targetProperty.readonly})`,
          source.node
        );
      }
      if (sourceProperty.type !== targetProperty.type) {
        report.fail(
          `Interface ${name}.${propertyName} type differs`,
          source.node,
          `      plan: ${sourceProperty.type}\n      code: ${targetProperty.type}`
        );
      }
    }
    for (const propertyName of targetShape.properties.keys()) {
      if (!sourceShape.properties.has(propertyName)) {
        report.fail(
          `Interface ${name} has extra property "${propertyName}" in packages/shared/src/domain`,
          target.node
        );
      }
    }
  }
  for (const [name, declaration] of domainDeclarations) {
    if (declaration.kind === "interface" && !planInterfaces.has(name)) {
      report.fail(
        `Interface "${name}" exists in packages/shared/src/domain but not in the plan`,
        declaration.node
      );
    }
  }
  report.info(
    `${planInterfaces.size} interfaces compared property-for-property in both directions.`
  );
}

export function checkClosedSets({ planSets, protocolDeclarations, report }) {
  console.log("\n[3/6] Closed value-set parity (plan vs protocol/enums.ts)...");
  const codeSets = collectLiteralSets(protocolDeclarations);
  for (const [name, source] of planSets) {
    const target = codeSets.get(name);
    if (!target) {
      report.fail(`Missing closed set "${name}" in protocol/enums.ts`, source.node);
      continue;
    }
    if (JSON.stringify(source.values) !== JSON.stringify(target.values)) {
      const index = findArrayDifference(source.values, target.values);
      report.fail(
        `Closed set "${name}" values differ at index ${index}`,
        source.node,
        `      plan: ${JSON.stringify(source.values)}\n      code: ${JSON.stringify(target.values)}`
      );
    }
  }
  for (const [name, target] of codeSets) {
    if (!planSets.has(name)) {
      report.fail(
        `Closed set "${name}" exists in protocol/enums.ts but not in the plan`,
        target.node
      );
    }
  }
  report.info(`${planSets.size} closed sets checked, ${codeSets.size} found in protocol/enums.ts.`);
}
