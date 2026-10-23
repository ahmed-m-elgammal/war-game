# 04. Technology Decisions

> **Project:** The Succession
> **Document:** `plan/04-technology-decisions.md`
> **Version:** 1.0 — technology baseline
> **Date:** 2026-10-23
> **Status:** Draft for technical and product-owner review
> **Authority:** [`specs/09-v1-design-lock.md`](../specs/09-v1-design-lock.md) is the v1 design authority. This document selects the technology used to satisfy it. Where a choice here conflicts with `09`, `09` wins unless the conflict is recorded as an approved spec delta in §17.
> **Companions:** [`plan/01-requirements.md`](01-requirements.md) (requirements), [`plan/02-game-design.md`](02-game-design.md) (game design), [`plan/03-gameplay-rules.md`](03-gameplay-rules.md) (execution rules), and [`plan/05-architecture.md`](05-architecture.md) (module boundaries and data flow).
> **Audience:** Engineering, design, QA, operations, and product.

---

## 1. Purpose

This document chooses the runtime, language, rendering approach, physics/collision approach, data layer, authentication, payments, hosting, build tooling, mobile packaging, testing stack, and observability for v1.

It is not an implementation guide. It records:

- what is chosen and why;
- the exact package baseline at the plan date;
- what was rejected and under what conditions it should be revisited;
- which choices are approved, proposed, or still TBD;
- the spec deltas that must be promoted into `09`, `01`, and `02` before implementation starts.

`05-architecture.md` divides the selected stack into modules and defines their responsibilities.

---

## 2. Decision rules

### 2.1 Authority and status

1. **`09` is authoritative.** No technology choice may silently change a locked gameplay rule, scope item, or acceptance criterion.
2. **A conflict is a spec delta.** If a technology decision requires changing `09`, the delta is listed in §17 and must be approved by the product owner before the change is promoted into the spec.
3. **`PROPOSED` is not approved.** A proposed technical default may be used for planning, but not treated as final implementation policy.
4. **`TBD` stops implementation.** When a TBD blocks a module, the module is designed with an explicit seam and the TBD remains visible.
5. **`03` §20 is the gameplay approval register.** No gameplay value from a `PROPOSED` or `TBD` line in `03` is implemented as final.

### 2.2 Selection rules

| Rule | Meaning |
|---|---|
| **Latest stable compatible** | Use the latest stable release that is compatible with the rest of the stack. Alpha/beta releases are not used in v1 unless explicitly approved. |
| **Exact pins** | Versions are pinned in `pnpm-lock.yaml`, Docker image digests, and mobile build files. No floating `latest` tags in production. |
| **Server authority** | The client never decides a gameplay outcome. Every visible state is a projection of server state. |
| **Managed where it reduces risk** | Use Supabase for Postgres and identity, Cloudflare for edge/static delivery, RevenueCat for mobile purchases, and Sentry for errors. Do not self-host what the team would have to operate badly. |
| **No single-bucket dependency** | The database and auth do not run on the game server. The EC2 host runs only the game/API process and its reverse proxy/tunnel. |
| **One deployable game service** | Fastify and Colyseus run in one Node process for v1. Split only after load tests show a need. |
| **Mobile-first, web-complete** | The web client is fully playable. Mobile packaging is required by v1; purchases are mobile-only. |
| **No new vendor without approval** | Every new paid or personal-data service requires a product-owner decision. |
| **Reversible by seam** | Hosting, auth, and payments are isolated behind interfaces so a later change does not rewrite gameplay code. |
| **Scope guard** | If scope pressure appears, the deferral order is mobile → shop → abilities, only with explicit product-owner approval. It is not a technology decision. |

### 2.3 Version policy

- The baseline below was checked against the npm registry on **2026-10-23**.
- Patch releases may be applied automatically after CI passes.
- Minor releases require a branch and a compatibility run.
- Major releases require an ADR and a rollback plan.
- A dependency that cannot run on the pinned Node LTS is replaced, not forced.
- `package.json` uses exact versions; the lockfile is the real pin.
- Docker images are pinned by tag and digest. Mobile SDK versions are pinned in Gradle/Xcode project files.
- The §3 table is a compatibility baseline, not the complete dependency list. Every package (including Radix, ESLint, Prettier, and test helpers) is pinned exactly in `pnpm-lock.yaml`; container images are pinned by digest in `infra/docker/`; mobile SDKs are pinned in Gradle/Xcode. “Latest stable at bootstrap” means chosen once and then pinned, never floating.

---

## 3. Stack at a glance

| Area | Decision | Status |
|---|---|---|
| Server runtime | Node.js **24.22.1** Active LTS | Decided |
| Language | TypeScript **7.0.2**, strict mode, ESM | Decided |
| Package manager | pnpm **12.15.0** workspaces | Decided |
| Client UI | React **19.3.1** + Radix primitives + CSS Modules/design tokens | Decided |
| Map renderer | Phaser **3.90.0** (latest 3.x) | Decided |
| Client state | Zustand **5.0.16** | Decided |
| Client audio | Howler.js **2.2.4** | Decided |
| HTTP framework | Fastify **5.12.7** | Decided |
| Realtime server | Colyseus **0.18.x** (`colyseus` 0.18.10 / `@colyseus/core` 0.18.23) | Decided |
| Database | Supabase PostgreSQL (Supabase Pro at launch) | Decided |
| Supabase client | `@supabase/supabase-js` **2.118.0** | Decided |
| ORM | Drizzle ORM **0.45.4** + Drizzle Kit **0.31.11** + `pg` **8.23.1** | Decided |
| Validation | Zod **4.6.7** | Decided |
| JWT verification | jose **6.2.13** | Decided |
| Auth | Supabase Auth; guest first; Google + Apple only; no email OTP | Decided; spec delta approved |
| Payments | RevenueCat **13.7.6**; mobile IAP only; web read-only; no Stripe | Decided; spec delta approved |
| Hosting | Existing AWS EC2 Linux + Docker Compose + Caddy + Cloudflare Tunnel | Decided |
| Edge/static | Cloudflare DNS, WAF/CDN, Pages, R2 for backups | Decided; admin Pages **PROPOSED** |
| Error/performance | Sentry **11.8.0** (`@sentry/node`, `@sentry/react`); local rotating logs; no CloudWatch | Decided |
| Mobile packaging | Capacitor **8.5.3**; Android + iOS; Xcode 26+; SPM | Decided |
| Build orchestration | Vite **8.3.5**, `tsc -b`, GitHub Actions | Decided |
| Testing | Vitest **5.0.5**, Playwright **1.64.1**, k6, deterministic bot | Decided |
| Physics/collision | No physics engine; province graph + mask hit-testing | Decided |
| Map rendering approach | CPU mask rasterizer → Phaser texture; repaint on ownership/level change | Decided |
| Persistence model | Compressed snapshots + append-only committed-input/event log + read projections | Decided |
| Live state authority | One in-memory single-writer Colyseus room per world | Decided |
| Scale target | 3–5 concurrent worlds on one EC2 host, load-tested | Decided |
| Firebase | Not used in v1 | Decided; spec delta approved |

---

## 4. Runtime and language

### 4.1 Node.js 24.22.1 LTS

**Decision:** Target Node.js **24.22.1** (Active LTS, Krypton).

Why:

- It is the latest line that is actually LTS on the plan date. Node 26.12.1 is published but still marked non-LTS; it must not be the v1 production runtime.
- It supports the ESM, `fetch`, WebSocket, and test tooling the server needs.
- Colyseus, Fastify, Drizzle, and `pg` are all validated on current Node LTS lines.

Rejected:

| Alternative | Why not |
|---|---|
| Node 26.12.1 | Not LTS on 2026-10-23. Revisit when it is promoted and dependencies pass CI. |
| Bun | Faster startup, but the Colyseus/Postgres/native-tooling story is less proven and adds a second runtime to support. |
| Deno | Good runtime, but the server ecosystem and mobile tooling are a poorer fit. |
| Go/Rust game server | Strong performance, but duplicates the TypeScript domain model and slows the small team. Revisit only if Node cannot hit load targets. |

**TBD:** The exact Node patch is moved forward only through security/patch updates. Node 26 is a post-launch upgrade, not a v1 dependency.

### 4.2 TypeScript 7.0.2

**Decision:** TypeScript **7.0.2** in strict mode, ESM, `moduleResolution: "NodeNext"`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride`.

Why:

- One language across client, server, shared rules, tools, and tests.
- Shared Zod schemas and generated types reduce client/server drift.
- TypeScript 7 is the current stable compiler line and is the version the team should learn now.

**Compatibility gate:** TypeScript 7 is new relative to parts of the ecosystem. Phase 0 must run `pnpm typecheck` across all packages. If a required dependency cannot typecheck under TS 7, the fallback is the latest compatible TypeScript 6.x line, recorded as an ADR. Do not mix compiler versions across packages.

**Rules:**

- `any` is banned in domain code; use `unknown` at boundaries and Zod parsing.
- No non-null assertions in gameplay rules; model absence explicitly.
- Shared protocol types come from Zod schemas, not hand-written duplicates.
- Client and server share `packages/shared`; the server remains the authority even when a type is shared.

### 4.3 pnpm workspaces

**Decision:** pnpm **12.15.0** with a single workspace lockfile.

Why:

- Strict dependency resolution prevents phantom imports between client, server, and shared packages.
- One lockfile makes CI reproducible.
- Workspace filtering (`pnpm --filter`) fits the monorepo layout in `05`.

Rejected: npm workspaces (weaker isolation), Yarn Berry (additional PnP complexity), Turborepo/Nx (not needed for this repo size; add only if CI time becomes a measured problem).

### 4.4 Server runtime shape

**Decision:** One Node process per EC2 host, containing:

- Fastify for `/api/v1`;
- Colyseus for the realtime world rooms;
- the world runtime, persistence worker, and RevenueCat webhook handler.

Why:

- A RevenueCat entitlement change can update the live room directly.
- One deploy unit and one auth/JWT verification path.
- The target is 3–5 worlds, not a fleet.
- A crash/restart affects both API and rooms, but snapshot recovery is already required.

**Rejected:** two containers (API + game) for v1. It isolates event loops but adds internal auth, two deploy units, and cross-service entitlement notification. Revisit after load tests show API work interfering with tick latency.

**Production rule:** The process binds to an internal port only. Caddy and Cloudflare Tunnel are the only ingress. The process runs as a non-root user in Docker.

---

## 5. Client stack

### 5.1 React 19.3.1 for UI, Phaser 3.90.0 for the map

**Decision:** Use React for all DOM UI and Phaser 3.90.0 only for the map canvas and map-local interaction.

Why:

- The UI is dense: world list, province sheet, queues, research, trade, alliance, army, pass, shop, settings, battle reports. React and Radix are a better fit than Phaser DOM elements.
- The map is a low-resolution pixel field with a texture and hit mask. Phaser is the right renderer and input surface.
- Phaser 3.90.0 is the latest 3.x release. It preserves the existing design-lock assumptions and avoids a Phaser 4 migration during v1.
- React 19.3.1 is the current stable React line.

Rejected:

| Alternative | Why not |
|---|---|
| Phaser 4.2.1 | Newer major; unnecessary migration risk for v1. Revisit after launch. |
| Phaser-only UI | Harder forms, accessibility, focus management, and text-heavy panels. |
| React Native/Expo | The game is a browser-first canvas app with a Capacitor wrapper; a native rewrite is out of scope. |
| Unity/Godot | Wrong tool for a server-authoritative HTML5 strategy game and mobile store size. |
| PixiJS | Viable renderer, but Phaser provides the scene, input, camera, and loader pieces already used by the map plan. |

### 5.2 UI primitives and styling

**Decision:**

- Radix primitives for dialogs, popovers, tabs, tooltips, switches, and menus.
- CSS Modules for component-scoped styles.
- A design-token layer (CSS custom properties) for color, spacing, type, elevation, and motion.
- No CSS-in-JS runtime and no utility-class framework as the primary styling system.

Why:

- Radix supplies accessible behavior without imposing a visual language.
- CSS Modules keep the bundle small and make the pixel-art/war-room visual direction explicit.
- Tokens allow the same components to render in the map, sheets, and admin app.

**Rules:**

- Touch targets are at least 44 × 44 CSS pixels.
- No hover-only action is required to play.
- Focus states are visible and keyboard navigation works for every non-map panel.
- The map has a text-based province list/search fallback for players who cannot use the visual map.
- `prefers-reduced-motion` disables non-essential motion.

### 5.3 Client state

**Decision:** Zustand **5.0.16** with explicit slices and schema-derived selectors.

Slices:

- `session` — Supabase session, account, link state.
- `worlds` — world list and join state.
- `world` — current world projection and server clock offset.
- `map` — selected province, camera, filter overlays.
- `panels` — open sheet/dialog and navigation stack.
- `queues` — build/training/research views.
- `passShop` — pass progress, catalog, entitlements (read-only on web).
- `notifications` — in-game event toasts and unread state.
- `settings` — audio, motion, colorblind mode, safe-area preferences.

**Rules:**

- The store never becomes a second game authority. It holds the latest server projection and UI state.
- Colyseus schema callbacks write into the store through one adapter; components do not subscribe to raw schema objects.
- Selectors are narrow; no component subscribes to the whole world state.
- On reconnect, the store replaces the world projection rather than merging stale arrays.
- REST data (shop, pass, account) is fetched through a typed client and written into the store; no separate query-cache library is required in v1.

Rejected: Redux Toolkit (more ceremony than needed), MobX (less predictable with schema updates), React Context for world state (too many re-renders).

### 5.4 Audio

**Decision:** Howler.js **2.2.4** for all audio, shared by Phaser and React.

Why:

- One audio layer avoids two competing sound systems.
- It handles mobile unlock, sprite atlases, volume, and mute reliably.
- The v1 audio direction is minimal cues, not full music.

**Rules:**

- Audio unlocks on the first explicit user gesture.
- Master, music, and SFX volumes persist locally.
- The game is fully playable muted.
- No audio is required to understand a battle or timer.

### 5.5 Map rendering

**Decision:** CPU mask rasterizer into an offscreen canvas, uploaded to a Phaser texture.

Pipeline:

1. Load the static Vardania mask (one color per province) and province metadata.
2. Precompute a `Uint16Array` mapping every mask pixel to a province index.
3. Build a base `ImageData` for the map at its native low resolution.
4. Paint province fill colors from ownership and level.
5. Paint borders by comparing neighboring province IDs.
6. Upload the `ImageData` to a Phaser texture with nearest-neighbor scaling.
7. On an ownership or level change, repaint only the dirty provinces and re-upload once per frame at most.
8. Draw capital stars, protection shields, incoming-attack warnings, and selection rings as separate Phaser objects, not into the mask.

Why:

- The map is pixel art; a CPU mask produces crisp, authored shapes without polygon artifacts.
- It avoids a full WebGL shader pipeline and keeps the map deterministic across devices.
- Dirty repainting is cheap at 320 × 180 and avoids per-frame full-map work.
- The same mask drives hit-testing: pointer coordinates → mask pixel → province ID.

Rejected:

| Alternative | Why not |
|---|---|
| WebGL shader-only map | More power, but more device/driver risk and a harder pixel-art pipeline for v1. |
| Phaser Graphics polygons | Scaling and border artifacts at low resolution; harder to match the pixel-art map. |
| Pre-rendered map variants per ownership combination | Combinatorial explosion and large asset size. |
| SVG map | DOM overhead and fuzzy pixel edges; poor fit for the art direction. |

### 5.6 Camera and input

**Decision:** Fit-to-width by default, with optional pan and pinch/drag zoom. No precision gesture is required for any core action.

- The map fills the available width above the bottom bar.
- Tap selects a province.
- Drag pans when zoomed.
- Pinch zooms on touch; mouse wheel zooms on desktop.
- A reset control returns to fit-to-width.
- All gameplay actions are available through taps and panels; zoom is never required to attack, upgrade, or trade.
- The map shows a selected-province ring and a tappable list alternative.
- No gamepad support in v1; the input contract is touch, mouse, and keyboard.

### 5.7 Physics and collision

**Decision:** No physics engine.

- Provinces are graph nodes; adjacency is static data.
- Armies move along graph edges with server timestamps.
- Combat is resolved by the server’s power comparison, not by collision geometry.
- Pointer hit-testing uses the province mask, not physics bodies.
- There are no rigid bodies, continuous collisions, or client-side movement simulation.

This is a strategy map, not a platformer. Adding a physics engine would add cost without gameplay value.

---

## 6. Server and data

### 6.1 Fastify 5.12.7 + Colyseus 0.18

**Decision:** Fastify hosts the versioned REST API and attaches Colyseus to its underlying HTTP server.

Why:

- Fastify gives schema validation, fast routing, raw-body handling for webhooks, and a mature plugin set.
- Colyseus owns room lifecycle, state synchronization, reconnection, and per-client views.
- One HTTP server simplifies CORS, auth, and Cloudflare Tunnel routing.

**Route layout:**

- `https://game.example.com/api/v1/*` — REST.
- `https://game.example.com/*` — Colyseus matchmaking/WebSocket paths.
- `https://game.example.com/healthz` — health probe for Sentry uptime monitoring.
- `https://app.example.com` — Cloudflare Pages web client.
- `https://admin.example.com` — Cloudflare Pages admin client (hosting choice **PROPOSED**).

**Rules:**

- JWT verification happens once in a Fastify auth plugin and once in Colyseus `onAuth`.
- Colyseus room auth uses the same Supabase JWKS and account lookup as REST.
- Webhooks are raw-body routes and verify provider signatures/authorization before parsing.
- No route accepts a client-computed result.

### 6.2 Colyseus rooms

**Decision:** One room per active world, addressed by `worldId`.

- Room ID is the world ID.
- The client joins with `joinById(worldId, { accessToken })`.
- `onAuth` verifies the Supabase JWT, loads the account, checks ban/eligibility, and returns a seat descriptor.
- The room uses `StateView` to project state per client.
- Reconnection uses Colyseus’s reconnection token and a bounded seat reservation.
- A world that ends transitions to a finished room/archive path; it does not accept new commands.

**Visibility rule (critical):**

- The shared schema must never contain exact enemy troop counts in a field visible to the enemy.
- Public state carries only approximate enemy bands.
- Exact own/allied counts live in separate private maps included by `StateView` only for the owner/alliance.
- Private resources, queues, research, missions, and support exact values are owner-only.
- Battle reports reveal the exact forces after resolution, as locked by `09`.
- A leakage test must assert that an enemy client cannot observe exact counts in serialized state, not merely that the UI hides them.

### 6.3 Persistence

**Decision:** Supabase PostgreSQL as durable storage, with compressed snapshots, an append-only committed-input/event log, and normalized read projections.

- **Live authority:** the in-memory world room.
- **Durable authority:** the latest committed snapshot plus the ordered input/event log.
- **Read model:** normalized tables for world lists, admin views, season results, and recovery diagnostics.
- **Audit:** command and admin events are append-only.

This model is defined in detail in `05`. It replaces the “load and lock affected DB rows for every command” wording in `03` §2.3; see §17.

### 6.4 Supabase PostgreSQL

**Decision:** Supabase Postgres for production and development; Supabase Pro is a launch gate.

Why:

- Managed backups, connection pooling, observability, and no database server to patch.
- It keeps the database off the single EC2 game host.
- Supabase Auth uses the same project, which simplifies identity and account deletion.
- Supabase Free is acceptable for development only; it can pause and has limited backups.

**Rules:**

- App tables live in a dedicated `game` schema, not `public`.
- RLS is enabled on all `game` tables; `anon`/`authenticated` have no direct table grants.
- The client never connects to Postgres. It talks to REST and Colyseus.
- Runtime uses the Supabase pooler in transaction mode; migrations use a direct/session connection.
- No named prepared statements that break transaction pooling.
- Nightly logical dumps are exported to Cloudflare R2 in addition to Supabase backups.
- Restore is tested before launch and at least monthly afterward.

**TBD:** PITR add-on, exact RPO/RTO, and the production Supabase region.

### 6.5 Drizzle ORM

**Decision:** Drizzle ORM **0.45.4** with Drizzle Kit **0.31.11** and `pg` **8.23.1**.

Why:

- SQL-first schema and migrations are easy to review.
- Typed queries work with the pooled `pg` driver.
- It does not hide the SQL needed for snapshots, event ordering, or advisory locks.
- It can target a non-public schema.

**Rules:**

- Migrations are generated SQL files committed to the repo; no `db push` in production.
- Migration order is forward-only. Destructive changes require a backup and an explicit approval.
- Runtime and migration DB credentials are separate.
- Every table has `created_at`; mutable gameplay projections also have `updated_at` and `version`.
- Snapshots are gzip-compressed `bytea`; JSONB is used for event payloads, configuration snapshots, and selected metadata, not as a substitute for every relational field.

### 6.6 Why not Redis

**Decision:** No Redis in v1.

- One process owns each world; no cross-process room routing is needed.
- Snapshots and the input/event log live in Postgres.
- Rate limiting can use in-process memory plus Cloudflare edge rules.
- Adding Redis would add another service to operate without solving a current bottleneck.

Revisit when the game runs on more than one app instance and needs shared presence, room placement, or cross-instance pub/sub.

---

## 7. Authentication and accounts

### 7.1 Supabase Auth

**Decision:** Supabase Auth is the identity provider.

- Guest: Supabase anonymous user.
- Linked identity: Google or Apple.
- No email/password and no email OTP in v1.
- Web: Supabase OAuth redirect for Google/Apple.
- Mobile: native Google/Apple SDK returns an ID token; the client exchanges it with Supabase `signInWithIdToken`.
- Colyseus and Fastify verify Supabase JWTs via the project JWKS.

Why:

- Guest-first is native to Supabase anonymous sign-in.
- Google + Apple covers both stores and satisfies Apple’s guideline when another social login is offered.
- JWTs are verifiable by both HTTP and WebSocket paths.
- It removes email deliverability, SMTP, magic-link deep links, and password support from v1.

**Native social integration:** use a maintained Capacitor social-login plugin that returns Google/Apple ID tokens. The proposed baseline is `@capgo/capacitor-social-login` **8.7.5**; the fallback is the Capawesome Google + Apple pair (`@capawesome/capacitor-google-sign-in` and `@capawesome/capacitor-apple-sign-in`, both 0.1.4). A Phase 0 mobile spike picks one and records the decision.

**Session storage:**

- Web: Supabase session in browser storage; strict CSP and no third-party scripts.
- Mobile: encrypted Keychain/Keystore via `capacitor-secure-storage-plugin` **0.13.0**.
- Non-secret preferences use `@capacitor/preferences`.
- Refresh tokens are rotated by Supabase; logout clears the local session and revokes where possible.

### 7.2 Guest-to-social linking

**Decision:** A guest can play immediately. Linking Google/Apple is optional until the player needs purchases, titles, season-history credit, or cross-device access.

**Link flow:**

1. The guest keeps a Supabase anonymous session.
2. The player signs in with Google/Apple, producing a second Supabase session.
3. The client calls `POST /api/v1/auth/link/preview` with the guest and social access tokens.
4. The server verifies both, checks `is_anonymous` and provider identities, and returns conflicts by world.
5. If the social account already has a faction in the same world, the guest faction is abandoned only after an explicit confirmation.
6. `POST /api/v1/auth/link` reassigns non-conflicting guest factions and account entitlements to the social account in one transaction.
7. The guest Supabase user is disabled/merged, sessions are revoked, and an audit row is written.
8. No resources, armies, or entitlements are duplicated. If a conflict is not confirmed, linking fails with a stable error code.

The rule “keep the existing social account; abandon guest progress after confirmation” is approved. It applies per world; non-conflicting guest worlds are reassigned.

### 7.3 Authorization

- `account_id` is the Supabase user ID.
- `app_metadata.role === "admin"` is required for admin APIs; it is never accepted from a client-supplied claim.
- Every faction action checks that the authenticated account owns the faction.
- Alliance actions check role and alliance state server-side.
- Admin endpoints are separate, audited, and never share a room token.
- Guest accounts cannot purchase, claim titles, or access cross-device history.

### 7.4 Rejected auth alternatives

| Alternative | Why not |
|---|---|
| Email OTP / magic link | Adds SMTP, deliverability, expiry, and mobile deep-link work. The product owner chose Google/Apple only. |
| Firebase Auth | Viable, but splits identity from Supabase data and adds a second vendor with no v1 need. |
| Custom opaque tokens | More control, but the team would own passwordless email delivery, token rotation, revocation, and abuse handling. |
| Passwords | Higher support and breach risk; poor guest-first fit. |
| Supabase Auth on web + Firebase on mobile | Two identity systems and a hard merge story. |

---

## 8. Payments

### 8.1 RevenueCat mobile IAP only

**Decision:** RevenueCat **13.7.6** handles iOS StoreKit and Android Play Billing. Web has no checkout.

- Web shows the shop, pass, prices, and owned entitlements, but no buy button.
- All purchases happen in the mobile app.
- RevenueCat webhooks are the source of truth; the client’s purchase state is never trusted.
- Server entitlements are account-wide and visible on web.
- No Stripe account is required.

Why:

- Apple and Google require in-app purchase for digital goods consumed in the app.
- RevenueCat handles receipt validation, restore, and entitlement events.
- A browsable web storefront preserves discovery without adding a second payment stack.
- It matches the approved v1 scope delta.

### 8.2 Product model

| Product | Store type | Entitlement | Server rule |
|---|---|---|---|
| Season pass (`pass_30d`) | iOS non-renewing subscription; Android one-time product (verify RevenueCat's supported non-subscription mapping in Phase 0) | `season_pass` | Grants a rolling 30-day term from purchase; can cross a season boundary; repeat purchase/stacking is **TBD** |
| Cosmetic item | Non-consumable | Item ID in `account_entitlements` | Permanent unless refunded/revoked |
| Cosmetic bundle | Non-consumable | Bundle ID + contained item IDs | Permanent; server expands bundle once |

Rules:

- The mobile SDK is configured with `appUserID = Supabase user ID`.
- A guest must link Google/Apple before the purchase UI is enabled.
- The server validates the RevenueCat webhook authorization header.
- Every webhook event is idempotent by event ID.
- Restore purchases calls a server endpoint that fetches the subscriber from RevenueCat’s REST API using a server-only secret; the client’s `customerInfo` is not authoritative.
- Refund/revocation removes the entitlement and unequips the cosmetic if active.
- The pass grants premium-track access while active; premium progress remains season-scoped.
- If a pass crosses a season boundary, the remaining days unlock the next season’s premium track.
- No pay-to-win, no resource packs, no paid pass levels, no premium currency.

**TBD:** exact product IDs, prices, catalog, repeat-purchase/stacking rule, refund policy, tax/VAT, and RevenueCat project configuration.

### 8.3 Rejected payment alternatives

| Alternative | Why not |
|---|---|
| Stripe Checkout on web | Requires a second payment integration and a web checkout surface the product owner does not want. |
| RevenueCat web billing | Uses Stripe underneath; still adds a web checkout and tax work. |
| Direct StoreKit/Play Billing | More native code, receipt validation, restore, and reconciliation than the team needs. |
| Premium currency | Adds economy and regulatory complexity; out of scope. |

---

## 9. Hosting and platform integration

### 9.1 Topology

```
Player
  │ HTTPS / WSS
  ▼
Cloudflare edge (DNS, WAF, CDN, Pages)
  │
  ├── app.example.com  ──► Cloudflare Pages (React + Phaser web client)
  ├── admin.example.com ─► Cloudflare Pages (admin client, proposed)
  └── game.example.com ──► Cloudflare Tunnel
                             │
                             ▼
                    EC2 Linux host
                    ┌─────────────────────────────┐
                    │ cloudflared (outbound only) │
                    │            │                │
                    │            ▼                │
                    │ Caddy (internal HTTP)       │
                    │            │                │
                    │            ▼                │
                    │ Node 24: Fastify + Colyseus │
                    └─────────────────────────────┘
                             │
              ┌──────────────┼───────────────┐
              ▼              ▼               ▼
        Supabase        RevenueCat        Sentry
     Postgres + Auth     webhooks       errors/perf
```

- **Cloudflare** owns DNS, WAF/CDN, Pages, Tunnel, and R2 backups.
- **AWS EC2** runs only the game/API process, Caddy, and cloudflared. This is the existing EC2 instance; v1 does not add a new VPS.
- **Supabase** owns Postgres and Auth.
- **RevenueCat** owns mobile purchase state.
- **Sentry** owns error/performance telemetry and uptime/cron monitors.
- **Firebase** is not used in v1.

### 9.2 Why Cloudflare Tunnel

- No inbound web ports on EC2.
- No origin certificate to rotate.
- The instance can live in a private subnet/security group with outbound access only.
- WAF and DDoS protection apply at the edge.
- WebSocket traffic is supported through the tunnel.

Trade-off: one extra hop and a `cloudflared` process to monitor. For a turn-based/strategy game with 1s ticks, this is acceptable. Revisit if measured WebSocket latency fails the budget.

### 9.3 EC2 host requirements

**Minimum:** 2 vCPU, 2 GB RAM, 20 GB gp3, Linux, Docker Engine + Compose v2, outbound HTTPS.

**Recommended:** 2 vCPU, 4 GB RAM, 30 GB gp3.

Why 2 GB is the floor: Postgres is not on the host; the app, Caddy, cloudflared, and Docker overhead must fit alongside a 3–5 world target. 4 GB gives build/backup/headroom.

**Rules:**

- No public 80/443. Prefer AWS Systems Manager Session Manager instead of public SSH.
- Docker images pinned by digest.
- `restart: unless-stopped`, healthchecks, `stop_grace_period: 30s`.
- Container logs use Docker’s `json-file` driver with size/rotation limits. No CloudWatch.
- The host clock is NTP-synced; the game still uses server UTC and its own monotonic tick loop.
- EBS snapshots are not the database backup; Supabase is.

**TBD:** EC2 instance type, region, OS image (Ubuntu 24.04 LTS or Amazon Linux 2023), and whether the existing instance is x86_64 or Graviton. The Docker image build must be multi-arch if Graviton is possible.

### 9.4 Docker Compose services

| Service | Responsibility |
|---|---|
| `app` | Node 24, Fastify + Colyseus, migrations entrypoint, healthcheck |
| `caddy` | Internal reverse proxy, compression, security headers, access log to stdout |
| `cloudflared` | Outbound tunnel to Cloudflare; no published ports |

No Postgres, Redis, or Firebase container on the host.

### 9.5 Supabase

- Development: Free project.
- Production: **Pro is a launch gate**. Do not run paid live worlds on Free.
- Postgres and Auth only; no Supabase Storage, Realtime, or Edge Functions in v1.
- Supabase backups plus nightly logical dumps to R2.
- Production region chosen near the primary player base; **TBD**.

### 9.6 Cloudflare

- **Pages:** web static build from GitHub Actions; admin build if the proposed admin hosting is approved.
- **DNS/WAF/CDN:** `app`, `admin`, `game` hostnames; rate limits on auth/webhook paths; managed WAF rules.
- **Tunnel:** `game.example.com` → Caddy.
- **R2:** encrypted database dumps and event-log archives. No runtime game assets.
- No Cloudflare Workers in v1.

### 9.7 Build and deploy pipeline

**Decision:** GitHub Actions.

- PR: install, lint, typecheck, unit, integration, build, Playwright smoke.
- `main`: build and push a multi-arch image to GHCR (or ECR if the team prefers AWS-native); deploy to EC2.
- Tags: Android and iOS builds, store upload.
- Nightly: deterministic bot season, k6 load test, snapshot recovery drill.
- Security: dependency audit, secret scanning, CodeQL or equivalent.

**Deploy mechanism (PROPOSED):**

1. Build image and push with an immutable tag.
2. Run migrations as a one-off job with the migration credential.
3. Pull and restart `app` with `docker compose up -d --no-deps app`.
4. Healthcheck `/readyz`; if it fails, roll back to the previous image tag.
5. Keep the previous two images on the host.

Use a dedicated deploy key or AWS SSM; no long-lived AWS access keys in GitHub. The exact choice is **TBD** until the EC2 access method is confirmed.

### 9.8 Mobile packaging

**Decision:** Capacitor **8.5.3**, Android and iOS, both stores at launch.

- Android: latest Google Play-required target SDK, JDK 21, Gradle.
- iOS: Xcode 26+, Swift Package Manager, current App Store minimum from the Capacitor 8 template.
- Plugins: App, Browser, Network, Preferences, Splash Screen, Status Bar, secure storage, social login, RevenueCat.
- No push plugin, no Firebase.
- IAP only on mobile; web is read-only.
- Store signing keys are in GitHub Actions secrets; no keys in the repo.

**Rejected:** Capacitor 9.0.0-alpha.8 (alpha; plugin compatibility unverified), PWA-only (no store IAP), native rewrite (scope).

---

## 10. Build and tooling

| Tool | Decision |
|---|---|
| Package manager | pnpm 12.15.0 workspaces |
| Web/admin bundler | Vite 8.3.5 |
| Type checking/build | `tsc -b` project references; per-package `tsc` for server output |
| Lint/format | ESLint 9 flat config + Prettier (pin at bootstrap) |
| Unit/integration | Vitest 5.0.5 |
| Browser E2E | Playwright 1.64.1 |
| Load | k6 (pin at bootstrap) |
| Bot | TypeScript bot using the Colyseus client |
| Server image | `node:24.22.1-bookworm-slim`, multi-stage, non-root |
| Reverse proxy | Caddy 2 (pin image digest) |
| Tunnel | cloudflared (pin image digest) |
| Mobile CI | GitHub Actions macOS runners for iOS; Ubuntu for Android |
| Store upload | Fastlane (PROPOSED; pin at bootstrap) |

**Rules:**

- `pnpm -r build` must be deterministic; generated files are not committed unless they are migrations or static map data.
- Source maps are uploaded to Sentry in CI and hidden from public serving.
- No build step downloads runtime game assets from R2.
- The web bundle is versioned; incompatible client versions get a refresh prompt.

---

## 11. Testing and quality

### 11.1 Test layers

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure rules: production, upkeep, combat, capture, support, trade, research, pass XP, visibility banding |
| Integration | Vitest + Postgres | Drizzle migrations, snapshot/event replay, leases, entitlement webhooks, account merge |
| E2E | Playwright | Guest onboarding, join world, capture, reconnect, shop read-only, pass display |
| Load | k6 | 5 worlds × 100 WebSocket clients, REST p95, broadcast latency |
| Bot | Custom TypeScript | Full 30-day accelerated season, invariants, crash/recovery, time travel |
| Mobile | Manual + store internal testing | Safe areas, touch, IAP sandbox, social login, restore |

### 11.2 Mandatory gates

- StateView leakage test: enemy clients never receive exact troop/resource/queue fields.
- Deterministic replay: same snapshot + ordered inputs + seed → same state hash.
- Snapshot recovery: kill the app at a random tick, restart, compare state and continue.
- Idempotency: duplicate commands and webhooks apply once.
- Season: accelerated 30-day bot season completes with 20–24 players + AI.
- Load: 3–5 worlds on the target EC2 without tick/broadcast budget breach.
- Payments: sandbox purchase, restore, refund, and webhook replay.
- Auth: guest → social merge, conflict path, cross-device login, ban.
- Security: authz matrix, rate limits, webhook signature, CSP, dependency audit.

### 11.3 Not in v1

- Native UI automation (Detox/Maestro) is not required; Playwright covers the web surface and mobile gets manual/store testing.
- Chaos engineering beyond the scripted crash/recovery drill.
- Full accessibility certification; colorblind-safe and touch-target checks are required.

---

## 12. Observability and operations

### 12.1 Sentry only

**Decision:** Sentry **11.8.0** for web and server error/performance telemetry. No Sentry Capacitor SDK, so native crashes rely on App Store/Play Console reports.

- Web/mobile WebView: `@sentry/react` 11.8.0.
- Server: `@sentry/node` 11.8.0.
- Uptime monitor: `/healthz` through Cloudflare.
- Cron monitors: tick loop, snapshot writer, nightly backup.
- Release/source-map upload in CI.
- `sendDefaultPii: false`; scrub tokens, emails, and IPs where possible.
- No Replay in v1.

**Trade-off:** chosen by the product owner. Native crash visibility is weaker; document it as a launch risk.

### 12.2 Logs

- Structured JSON via pino 10.4.0 to stdout.
- Docker `json-file` with `max-size=10m` and `max-file=5`.
- Local rotating logs on the EC2 host; no CloudWatch.
- No Prometheus, Grafana, Datadog, or third-party log service.

**Trade-off:** no infrastructure CPU/disk/memory alarms and no central log search. The health endpoint and Sentry uptime/cron monitors partially compensate. This is a documented operational risk.

### 12.3 Backups and recovery

- Supabase Pro daily backups.
- Nightly encrypted logical dump to R2; 30-day retention.
- Event-log archive to R2 before pruning.
- Restore drill before launch and monthly after.
- Snapshot recovery is part of the release gate.
- **TBD:** RPO/RTO and PITR.

---

## 13. Security and compliance

| Area | Rule |
|---|---|
| AuthN | Supabase JWT verified via JWKS; short-lived access tokens; refresh rotation |
| AuthZ | Account owns faction; alliance role checked; admin role from server-controlled metadata |
| State secrecy | StateView projections; exact enemy values never serialized |
| Input | Zod validation at every REST/WebSocket boundary; max message size |
| Rate limits | Cloudflare edge + Fastify per-account/IP + per-command token bucket |
| Web | CSP, no third-party scripts, no `dangerouslySetInnerHTML`, strict CORS |
| Mobile | Bundled app origin, allowlisted navigation, no cleartext, secure token storage |
| Secrets | Server env only; GitHub Actions secrets; no secrets in client bundle |
| Database | RLS enabled, no client grants, separate runtime/migration roles, SSL |
| Payments | Webhook authorization, idempotency, server-side RevenueCat lookup, no client trust |
| Admin | Separate app, role check, audit log, dangerous actions require confirmation |
| Moderation | Curated emblems, profanity filter, admin rename/reset; no chat/UGC |
| Privacy | No chat, no user images, no push, no app-level email login/reminders; provider email may exist in Supabase Auth and is not used for gameplay; account deletion/export **TBD** |
| Legal | Terms, privacy, refunds, tax, age rating **TBD** |

Threat model focus: token theft, replayed commands, webhook forgery, state leakage, market feeding/alt accounts, name abuse, admin misuse, and mobile client tampering.

---

## 14. Performance budgets

These are release gates, not final tuning values. They are **PROPOSED** until measured.

| Area | Budget |
|---|---|
| Web initial load | ≤ 800 KB gzip JS+CSS, interactive on a mid-range phone over 4G in ≤ 5 s |
| Map frame | 60 FPS target; 30 FPS floor on the minimum device; repaint only dirty provinces |
| Input | Tap-to-selection feedback ≤ 100 ms |
| Server tick | Military tick p95 ≤ 100 ms for 5 worlds |
| Broadcast | State delta p95 ≤ 250 ms after tick |
| REST | p95 ≤ 300 ms for common reads; p95 ≤ 500 ms for mutations |
| Snapshot | ≤ 500 ms write for a 100-province world |
| Recovery | Latest snapshot + ordered inputs + catch-up ≤ 30 s for normal restart |
| Server memory | ≤ 1.5 GB RSS on the 2 GB floor; ≤ 2.5 GB on 4 GB |
| Database | Snapshot compressed ≤ 100 KB typical; input/event log pruned per retention |

**TBD:** minimum device matrix, exact mobile FPS floor, and load-test concurrency beyond the 5 × 100 target.

---

## 15. Rejected alternatives

| Alternative | Why rejected | Revisit when |
|---|---|---|
| Phaser 4.2.1 | Migration risk during v1; Phaser 3.90 covers the map | After launch, with a dedicated spike |
| Capacitor 9 alpha | Alpha in store builds; plugin compatibility unverified | 9.0.0 stable and RevenueCat/social plugins support it |
| React Native/Expo | Native rewrite; browser-first game and Capacitor already fit | Never for this product |
| Unity/Godot | Heavy client, wrong UI model, store size | Never for this product |
| PixiJS | Less built-in scene/input/camera support than Phaser | If Phaser becomes a bottleneck |
| Phaser-only UI | Poor forms/accessibility | Never |
| WebGL shader map | Device/driver risk; pixel-art mask is sufficient | If map effects exceed CPU raster |
| Physics engine | No continuous motion/collision gameplay | Never |
| Self-hosted Postgres on EC2 | Single bucket, patching, backups, failover burden | If Supabase cost/latency becomes unacceptable |
| Redis | No cross-process state in v1 | Multi-instance rooms |
| Firebase Auth/Firestore | Splits identity/data; no v1 need | If Google/Apple via Supabase fails |
| Email OTP/magic link | Extra provider, deliverability, deep links | If product re-adds email recovery |
| Custom opaque tokens | Security/ops burden | If Supabase Auth is replaced |
| Stripe/Web checkout | Product owner chose mobile-only IAP | If web monetization is added |
| RevenueCat web billing | Still Stripe-backed; web checkout not wanted | If web checkout is added |
| Direct StoreKit/Play Billing | More native work than RevenueCat | If RevenueCat fees/limits become a problem |
| Firebase push | Push is out of v1 | If push is added |
| Cloudflare Workers API | Splits backend; one process is simpler | If edge latency/API scale requires it |
| ECS/Fargate | More setup/cost for one small service | If EC2 becomes a bottleneck |
| Kubernetes | Operationally inappropriate for this team/scale | Never for v1 |
| Turborepo/Nx | CI is small; pnpm filters suffice | If CI time becomes measured pain |
| Jest | Vitest is faster with Vite and shared config | Never |
| Redux | More ceremony than Zustand | If state complexity grows unexpectedly |
| GraphQL/tRPC | REST + Colyseus messages are sufficient | If API surface grows |
| Prometheus/Grafana/CloudWatch | Product owner chose Sentry only + local logs | If infra visibility becomes a blocker |
| Sentry Capacitor | Peer mismatch with latest React SDK; native crash gap accepted | When Sentry ships a compatible Capacitor SDK |
| Node 26 | Not LTS on plan date | When promoted to LTS and CI passes |
| npm/Yarn | pnpm isolation and workspace fit | Never |
| PWA-only | No store IAP; mobile is in v1 | If mobile is deferred |

---

## 16. Decision register

| ID | Area | Decision | Status | Owner/notes |
|---|---|---|---|---|
| D-001 | Client renderer | Phaser 3.90.0 for map | APPROVED | User chose Phaser 3 over 4 |
| D-002 | Client UI | React 19.3.1 + Radix + CSS Modules | APPROVED | — |
| D-003 | Client state | Zustand 5.0.16 | APPROVED | — |
| D-004 | Map rendering | CPU mask → Phaser texture | APPROVED | — |
| D-005 | Camera | Fit-to-width, optional pan/zoom | APPROVED | — |
| D-006 | Physics | None; graph + mask | DECIDED | Consequence of map design |
| D-007 | Server runtime | Node 24.22.1 LTS | APPROVED | Node 26 not LTS |
| D-008 | Server framework | Fastify 5.12.7 + Colyseus 0.18 | APPROVED | — |
| D-009 | Process layout | One app process/container | APPROVED | — |
| D-010 | Database | Supabase Postgres | APPROVED | Pro at launch |
| D-011 | ORM | Drizzle 0.45.4 + pg 8.23.1 | APPROVED | — |
| D-012 | Persistence | Snapshot + input/event log + projections | APPROVED | — |
| D-013 | Auth | Supabase Auth, guest + Google/Apple | APPROVED | Spec delta |
| D-014 | Email | No email OTP; no email reminders | APPROVED | Spec delta |
| D-015 | Payments | RevenueCat, mobile IAP only | APPROVED | Spec delta |
| D-016 | Web shop | Browsable, read-only, no checkout | APPROVED | Spec delta |
| D-017 | Hosting | Existing EC2 + Docker Compose + Caddy | APPROVED | — |
| D-018 | Edge | Cloudflare DNS/WAF/Pages/Tunnel/R2 | APPROVED | — |
| D-019 | Observability | Sentry only + local rotating logs | APPROVED | Native crash gap accepted |
| D-020 | Mobile | Capacitor 8.5.3, Android + iOS | APPROVED | 9 alpha rejected |
| D-021 | Build | pnpm + Vite + tsc -b | APPROVED | — |
| D-022 | CI | GitHub Actions | APPROVED | — |
| D-023 | Tests | Vitest + Playwright + k6 + bot | APPROVED | — |
| D-024 | Firebase | Not used in v1 | APPROVED | Push out of v1 |
| D-025 | Social plugin | Capgo 8.7.5, fallback Capawesome pair | PROPOSED | Phase 0 spike |
| D-026 | Secure storage | `capacitor-secure-storage-plugin` 0.13.0 | PROPOSED | Verify keychain/keystore behavior |
| D-027 | Deployment auth | GitHub → EC2 via deploy key or SSM | PROPOSED | Depends on EC2 access |
| D-028 | Snapshot retention | 60s for 24h, hourly for season, final forever | PROPOSED | See `05` |
| D-029 | Catch-up policy | Fast-forward with 30-min budget; pause beyond | PROPOSED | Product rule needed |
| D-030 | Pass repeat purchase | Extend or block | TBD | Product decision |
| D-031 | EC2 spec/region | To be confirmed | TBD | Existing instance |
| D-032 | Domain names | To be confirmed | TBD | `app`, `admin`, `game` |
| D-033 | Supabase region/PITR | To be confirmed | TBD | Launch gate |
| D-034 | Store product IDs/prices | To be confirmed | TBD | RevenueCat setup |
| D-035 | Admin hosting/auth | Separate Cloudflare Pages app; Google-only admin + allowlist | PROPOSED | Exact allowlist/provider TBD |
| D-036 | Performance budgets | Table in §14 | PROPOSED | Measure in Phase 0/5 |
| D-037 | TypeScript 7 fallback | Latest compatible 6.x if blocked | PROPOSED | ADR if triggered |
| D-038 | Container registry | GHCR; ECR only if AWS-native is required | PROPOSED | Deploy access still TBD |

---

## 17. Spec deltas and open items

### 17.1 Approved spec deltas

SD-01…SD-04 were explicitly approved by the product owner on 2026-10-23 and have been applied to `09`, `01`, `02`, and `03`. SD-05 and SD-06 are approved planning clarifications recorded for traceability; they do not change locked `09` text.

| # | Pre-delta `09` position | Approved v1 position | Files updated |
|---:|---|---|---|
| SD-01 | Link an email after the first session | Link Google or Apple; no email required | `09` §13.1, §15.5, §15.4; `01`; `02`; `03` §16.4 |
| SD-02 | Purchases require a linked email | Purchases require a linked Google/Apple identity | `09` §14.1, §15.5; `01`; `02`; `03` §16.4 |
| SD-03 | Web purchases use Stripe Checkout | Web shop/pass is fully browsable but read-only; all purchases are mobile IAP via RevenueCat | `09` §14.4, §15.7; `01`; `02`; `03` §16.2–16.3 |
| SD-04 | Email reminders are a retention idea | Email reminders are removed; the game does not collect email for login or reminders. Provider email may exist in Supabase Auth; the app-level `accounts.email` column is not used. | `09` §21, §15.4; `01`; `02`; `03` §17.5 |
| SD-05 | Pass term is account-wide 30 days | Rolling 30 days from purchase; may cross a season boundary; premium access follows the remaining days | `09` §14.2; `03` §16.2 |
| SD-06 | Firebase is available but unassigned | Firebase is not used in v1; push is out | `01` OFF-006; `02`; no `09` change needed |

### 17.2 `03` reconciliation

`03` §2.3 originally said every state-changing command loads and locks affected DB rows. That is no longer the intended execution model, and `03` §2.3 has been reconciled to the live-state model below.

The approved architecture is:

- The live world is a single-writer in-memory room.
- Commands are validated and applied in memory under the room’s command queue.
- A durable command commit is the ordered input/event log entry plus the command receipt; snapshots are periodic/forced accelerators, not ack dependencies.
- DB row locks are used only for account merge, world lease acquisition, migrations, and admin operations that must serialize across processes.
- No per-command `SELECT ... FOR UPDATE` on faction/province/army rows.

`05` §9.11 defines the replacement transaction and recovery model.

### 17.3 Still open

- 41 proposed defaults and 23 open TBDs in `03` §20.2/§20.3. Exact-power tie is approved (D-TIE, 2026-10-23).
- Unit stats, training/research costs, AI tuning, score constants, pass XP/missions, shop prices.
- War-window start time, world join cutoff, catch-up/pause policy.
- Pass repeat purchase/stacking; RevenueCat product mapping, IDs, prices, and catalog.
- Native social plugin and secure storage plugin final choices.
- Admin hosting/auth, allowlist, and moderation policy.
- EC2 region/size/OS, domain names, container registry, and deploy access method.
- Supabase region/PITR and backup RPO/RTO/encryption.
- Mobile minimum OS levels and device matrix.
- Account deletion/export and privacy compliance.
- Terms, privacy, refunds, tax, age rating, trademark check.

No implementation may treat a `PROPOSED` or `TBD` line as final.

---

## 18. Traceability

| Decision area | `09` | `01` | `03` |
|---|---|---|---|
| Server authority / realtime | §15.1–15.3 | NFR/security | §2 |
| Map rendering and intel | §6.3, §15.2 | Platform/visual | §17.4 |
| World runtime / persistence | §15.3–15.4 | Save/recovery | §2.2–2.4 |
| Auth / guest linking | §15.5 | Account/platform | §16.4 |
| Payments / pass / shop | §14.2–14.4, §15.7 | Monetization | §16.2–16.3 |
| Mobile | §15.7, §16.1 | Platform | §17 |
| Testing / recovery | §15.8–15.9 | NFR/quality | §19 |
| Ops / backups / monitoring | §15.9 | NFR/ops | §2 |

---

## 19. Review checklist

Before this document is promoted:

- [ ] Product owner confirms SD-01…SD-04 and the SD-05/SD-06 clarifications.
- [ ] Product owner resolves or explicitly defers the `03` §20.2/§20.3 register. Exact-power tie approved 2026-10-23.
- [ ] Engineering confirms the TypeScript 7 compatibility gate.
- [ ] Engineering confirms the Capacitor 8 social/store plugin spike.
- [ ] Engineering confirms the EC2 spec, region, and architecture.
- [ ] Security reviews token storage, StateView, webhook auth, and admin access.
- [ ] Operations confirms Sentry-only logging risk and backup/restore plan.
- [ ] Legal reviews privacy, terms, refunds, tax, age rating, and trademark.
- [ ] `09`, `01`, `02`, and `03` are updated for the approved deltas.
- [ ] Exact package versions are pinned in the lockfile and CI.
