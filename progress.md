# Progress Log - P2-E2-T1/T2

## Session: 2026-10-24

### Completed

- Created the live Supabase project `wargame` (`wellhdiorkoxfgedtqie`, `eu-central-1`) and logged the CLI account out.
- Applied `packages/db/migrations/0000_init.sql` live and verified the complete schema.
- Baselined the Drizzle journal so `drizzle-kit migrate` will skip the applied migration.
- Approved `D-RLS`: dedicated runtime role with `BYPASSRLS`; separate migration and backup roles; no client grants.
- Added and applied `infra/database/roles.sql`; verified the live role matrix and RLS denial.
- Added `packages/db/src/readiness.ts` and mismatch tests; wired `getReadinessStatus` in the server entrypoint.
- Updated `plan/tasks.json`, `plan/05`, `plan/06`, and `plan/07`.
- Marked `P2-E2-T1` and `P2-E2-T2` done; `P2-E2-T3` is ready.
- Ran the full root gate successfully.

### Test Results

| Check                  | Result                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `pnpm format:check`    | Pass                                                             |
| `pnpm typecheck`       | Pass                                                             |
| `pnpm lint`            | Pass                                                             |
| `pnpm test`            | 20 files, 211 tests pass                                         |
| `pnpm build`           | Pass                                                             |
| `pnpm check:rules`     | 93 source files, 0 errors                                        |
| `pnpm validate:domain` | Contract audit passed                                            |
| `pnpm validate:tasks`  | 100 tasks, 13 gates, 32 decisions, 0 errors                      |
| `pnpm validate:db`     | 0000_init.sql validated                                          |
| Live schema counts     | 39 tables, 40 enums, 407 columns, 76 FKs, 159 checks, 82 indexes |
| RLS denial             | No-`BYPASSRLS` probe saw 0 `schema_meta` rows                    |
| Runtime visibility     | `wargame_runtime` saw 1 `schema_meta` row                        |
| Migrator DDL/journal   | Passed in a rolled-back transaction                              |

### Pending

- Shop/config seeds remain blocked by the `03` section 20.3 TBDs, `D-MAP`, and `D-WAR-TIME`.
- No commit, push, or deployment has been performed.
