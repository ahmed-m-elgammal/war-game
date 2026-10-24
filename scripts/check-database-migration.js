#!/usr/bin/env node
/**
 * Database Migration Integrity Gate
 *
 * Statically verifies the initial Drizzle migration against the locked physical
 * contract in plan/schemas/game.schema.sql and the D-CONFIG-PIN decision:
 * - Exact table and enum name parity with the planning schema.
 * - The province_garrison view is a security-invoker read model, not a table.
 * - Exactly 76 foreign keys, including the three deferred circular constraints.
 * - Snapshot pin metadata must match its world and pass periods must own their
 *   source entitlement; pin hashes must be SHA-256 hex digests.
 * - Rebel captures clear last_attacker_faction_id; a null trade buyer is only
 *   valid for a system exchange.
 * - Gameplay tables never depend on identity/serial allocation.
 * - RLS is enabled on every game table, PUBLIC is revoked, and schema_meta is
 *   seeded with the version exported by @wargame/db.
 *
 * This gate is static by design. It does not replace executing the migration
 * against PostgreSQL; it prevents the migration and its manifest from drifting.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = join(ROOT, "packages/db/migrations");
const MIGRATION_PATH = join(MIGRATIONS_DIR, "0000_init.sql");
const JOURNAL_PATH = join(MIGRATIONS_DIR, "meta/_journal.json");
const MANIFEST_PATH = join(ROOT, "packages/db/src/schema/deferred-constraints.ts");
const DB_INDEX_PATH = join(ROOT, "packages/db/src/index.ts");
const REFERENCE_PATH = join(ROOT, "plan/schemas/game.schema.sql");

const EXPECTED_TABLES = 39;
const EXPECTED_ENUMS = 40;
const EXPECTED_FOREIGN_KEYS = 76;
const IDENTITY_TABLES = ["admin_audit", "name_reports"];

function readRequired(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function values(sql, pattern) {
  return [...sql.matchAll(pattern)].map((match) => match[1]);
}

function sortedUnique(valuesToSort) {
  return [...new Set(valuesToSort)].sort();
}

function compareSets(actual, expected, label, errors) {
  const actualSorted = sortedUnique(actual);
  const expectedSorted = sortedUnique(expected);
  const missing = expectedSorted.filter((name) => !actualSorted.includes(name));
  const extra = actualSorted.filter((name) => !expectedSorted.includes(name));

  if (missing.length > 0) {
    errors.push(`${label} missing from migration: ${missing.join(", ")}.`);
  }
  if (extra.length > 0) {
    errors.push(`${label} present in migration but absent from reference: ${extra.join(", ")}.`);
  }
  if (actualSorted.length !== expectedSorted.length) {
    errors.push(
      `${label} count mismatch: migration has ${actualSorted.length}, reference has ${expectedSorted.length}.`
    );
  }
}

function parseTableBlocks(sql) {
  const blocks = new Map();
  const pattern = /CREATE TABLE "game"\."([a-z_]+)" \(([\s\S]*?)\n\);/g;

  for (const match of sql.matchAll(pattern)) {
    blocks.set(match[1], match[2]);
  }
  return blocks;
}

function parseReferenceTableBlocks(sql) {
  const blocks = new Map();
  const pattern = /^create table game\.([a-z_]+) \(([\s\S]*?)\n\);/gm;

  for (const match of sql.matchAll(pattern)) {
    blocks.set(match[1], match[2]);
  }
  return blocks;
}

function parseEnumBlocks(sql, pattern) {
  const blocks = new Map();

  for (const match of sql.matchAll(pattern)) {
    blocks.set(match[1], match[2]);
  }
  return blocks;
}

function enumValues(block) {
  return [...block.matchAll(/'([^']*)'/g)].map((match) => match[1]);
}

function compareOrdered(actual, expected, label, errors) {
  const missing = expected.filter((value) => !actual.includes(value));
  const extra = actual.filter((value) => !expected.includes(value));

  if (missing.length > 0) {
    errors.push(`${label} missing: ${missing.join(", ")}.`);
  }
  if (extra.length > 0) {
    errors.push(`${label} unexpected: ${extra.join(", ")}.`);
  }
  if (
    missing.length === 0 &&
    extra.length === 0 &&
    JSON.stringify(actual) !== JSON.stringify(expected)
  ) {
    errors.push(`${label} is out of order.`);
  }
}

function checkColumnParity(sql, referenceSql, errors) {
  const tableBlocks = parseTableBlocks(sql);
  const referenceTableBlocks = parseReferenceTableBlocks(referenceSql);
  const nonColumnKeywords = new Set(["constraint", "primary", "unique", "foreign", "check"]);

  for (const [table, referenceBlock] of referenceTableBlocks) {
    const block = tableBlocks.get(table);
    if (!block) {
      continue;
    }

    const migrationColumns = [...block.matchAll(/^\t"([a-z0-9_]+)" /gm)]
      .map((match) => match[1])
      .filter((name) => !nonColumnKeywords.has(name));
    const referenceColumns = [...referenceBlock.matchAll(/^ {2}([a-z_][a-z0-9_]*) /gm)]
      .map((match) => match[1])
      .filter((name) => !nonColumnKeywords.has(name));

    compareOrdered(migrationColumns, referenceColumns, `Table ${table} columns`, errors);
  }
}

function checkEnumParity(sql, referenceSql, errors) {
  const migrationEnums = parseEnumBlocks(
    sql,
    /CREATE TYPE "game"\."([a-z_]+)" AS ENUM\(([\s\S]*?)\);/g
  );
  const referenceEnums = parseEnumBlocks(
    referenceSql,
    /^create type game\.([a-z_]+) as enum\s*\(([\s\S]*?)\);/gm
  );

  for (const [name, referenceBlock] of referenceEnums) {
    const block = migrationEnums.get(name);
    if (!block) {
      continue;
    }

    compareOrdered(
      enumValues(block),
      enumValues(referenceBlock),
      `Enum game.${name} values`,
      errors
    );
  }
}

function requireSnippet(sql, snippet, label, errors) {
  if (!sql.includes(snippet)) {
    errors.push(`Missing ${label}.`);
  }
}

function checkMigration() {
  console.log("Validating initial database migration integrity (0000_init.sql)...");

  const sql = readRequired(MIGRATION_PATH, "initial migration");
  const referenceSql = readRequired(REFERENCE_PATH, "reference schema");
  const manifestSql = readRequired(MANIFEST_PATH, "deferred FK manifest");
  const dbIndexSql = readRequired(DB_INDEX_PATH, "database package entrypoint");
  const errors = [];

  const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql"));
  if (migrationFiles.length !== 1 || migrationFiles[0] !== "0000_init.sql") {
    errors.push(
      `Expected exactly one migration named 0000_init.sql; found ${migrationFiles.join(", ")}.`
    );
  }

  requireSnippet(
    sql,
    'CREATE SCHEMA IF NOT EXISTS "game"',
    'idempotent CREATE SCHEMA IF NOT EXISTS "game" declaration',
    errors
  );

  const migrationTables = values(sql, /CREATE TABLE "game"\."([a-z_]+)" \(/g);
  const referenceTables = values(referenceSql, /^create table game\.([a-z_]+) \(/gm);
  compareSets(migrationTables, referenceTables, "Tables", errors);

  if (migrationTables.length !== EXPECTED_TABLES) {
    errors.push(
      `Expected ${EXPECTED_TABLES} CREATE TABLE statements, found ${migrationTables.length}.`
    );
  }
  if (referenceTables.length !== EXPECTED_TABLES) {
    errors.push(
      `Reference schema expected ${EXPECTED_TABLES} tables, found ${referenceTables.length}.`
    );
  }

  const migrationEnums = values(sql, /CREATE TYPE "game"\."([a-z_]+)" AS ENUM/g);
  const referenceEnums = values(referenceSql, /^create type game\.([a-z_]+)\b/gm);
  compareSets(migrationEnums, referenceEnums, "Enums", errors);

  if (migrationEnums.length !== EXPECTED_ENUMS) {
    errors.push(
      `Expected ${EXPECTED_ENUMS} CREATE TYPE ... AS ENUM statements, found ${migrationEnums.length}.`
    );
  }
  if (referenceEnums.length !== EXPECTED_ENUMS) {
    errors.push(
      `Reference schema expected ${EXPECTED_ENUMS} enums, found ${referenceEnums.length}.`
    );
  }

  const tableBlocks = parseTableBlocks(sql);
  if (tableBlocks.size !== EXPECTED_TABLES) {
    errors.push(`Parsed ${tableBlocks.size} table blocks; expected ${EXPECTED_TABLES}.`);
  }

  checkColumnParity(sql, referenceSql, errors);
  checkEnumParity(sql, referenceSql, errors);

  requireSnippet(
    sql,
    'CREATE VIEW "game"."province_garrison" WITH (security_invoker = true) AS (',
    "province_garrison security-invoker view",
    errors
  );
  for (const [snippet, label] of [
    ["from game.armies a", "garrison army source"],
    ["join game.army_units au", "army unit join"],
    ["from game.neutral_garrisons ng", "neutral garrison source"],
    ["sum(g.count)::bigint as count", "garrison count aggregation"]
  ]) {
    requireSnippet(sql, snippet, label, errors);
  }
  if (/CREATE TABLE "game"\."province_garrison"/.test(sql)) {
    errors.push("province_garrison must be a view, not a table.");
  }

  const fkNames = values(sql, /ADD CONSTRAINT "([a-z0-9_]+)" FOREIGN KEY/g);
  if (fkNames.length !== EXPECTED_FOREIGN_KEYS) {
    errors.push(
      `Expected ${EXPECTED_FOREIGN_KEYS} FOREIGN KEY constraints, found ${fkNames.length}.`
    );
  }
  if (new Set(fkNames).size !== fkNames.length) {
    errors.push("Foreign key constraint names must be unique.");
  }

  const manifestNames = values(manifestSql, /constraintName: "([a-z0-9_]+)"/g);
  const manifestStatements = values(manifestSql, /\bsql: '([^']+)'/g);
  if (manifestNames.length !== 3 || manifestStatements.length !== 3) {
    errors.push(
      `Deferred FK manifest must contain exactly 3 entries; found ${manifestNames.length} names and ${manifestStatements.length} statements.`
    );
  }
  for (const statement of manifestStatements) {
    if (!statement.includes("DEFERRABLE INITIALLY DEFERRED")) {
      errors.push("Each deferred FK statement must end with DEFERRABLE INITIALLY DEFERRED.");
    }
    const occurrences = sql.split(statement).length - 1;
    if (occurrences !== 1) {
      errors.push(
        `Deferred FK statement must appear exactly once in the migration; found ${occurrences} occurrence(s).`
      );
    }
  }

  const pinChecks = [
    ["worlds", "map_hash", "worlds_map_hash_sha256"],
    ["worlds", "config_hash", "worlds_config_hash_sha256"],
    ["world_snapshots", "map_hash", "world_snapshots_map_hash_sha256"],
    ["world_snapshots", "config_hash", "world_snapshots_config_hash_sha256"]
  ];
  for (const [table, column, constraint] of pinChecks) {
    const block = tableBlocks.get(table);
    if (!block) {
      errors.push(`Missing ${table} table block for pin hash validation.`);
      continue;
    }
    requireSnippet(block, `"${column}" char(64) NOT NULL`, `${table}.${column} char(64)`, errors);
    requireSnippet(
      block,
      `CONSTRAINT "${constraint}" CHECK ("game"."${table}"."${column}" ~* '^[0-9a-f]{64}$')`,
      `${constraint} SHA-256 format check`,
      errors
    );
  }

  const worldsBlock = tableBlocks.get("worlds");
  if (worldsBlock) {
    requireSnippet(
      worldsBlock,
      'CONSTRAINT "worlds_pin_unique" UNIQUE("world_id","config_version","config_hash","map_id","map_hash")',
      "worlds_pin_unique target constraint",
      errors
    );
  }

  requireSnippet(
    sql,
    'ALTER TABLE "game"."world_snapshots" ADD CONSTRAINT "world_snapshots_world_pin_fk" FOREIGN KEY ("world_id","config_version","config_hash","map_id","map_hash") REFERENCES "game"."worlds"("world_id","config_version","config_hash","map_id","map_hash")',
    "world_snapshots_world_pin_fk composite pin foreign key",
    errors
  );

  const entitlementsBlock = tableBlocks.get("account_entitlements");
  if (entitlementsBlock) {
    requireSnippet(
      entitlementsBlock,
      'CONSTRAINT "account_entitlement_owner_unique" UNIQUE("account_id","entitlement_id")',
      "account_entitlement_owner_unique target constraint",
      errors
    );
  }

  requireSnippet(
    sql,
    'ALTER TABLE "game"."pass_periods" ADD CONSTRAINT "pass_period_entitlement_owner_fk" FOREIGN KEY ("account_id","source_entitlement_id") REFERENCES "game"."account_entitlements"("account_id","entitlement_id")',
    "pass_period_entitlement_owner_fk composite ownership foreign key",
    errors
  );

  requireSnippet(
    tableBlocks.get("world_regions") ?? "",
    'CONSTRAINT "region_rebel_last_attacker" CHECK ("game"."world_regions"."controller_type" <> \'rebel\' or "game"."world_regions"."last_attacker_faction_id" is null)',
    "region_rebel_last_attacker check",
    errors
  );
  requireSnippet(
    tableBlocks.get("trade_log") ?? "",
    'CONSTRAINT "trade_log_buyer_null_only_system" CHECK ("game"."trade_log"."buyer_faction_id" is not null or "game"."trade_log"."kind" = \'state_exchange\')',
    "trade_log_buyer_null_only_system check",
    errors
  );

  if (/\b(?:smallserial|serial|bigserial)\b/i.test(sql)) {
    errors.push("Migration must not use serial/smallserial/bigserial column types.");
  }
  if (/CREATE SEQUENCE/i.test(sql)) {
    errors.push("Migration must not declare explicit sequences.");
  }
  const identityTables = sortedUnique(
    [...tableBlocks.entries()]
      .filter(([, block]) => block.includes("GENERATED ALWAYS AS IDENTITY"))
      .map(([table]) => table)
  );
  if (JSON.stringify(identityTables) !== JSON.stringify(IDENTITY_TABLES)) {
    errors.push(
      `Identity allocation is allowed only on ${IDENTITY_TABLES.join(", ")}; found ${identityTables.join(", ") || "none"}.`
    );
  }

  if (
    !/DO \$\$[\s\S]*FROM pg_tables[\s\S]*WHERE schemaname = 'game'[\s\S]*ENABLE ROW LEVEL SECURITY[\s\S]*END \$\$;/.test(
      sql
    )
  ) {
    errors.push("Missing RLS enablement loop over every table in the game schema.");
  }
  requireSnippet(sql, 'REVOKE ALL ON SCHEMA "game" FROM PUBLIC;', "PUBLIC schema revoke", errors);

  const versionMatch = dbIndexSql.match(/DB_SCHEMA_VERSION = "([^"]+)"/);
  if (!versionMatch) {
    errors.push("Could not read DB_SCHEMA_VERSION from packages/db/src/index.ts.");
  } else {
    requireSnippet(
      sql,
      `VALUES ('${versionMatch[1]}')`,
      `schema_meta seed for ${versionMatch[1]}`,
      errors
    );
  }
  requireSnippet(
    sql,
    'INSERT INTO "game"."schema_meta" ("schema_version")',
    "schema_meta seed insert",
    errors
  );
  requireSnippet(sql, 'ON CONFLICT ("id") DO UPDATE SET', "schema_meta idempotent upsert", errors);

  const journal = JSON.parse(readRequired(JOURNAL_PATH, "migration journal"));
  if (
    journal.entries?.length !== 1 ||
    journal.entries[0]?.idx !== 0 ||
    journal.entries[0]?.tag !== "0000_init"
  ) {
    errors.push('Migration journal must contain exactly one entry with tag "0000_init".');
  }

  if (errors.length > 0) {
    console.error(`Migration validation failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Success: 0000_init.sql validated against ${EXPECTED_TABLES} tables with column parity, ${EXPECTED_ENUMS} enums with value parity, 1 view, ${EXPECTED_FOREIGN_KEYS} FKs (3 deferred), pin ownership, RLS, and schema_meta version.`
  );
}

try {
  checkMigration();
} catch (error) {
  console.error(`Migration validation failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
