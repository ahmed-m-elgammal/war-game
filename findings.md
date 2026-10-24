# Findings & Analysis — Database Foundation

## Live Project

- Supabase project: `wargame` (`wellhdiorkoxfgedtqie`), organization `lrkokauriqvpxvufhhyr`, region `eu-central-1`.
- Postgres `17.11.0.003`; host `db.wellhdiorkoxfgedtqie.supabase.co`; URL `https://wellhdiorkoxfgedtqie.supabase.co`.
- The CLI account is logged out. The separate existing CLI project `wrotguqgersjpsgcsaty` was not touched.

## Schema Execution

- `packages/db/migrations/0000_init.sql` was applied to the live project on 2026-10-24.
- Verified: 39 tables, 40 enums, 407 `information_schema` columns (403 base + 4 view), 76 FKs, 159 checks, 82 indexes, 39 PKs, 3 unique constraints, 39 RLS-enabled tables, 0 policies.
- `province_garrison` is a `security_invoker` view; `schema_meta` is `2026-10-23.1`; the deferred `worlds.final_snapshot_fk` is present.
- `public`, `anon`, `authenticated`, and `service_role` have no `game` schema access.
- `drizzle.__drizzle_migrations` is baselined with hash `a19a57926ff9e292bee8f5516b8b825ef5c84cc50d62598d646a59f8ed8e3437` and `created_at` `1792811190552`; Supabase records `0000_init`.

## D-RLS Decision

- Approved 2026-10-24.
- The server is the only Postgres client. The runtime role uses `BYPASSRLS` so it can operate across all accounts and worlds without per-request policy context.
- RLS remains enabled on every table as defense in depth, and browser roles have no grants.
- A no-`BYPASSRLS` probe with SELECT on `game.schema_meta` saw 0 rows; `wargame_runtime` saw 1 row.

## Role Model

- `wargame_runtime`: `LOGIN`, `BYPASSRLS`, `USAGE` on `game`, DML on tables, sequence usage; no DDL, `TRUNCATE`, or `REFERENCES`.
- `wargame_migrator`: `LOGIN`, owns `game` and `drizzle`, can run DDL and write the Drizzle journal; no `BYPASSRLS`.
- `wargame_backup`: `LOGIN`, `BYPASSRLS`, `USAGE` and SELECT only.
- Passwords are not stored in the repository; deployment provisions them out-of-band.

## Readiness and Seeds

- `packages/db/src/readiness.ts` checks `game.schema_meta.schema_version` against `DB_SCHEMA_VERSION`; `getReadinessStatus` in `apps/server` uses it.
- Shop/config seed rows are intentionally absent. `P2-E1-T2` remains in progress pending the `03` §20.3 TBDs, `D-MAP`, and `D-WAR-TIME`; no speculative values were added.
