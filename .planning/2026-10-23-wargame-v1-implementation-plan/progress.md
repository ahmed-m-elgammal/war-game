# Progress Log

## Session: 2026-10-23

### Current Status
- **Phase:** 6 — Delivery
- **Started:** 2026-10-23
- **Plan:** `.planning/2026-10-23-wargame-v1-implementation-plan/`

### Actions Taken

- Read and analyzed `plan/06-data-model.md`, `plan/03-gameplay-rules.md`, `plan/05-architecture.md`, `plan/04-technology-decisions.md`, `plan/01-requirements.md`, `plan/02-game-design.md`, `plan/schemas/domain.ts`, and `plan/schemas/game.schema.sql`.
- Confirmed the workspace is documentation-only: no application code, git repository, commits, or deployment.
- Fixed `plan/04-technology-decisions.md` line 528 to say “Grants a rolling 30-day term from purchase.”
- Created `plan/07-implementation-plan.md`:
  - 14 phases (P0–P13).
  - 13 gates (G0–G12).
  - 32 decision gates.
  - 100 tasks with IDs, priorities, dependencies, acceptance criteria, and tests.
  - Cross-cutting test strategy, traceability matrix, risks, definition of done, and tracking protocol.
- Created `plan/tasks.json`:
  - Machine-readable register with 100 tasks, 13 gates, 32 decisions, and 14 phases.
  - Statuses: one decision task done (`P0-E1-T1`), the rest `ready`, `planned`, or `blocked`; no implementation task is in progress.
  - Every task has acceptance and test arrays.
- Recorded product-owner approval of `D-TIE` on 2026-10-23: exact ties are won by the defender; the attacker loses all committed units; the defender loses 50% (`DEFAULT`, config-driven). Updated `03` §8.4/§18.3/§20.1/§20.3, `09` §9.4, `02` §10.3/§19, `04` §17.3/§19, `05` §11.6/A-01, and `06` §10.4/§18.1.
- Updated `.planning/2026-10-23-wargame-v1-implementation-plan/findings.md` with analysis, assumptions, proposed changes, blockers, and verification results.
- Updated `.planning/2026-10-23-wargame-v1-implementation-plan/task_plan.md` with phase statuses and next action.
- Recorded proposed changes PC-01–PC-10, including pass-progress wording, `season_end` unification, metrics/session gap, config hashing, and typed actor columns.

### Test Results

| Test | Expected | Actual | Status |
|---|---|---|---|
| `tasks.json` JSON parse | Valid JSON | Parsed | Pass |
| Register integrity | Unique IDs; valid deps/decisions/gates; acceptance/tests present | 100 tasks, 13 gates, 32 decisions, 14 phases; no errors | Pass |
| Plan/register ID match | Every plan heading has a register task | 100 headings, 100 tasks, no missing/extra/duplicate | Pass |
| TypeScript strict compile | `domain.ts` compiles | `npx --package typescript@7.0.2 tsc --strict --noEmit ...` passed | Pass |
| SQL formatter parse | `game.schema.sql` parses | Formatter completed with no output/error | Pass |
| Markdown checks | Balanced fences, unique headings, valid links, table pipes | 21 files checked; 0 problems | Pass |
| Decision/task links | Every decision block references existing tasks; every task gate is listed | 32 decisions, 100 tasks; no errors | Pass |
| D-TIE approval | Product-owner choice recorded and propagated | Approved: defender wins; attacker loses all; defender loses 50% (DEFAULT) | Pass |
| Git initialization & push | Clean repository on branch `main` pushed to remote | `origin/main` tracking `https://github.com/ahmed-m-elgammal/war-game.git` | Pass |
| `pnpm` workspace bootstrap | `pnpm` runs and links workspace | Corepack downloaded and activated `pnpm@12.15.0`; `pnpm install` linked all 10 projects | Pass |
| Package skeleton check | 10 projects created with tsconfig and entrypoints | `apps/*` (3) and `packages/*` (6) + `infra/` scaffolded | Pass |
| SQL runtime execution | Migration runs on PostgreSQL | Not run; no `psql`/Docker runtime | Not run |
| Target Node 24.22.1 | Pinned in container image | `infra/docker/Dockerfile` pins `node:24.22.1-bookworm-slim` | Pass |
| TypeScript compile | `tsc -b` passes across all 10 projects | Compiles cleanly with zero errors (TypeScript 6.0.3) | Pass |
| ESLint 9 Flat Config | `pnpm run lint` | ESLint 9 + typescript-eslint passes across all code | Pass |
| Prettier formatting | `pnpm run format:check` | All matched files use Prettier style | Pass |
| Vitest unit suite | `pnpm run test` | 3 test files, 23 tests passed (protocol, env fail-fast & rules) | Pass |
| Task register validator | `pnpm run validate:tasks` | 100 tasks, 13 gates, and 32 decisions validated with 0 errors | Pass |
| Architecture rules check | `pnpm run check:rules` | No God Files (≤350 LOC cap) & no hardcoded colors (21 files checked) | Pass |
| CI and security pipeline | GitHub Actions | `.github/workflows/ci.yml` runs full validation + Gitleaks | Pass |
| Environment schemas & config | Zod validation | `packages/shared/src/config/env.ts` with fail-fast parsing | Pass |
| Monorepo build | `pnpm run build` | All 10 projects compile cleanly (`tsc -b`) | Pass |
| G1 Foundation Gate | `plan/tasks.json` | G1 exit criteria met and approved | Pass |
| Shared Protocol Package | Zod schemas | `packages/shared/src/protocol/` (P2-E1-T1 complete) | Pass |
| Game config schema | Strict `GameConfig` + decision gate | `packages/shared/src/config/game-config/` (25 tests) | Pass |
| `config:check` gate | 0 seed documents passes; negative fixture fails | 0 documents, exit 0; proposed/missing fixture exit 1 | Pass |
| Full unit suite | `pnpm run test` | 6 files, 49 tests passed | Pass |
| Root quality gate | typecheck, lint, format, test, build, validate:domain, validate:tasks, check:rules | All pass | Pass |
| Map-data scaffold tests | 43 map-data cases; mask hit-test, connectivity, spawn invariants, hash stability | 4 files, 43 tests passed | Pass |
| Map-data root gate | Full workspace after map-data changes | 10 files, 92 tests; typecheck, lint, format, build, check:rules, validate:domain, validate:tasks, config:check all pass | Pass |
| Map-data validation audit | Confirm all six findings, fix real defects, add regressions | 6 confirmed; 50 map-data tests and 99 root tests pass; root gates pass | Pass |
| Live Supabase schema execution | `0000_init.sql` applies from an empty project | 39 tables, 40 enums, 407 columns, 76 FKs, 159 checks, 82 indexes; RLS 39/39; `schema_meta` `2026-10-23.1` | Pass |
| Live role matrix | Runtime DML + `BYPASSRLS`; backup SELECT; browser denied | Verified through Supabase MCP privilege queries and `SET ROLE` probes | Pass |
| Readiness mismatch | Mismatch or missing version fails | 3 Vitest cases pass | Pass |
| P2-E2-T1/T2 root gate | Full required command set | `format:check`, `typecheck`, `lint`, 211 tests, `build`, `check:rules`, `validate:domain`, `validate:tasks`, and `validate:db` all pass | Pass |

### Errors

| Error | Resolution |
|---|---|
| `npx typescript@7.0.2 tsc` treated `tsc` as a source file | Used `npx --yes --package typescript@7.0.2 tsc` |
| `pnpm --version` refused because of global `packageManager` in `C:\Users\A-Dev\package.json` | Pinned `"packageManager": "pnpm@12.15.0"` in local workspace `package.json`; Corepack activated pnpm 12.15.0 |
| `typescript-eslint` rejected TS 7.0 (peer dep `<6.1.0`) | Approved fallback to `typescript@6.0.3` via `ADR-001` conforming to `plan/04` D-037 |
| No `psql` installed | SQL remains parser-checked; runtime validation is a P2 gate |
| Local Node 22.16.0 vs pinned 24.22.1 | Container image and CI pin 24.22.1; local Node 22 runs pnpm/TS cleanly |

### Final Verification

- 100 tasks, 13 gates, 32 decisions, and 14 phases.
- P1-E1-T1 (Initialize repository and workspace) is complete.
- P1-E1-T2 (Create package skeleton) is complete across all 10 projects.
- P1-E1-T3 (Pin toolchain and run TypeScript compatibility gate) is complete with `ADR-001` recorded.
- P1-E1-T4 (Add lint, format, test, and task-register validation) is complete.
- P1-E2-T1 (Build CI and security pipeline) is complete: `.github/workflows/ci.yml`, `check:rules` (350 LOC cap limit & color checking), and `AGENTS.md` rules added.
- P1-E2-T2 (Set up local dev and environment schema) is complete: `.env.example`, Zod `serverEnvSchema`/`clientEnvSchema` with unit tests, and `docker-compose.local.yml`.
- P1-E2-T3 (Hold G1 foundation gate) is complete: G1 is APPROVED. All foundation tasks are done and no gameplay code exists yet.
- Decision gates D-PASS-PROGRESS (PC-02), D-SEASON-END (PC-03), and D-CONFIG-PIN (PC-05) are approved and documented.
- P2-E1-T1 (Build shared protocol package) is complete:
  - `packages/shared/src/protocol/` created: `version.ts`, `ids.ts`, `enums.ts`, `errors.ts`, `envelopes.ts`, `commands.ts`, `dtos.ts`.
  - Nominal branded IDs with zero-cost internal casting helpers (`toProvinceId`, etc.).
  - Strict unknown-field rejection (`.strict()`) across all 25 command payloads, DTOs, and envelopes.
  - Production error handling: `AppError`, `formatZodError`, `createSuccessResponse`, `createErrorResponse`.
  - $O(1)$ command schema registry `COMMAND_PAYLOAD_SCHEMAS` and `parseCommandPayload`.
  - Domain modularization completed in `packages/shared/src/domain/` across 10 submodules (`primitives.ts`, `account.ts`, `world.ts`, `faction.ts`, `map-military.ts`, `alliance-trade.ts`, `queues.ts`, `state.ts`, `config.ts`, `index.ts`), each strictly <= 350 LOC (max 205 LOC).
  - StateView schema in `protocol/dtos.ts` aligned 100% with domain `StateView` asymmetric fog-of-war contract (§14.2 of `plan/06-data-model.md`).
  - Automated domain & protocol contract validator in `scripts/validate-domain-parity.js`: AST-based, two-way interface parity (70 interfaces, including generics, heritage and nested object types), 181-symbol coverage, 42 closed value sets, 16 branded IDs, 25 command payloads, and StateView/public-projection leakage checks.
  - Added `"validate:domain"` to root `package.json` and step `Validate domain and protocol contract parity` to `.github/workflows/ci.yml`.
  - Fixed `WorldState.supportDaily` to `Record<string, SupportDaily>` (was `Record<string, unknown>`), a type drift the previous regex-based validator could not detect.
  - Contract validator split into focused modules under `scripts/lib/` (largest 269 LOC); verified with clean and negative fixtures covering type drift, nested types, generics, enum/brand/registry/projection drift.
  - Unit tests in Vitest covering roundtrips, unknown-field rejection, StateView asymmetric projection, AppError serialization, and error codes.
- P2-E1-T2 (Build config package and schema) is scaffolded, not complete:
  - Strict Zod `GameConfig` schema added at `packages/shared/src/config/game-config/schema.ts`, mirroring `domain/config.ts`; missing and unknown fields fail.
  - Approved-document envelope (`document.ts`) rejects `proposed`/`tbd` status and any decision whose `plan/tasks.json` status is not `approved`.
  - Canonical JSON plus SHA-256 config hashing (`hash.ts`) pins `configVersion`/`configHash`; tests prove content and version immutability.
  - Root `config:check` gate scans `packages/shared/config/game-config/*.json`; the directory is intentionally empty until `P0-E1-T3` closes, so no balance value is hardcoded.
  - Product decision 2026-10-23: scaffold only; seed values and any additional `GameConfig` sections wait for the 23 TBDs in `03` §20.3 plus `D-MAP` and `D-WAR-TIME`.
- P2-E1-T3 (Build the Vardania map-data package) is scaffolded, not complete:
  - `packages/map-data` now defines map/province/art/mask contracts, locked map rules, mask hit-testing, adjacency helpers, and canonical map hashing.
  - Validators cover province count/identity, unique opaque mask colours, mask coverage, one contiguous landmass, edge-only water, symmetric/connected adjacency, refugee candidates, art anchors, and spawn invariants.
  - 50 map-data Vitest cases cover the required connectivity, spawn, mask hit-test, and map-hash checks; the fixture is synthetic and never exported as Vardania data.
  - Validation hardening (2026-10-23): malformed point/name inputs return structured issues instead of throwing, `#000000` is rejected as the water mask colour, art issue paths use array indices, duplicate adjacency entries no longer cascade, and constants documentation is top-of-file only. Seven regression tests cover these defects.
  - Production map content and completion remain blocked by `D-MAP`; resource-mix and neutral/AI-buffer guarantees from `09` §6.2 wait for approved per-world generation rules.
- P2-E1-T4 (Build game-rules primitives) completed 2026-10-24:
  - Added pure `time`, `prng`, `clock`, `event-order`, `id-allocator`, and `math` modules under `packages/game-rules/src`, with top-of-file contracts and no host clock, random, Node, DB, network, React, or browser dependencies.
  - PRNG uses FNV-1a seed derivation plus Mulberry32 state-in/state-out; `RngState.state` stays an opaque unsigned-decimal string. Golden-sequence and rejection-sampled integer tests lock the contract.
  - Clock derives day, phase, era, and season freeze from injected `WorldTimingConfig`; timestamp parsing requires an explicit UTC offset, intervals are half-open, the day index clamps to 1-30, and calendar era never advances from tech state.
  - Rules primitives cover world-event and battle-arrival ordering, monotonic `WorldIdCounters` allocation, fixed-point production/upkeep, largest-remainder apportionment, and weighted score aggregation. Rates, weights, and scale are caller-supplied; no balance values were added.
  - 83 game-rules Vitest cases across 7 files pass; the full suite is 181 tests. Root `typecheck`, `lint`, `format:check`, `test`, `build`, `check:rules`, `validate:domain`, `validate:tasks`, and `config:check` pass.
  - `scripts/check-code-rules.js` now enforces the game-rules purity boundary; a temporary `node:fs/promises` + `Date.now()` + `Math.random()` probe failed with three expected violations and was deleted.
  - Dependency reconciliation: `P2-E1-T2` remains `in_progress` for approved seed values; T4 consumes injected schedules/rates and does not need those seeds.
- P2-E2-T1 (Create Drizzle schema and first migration) completed 2026-10-24:
  - `packages/db` defines 39 tables, 40 enums, 407 columns (403 base + 4 view), 159 checks, 82 indexes, and the `security_invoker` `province_garrison` view under the `game` schema.
  - D-CONFIG-PIN is enforced in SQL: SHA-256 pin columns, format checks, `worlds_pin_unique`, and the composite `world_snapshots_world_pin_fk`. Snapshot pins cannot diverge from their world.
  - Cross-entity guards prevent a pass period from using another account's entitlement, a rebel province from retaining a last attacker, and a null trade buyer outside a state exchange.
  - 76 FKs match the reference schema, including the three deferred circular keys; a transaction test proved `worlds.final_snapshot_seq` defers to commit.
  - `pnpm validate:db` checks exact table names, per-table column order, enum values, deferred-FK manifest SQL, pin/ownership guards, view shape, sequence bans, identity allowlist, RLS, revoke, journal, and seed version.
  - `0000_init.sql` executed cleanly in an empty PGlite Postgres environment (16/16 checks) and matches the reference schema.
  - Applied `0000_init.sql` to live Supabase project `wargame` (`wellhdiorkoxfgedtqie`, `eu-central-1`). Verified 39 tables, 40 enums, 407 columns, 76 FKs, 159 checks, 82 indexes, 39 PKs, 3 unique constraints, 39 RLS-enabled tables, 0 policies, the view, `schema_meta` `2026-10-23.1`, and no `public`/`anon`/`authenticated`/`service_role` game access.
  - Baselined `drizzle.__drizzle_migrations` with hash `a19a57926ff9e292bee8f5516b8b825ef5c84cc50d62598d646a59f8ed8e3437` and `created_at` `1792811190552`; Supabase migration history records `0000_init` and `0001_roles_and_privileges`.
- P2-E2-T2 (Configure DB roles, RLS, metadata, and seeds) completed 2026-10-24:
  - D-RLS approved: dedicated runtime role with `BYPASSRLS`; separate migration and backup roles; no client grants.
  - Added `infra/database/roles.sql` and applied it live. `wargame_runtime` has `USAGE` plus `SELECT`/`INSERT`/`UPDATE`/`DELETE`, with no `CREATE`/`TRUNCATE`/`REFERENCES`; `wargame_backup` has SELECT only; `wargame_migrator` owns `game`/`drizzle` and can run DDL; browser roles have no game access.
  - RLS remains enabled on all 39 tables with zero policies. A no-`BYPASSRLS` probe saw 0 `schema_meta` rows; `wargame_runtime` saw 1 row. A migrator probe created DDL and wrote a Drizzle journal row in a rolled-back transaction.
  - Added `packages/db/src/readiness.ts` and readiness tests; wired `getReadinessStatus` in `apps/server/src/index.ts` to fail on schema-version mismatch.
  - Shop/config seeds remain intentionally empty while `P2-E1-T2` waits for the `03` §20.3 TBDs, `D-MAP`, and `D-WAR-TIME`; no unapproved values were added.
  - 211 root tests pass. The full root gate is recorded below.

### Next Actions

1. Root gate completed 2026-10-24: `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (211 tests), `pnpm build`, `pnpm check:rules`, `pnpm validate:domain`, `pnpm validate:tasks`, and `pnpm validate:db` all pass.
2. Start `P2-E2-T3` (domain, SQL, and documentation conformance) once the gate is green.
3. Complete `P2-E1-T2` only after `P0-E1-T3` resolves the `03` §20.3 TBDs, `D-MAP`, and `D-WAR-TIME`; then add approved config/shop seed documents.
4. Resolve `D-MAP` before adding production Vardania content.
5. Do not commit, push, or deploy without explicit approval.
