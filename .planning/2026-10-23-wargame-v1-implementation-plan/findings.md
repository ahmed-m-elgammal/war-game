# Findings & Decisions

## Objective

Produce a complete, dependency-ordered v1 implementation plan and a persistent task register from the approved planning baseline. No implementation code is to be written.

## Requirements

- Source of truth: `specs/09-v1-design-lock.md`, then `plan/01`–`06`, `plan/schemas/domain.ts`, and `plan/schemas/game.schema.sql`.
- Plan must include phases, epics, tasks, subtasks, priorities, acceptance criteria, dependencies, tests, gates, and completion criteria.
- Persistent tracking must record status, dependencies, blockers, evidence, and next actions.
- No task may implement a `PROPOSED` or `TBD` line.
- V1 scope: 30-day seasons, multiple rolling worlds, pass, cosmetic shop, Android + iOS, abilities, no chat, guest-first, cosmetics only, no pay-to-win.
- Phone-first controls: touch plus mouse/keyboard; no gamepad.
- Always online; server-side offline defense only.
- Existing AWS, Supabase, and Cloudflare accounts; avoid single-host concentration; Firebase unused.
- Web shop/pass is fully browsable with no checkout; mobile IAP is the only purchase path.
- Sentry is the only external observability service; local rotating logs; no CloudWatch/Grafana.
- Supabase Free for development; Supabase Pro is a launch gate.
- No email OTP or email reminders; no app-level email login.
- Deferral order only with explicit approval: mobile → shop → abilities.
- Pin exact compatible package versions.

## Research Findings

### Baseline reviewed

- `06-data-model.md` in full: authority planes, generic-concept mapping, IDs/time/numeric conventions, ER model, 39 tables, 40 enums, ownership/visibility, persistence/replay, invariants INV-01–INV-36, security, versioning, and appendices.
- `03-gameplay-rules.md`: global simulation contract, time/world/player/faction state machines, economy, queues, research, military, combat, abilities, support/rebellion, AI, season end, pass/shop, visibility, invariants, and the §20 approval register.
- `05-architecture.md`: module map, HTTP/WS boundary, room runtime, command pipeline, persistence, recovery, leases, visibility, merge flow, world generation, deployment, testing, and open questions.
- `04-technology-decisions.md`: stack, hosting, persistence, payments, mobile, observability, admin, and open items.
- `01-requirements.md`: platform matrix, scope, functional requirements FR-001–FR-033, NFR-001–NFR-016, and §13.2.
- `02-game-design.md`: pillars, loop, progression, combat intent, pass/shop, UI, screen map, and §19.
- `domain.ts`: branded IDs, enums, command types, state/view projections, and config types.
- `game.schema.sql`: 39 tables, 40 enums, constraints, indexes, deferred circular FKs, `province_garrison` view, RLS enablement, and schema metadata.

### Key implementation constraints

- The live room plus snapshot/input log is authoritative for world state; normalized tables are projections.
- Commands are validated/applied in memory, then the input event and receipt are committed in one DB transaction; ack only after durable commit; deltas broadcast after commit.
- Exact enemy troop counts must never enter the shared Colyseus schema.
- World time derives from `worlds.started_at`; day index clamps 1–30; war window starts at +18h and ends at +24h each day; season freezes at `T0+30d`.
- A durable command is the input/event-log entry plus receipt; snapshots are accelerators, not ack dependencies.
- AI decisions are audit-only `world_events` rows; replay skips them and recomputes AI state from snapshot + seed + config.
- Trade is 5 trades / 500 gold per faction per world day, reset at the world-day boundary.
- Pass is account-wide and rolling 30 days from purchase; it may cross a season boundary.
- Neutral provinces have no faction owner; neutral garrisons are separate and deleted on capture.
- Battle ordering is `arrive_at`, priority, `army_id`, then `world_events.seq`.
- AI warlords have no capital flag or capital province; captured player capitals become normal AI provinces.
- A title award requires player-controlled and linked-at-freeze; AI and guests are ineligible.
- Web has no checkout; mobile IAP is the only purchase path.
- Admin is a separate internal app with Google-only access, role claims, audit, and no SQL console.

## Gaps, Inconsistencies, and Proposed Changes

| ID | Finding | Impact | Proposal |
|---|---|---|---|
| PC-01 | No implementation plan or machine-readable task register existed. | Execution and tracking would be ad hoc. | Added `plan/07-implementation-plan.md` and `plan/tasks.json`. |
| PC-02 | `04` §8.2 says “premium progress remains season-scoped,” while `09` §14.2 says progress is earned in any world and rewards are account-wide; `06` models one progress row per pass period. | Could cause a wrong reset at a season boundary. | Change `04` to “premium progress is per pass period and account-wide.” Tracked as D-PASS-PROGRESS. |
| PC-03 | `05` §12.8 says pause extends `ends_at`; `06`/SQL use `worlds.season_end`. | Two season clocks risk a wrong freeze. | Use `season_end` as the single field and update `05`. Tracked as D-SEASON-END. |
| PC-04 | `01` FR-032 requires first-capture, day-2 return, war participation, and day-30 active metrics; `06` has no session/funnel table. | Success metrics may be uncomputable or incomplete. | Add `game.metrics_events` or `game.account_sessions`, or approve a log-derived funnel with explicit retention. Tracked as D-METRICS. |
| PC-05 | `06` requires config-hash validation on load, but `worlds` stores only `config_version`/`map_id` strings. | Replay could load the wrong config/map. | Make versions content-addressed or add `config_hash`/`map_hash`. Tracked as D-CONFIG-PIN. |
| PC-06 | `01` §13.2, `02` §19, and `03` §20 overlap. | Inconsistent answers and duplicated approval work. | One decision register, one owner, one gate. |
| PC-07 | `05` §9.3 uses `actor_id`; `06` uses typed actor columns. | Ambiguous audit shape. | Update `05` to the typed columns; `06` remains canonical. |
| PC-08 | `05` §12.3’s 30-minute catch-up policy is PROPOSED/TBD. | Recovery behavior could be invented in code. | Gate it in Phase 4; do not implement a default. |
| PC-09 | `world_events` payload version is only implicit. | Replay compatibility risk. | Require a versioned event envelope or payload version. |
| PC-10 | Sentry native crash capture is not covered by the pinned Sentry version. | Native crashes may be invisible. | Add a store-console crash triage runbook. |

## Assumptions

| ID | Assumption | Validation |
|---|---|---|
| A-01 | Workspace is documentation-only; no code, git repo, or deployment exists. | Confirmed by workspace inspection. |
| A-02 | Existing AWS, Supabase, and Cloudflare accounts are available. | Phase 0 access check. |
| A-03 | Existing EC2 can run Node 24 in Docker and the 3–5 world target. | Phase 0 sizing and Phase 12 load test. |
| A-04 | GitHub Actions and a registry are available; GHCR is default unless ECR is chosen. | D-INFRA. |
| A-05 | Supabase Free is development-only; Pro is a launch gate. | Approved constraint. |
| A-06 | Android and iOS launch with the pinned Capacitor line. | D-PLATFORM, D-PLUGINS, Phase 9. |
| A-07 | Sentry covers server/web errors, performance, cron, and uptime; native crash capture is out of scope. | Confirm store-console process. |
| A-08 | English-only UI; all strings externalized. | Approved constraint. |
| A-09 | Vardania is generated once, reviewed, and versioned. | Phase 2. |
| A-10 | Staging may share the host only with a separate Supabase project and hostname. | D-STAGING. |
| A-11 | Dates/calendar estimates are excluded until capacity is known. | Product decision. |
| A-12 | Pass progress is per pass period unless D-PASS-PROGRESS resolves otherwise. | D-PASS-PROGRESS. |
| A-13 | Config/map versions are content-addressed or hashed. | D-CONFIG-PIN. |
| A-14 | No new analytics vendor; metrics use server events, logs, and Sentry. | D-METRICS. |
| A-15 | Admin is internal, Google-only, and never exposes raw SQL. | D-ADMIN. |

## Technical Decisions

| Decision | Rationale |
|---|---|
| Plan is split into `07-implementation-plan.md` (narrative) and `tasks.json` (machine-readable). | Humans need rationale; agents/CI need stable IDs and status. |
| 14 phases, 13 gates, 32 decision gates, 100 tasks. | Full v1 coverage without turning the plan into a second GDD. |
| P0 includes decision closure before implementation. | Enforces “no implementation from PROPOSED/TBD.” |
| P1–P13 tasks start `blocked`; P0 decision tasks start `ready`/`planned`/`done`. | Accurately reflects the current state. |
| Task IDs use `P{phase}-E{epic}-T{task}`. | Stable, readable, and dependency-friendly. |
| Every task has acceptance criteria and tests. | Prevents “done” without evidence. |
| Phase gates require evidence, not just task completion. | Catches integration and operational gaps. |
| Traceability covers FR-001–FR-033 and NFR-001–NFR-016. | Launch audit can prove coverage. |
| Deferral order is documented but no deferral is approved. | Protects v1 scope. |

## Blockers and Open Decisions

| ID | Blocker | Blocks | Next action |
|---|---|---|---|
| D-TIE | Resolved 2026-10-23: defender wins; attacker loses all; defender loses 50% (DEFAULT). | — | None; automated coverage is owned by P5-E2-T3. |
| D-PD | 41 proposed defaults in `03` §20.2. | Most gameplay phases. | Disposition each item; approve all except item 17 if accepted. |
| D-TBD-* | 23 remaining TBDs in `03` §20.3 (TBD #1 resolved). | Movement, economy, queues, trade, AI, support, score, pass, shop, account, research, capital. | Assign owners and resolve or defer with no task dependency. |
| D-PLATFORM | Browser/iOS/Android minimums and orientation. | Client, mobile, QA. | Engineering proposal; product confirmation. |
| D-LEGAL | Terms, privacy, refunds, tax, age rating, deletion/export. | Launch. | Legal/business owner. |
| D-INFRA | EC2, domain, registry, RPO/RTO, staging. | Deploy and backups. | Ops proposal. |
| D-STORES | RevenueCat product/entitlement mapping. | Commerce and mobile. | Phase 0 sandbox spike. |
| D-PLUGINS | Native social/secure-storage packages. | Mobile auth. | Phase 0 spike; pin versions. |
| D-ADMIN | Admin hosting/auth. | Admin. | Product/engineering decision. |
| D-METRICS | Metrics source and retention. | Observability and launch. | Product/engineering decision. |
| D-RLS | Runtime DB role and policy. | DB security. | Engineering/security decision. |
| D-PASS-PROGRESS | Per-period vs season-scoped pass. | Pass. | Recommend per-period. |
| D-SEASON-END | `season_end` vs `ends_at`. | Pause/freeze. | Recommend `season_end`. |
| D-CONFIG-PIN | Content-addressed config/map or hashes. | Replay/world load. | Recommend content-addressed plus hashes. |
| D-CAPACITY | 3–5 worlds per host. | Load test and launch. | Validate with k6. |

## Verification

- `plan/tasks.json` parses as JSON.
- Register integrity: 100 tasks, 13 gates, 32 decisions, 14 phases; no duplicate IDs; all dependencies, decisions, and blocked-by gates exist; every task has acceptance and tests.
- Plan/register ID match: 100 headings, 100 register tasks, no missing/extra/duplicate IDs.
- TypeScript 7.0.2 strict compile of `plan/schemas/domain.ts`: pass.
- SQL formatter parse of `plan/schemas/game.schema.sql`: pass.
- Markdown checks across 21 `plan/`, `specs/`, and `.planning/` files: balanced fences, unique headings, valid relative links, consistent table pipes: pass.
- Decision/task links: every decision `blocks` entry exists; every task decision gate is listed by that decision: pass.
- `D-TIE` approved 2026-10-23: defender wins; attacker loses all; defender loses 50% (**DEFAULT**). `03` §8.4/§20.1, `09` §9.4, `02` §10.3/§19, `05` §11.6/A-01, and `06` §10.4/§18.1 updated; `P0-E1-T1` is `done`.
- SQL runtime execution: not run; no `psql`/Docker runtime available.
- Target Node 24.22.1: not available locally; environment has Node 22.16.0. P1-E1-T3 is the compatibility gate.
- `pnpm` is blocked by a global `packageManager` field in `C:\Users\A-Dev\package.json`; the workspace must pin its own package manager before use.
- Modular domain implementation in `packages/shared/src/domain/`: 10 submodules strictly <= 350 LOC cap limit (max 205 LOC).
- Domain parity verification (`scripts/validate-domain-parity.js`): 100% of symbols (181) and AST interface properties verified against `plan/schemas/domain.ts`.
- CI quality pipeline: `validate:domain` step added to `.github/workflows/ci.yml` and root `package.json`.
- Game-rules primitives (`P2-E1-T4`) verified 2026-10-24: 83 tests across 7 files; full suite 181 tests; `typecheck`, `lint`, `format:check`, `build`, `check:rules`, `validate:domain`, `validate:tasks`, and `config:check` pass.
- Purity gate negative probe: a temporary game-rules file importing `node:fs/promises` and calling `Date.now()`/`Math.random()` was rejected with three violations, then deleted.
- Dependency reconciliation: `P2-E1-T2` remains `in_progress` for approved seed values; `P2-E1-T4` consumes injected schedules/rates and does not consume those seeds.

## Resources

- `plan/07-implementation-plan.md` — implementation plan.
- `plan/tasks.json` — task register.
- `.planning/2026-10-23-wargame-v1-implementation-plan/task_plan.md` — phase tracker.
- `.planning/2026-10-23-wargame-v1-implementation-plan/progress.md` — work log.
