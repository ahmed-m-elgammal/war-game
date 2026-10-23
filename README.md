# WARGAME: The Succession

A deterministic, server-authoritative multiplayer strategy wargame built with React 19, Phaser 3.90, Fastify, Colyseus, and PostgreSQL.

## Documentation Index

- **Implementation Rules & Operating Guidelines:** [`AGENTS.md`](AGENTS.md)
- **V1 Design Lock (Authoritative):** [`specs/09-v1-design-lock.md`](specs/09-v1-design-lock.md)
- **Architecture & System Design:** [`plan/05-architecture.md`](plan/05-architecture.md)
- **Implementation Plan:** [`plan/07-implementation-plan.md`](plan/07-implementation-plan.md)
- **Task Register:** [`plan/tasks.json`](plan/tasks.json)

## Repository Layout

```text
WARGAME/
├── apps/
│   ├── web/                 React + Phaser browser/mobile client
│   ├── admin/               Internal ops dashboard
│   └── server/              Fastify REST + Colyseus realtime rooms
├── packages/
│   ├── shared/              Protocol schemas, DTOs, branded IDs
│   ├── game-rules/          Pure deterministic game math
│   ├── map-data/            Static province data, masks, borders
│   ├── db/                  Drizzle schema & migrations (Server-only)
│   └── ui/                  Design tokens & UI primitives
├── plan/                    System specifications and architecture plans
└── specs/                   Game design lock and feature documentation
```

## Contributing & Agent Guidelines

Read [`AGENTS.md`](AGENTS.md) before writing code or modifying specifications.
