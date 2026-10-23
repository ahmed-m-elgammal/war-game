# Task Plan: Wargame V1 Implementation Plan

## Goal

Produce a complete, dependency-ordered v1 implementation plan and persistent task register from the approved planning baseline, without writing implementation code.

## Next Step

`D-TIE` is approved (2026-10-23). Next, disposition `03` §20.2 items 1–41 and the 23 remaining TBDs in `03` §20.3. No implementation task may start before G0.

## Current Phase

Phase 6 — Delivery

## Phases

### Phase 1: Requirements & Discovery
- [x] Read `01`–`06`, `domain.ts`, and `game.schema.sql`
- [x] Identify constraints and decision gates
- [x] Record source-of-truth hierarchy
- **Status:** completed

### Phase 2: Analysis & Findings
- [x] Identify cross-document inconsistencies
- [x] Record assumptions and proposed changes
- [x] Map FR/NFR coverage and blockers
- **Status:** completed

### Phase 3: Implementation Plan
- [x] Define 14 phases and 13 gates
- [x] Define epics, tasks, subtasks, priorities, acceptance, and tests
- [x] Write `plan/07-implementation-plan.md`
- **Status:** completed

### Phase 4: Task Register & Tracking
- [x] Create `plan/tasks.json` with 100 tasks
- [x] Add 32 decision gates and dependency links
- [x] Initialize `findings.md`, `task_plan.md`, and `progress.md`
- **Status:** completed

### Phase 5: Verification
- [x] Validate register integrity and plan/register ID match
- [x] Run strict TypeScript compile
- [x] Run SQL formatter parse
- [x] Run Markdown checks
- [x] Record final verification results
- **Status:** completed

### Phase 6: Delivery
- [x] Produce the plan and register for review
- [x] Resolve the first G0 decision (`D-TIE`, approved 2026-10-23)
- [ ] Disposition `03` §20.2 items 1–41
- [ ] Resolve the 23 remaining TBDs in `03` §20.3
- [ ] Promote the baseline for technical and product review
- **Status:** in_progress

## Decisions Made

| Decision | Rationale |
|---|---|
| Use `plan/07-implementation-plan.md` for narrative and `plan/tasks.json` for machine-readable tracking. | Humans need rationale; CI/agents need stable IDs and status. |
| Use 14 phases and 13 gates. | Full v1 coverage with hard stops for decisions and integration. |
| Keep all P1–P13 tasks `blocked` until G0. | Enforces “no implementation from PROPOSED/TBD.” |
| Treat `09` as authoritative and `06` as canonical data model. | Prevents derived-doc drift. |
| Record PC-01–PC-10 as proposals, not silent edits. | Respects approval rules. |
| Exact-power tie: defender wins; attacker loses all; defender loses 50% (**DEFAULT**). | Product-owner approval 2026-10-23; avoids a mutual wipe while preserving the defense advantage. |
| Monorepo skeleton initialized (P1-E1-T1 & P1-E1-T2). | Git repository pushed to GitHub, 10 projects linked with pnpm workspace. |

## Errors Encountered

| Error | Resolution |
|---|---|
| Local Node is 22.16.0, not the pinned Node 24.22.1. | Recorded as a P1 toolchain gate; no implementation depends on it yet. |
| `pnpm` is blocked by a global `packageManager` field in `C:\Users\A-Dev\package.json`. | Resolved: pinned `"packageManager": "pnpm@12.15.0"` in local `package.json`. |
| No `psql`/Docker runtime for SQL execution. | SQL was formatter/parser-checked only; runtime validation remains a P2 gate. |
| `npx typescript@7.0.2 tsc` treated `tsc` as a file. | Use `npx --package typescript@7.0.2 tsc`. |
