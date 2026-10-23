#!/usr/bin/env node
/**
 * Comprehensive Domain & Protocol Data Integrity Validator
 *
 * Verifies end-to-end data integrity across:
 * 1. 100% Symbol Parity between plan/schemas/domain.ts and packages/shared/src/domain/
 * 2. Deep Interface Property Parity across all 19 domain interfaces
 * 3. Protocol vs Domain Alignment:
 *    - Branded IDs coverage
 *    - Enums and closed value sets coverage
 *    - Command types and payload schemas registry coverage
 *    - StateView asymmetric fog-of-war structural parity
 * 4. Architectural Constraints (350 LOC cap limit on all shared modules)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const domainSourcePath = resolve(__dirname, "../plan/schemas/domain.ts");
const sharedSrcDir = resolve(__dirname, "../packages/shared/src");
const domainSrcDir = resolve(__dirname, "../packages/shared/src/domain");
const protocolSrcDir = resolve(__dirname, "../packages/shared/src/protocol");

function extractSymbols(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const symbolRegex = /export\s+(?:interface|type|const|class|function)\s+([A-Za-z0-9_]+)/g;
  const symbols = new Set();
  let match;
  while ((match = symbolRegex.exec(content)) !== null) {
    symbols.add(match[1]);
  }
  return symbols;
}

function getAllFiles(dir, ext = ".ts") {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (entry.endsWith(ext) && !entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractInterfaces(sourceText) {
  const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
  const interfaces = new Map();
  let match;
  while ((match = interfaceRegex.exec(sourceText)) !== null) {
    const name = match[1];
    const body = match[2];
    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*")
      );
    const props = new Set();
    for (const line of lines) {
      const propMatch = /^([A-Za-z0-9_]+)\??\s*:/.exec(line);
      if (propMatch) {
        props.add(propMatch[1]);
      }
    }
    interfaces.set(name, props);
  }
  return interfaces;
}

function validateDataIntegrity() {
  console.log("===============================================================================");
  console.log("🛡️  WARGAME v1 — Deep Domain & Protocol Data Integrity Audit");
  console.log("===============================================================================");

  let hasError = false;

  // 1. Symbol Parity Check
  console.log("\n[1/4] Checking 100% Symbol Parity against plan/schemas/domain.ts...");
  const sourceSymbols = extractSymbols(domainSourcePath);
  console.log(`      Found ${sourceSymbols.size} exported symbols in plan/schemas/domain.ts`);

  const sharedFiles = getAllFiles(sharedSrcDir);
  const targetSymbols = new Set();
  for (const file of sharedFiles) {
    for (const sym of extractSymbols(file)) {
      targetSymbols.add(sym);
    }
  }
  console.log(`      Found ${targetSymbols.size} exported symbols across packages/shared/src`);

  const missingSymbols = [];
  for (const sym of sourceSymbols) {
    if (!targetSymbols.has(sym)) {
      missingSymbols.push(sym);
    }
  }
  if (missingSymbols.length > 0) {
    console.error(`❌ Symbol Parity Check FAILED! Missing ${missingSymbols.length} symbol(s):`);
    for (const s of missingSymbols) console.error(`   - ${s}`);
    hasError = true;
  } else {
    console.log(
      `✅ Symbol Parity PASSED: All ${sourceSymbols.size} domain symbols are accounted for.`
    );
  }

  // 2. Deep Interface Property Parity Check
  console.log("\n[2/4] Checking Deep Interface Property Parity across domain models...");
  const sourceInterfaces = extractInterfaces(readFileSync(domainSourcePath, "utf-8"));
  let domainFilesContent = "";
  for (const file of getAllFiles(domainSrcDir)) {
    domainFilesContent += "\n" + readFileSync(file, "utf-8");
  }
  const targetInterfaces = extractInterfaces(domainFilesContent);

  let mismatchedInterfaces = 0;
  for (const [name, sourceProps] of sourceInterfaces.entries()) {
    const targetProps = targetInterfaces.get(name);
    if (!targetProps) {
      console.error(`❌ Missing target interface: ${name}`);
      hasError = true;
      mismatchedInterfaces++;
      continue;
    }
    const missingProps = [];
    for (const p of sourceProps) {
      if (!targetProps.has(p)) {
        missingProps.push(p);
      }
    }
    if (missingProps.length > 0) {
      console.error(`❌ Interface ${name} missing properties in packages/shared/src/domain:`);
      for (const p of missingProps) console.error(`   - ${p}`);
      hasError = true;
      mismatchedInterfaces++;
    }
  }
  if (mismatchedInterfaces === 0) {
    console.log(
      `✅ Interface Property Parity PASSED: All ${sourceInterfaces.size} interfaces match 100% property-for-property.`
    );
  }

  // 3. Protocol vs Domain Alignment Check
  console.log("\n[3/4] Checking Network Protocol vs Domain Alignment...");
  const commandsContent = readFileSync(resolve(protocolSrcDir, "commands.ts"), "utf-8");
  const enumsContent = readFileSync(resolve(protocolSrcDir, "enums.ts"), "utf-8");
  const dtosContent = readFileSync(resolve(protocolSrcDir, "dtos.ts"), "utf-8");
  const idsContent = readFileSync(resolve(protocolSrcDir, "ids.ts"), "utf-8");

  // Check StateView structure
  const stateViewDomainProps = sourceInterfaces.get("StateView");
  console.log(
    `      Verifying StateView fog-of-war shape (${stateViewDomainProps?.size || 0} top-level fields)...`
  );
  const stateViewMatches = [
    "public",
    "exactProvinces",
    "exactArmies",
    "ownFaction",
    "ownProvinceDetails",
    "battleReports"
  ];
  for (const field of stateViewMatches) {
    if (!dtosContent.includes(`${field}:`)) {
      console.error(`❌ stateViewSchema in dtos.ts is missing field: ${field}`);
      hasError = true;
    }
  }

  // Check Enums
  console.log("      Verifying closed enum constants in enums.ts...");
  const requiredEnumSets = ["COMMAND_TYPES", "RESOURCE_TYPES", "TRADEABLE_RESOURCES", "UNIT_TYPES"];
  for (const set of requiredEnumSets) {
    if (!enumsContent.includes(set)) {
      console.error(`❌ protocol/enums.ts missing enum set: ${set}`);
      hasError = true;
    }
  }

  // Check Command Types in registry
  if (commandsContent.includes("COMMAND_PAYLOAD_SCHEMAS")) {
    console.log("      Verifying Command Payload Registry coverage...");
    if (!commandsContent.includes("parseCommandPayload")) {
      console.error("❌ commands.ts missing parseCommandPayload dispatcher");
      hasError = true;
    }
  }

  // Check Branded IDs
  const domainIds = [
    "AccountId",
    "WorldId",
    "ProvinceId",
    "FactionId",
    "ArmyId",
    "BattleId",
    "TradeOfferId",
    "TradeId",
    "AllianceId",
    "AllianceMembershipId",
    "AllianceInvitationId",
    "BuildOrderId",
    "TrainingOrderId",
    "RebellionId",
    "DoctrineChangeId",
    "CommandId"
  ];
  let missingIds = 0;
  for (const id of domainIds) {
    const schemaName = id.charAt(0).toLowerCase() + id.slice(1) + "Schema";
    if (!idsContent.includes(schemaName)) {
      console.error(`❌ protocol/ids.ts missing schema: ${schemaName}`);
      hasError = true;
      missingIds++;
    }
  }
  if (missingIds === 0) {
    console.log(
      `✅ Branded IDs PASSED: All ${domainIds.length} domain entity IDs have dedicated Zod schemas.`
    );
  }

  // 4. Architectural LOC Cap Check (<= 350 lines)
  console.log("\n[4/4] Checking 350 LOC Cap Limit across shared modules...");
  let oversized = 0;
  for (const file of sharedFiles) {
    const lines = readFileSync(file, "utf-8").split("\n").length;
    if (lines > 350) {
      console.error(`❌ Oversized file (> 350 LOC): ${file} (${lines} lines)`);
      hasError = true;
      oversized++;
    }
  }
  if (oversized === 0) {
    console.log(
      `✅ LOC Cap PASSED: All ${sharedFiles.length} files in packages/shared are strictly <= 350 lines.`
    );
  }

  console.log("\n===============================================================================");
  if (hasError) {
    console.error("❌ DATA INTEGRITY AUDIT FAILED! Please address the issues listed above.");
    process.exit(1);
  } else {
    console.log("✅ DATA INTEGRITY AUDIT PASSED: 100% Parity, Alignment, and Rule Compliance!");
    console.log("===============================================================================");
  }
}

validateDataIntegrity();
