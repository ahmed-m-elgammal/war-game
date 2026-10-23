/**
 * Protocol-surface checks against the plan: branded IDs, command payloads and
 * the StateView projection.
 *
 * These checks guard the security-relevant boundary as well as naming parity:
 * public projections must keep bands instead of exact counts, and the command
 * registry must cover every command type with a strict payload schema.
 */

import { findArrayDifference } from "./contract-inputs.js";
import {
  describeInterface,
  isStrictZodSchema,
  normalizeTypeText,
  readBrand,
  readObjectKeys,
  unwrapZodObject
} from "./ts-ast.js";

export function checkBrandedIds({ planBrands, idsDeclarations, report }) {
  console.log("\n[4/6] Branded ID parity (plan vs protocol/ids.ts)...");
  for (const [name, source] of planBrands) {
    const schemaName = name.charAt(0).toLowerCase() + name.slice(1) + "Schema";
    const schema = idsDeclarations.get(schemaName);
    const codeBrand = schema && schema.kind === "const" ? readBrand(schema.node.initializer) : null;
    if (!codeBrand) {
      report.fail(`Missing branded schema "${schemaName}" for ${name}`, source.node);
      continue;
    }
    if (codeBrand.brand !== name) {
      report.fail(
        `Branded schema "${schemaName}" brands "${codeBrand.brand}" instead of "${name}"`,
        schema.node
      );
    }
    if (codeBrand.base !== source.base) {
      report.fail(
        `Branded schema "${schemaName}" base differs (plan ${source.base}, code ${codeBrand.base})`,
        schema.node
      );
    }
    const typeDeclaration = idsDeclarations.get(name);
    const expectedType = normalizeTypeText(`z.infer<typeof ${schemaName}>`);
    if (!typeDeclaration || typeDeclaration.kind !== "type") {
      report.fail(`Missing inferred type "${name}" in protocol/ids.ts`, source.node);
    } else if (normalizeTypeText(typeDeclaration.node.type.getText()) !== expectedType) {
      report.fail(
        `Type "${name}" must be z.infer<typeof ${schemaName}>`,
        typeDeclaration.node,
        `      code: ${normalizeTypeText(typeDeclaration.node.type.getText())}`
      );
    }
  }
  const knownSchemas = new Set(
    [...planBrands.keys()].map((name) => name.charAt(0).toLowerCase() + name.slice(1) + "Schema")
  );
  for (const [name, declaration] of idsDeclarations) {
    if (declaration.kind !== "const" || knownSchemas.has(name)) {
      continue;
    }
    if (readBrand(declaration.node.initializer)) {
      report.fail(
        `Branded schema "${name}" has no matching Brand type in the plan`,
        declaration.node
      );
    }
  }
  report.info(`${planBrands.size} branded IDs checked in both directions.`);
}

export function checkCommandRegistry({ planSets, commandDeclarations, report }) {
  console.log("\n[5/6] Command payload registry (protocol/commands.ts)...");
  const commandTypes = planSets.get("COMMAND_TYPES");
  if (!commandTypes) {
    report.fail("The plan does not export COMMAND_TYPES");
    return;
  }
  const registry = commandDeclarations.get("COMMAND_PAYLOAD_SCHEMAS");
  const registryKeys =
    registry && registry.kind === "const" ? readObjectKeys(registry.node.initializer) : null;
  if (!registryKeys) {
    report.fail("Missing COMMAND_PAYLOAD_SCHEMAS object literal in protocol/commands.ts");
  } else {
    const difference = findArrayDifference(commandTypes.values, registryKeys);
    if (difference !== -1) {
      report.fail(
        `COMMAND_PAYLOAD_SCHEMAS does not match COMMAND_TYPES at index ${difference}`,
        registry.node,
        `      plan: ${JSON.stringify(commandTypes.values)}\n      code: ${JSON.stringify(registryKeys)}`
      );
    }
  }
  if (!commandDeclarations.has("parseCommandPayload")) {
    report.fail("Missing parseCommandPayload dispatcher in protocol/commands.ts");
  }
  let payloadSchemaCount = 0;
  for (const [name, declaration] of commandDeclarations) {
    if (name.endsWith("PayloadSchema")) {
      payloadSchemaCount += 1;
      if (!isStrictZodSchema(declaration.node.initializer)) {
        report.fail(`Payload schema "${name}" is not .strict()`, declaration.node);
      }
    }
  }
  report.info(
    `${commandTypes.values.length} command types, ${payloadSchemaCount} payload schemas checked for strictness.`
  );
}

export function checkStateView({ stateView, dtoDeclarations, report }) {
  console.log("\n[6/6] StateView projection and fog-of-war shape (protocol/dtos.ts)...");
  const schema = dtoDeclarations.get("stateViewSchema");
  const schemaObject =
    schema && schema.kind === "const" ? unwrapZodObject(schema.node.initializer) : null;
  const schemaKeys = schemaObject ? readObjectKeys(schemaObject) : null;
  if (!stateView || !schema || !schemaKeys) {
    report.fail("Missing StateView interface or stateViewSchema object literal");
    return;
  }
  const expectedKeys = [...describeInterface(stateView.node, normalizeTypeText).properties.keys()];
  const difference = findArrayDifference(expectedKeys, schemaKeys);
  if (difference !== -1) {
    report.fail(
      `stateViewSchema does not match StateView at index ${difference}`,
      schema.node,
      `      plan: ${JSON.stringify(expectedKeys)}\n      code: ${JSON.stringify(schemaKeys)}`
    );
  }
  if (!isStrictZodSchema(schema.node.initializer)) {
    report.fail(
      "stateViewSchema must be .strict() to reject unknown projection fields",
      schema.node
    );
  }
  const forbidden = new Map([
    ["publicFactionSchema", ["resources", "research"]],
    ["publicArmySchema", ["units"]],
    ["publicRegionSchema", ["units"]]
  ]);
  for (const [name, forbiddenKeys] of forbidden) {
    const declaration = dtoDeclarations.get(name);
    const object =
      declaration && declaration.kind === "const"
        ? unwrapZodObject(declaration.node.initializer)
        : null;
    const keys = object ? readObjectKeys(object) : null;
    if (!keys) {
      report.fail(`Missing public projection schema "${name}"`);
      continue;
    }
    for (const key of forbiddenKeys) {
      if (keys.includes(key)) {
        report.fail(`Public projection "${name}" exposes exact field "${key}"`, declaration.node);
      }
    }
  }
  for (const name of ["publicArmySchema", "publicRegionSchema"]) {
    const declaration = dtoDeclarations.get(name);
    const object = declaration ? unwrapZodObject(declaration.node.initializer) : null;
    const keys = object ? readObjectKeys(object) : null;
    if (!keys || !keys.includes("troopBand")) {
      report.fail(`Public projection "${name}" must expose a troopBand instead of exact units`);
    }
  }
  report.info(
    `${expectedKeys.length} StateView fields compared; public projections checked for exact-count leakage.`
  );
}
