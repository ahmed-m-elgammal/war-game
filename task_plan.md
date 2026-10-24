# Task Plan — P2-E2-T1/T2: Database Foundation

## Goal

Apply the reviewed Drizzle schema to the live Supabase project and close the database role, RLS, metadata, and readiness work required by `plan/06-data-model.md` §15, `plan/05-architecture.md` §9.9, and `plan/tasks.json`.

---

## Phase 1: Grounding & Decision Alignment — Complete

- [x] Read `specs/09-v1-design-lock.md`, `plan/05`, `plan/06`, `plan/07`, and `plan/tasks.json`.
- [x] Identify `D-RLS` options and confirm the server-authoritative access model.
- [x] Obtain approval for `D-RLS`: dedicated runtime role with `BYPASSRLS`; separate migration and backup roles; no client grants.

## Phase 2: Live Schema Execution — Complete

- [x] Apply `packages/db/migrations/0000_init.sql` to Supabase project `wargame` (`wellhdiorkoxfgedtqie`, `eu-central-1`).
- [x] Verify tables, enums, columns, keys, checks, indexes, the `province_garrison` view, RLS enablement, and `schema_meta`.
- [x] Baseline `drizzle.__drizzle_migrations` and record `0000_init` in the Supabase migration history.

## Phase 3: Roles and RLS — Complete

- [x] Add `infra/database/roles.sql` with `wargame_runtime`, `wargame_migrator`, and `wargame_backup`.
- [x] Transfer `game`/`drizzle` ownership to the migration role.
- [x] Grant runtime DML, backup SELECT, and remove all browser-role access.
- [x] Verify the live role matrix and RLS denial behavior.

## Phase 4: Schema Version Readiness — Complete

- [x] Add `packages/db/src/readiness.ts` and mismatch tests.
- [x] Export the readiness helpers from `@wargame/db`.
- [x] Wire `getReadinessStatus` in `apps/server/src/index.ts`.

## Phase 5: Root Gates & Registration - Complete

- [x] Update `plan/tasks.json`, `plan/05`, `plan/06`, and `plan/07`.
- [x] Record progress and evidence.
- [x] Run the full root gate and confirm the final test count (211 tests).

## Blocked Follow-Up

Shop/config seed rows remain intentionally empty. `P2-E1-T2` is still waiting for the `03` §20.3 TBDs, `D-MAP`, and `D-WAR-TIME`; no unapproved values were added. `P2-E2-T3` is ready after `P2-E2-T2` closes.
