# 07. V1 Implementation Plan

**Status:** Draft for approval  
**Date:** 2026-10-23  
**Depends on:** `01-requirements.md`, `02-game-design.md`, `03-gameplay-rules.md`, `04-technology-decisions.md`, `05-architecture.md`, `06-data-model.md`, `plan/schemas/domain.ts`, `plan/schemas/game.schema.sql`, `specs/09-v1-design-lock.md`  
**Machine-readable register:** [`tasks.json`](tasks.json)  
**Scope:** dependency-ordered phases, epics, tasks, subtasks, priorities, acceptance criteria, tests, decision gates, and completion criteria for v1.  
**Current state:** Phase 1 started; repository initialized and workspace skeleton created (P1-E1-T1 and P1-E1-T2 done).

---

## 1. Purpose and how to use this plan

This document converts the approved planning baseline into an executable build sequence. It does not implement anything. It defines:

- what must be decided before a feature can start;
- the order in which work becomes available;
- the acceptance evidence required to call a task done;
- the tests that must exist before a phase gate can pass;
- how work is tracked persistently.

Rules for using it:

1. **`09` is authoritative.** If this plan conflicts with `09`, stop and fix the plan or the source document.
2. **No task starts from a `PROPOSED` or `TBD` line.** A task with an open decision gate stays `blocked`.
3. **A phase gate is a hard stop.** Later-phase work may be prototyped behind a throwaway flag only with technical-lead approval; it cannot be merged as v1 behavior.
4. **Tasks are the unit of status.** Update `tasks.json` when a task starts, blocks, or completes. Update `task_plan.md` only when a phase or gate changes.
5. **Tests are part of the task.** A task without its required tests is not done.
6. **Config is not code.** Every `DEFAULT` and approved balance value lives in versioned config, not in a branch.
7. **No silent scope changes.** Any deferral follows §11 and requires product-owner approval.

---

## 2. Source of truth, constraints, and non-negotiables

### 2.1 Authority order

| Rank | Source | Use |
|---:|---|---|
| 1 | `specs/09-v1-design-lock.md` | v1 scope and locked rules |
| 2 | `plan/01-requirements.md` | requirements and launch acceptance |
| 3 | `plan/02-game-design.md` | player experience and design intent |
| 4 | `plan/03-gameplay-rules.md` | field-level rules, state machines, invariants |
| 5 | `plan/04-technology-decisions.md` | approved stack and hosting |
| 6 | `plan/05-architecture.md` | runtime, persistence, authority, recovery |
| 7 | `plan/06-data-model.md` and schemas | entities, constraints, storage mapping |
| 8 | this plan | sequencing and execution |

`03` §20 and `01` §13.2 remain open-decision registers. This plan does not override them.

### 2.2 Locked v1 constraints

- 30-day seasons; multiple rolling worlds; one open world at a time.
- 20–24 human factions, 10–15 AI warlords, 80–100 provinces; Vardania only.
- Guest-first; Google/Apple linking only; no email OTP, app email login, or email reminders.
- Android and iOS Capacitor apps at launch; web is a first-class secondary client.
- Phone-first at 390px; touch plus mouse/keyboard; no gamepad, console, or VR.
- Always online; server-side offline defense only; no offline commands.
- No chat, voice, emotes, pings, user-uploaded images, or free-text social surface.
- Cosmetics only; no pay-to-win, premium currency, loot boxes, or paid pass levels.
- Web shop/pass is fully browsable with no checkout; all purchases are mobile IAP.
- RevenueCat is the only purchase authority; Stripe and web checkout are rejected.
- Supabase Auth + Postgres; Supabase Free for development; Supabase Pro is a launch gate.
- Existing AWS EC2 + Docker Compose + Caddy behind Cloudflare Tunnel; no new VPS and no inbound web ports.
- Cloudflare owns DNS, WAF/CDN, Pages, Tunnel, and R2 backups.
- Sentry is the only external observability service; local rotating logs; no CloudWatch/Grafana.
- Firebase is unused.
- Server-authoritative simulation; in-memory single-writer room; snapshot + ordered input log + projections.
- Exact enemy troop counts never enter shared Colyseus state.

---

## 3. Planning assumptions

These are planning assumptions, not approved game rules. Each is either validated in Phase 0 or tracked as a risk.

| ID | Assumption | Validation |
|---|---|---|
| A-01 | The workspace is documentation-only; no application code, git repository, or deployment exists. | Confirmed by workspace inspection on 2026-10-23. |
| A-02 | The existing AWS, Supabase, and Cloudflare accounts are available to the delivery team. | Phase 0 access check. |
| A-03 | The existing EC2 host can run a multi-arch Node 24 image and the 3–5 world target. | Phase 0 sizing and Phase 12 load test. |
| A-04 | GitHub Actions and a container registry are available; GHCR is the default unless AWS-native ECR is chosen. | D-INFRA. |
| A-05 | Supabase Free is used for development only; no paid live world runs on Free. | Approved constraint. |
| A-06 | The team can support Android and iOS at launch with the pinned Capacitor line. | D-PLATFORM, D-PLUGINS, Phase 9. |
| A-07 | Sentry covers server/web errors, performance, cron, and uptime; native crash capture is out of scope. | Approved constraint; confirm store-console process. |
| A-08 | English-only UI; all strings are externalized. | Approved constraint. |
| A-09 | Vardania geometry is generated once, reviewed, and versioned; worlds reference it. | Phase 2. |
| A-10 | No staging EC2 is confirmed; staging may share the host only with a separate Supabase project and hostname. | D-STAGING. |
| A-11 | Dates and calendar estimates are excluded until team capacity is known. T-shirt sizes are planning aids only. | Product decision. |
| A-12 | The pass is account-wide and rolling; progress is per pass period unless D-PASS-PROGRESS resolves otherwise. | D-PASS-PROGRESS. |
| A-13 | All gameplay config values are versioned and content-addressed; a world pins them at creation. | D-CONFIG-PIN. |
| A-14 | No new analytics vendor is added; metrics come from server events, logs, and Sentry. | D-METRICS. |
| A-15 | The admin app is internal, Google-only, and never exposes raw SQL. | D-ADMIN. |

---

## 4. Proposed changes to the baseline

These are explicit proposals. None is applied silently. Phase 0 decides each.

| ID | Proposal | Why | Files affected |
|---|---|---|---|
| PC-01 | Add `plan/07-implementation-plan.md` and `plan/tasks.json` as planning artifacts. | Gives the team one dependency-ordered execution plan and one machine-readable tracker. | `plan/` |
| PC-02 | Correct `04` §8.2 from “premium progress remains season-scoped” to “premium progress is per pass period and account-wide,” matching `09` §14.2. | `09` says progress is earned in any world and rewards are account-wide; `06` models one progress row per pass period. | `04`, possibly `05` |
| PC-03 | Use `worlds.season_end` as the single season-end field; update `05` §12.8 from `ends_at` to `season_end`. | Avoids two clocks for pause extension and freeze. | `05` |
| PC-04 | Add a durable metrics/session source, either `game.metrics_events` or `game.account_sessions`, or approve a log-derived funnel with explicit retention. | `01` FR-032 needs first-capture, day-2 return, war participation, and day-30 active; `06` has no session/funnel table. | `06`, SQL, `05` |
| PC-05 | Make `config_version` and `map_id` content-addressed, or add `config_hash`/`map_hash` to `worlds`. | `06` requires config-hash validation on load, but the SQL stores only version strings. | `06`, SQL |
| PC-06 | Consolidate `01` §13.2, `02` §19, and `03` §20 into one decision register with one owner and one gate. | Three overlapping lists invite inconsistent answers. | `01`, `02`, `03`, this plan |
| PC-07 | Update `05` §9.3’s `actor_id` wording to the typed actor columns already used by `06` and SQL. | `06` is the canonical data model; typed columns enforce valid actor shapes. | `05` |
| PC-08 | Treat the 30-minute automatic catch-up policy as a gated product decision, not an implementation default. | `05` §12.3 marks it PROPOSED/TBD. | `05`, Phase 4 |
| PC-09 | Define `world_events` payload versioning as a required field or a versioned envelope before the first event is written. | Replay compatibility needs an explicit payload version; `06` leaves it inside the payload. | `06`, shared protocol |
| PC-10 | Add a store-console native-crash triage runbook because Sentry native crash capture is not covered. | Sentry Capacitor 4.4.0 needs `@sentry/react` 10.69.0; v1 pins 11.8.0. | `04`, `05`, Phase 11 |

---

## 5. Delivery model, statuses, and priorities

### 5.1 Status values

| Status | Meaning |
|---|---|
| `planned` | Scoped but not started; gate may still be open. |
| `ready` | All dependencies and decision gates are satisfied; work may start. |
| `in_progress` | Actively being implemented by an owner. |
| `blocked` | Cannot proceed; `blockedBy` names the gate, decision, or task. |
| `done` | Acceptance criteria and tests are complete; evidence is recorded. |
| `cancelled` | Removed by approved scope change; reason recorded. |

### 5.2 Priority values

| Priority | Meaning |
|---|---|
| `P0` | Critical path, launch gate, or decision that blocks other work. |
| `P1` | Required v1 scope; can follow the P0 path but cannot be cut without approval. |
| `P2` | Hardening, polish, or operational maturity required before launch where stated. |

No v1 feature is `P3`. Deferral is a separate product decision, not a priority label.

### 5.3 Task anatomy

Every task in `tasks.json` has:

- `id`, `phase`, `epic`, `title`, `priority`, `status`;
- `dependsOn` task IDs and `decisionGate` IDs;
- `ownerRole`;
- `acceptance` array;
- `tests` array;
- optional `blockedBy`, `size`, `evidence`.

### 5.4 Sizing

| Size | Meaning |
|---|---|
| `S` | One focused change, one owner, small test surface. |
| `M` | Multi-file change, one subsystem, integration tests. |
| `L` | Cross-cutting subsystem, multiple owners, room/DB/E2E tests. |
| `XL` | Phase-sized risk; split before starting if possible. |

Sizes are not dates.

---

## 6. Phase overview

| Phase | Outcome | Gate | Depends on | Main risk |
|---|---|---|---|---|
| P0 | Decisions closed; baseline approved | G0 | none | Decision backlog |
| P1 | Repository, toolchain, CI, tracking | G1 | G0 | Toolchain compatibility |
| P2 | Contracts, config, map, database | G2 | G1 | Schema drift |
| P3 | Auth, accounts, world access | G3 | G2 | Merge conflicts |
| P4 | Runtime, persistence, recovery, world generation | G4 | G3 | Determinism and durability |
| P5 | Core season gameplay | G5 | G4 | Rules breadth and balance |
| P6 | Trade and alliances | G6 | G5 | Escrow and war-lock edge cases |
| P7 | Pass, shop, RevenueCat | G7 | G5 | Store/provider mapping |
| P8 | Web client, map, UI, onboarding | G8 | G3–G7 APIs | Phone usability |
| P9 | Android/iOS shell, native auth, IAP | G9 | G7, G8 | Store review |
| P10 | Admin and moderation | G10 | G3, G4 | Privilege and audit |
| P11 | Infrastructure, security, observability, backups | G11 | G4, G7 | Single-host operations |
| P12 | Verification, load, recovery, launch readiness | G12 | G5–G11 | Late discovery |
| P13 | Launch and hypercare | live | G12 | Incident response |

**Critical path:** P0 → P1 → P2 → P3 → P4 → P5 → G5 → P6/P7/P8 → P9 → G9 → P12 → G12 → P13.

**Parallel tracks after G5:** P6, P7, P8, P10, and P11 may overlap. P9 starts only when P7 and P8 are stable enough to package. P12 starts when the first end-to-end season is playable, not only when every polish task is done.

---

## 7. Gates, decisions, and phase entry rules

### 7.1 Gate catalog

| Gate | Name | Exit evidence |
|---|---|---|
| G0 | Baseline approval | All decision gates dispositioned; docs/schemas promoted; technical and product sign-off |
| G1 | Foundation | Clean clone builds; lint, typecheck, unit smoke, task validator, and CI pass |
| G2 | Contract/data | Domain/SQL/config/map conformance; migrations run; no hardcoded TBD |
| G3 | Identity/join | Guest, link/merge, world list, join, spawn, and authz tests pass |
| G4 | Runtime/persistence | Deterministic tick, durable command, StateView leak, crash/replay, lease tests pass |
| G5 | Core gameplay | FR-010–FR-024 core rules and a 30-day bot season pass |
| G6 | Social/economy | Trade and alliance matrices pass, including war freeze and escrow |
| G7 | Commerce | Pass/shop/RevenueCat sandbox passes; web read-only; no pay-to-win |
| G8 | Web client | 390px E2E, visual, accessibility, reconnect, and read-only shop pass |
| G9 | Mobile | Android/iOS builds, native auth, IAP sandbox, safe areas, store metadata |
| G10 | Admin | Admin authz, audit, moderation, and no-SQL-console checks pass |
| G11 | Ops | Deploy, tunnel, backups, restore drill, Sentry, runbooks, security checks |
| G12 | Launch | `01` §12 acceptance, store approval, legal, load/recovery, no P0/P1 defects |

### 7.2 Decision register

Statuses are `open`, `approved`, `rejected`, or `deferred`. A task whose `decisionGate` is not `approved` is `blocked`.

| ID | Decision | Source | Blocks | Recommended path |
|---|---|---|---|---|
| D-TIE | Exact combat-power tie | `03` §20.1, `09` §9.4 | Combat, battle tests | **Approved 2026-10-23:** defender wins; attacker loses all; defender loses 50% (DEFAULT/config). Mutual wipe rejected. |
| D-PD | 41 proposed defaults | `03` §20.2 | Most gameplay phases | Approved 2026-10-23: items 1-16 and 18-41; item 17 remains TBD under D-TBD-SUPPORT. Dispositions recorded in plan/G0-baseline-approval.md. |
| D-TBD-MOVE | Movement, recall, ability range, missile damage | `03` §20.3 #2–4, #18, #23 | March, abilities | Design proposes values; engineering adds config keys. |
| D-TBD-ECON | Water shortage, unpaid penalty, loot gold, doctrine cost | `03` §20.3 #5–7, #9, #24 | Economy, research | Design proposes values. |
| D-TBD-QUEUE | Training costs, times, batches, slot upgrades | `03` §20.3 #8, #21 | Queues | Design proposes values. |
| D-TBD-TRADE | Offer lifetime, bundles, state-exchange rates | `03` §20.3 #10 | Trade | Design proposes values. |
| D-TBD-AI | AI cadence, scoring, replenishment, retreat | `03` §20.3 #11 | AI | Design proposes values and test expectations. |
| D-TBD-SUPPORT | Major battle threshold, rebel army size | `03` §20.3 #12–13 | Support, rebellion | Design proposes values. |
| D-TBD-SCORE | Score constants and components | `03` §20.3 #14 | Season awards | Design proposes values. |
| D-TBD-PASS | XP, missions, reward catalog | `03` §20.3 #15 | Pass | Product/design proposes values. |
| D-TBD-SHOP | Catalog, prices, refund window, receipt rules | `03` §20.3 #16 | Shop | Product/business proposes values. |
| D-TBD-NOTIFY | In-game notification presentation and priority | `03` §20.3 #17 | Client notifications | Design proposes. |
| D-TBD-ACCOUNT | Deletion, ban, guest-merge edge cases | `03` §20.3 #20 | Auth, legal | Legal/engineering proposes. |
| D-TBD-RESEARCH | Tech costs and late-era gold | `03` §20.3 #21 | Research | Design proposes. |
| D-TBD-CAPITAL | Voluntary relocation cost | `03` §20.3 #22 | Capital | Design proposes. |
| D-PLATFORM | iOS/Android/browser minimums, orientation | `01` §13.2 | Client, mobile | Engineering proposes; product confirms. |
| D-LEGAL | Jurisdiction, terms, privacy, refunds, tax, age rating, deletion/export | `01` §13.2, NFR-009 | Launch | Legal/business owns. |
| D-INFRA | EC2 type/region/OS, domain, registry, RPO/RTO | `01` §13.2, `04` §9 | Deploy, backups | Engineering/ops owns. |
| D-STORES | RevenueCat project, products, entitlement IDs, prices | `04` §8 | Commerce, mobile | Engineering/business owns. |
| D-PLUGINS | Native social-login and secure-storage packages | `04` §9.8 | Mobile auth | Engineering spike; pin exact versions. |
| D-ADMIN | Admin hosting and auth model | `04` §9.6, `06` §12.6 | Admin | Product/engineering owns. |
| D-METRICS | Success-metric source, retention, dashboard | `01` FR-032 | Observability, launch | Product/engineering owns. |
| D-RLS | Runtime DB role and RLS policy | `06` §15 | DB security | Engineering/security owns. |
| D-MAP | Final map values, pan/zoom, spawn geometry | `01` §13.2, `02` §19 | Map, client | Design/engineering owns. |
| D-WAR-TIME | War-window start time per world | `01` §13.2 | World config, client clock | Product/ops owns. |
| D-PASS-PROGRESS | Per-period vs season-scoped pass progress | PC-02 | Pass | Recommend per-period, matching `09` §14.2. |
| D-SEASON-END | `season_end` vs `ends_at` | PC-03 | Pause, season freeze | Recommend `season_end` as the single field. |
| D-CONFIG-PIN | Content-addressed config/map or stored hashes | PC-05 | Replay, world load | Recommend content-addressed IDs plus stored hashes. |
| D-CAPACITY | 3–5 worlds per host | `01` NFR-015 | Load test, infra | Validate with k6; no guarantee before G11. |
| D-STAGING | Staging environment shape | `05` §17.1 | Deploy, QA | Recommend separate Supabase project and hostname; no production data. |
| D-DEFERRAL | Any scope deferral | `01` §9.3 | Scope | No deferral approved. Mobile → shop → abilities only with explicit approval. |
| D-NAMING | Trademark, region/faction names, emblem set | `01` §13.2 | Content, store | Business/legal and art own. |

### 7.3 Phase entry rules

- P1 starts only after G0.
- P2 starts only after G1 and after D-MAP, D-WAR-TIME, and the config decisions needed by its schemas are approved.
- P3 starts only after G2 and D-PLATFORM is approved.
- P4 starts only after G3 and D-SEASON-END, D-CONFIG-PIN, and D-RLS are approved.
- P5 starts only after G4 and D-TIE (approved), D-PD, D-TBD-MOVE, D-TBD-ECON, D-TBD-QUEUE, D-TBD-SUPPORT, D-TBD-SCORE, D-TBD-CAPITAL, and D-TBD-RESEARCH are approved.
- P6 starts only after G5 and D-TBD-TRADE and the alliance defaults are approved.
- P7 starts only after G5 and D-TBD-PASS, D-TBD-SHOP, and D-STORES are approved.
- P8 starts when the APIs it consumes are stable; it may begin against contract mocks after G2.
- P9 starts only after G7, G8, D-PLATFORM, D-PLUGINS, and D-STORES are approved.
- P10 starts only after G4 and D-ADMIN is approved.
- P11 starts after G4 for deploy scaffolding; production backups and launch operations wait for G7 and D-INFRA.
- P12 starts after G5 and the first complete E2E path; it does not wait for every P8/P9 polish task.
- P13 starts only after G12.

---

## 8. Phase plans

### 8.1 Phase 0 — Decision closure and baseline approval

**Objective:** remove every `PROPOSED` and `TBD` that a v1 task would otherwise implement, and pin the external choices that block sequencing.

**Entry:** planning baseline `01`–`06` and schemas exist.  
**Exit:** G0.

#### Epic P0-E1 — Resolve rules and product decisions

##### P0-E1-T1 — Resolve the exact-power tie
- **Priority:** P0 · **Status:** done · **Depends:** none · **Decision gate:** D-TIE (approved 2026-10-23)
- **Subtasks:** choose mutual wipe or defender-wins-with-50%-loss; add exact test vectors; update `03` §8.4/§20.1 and `09` §9.4; confirm `06` battle result shape.
- **Acceptance:** `03` §20.1 has one approved rule; the rule is deterministic and uses unrounded power; no random tie roll; the battle report can explain it.
- **Tests:** T-COMBAT tie cases at ratio 1.0 and near-1.0; replay hash; property test that losses stay within committed counts. Automated coverage is owned by P5-E2-T3.
- **Evidence:** `03` §8.4/§20.1, `09` §9.4, `02` §10.3/§19, `05` §11.6, and `06` §10.4 updated 2026-10-23; `tasks.json` D-TIE is approved.

##### P0-E1-T2 — Approve or reject the 41 proposed defaults
- **Priority:** P0 · **Status:** ready · **Depends:** none · **Decision gate:** D-PD
- **Subtasks:** walk `03` §20.2 item by item; record approve/reject/change and target tag; promote approved items to `09`; keep rejected items out of config.
- **Acceptance:** every item 1–41 has a disposition and an owner; no approved item remains `PROPOSED`; item 17 stays TBD until its threshold is chosen.
- **Tests:** documentation lint; config-key coverage check; review checklist from `03` §20.4.

##### P0-E1-T3 — Resolve the 23 remaining TBDs needed for v1
- **Priority:** P0 · **Status:** planned · **Depends:** P0-E1-T2 · **Decision gate:** D-TBD-MOVE, D-TBD-ECON, D-TBD-QUEUE, D-TBD-TRADE, D-TBD-AI, D-TBD-SUPPORT, D-TBD-SCORE, D-TBD-PASS, D-TBD-SHOP, D-TBD-NOTIFY, D-TBD-ACCOUNT, D-TBD-RESEARCH, D-TBD-CAPITAL
- **Subtasks:** assign an owner per TBD group; choose a value or defer with a no-v1-dependency justification; add config keys; add acceptance criteria where behavior changes.
- **Acceptance:** every TBD is resolved or explicitly deferred with no task dependency; each resolved value has a config key and test vector.
- **Tests:** config schema completeness; `config:check` fails on missing values; traceability review.

##### P0-E1-T4 — Resolve `01` §13.2 and `02` §19 open questions
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1-T2, P0-E1-T3 · **Decision gate:** D-PLATFORM, D-LEGAL, D-INFRA, D-MAP, D-WAR-TIME, D-NAMING
- **Subtasks:** consolidate duplicate questions; assign owner; resolve or mark launch-blocking; add to the decision register.
- **Acceptance:** no orphan question remains in `01` or `02`; each has a disposition or a gate.
- **Tests:** cross-document link and term check; decision-register validator.

##### P0-E1-T5 — Correct cross-document inconsistencies
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1-T4 · **Decision gate:** D-PASS-PROGRESS, D-SEASON-END, D-CONFIG-PIN
- **Subtasks:** apply PC-02, PC-03, PC-05, PC-07, PC-09; record PC-04 and PC-10 as open; scan for stale pass/season wording.
- **Acceptance:** `04` no longer says pass progress is season-scoped; `05` uses `season_end`; `05` uses typed actor columns; config pinning is explicit.
- **Tests:** Markdown term scan; link check; schema/domain review.

##### P0-E1-T6 — Build the decision register and traceability map
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1-T1–T5 · **Decision gate:** none
- **Subtasks:** create one register with ID, source, owner, status, gate, affected tasks; map every FR/NFR to a phase.
- **Acceptance:** every decision in §7.2 has a status; every task with a gate references an existing decision; every FR-001–FR-033 maps to at least one task.
- **Tests:** `tasks.json` validator; traceability completeness check.

#### Epic P0-E2 — Pin external and operational choices

##### P0-E2-T1 — Verify RevenueCat non-renewing pass mapping
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1-T2 · **Decision gate:** D-STORES
- **Subtasks:** create sandbox project; map iOS non-renewing subscription and Android one-time product; verify entitlement/expiry events; document restore and refund paths.
- **Acceptance:** sandbox purchase, restore, expiry, refund, and duplicate webhook are understood; product IDs and entitlement IDs are recorded; no web checkout.
- **Tests:** sandbox checklist; webhook fixture replay; entitlement idempotency.

##### P0-E2-T2 — Pin native social and secure-storage plugins
- **Priority:** P0 · **Status:** ready · **Depends:** none · **Decision gate:** D-PLUGINS
- **Subtasks:** spike Google/Apple native sign-in; compare candidate packages; verify Capacitor 8 compatibility; pin exact versions and native config.
- **Acceptance:** one social plugin path and one secure-storage path are approved for Android and iOS; fallback plan documented.
- **Tests:** device spike on both platforms; token-to-Supabase `signInWithIdToken`; Keychain/Keystore persistence.

##### P0-E2-T3 — Approve admin hosting and auth model
- **Priority:** P1 · **Status:** ready · **Depends:** P0-E1-T4 · **Decision gate:** D-ADMIN
- **Subtasks:** choose Pages vs other hosting; choose Google-only allowlist and role source; define session lifetime and confirmation policy.
- **Acceptance:** admin hostname, auth flow, role claim, allowlist owner, and audit requirements are approved.
- **Tests:** threat-model review; authz matrix draft.

##### P0-E2-T4 — Pin infrastructure and capacity inputs
- **Priority:** P0 · **Status:** ready · **Depends:** none · **Decision gate:** D-INFRA, D-CAPACITY, D-STAGING
- **Subtasks:** record EC2 type/region/OS/architecture; domain names; registry; tunnel; RPO/RTO; staging shape; backup bucket.
- **Acceptance:** deployment can be planned without guessing; capacity target is testable; staging cannot touch production data.
- **Tests:** infra checklist; restore/RTO tabletop.

##### P0-E2-T5 — Define the metrics source and reporting
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1-T4 · **Decision gate:** D-METRICS
- **Subtasks:** map first capture, day-2 return, war-window participation, day-30 active, uptime, latency to a source; choose durable table or log-derived funnel; define retention.
- **Acceptance:** each metric has source, event shape, retention, and reporting path; no new vendor; no PII beyond policy.
- **Tests:** metric mapping review; sample query or log extraction; retention check.

#### Epic P0-E3 — Architecture and baseline sign-off

##### P0-E3-T1 — Write architecture decision records
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E1, P0-E2 · **Decision gate:** all Phase 0 decisions
- **Subtasks:** ADRs for persistence, command pipeline, StateView, lease/fencing, pass model, admin, metrics, config pinning.
- **Acceptance:** each ADR states context, decision, alternatives, consequences, and rollback; no ADR overrides `09`.
- **Tests:** architecture review; cross-reference check.

##### P0-E3-T2 — Promote decisions into docs and schemas
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E3-T1 · **Decision gate:** all Phase 0 decisions
- **Subtasks:** update `09`, `01`, `02`, `03`, `04`, `05`, `06`, `domain.ts`, and SQL; regenerate or review migrations; update config keys.
- **Acceptance:** strict TypeScript compile; SQL parse and migration review; Markdown link/table checks; no unresolved PROPOSED/TBD in an implemented path.
- **Tests:** `tsc --strict`; SQL formatter/parser; Markdown checker; schema conformance.

##### P0-E3-T3 — Hold the G0 baseline review
- **Priority:** P0 · **Status:** ready · **Depends:** P0-E3-T2 · **Decision gate:** none
- **Subtasks:** technical review; product review; legal/ops review of launch blockers; record sign-off and dissent.
- **Acceptance:** G0 evidence is attached; open items are explicitly deferred with no task dependency; the plan and register are approved.
- **Tests:** G0 checklist; decision-register audit.

---

### 8.2 Phase 1 — Monorepo foundation and CI

**Objective:** create a reproducible workspace and the quality gates every later task depends on.  
**Entry:** G0.  
**Exit:** G1.

#### Epic P1-E1 — Repository and toolchain

##### P1-E1-T1 — Initialize the repository and workspace
- **Priority:** P0 · **Status:** done · **Depends:** none · **Decision gate:** none
- **Subtasks:** `git init`; branch protection; README; `.gitignore`; `.editorconfig`; license/notice decision.
- **Acceptance:** clean clone has the documented layout; no secrets or generated build output are committed.
- **Tests:** clean-clone smoke; secret scan.

##### P1-E1-T2 — Create the package skeleton
- **Priority:** P0 · **Status:** done · **Depends:** P1-E1-T1 · **Decision gate:** none
- **Subtasks:** `apps/web`, `apps/admin`, `apps/server`; `packages/shared`, `game-rules`, `map-data`, `db`, `ui`, `test-bot`; `infra/`.
- **Acceptance:** dependency direction in `05` §4.1 is enforced; packages build independently.
- **Tests:** `pnpm -r build`; dependency-boundary lint.

##### P1-E1-T3 — Pin the toolchain and run the TypeScript compatibility gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P1-E1-T2 · **Decision gate:** D-INFRA (Node image), TS compatibility
- **Subtasks:** Node 24.22.1; pnpm 12.15.0; TypeScript 7.0.2; Vite 8.3.5; verify ecosystem compatibility; approve a 6.x fallback if needed.
- **Acceptance:** exact versions are pinned in `package.json`/lockfile and the Docker image; `tsc -b` passes on the skeleton.
- **Tests:** CI matrix; lockfile check; Docker build.

##### P1-E1-T4 — Add lint, format, test, and task-register validation
- **Priority:** P0 · **Status:** blocked · **Depends:** P1-E1-T3 · **Decision gate:** none
- **Subtasks:** ESLint 9 flat config; Prettier; Vitest 5.0.5; Playwright 1.64.1; JSON schema for `tasks.json`; Markdown link/table checker.
- **Acceptance:** a sample failing test blocks CI; task IDs and dependencies validate; docs checks run.
- **Tests:** self-test the validator with duplicate/missing IDs.

#### Epic P1-E2 — CI, security, and local environment

##### P1-E2-T1 — Build the CI and security pipeline
- **Priority:** P0 · **Status:** blocked · **Depends:** P1-E1-T4 · **Decision gate:** D-INFRA
- **Subtasks:** PR install/lint/typecheck/unit/build/Playwright smoke; dependency audit; secret scan; CodeQL or equivalent; artifact retention.
- **Acceptance:** required checks block merge; no long-lived cloud keys in GitHub.
- **Tests:** intentionally failing PR; secret-scan fixture.

##### P1-E2-T2 — Set up the local dev and environment schema
- **Priority:** P0 · **Status:** blocked · **Depends:** P1-E1-T2 · **Decision gate:** D-RLS
- **Subtasks:** local Postgres/Supabase; `.env.example`; Zod env validation; test database; migration reset; no production secrets.
- **Acceptance:** a new developer can boot the workspace from the README; invalid env fails fast.
- **Tests:** clean-machine bootstrap; env failure tests.

##### P1-E2-T3 — Hold the G1 foundation gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P1-E1, P1-E2 · **Decision gate:** none
- **Subtasks:** run all checks; record evidence; confirm no gameplay code exists yet.
- **Acceptance:** G1 evidence is attached; all P0 foundation tasks are done.
- **Tests:** G1 checklist.

---

### 8.3 Phase 2 — Contracts, config, map, and database

**Objective:** make the domain, config, map, and database executable and consistent before runtime work.  
**Entry:** G1.  
**Exit:** G2.

#### Epic P2-E1 — Shared contracts, config, map, and rules primitives

##### P2-E1-T1 — Build the shared protocol package
- **Priority:** P0 · **Status:** blocked · **Depends:** G1 · **Decision gate:** D-PASS-PROGRESS, D-SEASON-END, D-CONFIG-PIN
- **Subtasks:** branded IDs; command/event/error schemas; REST/WS envelopes; protocol version; DTOs; result/error codes.
- **Acceptance:** `domain.ts` types are represented in runtime schemas; unknown fields are rejected; protocol version is explicit.
- **Tests:** schema roundtrip; unknown-field rejection; error-code coverage.

##### P2-E1-T2 — Build the config package and schema
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T1, P0 decisions · **Decision gate:** D-PD, D-TBD-*, D-MAP, D-WAR-TIME
- **Subtasks:** Zod `GameConfig`; units/weapons/skills/abilities/techs/missions/pass/shop; version/hash; `config:check`; seed values only from approved decisions.
- **Acceptance:** missing or `proposed`/`tbd` values fail; a world can pin a config version/hash; no balance value is hardcoded.
- **Tests:** config validation; missing-value failure; version/hash immutability.

##### P2-E1-T3 — Build the Vardania map-data package
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T1 · **Decision gate:** D-MAP
- **Subtasks:** 320×180 mask; 80–100 provinces; adjacency; terrain/resource; refugee pool; spawn rules; map hash; mask hit-test.
- **Acceptance:** every province is land-reachable; every capital has food/water within 2 hops and a weak adjacent target; no adjacent player capitals; no naval province.
- **Tests:** connectivity; spawn invariants; mask hit-test; map hash stability.

##### P2-E1-T4 — Build the game-rules primitives
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T1, P2-E1-T2 · **Decision gate:** D-PD
- **Subtasks:** seeded PRNG; clock/phase/era; integer/remainder math; event ordering; invariant helpers; deterministic ID allocator.
- **Acceptance:** pure package imports no Node, DB, network, React, or browser code; same inputs produce the same output.
- **Tests:** property tests; replay hash; dependency-boundary lint.

#### Epic P2-E2 — Database and conformance

##### P2-E2-T1 — Create the Drizzle schema and first migration
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T1 · **Decision gate:** D-RLS, D-CONFIG-PIN
- **Subtasks:** translate all 39 tables, enums, checks, indexes, deferred FKs, view; generate migration; review SQL.
- **Acceptance:** migration runs from empty; schema matches `06`; `province_garrison` is a view; no DB sequence inside a tick.
- **Tests:** migration up/down where safe; schema diff; SQL parse and execution.

##### P2-E2-T2 — Configure DB roles, RLS, metadata, and seeds
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E2-T1 · **Decision gate:** D-RLS
- **Subtasks:** runtime/migration roles; RLS enablement; no client grants; `schema_meta`; shop/config seeds; backup role.
- **Acceptance:** browser cannot read `game`; runtime role has least privilege; readiness fails on schema-version mismatch.
- **Tests:** role matrix; RLS denial; schema-version failure.

##### P2-E2-T3 — Run domain, SQL, and documentation conformance
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1, P2-E2-T2 · **Decision gate:** none
- **Subtasks:** map every `domain.ts` field to storage or transient; check every table PK/ownership/retention; check invariants INV-01–INV-36; run TS/SQL/Markdown checks.
- **Acceptance:** `06` §18.2 checklist is complete; no exact enemy counts in public types; no app email; no inventory/quest/chat table.
- **Tests:** strict TypeScript; SQL parser/execution; custom conformance script.

##### P2-E2-T4 — Hold the G2 contract/data gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1, P2-E2 · **Decision gate:** none
- **Subtasks:** attach evidence; review migrations; approve config/map versions.
- **Acceptance:** G2 evidence is attached; no unresolved schema decision remains.
- **Tests:** G2 checklist.

---

### 8.4 Phase 3 — Identity, accounts, and world access

**Objective:** a guest can become an account, link Google/Apple safely, see worlds, and join one faction per world.  
**Entry:** G2 and D-PLATFORM.  
**Exit:** G3.

#### Epic P3-E1 — Auth and accounts

##### P3-E1-T1 — Configure Supabase Auth
- **Priority:** P0 · **Status:** blocked · **Depends:** G2 · **Decision gate:** D-PLATFORM, D-LEGAL (privacy)
- **Subtasks:** anonymous sign-in; Google/Apple providers; redirect URLs; JWKS; disable email OTP/app email; dev/prod projects.
- **Acceptance:** guest and social sessions work on web; no email login path exists; secrets stay server-side.
- **Tests:** auth smoke; provider callback; JWKS rotation.

##### P3-E1-T2 — Implement JWT verification and account provisioning
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E1-T1 · **Decision gate:** D-RLS
- **Subtasks:** verify issuer/audience/JWKS; idempotent `accounts` row; guest/linked cache; ban/disabled checks; `/me`.
- **Acceptance:** client cannot choose account ID; retries do not create two accounts; banned accounts cannot join.
- **Tests:** valid/expired/wrong-audience tokens; provisioning idempotency; ban matrix.

##### P3-E1-T3 — Implement profile, name, and emblem validation
- **Priority:** P1 · **Status:** blocked · **Depends:** P3-E1-T2 · **Decision gate:** D-NAMING
- **Subtasks:** display/faction name 1–32; normalization; profanity filter; curated emblems/colors; rename policy.
- **Acceptance:** names normalize consistently; offensive names are rejected; no user-uploaded images.
- **Tests:** validation/fuzz; profanity fixtures; duplicate-name policy.

##### P3-E1-T4 — Implement guest-to-social link and merge
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E1-T2 · **Decision gate:** D-TBD-ACCOUNT
- **Subtasks:** preview both tokens; per-world conflicts; atomic merge; entitlement move; conflicting guest faction abandoned; sessions revoked; audit.
- **Acceptance:** survivor has at most one controllable faction per world; conflict requires explicit confirmation; failure rolls back all; duplicate link is idempotent.
- **Tests:** merge matrix (no conflict, one conflict, multiple, banned, duplicate); entitlement move; room resolution.

#### Epic P3-E2 — World access and join

##### P3-E2-T1 — Implement world list, detail, and preflight
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E1-T2 · **Decision gate:** D-WAR-TIME
- **Subtasks:** list open/running/finished; day/players/war window; join window; capacity; pre-register; preflight guards.
- **Acceptance:** no join after day 3; full world rejects; late joiners can pre-register; public data has no hidden counts.
- **Tests:** API contract; join-window boundaries; capacity race.

##### P3-E2-T2 — Implement the join transaction and spawn
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E2-T1, P2-E1-T3 · **Decision gate:** D-MAP, D-WAR-TIME
- **Subtasks:** one faction per account/world; capital spawn; starting resources/50 infantry; 24h protection; neutral garrisons; initial snapshot.
- **Acceptance:** join is atomic; duplicate/race cannot create two factions; every spawn satisfies `03` §4.4; room receives initial state.
- **Tests:** join/duplicate/race; spawn invariants; snapshot presence.

##### P3-E2-T3 — Hold the G3 identity/join gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E1, P3-E2 · **Decision gate:** none
- **Subtasks:** run authz, merge, join, and leak tests; record evidence.
- **Acceptance:** G3 evidence is attached; no P0/P1 auth/join defect.
- **Tests:** G3 checklist.

---

### 8.5 Phase 4 — World runtime, persistence, and recovery

**Objective:** a world can run deterministically, accept durable commands, hide private state, survive a crash, and recover.  
**Entry:** G3 and D-SEASON-END, D-CONFIG-PIN, D-RLS.  
**Exit:** G4.

#### Epic P4-E1 — Runtime and realtime

##### P4-E1-T1 — Build the server composition root
- **Priority:** P0 · **Status:** blocked · **Depends:** G3 · **Decision gate:** D-INFRA
- **Subtasks:** Fastify + Colyseus on one HTTP server; config validation; Sentry/pino; health/readiness; graceful shutdown.
- **Acceptance:** one process serves REST and WS; readiness waits for assigned worlds; shutdown writes a snapshot and releases leases.
- **Tests:** boot/shutdown; readiness failure; signal handling.

##### P4-E1-T2 — Implement room lifecycle, auth, reconnect, and spectator
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T1 · **Decision gate:** none
- **Subtasks:** loading/open/running/paused/finished/quarantined; `onAuth`; `onJoin`; `onLeave`; reconnection token; spectator public view.
- **Acceptance:** no join before load; paused/finished reject commands; reconnect restores current state; spectator sees public only.
- **Tests:** room harness; reconnect expiry; pause/finish; spectator leak.

##### P4-E1-T3 — Implement the tick scheduler and clock
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T1 · **Decision gate:** D-WAR-TIME, D-SEASON-END
- **Subtasks:** 1s military, 60s economy; UTC; derived phase/era; catch-up; monotonic clock; watchdog.
- **Acceptance:** phase/era derive from `started_at`; no device time; no skipped ticks; overrun pauses/quarantines.
- **Tests:** T-TIME (20 cases); boundary transitions; clock drift; catch-up.

##### P4-E1-T4 — Implement the command pipeline and idempotency
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T1, P4-E1-T3 · **Decision gate:** none
- **Subtasks:** parse; rate limit; authz; dedupe; validate; apply; append input + receipt; ack; broadcast after commit; degraded mode.
- **Acceptance:** no ack before durable commit; duplicate returns original result; stale version returns `STALE_STATE`; rejected intent mutates nothing.
- **Tests:** duplicate; stale; DB failure; rate limit; rejection atomicity.

##### P4-E1-T5 — Implement StateView and the Colyseus schema
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T2 · **Decision gate:** none
- **Subtasks:** public state; exact own/allied maps; private own faction/details; battle reports; per-client filter; serialization tests.
- **Acceptance:** exact enemy counts never enter shared schema; support is public exact; allies do not see resources/queues/research/missions; spectator public only.
- **Tests:** serialization leak matrix; ally visibility; battle-party visibility.

#### Epic P4-E2 — Persistence, leases, and recovery

##### P4-E2-T1 — Implement snapshots, event log, and receipts
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T4 · **Decision gate:** D-CONFIG-PIN
- **Subtasks:** canonical JSON; SHA-256; gzip; per-world seq; input + receipt transaction; projections; retention.
- **Acceptance:** same state serializes to same hash; snapshot failure does not block ack; projections are idempotent; no truncate during season.
- **Tests:** snapshot hash; transaction order; projection rebuild; retention job.

##### P4-E2-T2 — Implement lease, heartbeat, and fencing
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T4 · **Decision gate:** D-RLS
- **Subtasks:** 30s TTL; 10s heartbeat; version increment; stale-writer rejection; lease loss stops room.
- **Acceptance:** two writers cannot append; stale snapshot/event write rejected; DB outage degrades then pauses.
- **Tests:** split-brain; expired lease; heartbeat loss; duplicate seq.

##### P4-E2-T3 — Implement recovery, replay, and quarantine
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1-T1, P4-E2-T1, P4-E2-T2 · **Decision gate:** D-SEASON-END, catch-up policy
- **Subtasks:** load latest snapshot; verify config/map; replay committed inputs; fast-forward; invariant check; quarantine; 30-minute policy.
- **Acceptance:** replay reproduces state hash; audit-only events skipped; AI state recomputed; corrupt state quarantines and alerts.
- **Tests:** crash at random tick; corrupt snapshot; event gap; long outage; T-REPLAY.

#### Epic P4-E3 — World generation and rolling worlds

##### P4-E3-T1 — Implement the world generation transaction
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T3, P3-E2-T2 · **Decision gate:** D-MAP
- **Subtasks:** 20–24 human slots; 10–15 AI; 80–100 provinces; capitals/spawns; neutrals; refugees; neutral garrisons; initial snapshot.
- **Acceptance:** every generation invariant passes; invalid map is rejected; world is published only after generation.
- **Tests:** generation invariants; repeatable seed; capital spacing; neutral garrison seed.

##### P4-E3-T2 — Implement rolling worlds and archive
- **Priority:** P1 · **Status:** blocked · **Depends:** P4-E3-T1 · **Decision gate:** D-CAPACITY
- **Subtasks:** one open world; 3-day window; next world; finished read-only; archive after retention.
- **Acceptance:** no second open world; underfilled world runs without AI backfill; finished world cannot reopen.
- **Tests:** scheduler; window close; archive; world-list state.

##### P4-E3-T3 — Hold the G4 runtime/persistence gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P4-E1, P4-E2, P4-E3 · **Decision gate:** none
- **Subtasks:** run deterministic tick, command durability, StateView, crash/replay, lease, and generation tests; record evidence.
- **Acceptance:** G4 evidence is attached; no P0/P1 runtime or data-loss defect.
- **Tests:** G4 checklist.

### 8.6 Phase 5 — Core season gameplay

**Objective:** make a complete 30-day season playable: economy, queues, research, map control, war, support, AI, and awards.  
**Entry:** G4 and the gameplay decision gates in §7.3.  
**Exit:** G5.

#### Epic P5-E1 — Economy, queues, and research

##### P5-E1-T1 — Implement economy
- **Priority:** P0 · **Status:** blocked · **Depends:** G4 · **Decision gate:** D-PD, D-TBD-ECON
- **Subtasks:** production; capital money; storage caps; upkeep; food/water/money shortages; oil; loot; state exchange hooks; overflow.
- **Acceptance:** five resources never negative; production/upkeep use config; storage cap applies; shortage penalties are deterministic; no hidden modifier.
- **Tests:** T-ECON (25 cases); rounding/remainder; overflow; shortage; property test for non-negative balances.

##### P5-E1-T2 — Implement build and training queues
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1-T1 · **Decision gate:** D-TBD-QUEUE
- **Subtasks:** 1–2 slots; one running per faction; timers; cancel/refund; offline completion; capture/elimination/season-end behavior; queue projections.
- **Acceptance:** one running build and one running training per faction; a province has at most one active build; cancel refund matches config; completion applies once.
- **Tests:** T-QUEUE (20 cases); restart; capture; cap change; duplicate completion.

##### P5-E1-T3 — Implement research, eras, and doctrine
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1-T1 · **Decision gate:** D-TBD-RESEARCH, D-PD
- **Subtasks:** era days 8/16/24; 3-of-5 main-tech gate; instant research; side branches; tech effects; doctrine change in peace; no queue/steal/catch-up.
- **Acceptance:** era gate cannot be bypassed; research applies once; doctrine is national and peace-only; all costs come from config.
- **Tests:** T-TIME era boundaries; research gate; doctrine; effect application; no duplicate effect.

#### Epic P5-E2 — Map control, military, combat, abilities

##### P5-E2-T1 — Implement province, capital, refugee, elimination, and respawn
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1-T1 · **Decision gate:** D-PD, D-TBD-CAPITAL
- **Subtasks:** levels 1–5; fortification; capture; capital relocation; refugee pool; elimination; 35% resource loss; research retention; 24h protection; spectator fallback.
- **Acceptance:** province has one controller; capital flag only on player-owned provinces; AI/rebel capture relocates or eliminates without gaining capital benefits; respawn follows refugee → neutral/AI → spectator.
- **Tests:** T-CAPITAL (15); T-PLAYER (20); capital capture; last-province loss; respawn placement; protection.

##### P5-E2-T2 — Implement military and march
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1-T1 · **Decision gate:** D-TBD-MOVE, D-PD
- **Subtasks:** army states; launch guards; movement ranges; slowest-stack speed; split/merge; recall; reinforce; retreat; fatigue; arrival ordering.
- **Acceptance:** army is in exactly one state/place; no PvP arrival outside war; recall at arrival is too late; split/merge conserves counts; arrival order is time, priority, army ID, seq.
- **Tests:** T-MOVE (25); T-PLAYER; simultaneous arrivals; recall; retreat; target changes.

##### P5-E2-T3 — Implement combat
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E2-T2 · **Decision gate:** D-TIE, D-PD
- **Subtasks:** power formula; era/unit stats; counters; skill/weapon; fortification/capital/offline; additive cap +75%; loser destruction; winner losses; capture; battle log/report.
- **Acceptance:** exact powers use unrounded values; tie follows the approved rule; losses are integer and within committed counts; battle report lists every factor; no hidden modifier.
- **Tests:** T-COMBAT (30); tie; rounding; counters; cap; capture; fatigue; offline +15%; T-FUZZ.

##### P5-E2-T4 — Implement abilities
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E2-T2, P5-E2-T3 · **Decision gate:** D-TBD-MOVE, D-PD
- **Subtasks:** Mobilization; Airstrike; Missile Strike; era gates; war-only; costs; cooldowns; province targeting; damage model; cooldown persistence.
- **Acceptance:** ability unavailable in peace/cooldown/wrong era; costs deduct once; effects apply once; cooldowns persist through respawn and clear at season end.
- **Tests:** T-ABILITY; era/war gates; cooldown; cost; damage; no duplicate effect.

#### Epic P5-E3 — Support, AI, season end, and full-season proof

##### P5-E3-T1 — Implement support and rebellion
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1-T1 · **Decision gate:** D-TBD-SUPPORT, D-PD
- **Subtasks:** support 0–100; thresholds; continuous drivers; regional events; one-time events; capital ×3; one active rebellion; spawn/defeat/grace; rebel armies; rebel capture.
- **Acceptance:** support starts at 60; support never affects combat; one rebellion per faction; spawn below 15 only; grace blocks spawn; rebel capture follows province rules.
- **Tests:** T-SUPPORT (20); threshold 14/15; grace; active group; rebel last-province capture; AI defeat; respawn reset.

##### P5-E3-T2 — Implement AI warlords
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1, P5-E2 · **Decision gate:** D-TBD-AI, D-PD
- **Subtasks:** archetypes; decision cycle; target scoring; war-only player aggression; era scaling; economy/strength; no respawn; no awards; AI audit events; abandonment takeover.
- **Acceptance:** AI never attacks players in peace; AI does not attack protected/refugee players; AI decisions are deterministic; AI state is private; abandoned player faction keeps `kind = player` and gains AI state.
- **Tests:** T-AI (15); war/peace; protection; era scaling; elimination; audit replay skip; abandonment return.

##### P5-E3-T3 — Implement season end, awards, and recap
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1, P5-E2, P5-E3-T1, P5-E3-T2 · **Decision gate:** D-TBD-SCORE, D-PD, D-PASS-PROGRESS
- **Subtasks:** freeze at `season_end`; cancel late marches/queues/trades; final snapshot exactly once; score; Conqueror/Best Nation; tie-breakers; linked/player eligibility; recap; reset/next world.
- **Acceptance:** season never ends early; awards are deterministic; title requires player-controlled and linked at freeze; final snapshot exists; no duplicate award; finished world is read-only.
- **Tests:** T-SEASON (15); freeze; late arrival; award tie; ineligible AI/guest; duplicate freeze; recap.

##### P5-E3-T4 — Run the full-season bot and hold G5
- **Priority:** P0 · **Status:** blocked · **Depends:** P5-E1, P5-E2, P5-E3-T3 · **Decision gate:** none
- **Subtasks:** accelerate 30 days; 20–24 players + AI; random valid/invalid intents; invariants; crash/replay; record evidence.
- **Acceptance:** full season completes; no invariant violation; deterministic replay hash matches; G5 evidence attached.
- **Tests:** bot season; T-FUZZ 10k+ runs; T-REPLAY; G5 checklist.

---

### 8.7 Phase 6 — Trade and alliances

**Objective:** make the social economy complete without shared armies or chat.  
**Entry:** G5 and D-TBD-TRADE plus alliance defaults.  
**Exit:** G6.

#### Epic P6-E1 — Trade and alliances

##### P6-E1-T1 — Implement trade
- **Priority:** P0 · **Status:** blocked · **Depends:** G5 · **Decision gate:** D-TBD-TRADE, D-PD
- **Subtasks:** market listings; direct offers; state exchange; escrow; tax; daily limits; account-age gate; war freeze; cancellation/expiry; audit.
- **Acceptance:** escrow is all-or-nothing; 5 trades/500 gold per faction per world day; reset at world-day boundary; tax follows config; war freezes existing offers; overflow rejects.
- **Tests:** T-TRADE (20); escrow; tax; ally tax-free; limits; war freeze; elimination; expiry.

##### P6-E1-T2 — Implement alliances
- **Priority:** P0 · **Status:** blocked · **Depends:** G5 · **Decision gate:** D-PD (alliance items)
- **Subtasks:** create; invite; accept; leave; kick; max 3; peace-only; war lock; leader succession; cooldowns; shared vision; ally trade; elimination persistence; abandonment removal.
- **Acceptance:** max three factions; one active leader; one active membership; war blocks changes; leave applies −5 and 24h cooldowns; eliminated members remain but cannot lead; abandoned players leave.
- **Tests:** T-ALLY (15); max 3; war lock; leader transfer; kick/leave; ex-ally attack lock; shared vision.

##### P6-E1-T3 — Hold the G6 social/economy gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P6-E1-T1, P6-E1-T2 · **Decision gate:** none
- **Subtasks:** run trade/alliance matrices; verify StateView ally rules; record evidence.
- **Acceptance:** G6 evidence is attached; no P0/P1 escrow or war-lock defect.
- **Tests:** G6 checklist; StateView ally visibility.

---

### 8.8 Phase 7 — Pass, shop, and RevenueCat

**Objective:** sell only cosmetics and the pass, through mobile IAP, with a read-only web storefront.  
**Entry:** G5 and D-TBD-PASS, D-TBD-SHOP, D-STORES.  
**Exit:** G7.

#### Epic P7-E1 — Pass, shop, and entitlements

##### P7-E1-T1 — Implement pass progression and missions
- **Priority:** P0 · **Status:** blocked · **Depends:** G5 · **Decision gate:** D-TBD-PASS, D-PASS-PROGRESS
- **Subtasks:** free/premium tracks; XP; daily/weekly/season missions; reward claims; retroactive premium; auto-claim at expiry; one claim; 30-day term.
- **Acceptance:** pass is account-wide; progress is per pass period unless D-PASS-PROGRESS says otherwise; mid-season purchase makes earned premium rewards claimable; no level buying; no power.
- **Tests:** pass unit/integration; XP; mission; retroactive claim; duplicate claim; expiry auto-claim; no gameplay effect.

##### P7-E1-T2 — Implement shop, cosmetics, and equip
- **Priority:** P0 · **Status:** blocked · **Depends:** G5 · **Decision gate:** D-TBD-SHOP
- **Subtasks:** catalog; `shop_items`; entitlements; one equipped item per slot; account-wide; refund unequip; no pass/shop overlap.
- **Acceptance:** only identity cosmetics; entitlement permanent unless revoked; equip checks ownership; cosmetic never changes stats; web can display but not buy.
- **Tests:** shop/cosmetic; equip/unequip; refund; slot uniqueness; no-pay-to-win audit.

##### P7-E1-T3 — Implement RevenueCat webhook and entitlements
- **Priority:** P0 · **Status:** blocked · **Depends:** P7-E1-T1, P7-E1-T2 · **Decision gate:** D-STORES
- **Subtasks:** authorization header; raw body; event ID idempotency; account mapping; product/entitlement mapping; grant/revoke; pass period; audit.
- **Acceptance:** forged/duplicate/out-of-order events handled; provider event applied once; no client receipt trust; account-wide entitlement; refund revokes.
- **Tests:** T-RC webhook matrix; duplicate; forged; out-of-order; refund; unmapped user.

##### P7-E1-T4 — Implement restore, refund, and revocation
- **Priority:** P0 · **Status:** blocked · **Depends:** P7-E1-T3 · **Decision gate:** D-STORES
- **Subtasks:** server-side RevenueCat REST lookup; missing entitlement grant; refund/chargeback revoke; unequip; idempotent sync.
- **Acceptance:** restore grants only missing entitlements; client `customerInfo` is not authority; refund removes cosmetic and active pass access; audit recorded.
- **Tests:** restore; refund; chargeback; duplicate restore; no double grant.

##### P7-E1-T5 — Implement web read-only APIs and hold G7
- **Priority:** P0 · **Status:** blocked · **Depends:** P7-E1-T1–T4 · **Decision gate:** D-STORES
- **Subtasks:** `GET /pass`; `GET /shop`; claim; equip; guest purchase gate; no checkout endpoint; sandbox evidence; no-pay-to-win audit.
- **Acceptance:** web can browse and claim/equip but has no purchase path; mobile is the only IAP path; G7 evidence attached.
- **Tests:** API contract; guest gate; no checkout; G7 checklist.

---

### 8.9 Phase 8 — Web client, map, and UI

**Objective:** a phone-first client that makes the map the menu and never leaks private state.  
**Entry:** G3–G7 APIs stable; contract mocks allowed after G2.  
**Exit:** G8.

#### Epic P8-E1 — Client foundation, design system, map

##### P8-E1-T1 — Build client bootstrap, auth, and API
- **Priority:** P0 · **Status:** blocked · **Depends:** G3, G4 · **Decision gate:** D-PLATFORM
- **Subtasks:** Vite; Supabase session; guest/link; typed API client; error envelope; Sentry; version mismatch; server-time offset.
- **Acceptance:** guest can boot, restore session, and reach the world list; no service-role key; errors are actionable.
- **Tests:** component; E2E boot; token refresh; version mismatch.

##### P8-E1-T2 — Build the design system and assets
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1-T1 · **Decision gate:** D-NAMING
- **Subtasks:** 16-color palette; paper/ink tokens; typography; 29 icons; emblems/colors; focus states; strings table.
- **Acceptance:** no more than 16 base colors per screen; shape/pattern supports color; all user strings externalized; no user-uploaded images.
- **Tests:** visual; contrast; colorblind review; string extraction.

##### P8-E1-T3 — Build the Phaser map renderer
- **Priority:** P0 · **Status:** blocked · **Depends:** P2-E1-T3, P8-E1-T1 · **Decision gate:** D-MAP
- **Subtasks:** CPU mask rasterizer 320×180; Phaser texture; dirty-province repaint; fit-to-width; optional pan/zoom; hit-testing; no physics.
- **Acceptance:** map loads within 5 seconds on a good connection; 390px fit is usable; province hit-testing matches mask; no physics engine.
- **Tests:** visual; hit-test; resize; frame budget; 390px screenshot.

#### Epic P8-E2 — Screens, flow, and quality

##### P8-E2-T1 — Build the HUD and screens
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1-T1–T3 · **Decision gate:** D-TBD-NOTIFY
- **Subtasks:** world list; map HUD; province panel; research; market; alliance; army/orders; pass; shop; profile; incoming attack; battle report; recap.
- **Acceptance:** every screen in `02` §15.2 exists; support/resources/clock always visible; one modal layer; destructive actions confirm; enemy counts are bands.
- **Tests:** E2E; visual regression; 390px; no hidden exact counts.

##### P8-E2-T2 — Build onboarding and tutorial
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1-T1, P8-E2-T1 · **Decision gate:** none
- **Subtasks:** guest start; name/emblem/color; spawn; tutorial overlay; first capture; link prompt; guest-risk warning.
- **Acceptance:** new guest can complete first capture in 5–10 minutes; 80% within 15 minutes in playtest; link prompt appears after first session; no email.
- **Tests:** E2E first-capture; usability playtest; link prompt; guest warning.

##### P8-E2-T3 — Build the command client and reconnect
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1-T1, P8-E2-T1 · **Decision gate:** none
- **Subtasks:** command builder with UUID/worldVersion; ack/reject; no offline queue; reconnect; stale resync; optimistic UI limits.
- **Acceptance:** client never treats a battle/trade/purchase/capture as final before ack; reconnect replaces store; stale version refreshes; offline is read-only.
- **Tests:** E2E network drop; duplicate click; stale state; offline screen.

##### P8-E2-T4 — Build responsive, accessibility, and keyboard support
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1-T2, P8-E2-T1 · **Decision gate:** D-PLATFORM
- **Subtasks:** 390px layout; safe areas; 44px targets; keyboard focus; Esc; no hover-only; reduced motion; colorblind patterns.
- **Acceptance:** core actions are touch-only possible; keyboard parity; focus visible; no clipped safe areas; accessibility checklist passes.
- **Tests:** Playwright 390px/1280px; axe; keyboard; notched-phone viewport.

##### P8-E2-T5 — Hold the G8 client gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P8-E1, P8-E2 · **Decision gate:** none
- **Subtasks:** E2E, visual, accessibility, reconnect, read-only shop, and leak checks; record evidence.
- **Acceptance:** G8 evidence attached; no P0/P1 client defect.
- **Tests:** G8 checklist.

---

### 8.10 Phase 9 — Android and iOS packaging

**Objective:** ship the same client through Capacitor with native Google/Apple auth, secure storage, and mobile IAP.  
**Entry:** G7, G8, D-PLATFORM, D-PLUGINS, D-STORES.  
**Exit:** G9.

#### Epic P9-E1 — Mobile shell, auth, and IAP

##### P9-E1-T1 — Create the Capacitor shell
- **Priority:** P0 · **Status:** blocked · **Depends:** G8 · **Decision gate:** D-PLATFORM
- **Subtasks:** Android/iOS projects; bundled origin; safe areas; splash/status bar; navigation allowlist; no push; no Firebase.
- **Acceptance:** both apps install and boot; safe areas respected; no cleartext; no secrets in bundle.
- **Tests:** device smoke; safe-area screenshots; bundle secret scan.

##### P9-E1-T2 — Implement native social login and secure storage
- **Priority:** P0 · **Status:** blocked · **Depends:** P3-E1, P9-E1-T1 · **Decision gate:** D-PLUGINS
- **Subtasks:** Google/Apple ID token; Supabase `signInWithIdToken`; cancel/error; Keychain/Keystore; logout; guest warning.
- **Acceptance:** native sign-in links/creates the correct account; tokens survive restart; logout clears; no email path.
- **Tests:** device matrix; cancel/error; token refresh; secure-storage inspection.

##### P9-E1-T3 — Implement RevenueCat mobile IAP
- **Priority:** P0 · **Status:** blocked · **Depends:** P7, P9-E1-T1 · **Decision gate:** D-STORES
- **Subtasks:** SDK; `appUserID`; products; purchase; restore; entitlement refresh; no web checkout; no external purchase link.
- **Acceptance:** sandbox purchase grants account-wide entitlement; restore works; refund revokes; guest purchase blocked; web sees entitlement.
- **Tests:** iOS/Android sandbox; purchase; restore; refund; duplicate; offline.

#### Epic P9-E2 — Store readiness

##### P9-E2-T1 — Prepare store compliance, assets, signing, and CI
- **Priority:** P0 · **Status:** blocked · **Depends:** P9-E1 · **Decision gate:** D-LEGAL, D-STORES, D-PLATFORM
- **Subtasks:** privacy labels; age rating; screenshots; icons; signing; Fastlane or approved path; TestFlight/Play internal; store review notes.
- **Acceptance:** both store submissions are complete; IAP declared; no prohibited external checkout; privacy labels match data.
- **Tests:** submission checklist; TestFlight/Play internal; store preflight.

##### P9-E2-T2 — Hold the G9 mobile gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P9-E1, P9-E2-T1 · **Decision gate:** none
- **Subtasks:** device, sandbox, safe-area, store, and secret checks; record evidence.
- **Acceptance:** G9 evidence attached; both builds pass internal testing; no P0/P1 mobile defect.
- **Tests:** G9 checklist.

### 8.11 Phase 10 — Admin and moderation

**Objective:** operate the game safely without direct database edits or a chat surface.  
**Entry:** G4 and D-ADMIN.  
**Exit:** G10.

#### Epic P10-E1 — Admin and moderation

##### P10-E1-T1 — Implement admin auth and hosting
- **Priority:** P0 · **Status:** blocked · **Depends:** G3, G4 · **Decision gate:** D-ADMIN
- **Subtasks:** separate admin app; Google-only; `app_metadata.role`; allowlist; session lifetime; hostname; no public signup.
- **Acceptance:** non-admin rejected before handlers; no shared player session; admin host is separate from game API.
- **Tests:** authz matrix; role tampering; allowlist removal.

##### P10-E1-T2 — Implement the admin API
- **Priority:** P0 · **Status:** blocked · **Depends:** P10-E1-T1, P4 · **Decision gate:** D-ADMIN
- **Subtasks:** read accounts/factions/worlds/entitlements/reports; pause/resume; force snapshot; rename/reset; ban; grant; force finish; confirmation; audit.
- **Acceptance:** every state-changing action writes `admin_audit` with reason; no raw SQL; live-world actions use a supported command seam; dangerous actions confirm.
- **Tests:** admin integration; audit; pause/resume; force finish; grant; no-SQL-console.

##### P10-E1-T3 — Implement moderation and the admin UI
- **Priority:** P1 · **Status:** blocked · **Depends:** P10-E1-T1, P10-E1-T2 · **Decision gate:** D-ADMIN, D-NAMING
- **Subtasks:** profanity filter; reports; review states; renames; admin screens; reason/confirmation; no chat.
- **Acceptance:** names/emblems can be reported and actioned; `reviewed_by`/`reviewed_at` set together; no public report data; no chat surface.
- **Tests:** moderation flow; report states; rename; audit; UI E2E.

##### P10-E1-T4 — Hold the G10 admin gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P10-E1 · **Decision gate:** none
- **Subtasks:** authz, audit, moderation, and no-SQL-console checks; record evidence.
- **Acceptance:** G10 evidence attached; no P0/P1 privilege defect.
- **Tests:** G10 checklist.

---

### 8.12 Phase 11 — Infrastructure, security, observability, and backups

**Objective:** run the game on the existing EC2 host with no inbound web ports, recoverable data, and only Sentry as external observability.  
**Entry:** G4 for scaffolding; G7 and D-INFRA, D-RLS, D-METRICS for production.  
**Exit:** G11.

#### Epic P11-E1 — Deployment, edge, and data protection

##### P11-E1-T1 — Build Docker, Compose, Caddy, and cloudflared
- **Priority:** P0 · **Status:** blocked · **Depends:** G4 · **Decision gate:** D-INFRA
- **Subtasks:** multi-stage Node 24 image; non-root; pinned digests; healthchecks; `restart: unless-stopped`; log rotation; no published ports; Caddy; tunnel.
- **Acceptance:** app is reachable only through the tunnel; no public 80/443; graceful stop; previous two images retained.
- **Tests:** compose smoke; port scan; graceful shutdown; image digest check.

##### P11-E1-T2 — Configure Cloudflare DNS, WAF, Pages, Tunnel, and R2
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1-T1 · **Decision gate:** D-INFRA
- **Subtasks:** hostnames; TLS; WAF managed rules; rate limits; Pages; Tunnel; R2 buckets; no Workers.
- **Acceptance:** web/admin/game hostnames resolve; WAF and rate limits active; tunnel-only origin; R2 private.
- **Tests:** edge checks; WAF rule test; tunnel failover; R2 access policy.

##### P11-E1-T3 — Build deploy, migration, and rollback pipeline
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1-T1, P11-E1-T2 · **Decision gate:** D-INFRA
- **Subtasks:** GitHub Actions; registry; immutable tag; one-off migration job; healthcheck; rollback; no long-lived AWS keys.
- **Acceptance:** deploy is repeatable; migrations run before app; failed healthcheck rolls back; previous image retained.
- **Tests:** staging deploy; failed migration; failed healthcheck; rollback.

##### P11-E1-T4 — Configure Supabase Pro, backups, restore, and archive
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1-T3 · **Decision gate:** D-INFRA, D-RLS
- **Subtasks:** Pro project; daily backups; nightly encrypted `pg_dump` to R2; event-log archive; retention; restore drill; RPO/RTO.
- **Acceptance:** restore drill succeeds; event archive runs before prune; backup encryption; no production data in staging.
- **Tests:** restore drill; archive/restore; retention; RPO/RTO tabletop.

#### Epic P11-E2 — Observability, security, and runbooks

##### P11-E2-T1 — Configure Sentry, pino, uptime, and metrics
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1-T3 · **Decision gate:** D-METRICS
- **Subtasks:** Sentry server/web; source maps; PII scrubbing; cron heartbeat; pino rotating logs; metric extraction; alerts.
- **Acceptance:** an incident can be traced alert → log → world/account; no provider payloads/tokens/email; no CloudWatch/Grafana; native crash triage documented.
- **Tests:** incident trace; scrub fixture; cron miss; log rotation.

##### P11-E2-T2 — Harden security and write runbooks
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1, P11-E2-T1 · **Decision gate:** D-RLS, D-LEGAL
- **Subtasks:** CSP/CORS; secrets; rate limits; RLS roles; dependency audit; mobile hardening; runbooks for DB, snapshot, lease, payment, auth, tunnel, season-end.
- **Acceptance:** authz/rate-limit matrix passes; no secrets in bundles/logs; runbooks cover the seven required incidents; no direct DB console.
- **Tests:** security checklist; authz matrix; secret scan; tabletop.

##### P11-E2-T3 — Hold the G11 ops gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P11-E1, P11-E2 · **Decision gate:** none
- **Subtasks:** deploy, restore, security, observability, and runbook evidence; record.
- **Acceptance:** G11 evidence attached; no P0/P1 operational defect.
- **Tests:** G11 checklist.

---

### 8.13 Phase 12 — Verification and launch readiness

**Objective:** prove the whole product, not just the parts, before opening paid worlds.  
**Entry:** G5 and first complete E2E path; G6–G11 for the full gate.  
**Exit:** G12.

#### Epic P12-E1 — Verification, stores, and launch

##### P12-E1-T1 — Audit test coverage
- **Priority:** P0 · **Status:** blocked · **Depends:** G5–G11 · **Decision gate:** none
- **Subtasks:** map `03` §19 suites to tests; check unit/integration/room/E2E/load/bot; find untested FRs; add missing.
- **Acceptance:** T-TIME, T-MOVE, T-COMBAT, T-CAPITAL, T-ECON, T-QUEUE, T-SUPPORT, T-TRADE, T-ALLY, T-PLAYER, T-AI, T-SEASON, T-REPLAY, T-FUZZ meet minimums; every FR has evidence.
- **Tests:** coverage report; traceability audit.

##### P12-E1-T2 — Run the k6 load test
- **Priority:** P0 · **Status:** blocked · **Depends:** G11 · **Decision gate:** D-CAPACITY
- **Subtasks:** 5 worlds × 100 clients; REST/WS latency; tick stability; memory; reconnect storm; report.
- **Acceptance:** 3–5 worlds meet tick/broadcast budgets on the target EC2; intent round-trip <200ms under normal load; no cross-world leak.
- **Tests:** k6 report; soak; reconnect storm; capacity note.

##### P12-E1-T3 — Run the 30-day bot season and recovery drills
- **Priority:** P0 · **Status:** blocked · **Depends:** P5, P11-E1-T4 · **Decision gate:** none
- **Subtasks:** accelerated 30-day season; crash at random tick; restore from backup; lease takeover; final snapshot; awards.
- **Acceptance:** season completes; state hash matches; restore succeeds; no duplicate resources/units/purchases; awards exactly once.
- **Tests:** bot; crash matrix; restore drill; T-REPLAY.

##### P12-E1-T4 — Run the device, browser, and accessibility matrix
- **Priority:** P0 · **Status:** blocked · **Depends:** G8, G9 · **Decision gate:** D-PLATFORM
- **Subtasks:** iOS/Android devices; web browsers; 390px; 1280px; safe areas; keyboard; colorblind; contrast; touch targets.
- **Acceptance:** matrix passes; no clipped controls; core actions touch-only; keyboard parity; accessibility checklist passes.
- **Tests:** device matrix; Playwright; axe; manual review.

##### P12-E1-T5 — Run the security review
- **Priority:** P0 · **Status:** blocked · **Depends:** G11 · **Decision gate:** D-LEGAL, D-RLS
- **Subtasks:** threat model; authz; rate limits; secrets; webhook; mobile storage; dependency audit; payment fraud; admin.
- **Acceptance:** no open P0/P1 security defect; no client-trusted value; no state leak; no secret exposure.
- **Tests:** security checklist; authz matrix; secret scan; webhook forgery; state-leak serialization.

##### P12-E1-T6 — Submit to the app stores
- **Priority:** P0 · **Status:** blocked · **Depends:** G9 · **Decision gate:** D-LEGAL, D-STORES
- **Subtasks:** final metadata; privacy labels; age rating; IAP review; screenshots; build upload; respond to review.
- **Acceptance:** both apps submitted and approved; IAP products approved; no external checkout link; privacy labels accurate.
- **Tests:** store checklist; review response log.

##### P12-E1-T7 — Audit the launch acceptance criteria
- **Priority:** P0 · **Status:** blocked · **Depends:** P12-E1-T1–T6 · **Decision gate:** D-LEGAL, D-DEFERRAL
- **Subtasks:** walk `01` §12.1–12.4; verify legal, store, performance, recovery, accessibility, metrics; record gaps.
- **Acceptance:** every launch criterion has evidence or an approved exception; no unapproved scope addition; no P0/P1 defect.
- **Tests:** launch audit; legal sign-off; metrics review.

##### P12-E1-T8 — Hold the G12 launch gate
- **Priority:** P0 · **Status:** blocked · **Depends:** P12-E1-T1–T7 · **Decision gate:** none
- **Subtasks:** go/no-go review; rollback plan; on-call rota; launch communication; final decision.
- **Acceptance:** G12 evidence attached; go/no-go signed; rollback and incident contacts ready.
- **Tests:** G12 checklist.

---

### 8.14 Phase 13 — Launch and hypercare

**Objective:** open paid worlds and operate them through the first stabilization window.  
**Entry:** G12.  
**Exit:** stable live service and retrospective.

#### Epic P13-E1 — Launch and stabilize

##### P13-E1-T1 — Launch production
- **Priority:** P0 · **Status:** blocked · **Depends:** G12 · **Decision gate:** none
- **Subtasks:** deploy; migrate; open world; smoke guest/join/capture/purchase; verify Sentry/logs; announce.
- **Acceptance:** live world accepts players; purchases reconcile; no P0 incident in the first 24 hours.
- **Tests:** launch checklist; smoke; payment sandbox-to-live reconciliation.

##### P13-E1-T2 — Run hypercare and retrospective
- **Priority:** P1 · **Status:** blocked · **Depends:** P13-E1-T1 · **Decision gate:** none
- **Subtasks:** monitor errors/latency/uptime; triage incidents; review metrics; collect player feedback; write retrospective; update backlog.
- **Acceptance:** hypercare report exists; P0/P1 incidents have owners; metrics are reviewed; next-season changes are prioritized.
- **Tests:** daily health review; incident log; retrospective.

---

## 9. Cross-cutting test strategy

### 9.1 Test layers

| Layer | Scope | Required evidence |
|---|---|---|
| Unit | `packages/game-rules` pure functions | Deterministic vectors; property tests; no I/O |
| Contract | `packages/shared` schemas | Roundtrip; unknown-field rejection; error codes |
| Integration | DB + server modules | Migrations; receipts; snapshots; leases; webhooks; merge |
| Room | Colyseus harness | Join; command; StateView; reconnect; tick; freeze |
| E2E | Playwright web | Guest onboarding; join; capture; reconnect; shop read-only; pass |
| Mobile | Manual/device + sandbox | Safe areas; native auth; IAP; restore; offline |
| Load | k6 | 5 worlds × 100 clients; latency; tick stability |
| Bot | Accelerated season | 30 days; 20–24 players + AI; invariants; recovery |
| Security | Checklist + fixtures | Authz; rate limits; secrets; webhook; leak |

### 9.2 Required suites from `03` §19

The following are release-blocking and must meet the minimum case counts:

- T-TIME (20), T-MOVE (25), T-COMBAT (30), T-CAPITAL (15), T-ECON (25), T-QUEUE (20), T-SUPPORT (20), T-TRADE (20), T-ALLY (15), T-PLAYER (20), T-AI (15), T-SEASON (15), T-REPLAY (15), T-FUZZ (10k+ runs).
- The 25 deterministic cases in `03` §19.3 are mandatory, including the approved tie rule, simultaneous arrivals, capital capture, respawn, support threshold, queue capture, restart, trade escrow, war lock, AI peace restriction, and season freeze.
- The property tests in `03` §19.4 are mandatory.

### 9.3 Architecture gates from `05` §16.3

1. No exact enemy values in serialized client state.
2. Same snapshot + inputs + seed → same state hash.
3. Crash at a random tick → restart → valid state.
4. Duplicate command/webhook applies once.
5. 30-day bot season completes.
6. 3–5 worlds meet tick/broadcast budgets.
7. Payment purchase/restore/refund sandbox passes.
8. Guest → social merge conflict path passes.
9. Authz matrix and rate limits pass.
10. CSP/CORS/webhook signature checks pass.
11. No `PROPOSED`/`TBD` value is hardcoded as final.
12. Backup restore drill passes.

### 9.4 Evidence rule

A gate cannot pass on “tests exist.” It needs:

- a command or CI job that runs the test;
- a stored report or link;
- the date and commit;
- the owner who reviewed it;
- any known gaps with an approved exception.

---

## 10. Traceability matrix

### 10.1 Functional requirements

| Requirement | Primary tasks | Gate |
|---|---|---|
| FR-001 worlds, counts, 30 days | P2-E1-T3, P4-E3-T1, P5-E3-T3 | G2, G4, G5 |
| FR-002 awards, no early end | P5-E3-T3 | G5 |
| FR-003 war window and beats | P4-E1-T3, P5-E2-T2, P8-E2-T1 | G4, G5, G8 |
| FR-004 world list and rolling | P3-E2-T1, P4-E3-T2 | G3, G4 |
| FR-005 elimination and respawn | P5-E2-T1 | G5 |
| FR-006 capture and capital | P5-E2-T1, P5-E2-T3 | G5 |
| FR-007 Vardania map | P2-E1-T3, P8-E1-T3 | G2, G8 |
| FR-008 capitals and spawn | P2-E1-T3, P4-E3-T1 | G2, G4 |
| FR-009 province UI and bands | P4-E1-T5, P8-E2-T1 | G4, G8 |
| FR-010 resources and production | P5-E1-T1 | G5 |
| FR-011 upkeep and shortages | P5-E1-T1 | G5 |
| FR-012 levels and upgrades | P5-E1-T2, P5-E2-T1 | G5 |
| FR-013 queues and instant research | P5-E1-T2, P5-E1-T3 | G5 |
| FR-014 trade | P6-E1-T1 | G6 |
| FR-015 support | P5-E3-T1 | G5 |
| FR-016 rebels | P5-E3-T1 | G5 |
| FR-017 units, counters, doctrine | P5-E1-T3, P5-E2-T3 | G5 |
| FR-018 combat | P5-E2-T3 | G5 |
| FR-019 defender agency and recall | P5-E2-T2, P5-E2-T3 | G5 |
| FR-020 march, fatigue, split/merge | P5-E2-T2 | G5 |
| FR-021 abilities | P5-E2-T4 | G5 |
| FR-022 eras and research gate | P5-E1-T3 | G5 |
| FR-023 alliances | P6-E1-T2 | G6 |
| FR-024 AI warlords | P5-E3-T2 | G5 |
| FR-025 guest onboarding | P3-E2-T2, P8-E2-T2 | G3, G8 |
| FR-026 social link | P3-E1-T4, P8-E2-T2 | G3, G8 |
| FR-027 recap and profile | P5-E3-T3, P8-E2-T1 | G5, G8 |
| FR-028 pass | P7-E1-T1, P9-E1-T3 | G7, G9 |
| FR-029 shop | P7-E1-T2, P9-E1-T3 | G7, G9 |
| FR-030 mobile builds | P9-E1, P9-E2 | G9 |
| FR-031 moderation | P10-E1-T3 | G10 |
| FR-032 metrics | P0-E2-T5, P11-E2-T1 | G11 |
| FR-033 server authority and anti-abuse | P1-E2-T1, P4-E1-T4, P11-E2-T2 | G4, G11 |

### 10.2 Non-functional requirements

| Requirement | Primary tasks | Gate |
|---|---|---|
| NFR-001 performance | P8-E1-T3, P12-E1-T2 | G8, G12 |
| NFR-002 reliability and restore | P4-E2, P11-E1-T4, P12-E1-T3 | G4, G11, G12 |
| NFR-003 security | P1-E2-T1, P4-E1-T4, P11-E2-T2 | G4, G11 |
| NFR-004 data integrity | P4-E1-T4, P4-E2-T1, P7-E1-T3 | G4, G7 |
| NFR-005 accessibility | P8-E2-T4, P12-E1-T4 | G8, G12 |
| NFR-006 compatibility | P8-E2-T4, P9-E2, P12-E1-T4 | G8, G9, G12 |
| NFR-007 localization readiness | P8-E1-T2 | G8 |
| NFR-008 observability | P11-E2-T1 | G11 |
| NFR-009 privacy and legal | P0-E1-T4, P0-E2-T4, P12-E1-T7 | G0, G12 |
| NFR-010 fairness | P7-E1-T2, P7-E1-T5 | G7 |
| NFR-011 moderation and safety | P10-E1-T3 | G10 |
| NFR-012 maintainability | P1-E1-T2, P2-E1-T2 | G1, G2 |
| NFR-013 testing | P12-E1-T1, P12-E1-T3 | G12 |
| NFR-014 mobile store compliance | P9-E2-T1, P12-E1-T6 | G9, G12 |
| NFR-015 scalability | P4-E3-T2, P12-E1-T2 | G4, G12 |
| NFR-016 time authority | P4-E1-T3, P8-E2-T3 | G4, G8 |

---

## 11. Scope control, deferral, and change rules

### 11.1 Approved deferral order

If schedule pressure appears, the only permitted discussion order is:

1. Mobile app.
2. Cosmetic shop.
3. Special abilities.

The core season, war window, economy, support, research, alliances, trade, and pass are the last things to cut. **Any deferral requires explicit product-owner approval and a written scope change.** This plan assumes no deferral.

### 11.2 Change rules

- A new feature requires an update to `09`, `01`, `02`, `03`, the data model if needed, and this plan.
- A balance change requires a config version bump and a new world; never rewrite a running world.
- A schema change requires a migration review and a restore plan.
- A protocol change requires a version bump and a client compatibility check.
- A task cannot be marked `done` if its acceptance criteria changed without updating `tasks.json`.

### 11.3 Stop conditions

Stop and escalate if:

- a task needs a `PROPOSED` or `TBD` value;
- a test reveals a locked-rule contradiction;
- a schema change would drop audit/history data during a season;
- a store/provider behavior contradicts the approved payment model;
- a security review finds client-trusted value;
- the 3–5 world capacity target fails and the product wants to launch anyway.

---

## 12. Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | 65+ open decisions delay the start | High | High | Run Phase 0 as a time-boxed decision sprint; group by system; no code from open lines. |
| R-02 | V1 scope is Beta-level and too broad | High | High | Gate each phase; protect the core season; deferral only with approval. |
| R-03 | Deterministic replay is harder than expected | Medium | High | Build replay seams in P2/P4; property tests; 30-day bot; hash checks. |
| R-04 | State leakage | Medium | High | StateView split; serialization leak tests; no exact enemy counts in shared schema. |
| R-05 | RevenueCat non-renewing pass mapping | Medium | High | Phase 0 sandbox spike; provider-neutral entitlement model; no web checkout. |
| R-06 | Supabase Free pause/backup limits | Medium | Medium | Dev only; Pro launch gate; nightly R2 dumps; restore drills. |
| R-07 | Single EC2 host has no HA | Medium | High | Fast restart; lease/replay; backups; capacity limits; runbooks. |
| R-08 | Cloudflare Tunnel dependency | Medium | Medium | Monitor; direct local health; documented failover; no inbound ports. |
| R-09 | TypeScript 7 ecosystem compatibility | Medium | Medium | P1 compatibility gate; approved 6.x fallback; lockfile. |
| R-10 | Native plugin volatility | Medium | Medium | Phase 0 spike; pin exact versions; fallback path; device tests. |
| R-11 | Metrics/legal gaps | High | High | D-METRICS and D-LEGAL in Phase 0; launch blockers. |
| R-12 | Balance without playtests | High | Medium | Config-driven values; bot/season tests; tune after playtests. |
| R-13 | 3–5 worlds per host unproven | Medium | High | k6 load test; capacity note; launch with fewer worlds if needed. |
| R-14 | No confirmed staging environment | Medium | Medium | D-STAGING; separate Supabase project/hostname; no production data. |
| R-15 | Store review rejects payment/auth flow | Medium | High | Follow platform IAP rules; no external checkout; privacy labels; review notes. |
| R-16 | Admin misuse | Low | High | Google allowlist; role claim; audit; no SQL console; confirmation. |

---

## 13. Definition of done and completion criteria

### 13.1 Task done

A task is `done` only when:

- all acceptance criteria are met;
- the required tests exist and pass in CI;
- no `PROPOSED`/`TBD` value is hardcoded;
- config keys and docs are updated;
- server authority and idempotency are preserved;
- StateView leak tests pass if the task touches visible state;
- the 390px layout is checked if the task touches UI;
- evidence is linked in `tasks.json`;
- the owner and reviewer sign off.

### 13.2 Phase gate done

A gate is passed only when:

- every P0 task in the phase is `done`;
- required evidence is attached;
- no P0/P1 defect is open;
- the next phase’s decision gates are approved;
- the technical lead and product owner sign the gate.

### 13.3 Plan complete

This plan is complete when:

- `07-implementation-plan.md` and `tasks.json` exist;
- every task has an ID, phase, epic, priority, status, dependency, decision gate, acceptance criteria, and tests;
- every FR-001–FR-033 and NFR-001–NFR-016 maps to a task and gate;
- every `03` §20 item is represented by a decision gate;
- no implementation code has been written;
- the baseline is ready for G0 review.

---

## 14. Persistent task tracking

### 14.1 Files

| File | Role |
|---|---|
| `plan/tasks.json` | Machine-readable task register; source of truth for task status and dependencies. |
| `.planning/2026-10-23-wargame-v1-implementation-plan/task_plan.md` | Phase-level status and next action. |
| `.planning/2026-10-23-wargame-v1-implementation-plan/findings.md` | Analysis, assumptions, proposed changes, blockers. |
| `.planning/2026-10-23-wargame-v1-implementation-plan/progress.md` | Chronological work log and test results. |
| `.planning/.active_plan` | Points at the active planning plan. |

### 14.2 Update protocol

1. **Before starting:** confirm every `dependsOn` task is `done` and every `decisionGate` is `approved`; set `status: in_progress`, `startedAt`, `owner`.
2. **When blocked:** set `status: blocked`, `blockedBy`, and a one-line reason; do not leave an in-progress task idle.
3. **When complete:** set `status: done`, `completedAt`, `evidence` (test report, PR, commit, screenshot, or doc link).
4. **When a gate passes:** update the phase status in `task_plan.md`, append the gate evidence to `progress.md`, and set the next phase’s ready tasks to `ready`.
5. **When scope changes:** update `09`/`01` first, then `tasks.json`, then this plan; never silently change acceptance criteria.
6. **Weekly:** audit `in_progress` tasks, stale blockers, and gate readiness.

### 14.3 Validation

After P1-E1-T4, `tasks.json` is validated by a JSON schema and a small script that checks:

- unique task IDs;
- every `dependsOn` and `decisionGate` exists;
- every `done` task has evidence;
- every phase has a gate;
- every gate has at least one P0 task;
- every FR/NFR has a mapping.

Until that script exists, validate with:

```bash
node -e "JSON.parse(require('fs').readFileSync('plan/tasks.json','utf8')); console.log('tasks.json parses')"
```

---

## Appendix A. Task register schema

Each task object in `tasks.json` uses:

```json
{
  "id": "P5-E2-T3",
  "phase": "P5",
  "epic": "P5-E2",
  "title": "Implement combat",
  "priority": "P0",
  "status": "blocked",
  "dependsOn": ["P5-E2-T2"],
  "decisionGate": ["D-TIE", "D-PD"],
  "blockedBy": ["G4", "D-PD"],
  "ownerRole": "server+design",
  "size": "L",
  "acceptance": ["..."],
  "tests": ["T-COMBAT", "T-FUZZ"],
  "evidence": []
}
```

Top-level fields:

| Field | Meaning |
|---|---|
| `version` | Register format version. |
| `updatedAt` | Last update date. |
| `statusValues` | Allowed statuses. |
| `priorityValues` | Allowed priorities. |
| `gates` | Gate catalog and status. |
| `decisions` | Decision register and status. |
| `phases` | Phase metadata. |
| `tasks` | Flat task array; `phase`/`epic` fields provide grouping. |

## Appendix B. Gate checklist

### G0 — Baseline
- [x] `03` §20.1 tie approved (2026-10-23).
- [x] All 41 proposed defaults dispositioned (items 1-16 and 18-41 approved; item 17 remains TBD under D-TBD-SUPPORT).
- [ ] All 23 open TBDs resolved or deferred with no task dependency.
- [ ] `01` §13.2 and `02` §19 dispositioned.
- [ ] External/infra decisions pinned.
- [ ] ADRs written.
- [ ] Docs and schemas promoted.
- [ ] Technical and product sign-off.

### G1 — Foundation
- [ ] Clean clone builds.
- [ ] Toolchain pinned; TS compatibility gate passed.
- [ ] Lint/format/typecheck/unit smoke pass.
- [ ] Task validator passes.
- [ ] CI and security checks block merge.

### G2 — Contract/data
- [ ] `domain.ts` strict compile.
- [ ] SQL parses and migration runs.
- [ ] Config/map versions and hashes pinned.
- [ ] Conformance checklist complete.
- [ ] No hardcoded TBD.

### G3 — Identity/join
- [ ] Guest auth works.
- [ ] Google/Apple link and merge matrix pass.
- [ ] World list/preflight/join work.
- [ ] One faction per world enforced.
- [ ] Authz/rate-limit checks pass.

### G4 — Runtime/persistence
- [ ] Tick/phase/era deterministic.
- [ ] Command ack after durable commit.
- [ ] StateView leak tests pass.
- [ ] Snapshot/replay hash matches.
- [ ] Lease split-brain test passes.
- [ ] World generation invariants pass.

### G5 — Core gameplay
- [ ] Economy, queues, research pass.
- [ ] Province/capital/elimination pass.
- [ ] March/combat/tie pass.
- [ ] Abilities pass.
- [ ] Support/rebellion pass.
- [ ] AI pass.
- [ ] Season/awards pass.
- [ ] 30-day bot passes.

### G6 — Social/economy
- [ ] Trade escrow/tax/limits pass.
- [ ] War freeze pass.
- [ ] Alliance max/war lock/cooldowns pass.
- [ ] Ally visibility rules pass.

### G7 — Commerce
- [ ] Pass progress/claims pass.
- [ ] Shop/equip pass.
- [ ] RevenueCat webhook/restore/refund pass.
- [ ] Web read-only.
- [ ] No pay-to-win.

### G8 — Web client
- [ ] 390px E2E pass.
- [ ] Map/hit-test/fit pass.
- [ ] Onboarding first capture pass.
- [ ] Reconnect/stale pass.
- [ ] Accessibility/visual pass.

### G9 — Mobile
- [ ] Android/iOS boot.
- [ ] Native auth/secure storage pass.
- [ ] IAP sandbox pass.
- [ ] Safe areas pass.
- [ ] Store metadata/submission pass.

### G10 — Admin
- [ ] Admin authz pass.
- [ ] Audit every action.
- [ ] Moderation/report/rename pass.
- [ ] No SQL console.

### G11 — Ops
- [ ] Tunnel-only origin.
- [ ] Deploy/rollback pass.
- [ ] Supabase Pro/backups/restore pass.
- [ ] Sentry/pino/metrics pass.
- [ ] Security/runbooks pass.

### G12 — Launch
- [ ] `01` §12.1–12.4 pass.
- [ ] Load/30-day bot/recovery pass.
- [ ] Store approval.
- [ ] Legal/privacy/age/refund/tax ready.
- [ ] No P0/P1 defect.
- [ ] Go/no-go signed.

## Appendix C. Immediate next action

The plan is ready for review, but **no implementation task may start** until G0. The next gate work is:

> D-TIE is approved (defender wins; attacker loses all; defender loses 50%; DEFAULT config). Disposition `03` §20.2 items 1–41 and the 23 remaining TBDs in `03` §20.3.

This is tracked as `P0-E1-T2` and `P0-E1-T3` in `tasks.json`.


