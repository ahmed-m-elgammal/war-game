# 03. Gameplay Rules and State Machines

> **Project:** The Succession
> **Document:** `plan/03-gameplay-rules.md`
> **Version:** 1.0 - review draft
> **Date:** 2026-10-23
> **Status:** Draft for product-owner review
> **Authority:** [`specs/09-v1-design-lock.md`](../specs/09-v1-design-lock.md) is the source of truth. This document defines how the locked rules execute. If this document conflicts with `09`, `09` wins.
> **Companions:** [`plan/01-requirements.md`](01-requirements.md) (testable requirements) and [`plan/02-game-design.md`](02-game-design.md) (game design).
> **Audience:** Engineering, design, QA, and operations.
>
> **Scope:** Server-authoritative gameplay rules, state machines, transitions, ordering, and edge cases for v1.
>
> **Non-goals:** Balance numbers that are still TBD, UI layout, implementation code, and account/payment provider integration.

---

## 1. How to read this document

### 1.1 Status tags

| Tag | Meaning |
|---|---|
| **LOCKED** | Fixed by `09`. Do not change without a new design-lock revision. |
| **DEFAULT** | Fixed enough to implement, but configurable. Values may be tuned. |
| **PROPOSED** | A recommendation introduced by this document. It is **not approved** and must not be treated as final. Promote it into `09` before implementation depends on it. |
| **TBD** | Undecided. Stop and ask. Do not invent a value or rule. |

`PROPOSED` is a planning-document extension. It is not a fourth game status. Any `PROPOSED` rule is effectively TBD until the product owner approves it.

### 1.2 Rule precedence

1. `specs/09-v1-design-lock.md`
2. `plan/01-requirements.md` for testable acceptance criteria
3. `plan/02-game-design.md` for design intent
4. this document for execution detail

A lower document never silently overrides a higher one. A conflict is a defect and must be logged.

### 1.3 Terms

| Term | Meaning |
|---|---|
| **World** | One 30-day Vardania instance with its own map, factions, economy, and clock. |
| **Faction** | A player-led movement or an AI warlord. The unit of ownership. |
| **Player** | The account controlling a faction. A player may be offline while the faction remains active. |
| **Province** | A map node with an owner/controller, level, resource, garrison, and adjacency edges. |
| **Garrison** | Units stationed in a province. |
| **Army** | A stack of units that is either a garrison or a march. |
| **March** | An army moving from one province to another. |
| **Battle** | A server resolution at a province when a hostile army arrives. |
| **Tick** | A server simulation step. Military ticks are 1 second; economy/support ticks are 60 seconds. |
| **Intent** | A client request. It has no effect until the server validates and commits it. |
| **Event** | A scheduled server state transition, such as an arrival or queue completion. |
| **Stockpile** | A faction's integer amounts of money, gold, food, water, and oil. |
| **Entitlement** | An account-bound cosmetic or pass right. Never a gameplay advantage. |
| **Refugee province** | A reserved province used for respawns. It is not normally claimable. |
| **Rebel enclave** | A province held by a rebel group. It is hostile to everyone and owned by no faction. |

### 1.4 What this document does not decide

Exact unit costs, training times, AI cadence, score constants, pass XP, shop prices, and similar balance values remain TBD in `09` §20 unless stated. This document defines the **mechanism** and marks the missing values rather than inventing them.

### 1.5 Traceability

This table is navigational. It does not create new requirements and does not override `09`.

| Rule area | Authoritative rule | Requirements baseline | GDD intent |
|---|---|---|---|
| Time, phases, world lifecycle | `09` §5.2-5.3, §6 | `01` §10.1 | `02` §7.3, §16.4 |
| Player lifecycle, elimination, respawn | `09` §5.4 | `01` §10.1 | `02` §16.2-16.3 |
| Province levels, capitals, refugees | `09` §5.5, §6 | `01` §10.1 | `02` §7.5, §10.12 |
| Army, movement, combat | `09` §9 | `01` §10.3 | `02` §10 |
| Economy, support, rebellion | `09` §7-8 | `01` §10.2 | `02` §11 |
| Queues, research, doctrine | `09` §7.5, §10 | `01` §10.2-10.4 | `02` §6.2-6.4, §11.2 |
| Trade and alliances | `09` §7.7, §11 | `01` §10.2, §10.4 | `02` §11.3, §12 |
| AI warlords | `09` §12 | `01` §10.4 | `02` §8.2, §14.2 |
| Season end, awards, meta | `09` §5.2, §14 | `01` §10.4, §12 | `02` §13, §16.4 |
| Client, session, visibility | `09` §6.3, §15.2-15.3, §15.7 | `01` §4, §6, §8 | `02` §15 |

---

## 2. Global simulation contract

### 2.1 Server authority

The server is authoritative for every gameplay value. The client may render, predict, or animate, but it never decides an outcome.

Rules:

- **MUST:** The client sends intents only. It never sends a resulting state.
- **MUST:** The server validates ownership, phase, resources, capacity, range, cooldown, protection, and target validity before committing an intent.
- **MUST:** A rejected intent produces no state change and a stable error code.
- **MUST:** A committed intent produces exactly one transaction and one audit record.
- **MUST:** The client cannot choose a battle result, loss amount, loot amount, support change, or random seed.

### 2.2 Determinism and replay

- **MUST:** Every random decision uses a server-side seeded generator scoped to the world and event. The seed is stored in the snapshot.
- **MUST:** Given the same snapshot, ordered input/event log, and frozen world config, replay produces the same state.
- **MUST:** Events are ordered by `(effective_at, priority, sequence)` where `sequence` is a monotonically increasing server integer.
- **MUST:** No resolution depends on client wall-clock time, locale, or unsorted database rows.
- **MUST:** All times are stored and compared in UTC.

### 2.3 Transactions and live state

Every state-changing command is an atomic logical transaction against the live world state:

1. The single-writer world room serializes the command; no other command for that world runs concurrently.
2. Validate every guard against the in-memory world state.
3. Reserve or deduct resources and apply the mutation in memory.
4. Append the committed input and command receipt to the durable ordered log in one database transaction.
5. Acknowledge only after the durable commit succeeds.
6. Emit notifications and state deltas after commit.

If any step fails, nothing is acknowledged and no durable input is written. The room either retries the durable write or pauses and reloads from the last snapshot plus ordered inputs. There are no partial trades, partial captures, or partial purchases.

Database row locks are not used for normal commands. They are reserved for account merge, world-lease acquisition, migrations, and cross-process admin operations. `05` §9.11 defines the live-state, snapshot, and replay model that replaces the earlier “load and lock affected DB rows” wording.

### 2.4 Idempotency

- **MUST:** Every client intent carries an idempotency key unique to the account.
- **MUST:** Repeating the same key returns the original result and never applies the mutation twice.
- **MUST:** Scheduled events have unique IDs. Replaying an event ID is a no-op.

### 2.5 Numeric rules

- **MUST:** Unit counts and resource amounts are integers.
- **MUST:** Resources and units never go below zero.
- **MUST:** Continuous rates use fixed-point arithmetic with a stored remainder. The UI may show a rounded integer, but the server must not lose or create resources through repeated rounding.
- **MUST:** Power comparisons use unrounded values. Displayed power may be rounded.
- **MUST:** Unless a rule says otherwise, a fractional final count is rounded **half up** (0.5 becomes 1).
- **MUST:** Loss distribution across unit types uses the largest-remainder method so the sum equals the required integer total and no type goes negative.

### 2.6 Tick and event order

Two clocks exist:

| Clock | Period | Responsibility |
|---|---:|---|
| **Military tick** | 1 second | March progress, arrivals, battles, captures, queue completion checks, ability expiry. |
| **Economy tick** | 60 seconds | Production, upkeep, storage clamping, support drivers, rebel checks, AI decision slot. |

When several events share a timestamp, the server applies this priority order:

| Priority | Event class |
|---:|---|
| 0 | World lifecycle and phase-boundary events |
| 10 | Defender agency committed before the cutoff (retreat; reinforcement order) |
| 20 | Attack arrivals and battle resolution |
| 30 | Reinforcement and transfer arrivals |
| 40 | Capture, capital, elimination, and respawn consequences |
| 50 | Build, training, and research completion effects |
| 60 | Production, upkeep, storage, support, and rebellion |
| 70 | AI decisions |
| 80 | Notifications, analytics, and snapshots |

Rules:

- **MUST:** A defender action is valid only if it is committed **strictly before** the attacker's `arrive_at`. An action at the same timestamp is too late.
- **MUST:** Client intents are serialized by server commit sequence. At each tick, intents committed before the tick boundary apply first in commit sequence. Scheduled events then run in the priority order above. Intents committed during the tick apply after that tick's events. No intent interleaves inside a scheduled transaction. This keeps loot, trades, and battle state deterministic.
- **MUST:** Among attacks arriving at the same timestamp, resolve in ascending `army_id`. The first resolution changes the province before the next attack is evaluated.
- **MUST:** A battle is resolved atomically. No economy tick runs in the middle of a battle transaction.
- **MUST:** If the server restarts, it loads the last snapshot, replays committed events in order, and processes overdue queue completions once.

### 2.7 State ownership and cardinality

- **MUST:** Every province has exactly one of: no owner, a player faction owner, an AI faction owner, or a rebel controller.
- **MUST:** A faction has at most one capital.
- **MUST:** A player account has at most one faction per world. A player may join more than one world.
- **MUST:** No power transfers between worlds. Provinces, armies, resources, research, and support are per world; cosmetics, titles, and entitlements are account-wide.
- **MUST:** A faction has at most one active rebellion.
- **MUST:** An army is in exactly one place and one state.
- **MUST:** A unit belongs to exactly one garrison or army. It cannot be duplicated by splitting, trading, or reconnecting.

---

## 3. Time, day, and phase state machine

### 3.1 World clock

Let `T0 = world.started_at`.

```
day_index      = clamp(floor((now - T0) / 24h) + 1, 1, 30)
cycle_start    = T0 + 24h × (day_index - 1)
peace_start    = cycle_start
war_start      = cycle_start + 18h
war_end        = cycle_start + 24h
season_end     = T0 + 30d
```

The last day is day 30. The season freezes at `season_end`; there is no day 31.

### 3.2 Daily phase

| Phase | Interval | PvP attacks | AI attacks on players | Economy, build, train, research | Trade | Abilities | Alliances |
|---|---|---|---|---|---|---|---|
| **Peace** | `[peace_start, war_start)` | Not allowed | Not allowed | Allowed | Allowed | Not allowed | Form/join/leave allowed |
| **War** | `[war_start, war_end)` | Allowed | Allowed | Allowed | Frozen | Allowed | Locked |

War beats are display and rule windows inside the war phase:

| Beat | Interval from `war_start` | Purpose |
|---|---|---|
| **Opening** | `[0, 90m)` | First attacks and defense commitments |
| **Reinforcement** | `[90m, 270m)` | Reinforce, counterattack, reposition |
| **Land grab** | `[270m, 360m)` | Final captures before peace |

The beats do not add separate permissions in v1. They label the same war window. **DEFAULT**

### 3.3 Boundary rules

- **MUST:** Intervals are start-inclusive and end-exclusive. A PvP arrival at exactly `war_end` is outside the window.
- **MUST:** A PvP attack must have both `launch_at >= war_start` and `arrive_at < war_end`. If either condition fails, the server rejects the launch.
- **MUST:** An AI attack on a player follows the same launch/arrival window.
- **MUST:** PvE attacks (player/AI versus neutral, AI, or rebel) may launch and arrive in either phase.
- **MUST:** A defender action at exactly `arrive_at` is late.
- **LOCKED:** At `war_end`, no PvP march may still be in flight. The launch validation is the primary guarantee. If a server-time correction or admin change would violate the invariant, the march is cancelled and returned with no loss; the incident is logged.

### 3.4 First cycle and war-window anchor

`09` requires a fixed war window per world chosen for the main player time zone. This document anchors the cycle to `T0`:

- Day 1 begins with 18 hours of peace.
- The first war window begins at `T0 + 18h`.
- Every later window begins 24 hours after the previous one.
- World creation chooses `T0` so the resulting war window lands at the desired local time.

**DEFAULT.** The alternative is a fixed UTC time-of-day with a partial first day. The anchored model guarantees a full first peace period and keeps the displayed war time stable.

### 3.5 Phase transition state machine

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `peace` | `now == war_start` | World is running | `war` | Lock alliances; emit war-start notification; enable PvP intents. |
| `war` | `now == war_end` | World is running | `peace` | Reject new PvP intents; cancel any illegal in-flight PvP march; unlock alliance changes at the next peace tick. |
| any | `now >= season_end` | — | `finished` | Freeze the world; cancel unfinished business; calculate awards. |

The phase is **derived from the clock**, not stored as an independent mutable flag. A stored `phase` may be cached for queries, but the clock is authoritative.

---

## 4. World lifecycle state machine

### 4.1 States

| State | Visible in world list | Accepts joins | Gameplay | Terminal |
|---|---|---|---|---|
| `creating` | No | No | No | No |
| `open` | Yes | Yes | Yes | No |
| `running` | Yes | No | Yes | No |
| `finished` | Yes | No | No | Yes |

`creating` is an internal transaction state. The public list shows only `open`, `running`, and `finished`.

### 4.2 Transitions

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `creating` | Generation validates | All map/faction constraints pass | `open` | Publish world; start `T0`; create first open-world slot if needed. |
| `creating` | Generation fails | — | `creating` (retry) | No partial world is published; log the failed seed. |
| `open` | Player count reaches capacity | Capacity reached | `running` | Close joins; create the next open world. |
| `open` | `now >= T0 + 3d` | Join window closed | `running` | Close joins; create the next open world. |
| `running` | `now >= season_end` | — | `finished` | Freeze; calculate awards; produce recap; archive. |
| `finished` | — | — | `finished` | No further transitions. |

### 4.3 Join guards

A join is accepted only when all are true:

- world state is `open`;
- `now < T0 + 3d`;
- current human faction count is below the world's capacity (20–24);
- the account has no faction in this world;
- the account is not banned from the world;
- a valid spawn province exists with no incoming hostile march;
- the world generation is complete and committed.

If a join fails after account selection, the account remains unspawned and may retry or pre-register for the next world. A late joiner cannot enter a `running` world; they are routed to the next `open` world or the pre-registration queue. **DEFAULT**

### 4.4 World generation invariants

A world is not published unless:

- the province count is 80–100;
- human capacity is 20–24;
- AI warlord count is 10–15, each with 2–4 provinces;
- neutral provinces number 25–40;
- refugee provinces number 4–6 and are disjoint from normal spawns;
- the generated player-capital, AI, neutral, and refugee counts sum exactly to the world's total province count;
- every province is reachable by land;
- every player faction has exactly one capital at creation; AI warlords do not use the player capital flag;
- every province has a resource type and level;
- roughly one in ten provinces is gold; food, water, and oil are distributed in clusters; every player capital is money;
- the adjacency graph is connected and has no duplicate edges;
- all neutral/AI garrisons are above zero;
- each player capital has at least one food and one water province within 2 hops;
- each player capital has one adjacent weak neutral province suitable for the first conquest;
- player capitals meet the minimum spacing and have a neutral/AI buffer before the nearest player border;
- nearby resources are mixed, never all one type;
- the generator regenerates if any placement constraint fails.

The map is the same Vardania geometry each time; ownership, resources, AI archetypes, and spawn assignments are generated per world.

### 4.5 Open-world capacity and underfill

**DEFAULT:** If the 3-day join window closes with fewer than 20 humans, the world still runs with the players who joined. AI warlords are not added to replace missing humans, and human slots do not reopen. This preserves a fixed world composition and avoids late joiners entering an established map.

### 4.6 Finished-world behavior

At `finished`:

- no intents are accepted except read-only queries and account-level claims;
- all marches are cancelled;
- all queues stop;
- no production, upkeep, support, rebellion, or AI decisions run;
- final ownership, armies, score, and titles are snapshotted exactly once;
- the recap is generated from that snapshot.

---

## 5. Player and faction lifecycle state machine

### 5.1 States

| State | Has provinces | Can act | Can be attacked | Notes |
|---|---|---|---|---|
| `pending_spawn` | No | No | No | Join transaction in progress. |
| `active` | Yes | Yes | Yes, unless protected | Normal play. |
| `eliminated` | No | No | No | Transient state during loss/respawn processing. |
| `spectator` | No | Read-only | No | No valid respawn location. |
| `ai_controlled` | Maybe | AI only | Yes | Abandoned faction. |
| `finished` | Snapshot only | No | No | Season ended. |

`protected` is a **modifier**, not a lifecycle state. A faction with `protection_until > now` is active and protected.

### 5.2 Transitions

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| — | Join accepted | World open, slot available, spawn valid | `pending_spawn` | Reserve account/world slot. |
| `pending_spawn` | Spawn transaction commits | Spawn province still valid | `active` | Assign capital, starting resources, 50 infantry, `protection_until = now + 24h`. |
| `pending_spawn` | Spawn fails | No province or world closed | `spectator` or pre-register | Release slot; no partial faction. |
| `active` | Province count becomes 0 | After capture/resolution | `eliminated` | Destroy armies, cancel queues/listings, apply loss package. |
| `eliminated` | Respawn location found | Refugee or fallback exists | `active` | Respawn package; `protection_until = now + 24h`. |
| `eliminated` | No respawn location | — | `spectator` | Wait for a location. |
| `active` | 5 days inactive | No session and no accepted intent | `ai_controlled` | Remove from alliance; AI takes over; player becomes an observer of their old faction. |
| `ai_controlled` | Player returns | World not finished | `eliminated` → respawn | Old faction is dissolved; player respawns like an eliminated player. **LOCKED** |
| `ai_controlled` | Faction eliminated by AI play | — | `eliminated` | Player may respawn on return. |
| `spectator` | Respawn location appears | World not finished | `active` | Auto-respawn with protection. **DEFAULT** |
| any | `now >= season_end` | — | `finished` | Freeze; eligibility checked. |

### 5.3 Protection

Protection is a faction-level timer, `protection_until`.

- **MUST:** A protected faction's provinces cannot be targeted by player or AI attacks.
- **MUST:** Protection does not block rebel uprisings, resource shortages, or support loss.
- **MUST:** A protected faction may attack neutral/AI/rebel provinces and may transfer or reinforce its own provinces.
- **LOCKED:** If a protected faction launches a hostile attack against a player-owned province, or captures a player-owned province, protection ends immediately. This prevents a protected player from attacking while remaining untouchable.
- **PROPOSED:** Protection is not refreshed by respawn unless the respawn rule grants it. It is granted once per spawn/respawn.

### 5.4 Elimination package

When a player loses their last province:

1. Mark the faction `eliminated`.
2. Destroy every army owned by the faction, including armies in flight.
3. Cancel all build and training orders. No refund.
4. Cancel all open market listings and direct offers; return escrow to the faction stockpile before the loss calculation. **PROPOSED**
5. Lose 35% of each resource, rounded so the player keeps `floor(0.65 × amount)`. **PROPOSED**
6. Clamp the remaining stockpile to a **respawn storage floor of 500 per resource**, not to zero. Without this floor, a zero-province faction would lose all resources and the locked “keep trade access” rule would be meaningless. A spectator keeps the same 500-per-resource reserve. **DEFAULT**
7. Keep research, era, doctrine, and pass progress.
8. Reset support to 60. **DEFAULT**; without this, a faction eliminated below 15 support would immediately spawn rebels on respawn.
9. Keep alliance membership and trade access, as `09` requires.
10. Select a respawn province and apply the respawn package, or become a spectator.

### 5.5 Respawn package

When respawning:

- The respawn province becomes the faction capital.
- The province is set to **level 1**. **DEFAULT**
- The province has **0 troops**. The eliminated army is not replaced. **DEFAULT**, derived from “lose army.”
- The faction stockpile is whatever survived the 35% loss and storage clamp.
- Protection is 24 hours from the respawn transaction.
- Research, era, doctrine, and cosmetics are unchanged.
- The faction's active rebel group, if any, persists as the same rebel enclave. It is not deleted from the map. **LOCKED**

### 5.6 Respawn placement

“Away from the attacker” is not defined numerically in `09`. This document proposes:

1. Prefer an unused refugee province.
2. If none, use any neutral or AI province.
3. Score each candidate by graph distance from the attacker's nearest owned province, descending.
4. Exclude candidates with an incoming hostile march.
5. Exclude candidates adjacent to the attacker's provinces if any non-adjacent candidate exists.
6. Break ties by highest province level, then lowest province ID.
7. Transfer ownership to the respawning faction. If the candidate was AI-owned and it was the AI's last province, eliminate that AI.

If no candidate exists, the player becomes a spectator. **PROPOSED**

### 5.7 Inactivity and return

- **PROPOSED:** “Inactive” means **no authenticated session and no accepted intent for 5 consecutive days**. Logging in resets the inactivity timer even without issuing a command.
- **PROPOSED:** On AI takeover, the player is removed from their alliance at the next valid removal step. The AI faction continues to hold provinces and armies.
- **LOCKED:** On return, the old AI faction is dissolved:
  - all its provinces become neutral with their current level;
  - all its armies are destroyed;
  - its capital flag is removed;
  - its queues and listings are cancelled;
  - its active rebel group becomes an independent rebel enclave.
- The returning player then respawns under the elimination/respawn package.
- **TBD:** Whether titles, pass credit, or season history earned by the AI-controlled faction accrue to the returning player. This document recommends **no**: the player is eligible only for what their player-controlled faction achieves after respawn.

### 5.8 Alliance and social persistence

- Eliminated players keep alliance membership, shared vision, and direct-trade access, as `09` requires.
- Abandoned players are removed from the alliance.
- A player who returns from abandonment does not automatically rejoin the old alliance.
- A player with no provinces cannot be attacked, cannot reinforce, and cannot be a battle target.

### 5.9 Starting state

A newly spawned player receives exactly:

| Item | Value | Status |
|---|---:|---|
| Capital provinces | 1, level 1, effective resource money | **DEFAULT** |
| Infantry | 50 | **DEFAULT** |
| Money | 500 | **DEFAULT** |
| Food | 200 | **DEFAULT** |
| Water | 200 | **DEFAULT** |
| Oil | 50 | **DEFAULT** |
| Gold | 0 | **DEFAULT** |
| Start protection | 24 hours | **DEFAULT** |
| Tutorial target | One adjacent weak neutral province | **DEFAULT** |

The player chooses display name, faction name, emblem preset, and color. The capital location is server-assigned under the placement constraints in §4.4.

---

## 6. Province state machine

### 6.1 Province fields

| Field | Rule |
|---|---|
| `province_id` | Stable for the season. |
| `name` | Display only. |
| `adjacency` | Undirected land edges; fixed for the season. |
| `terrain` | Visual only; no combat modifier. |
| `terrain_resource` | Money, gold, food, water, or oil. Fixed for the season. |
| `effective_resource` | `money` while the province is a capital; otherwise `terrain_resource`. **PROPOSED** |
| `level` | 1–5. |
| `owner_faction_id` | Null for neutral, rebel, and refugee provinces. |
| `controller_type` | `none`, `player`, `ai`, or `rebel`. |
| `rebel_group_id` | Set only when `controller_type = rebel`. |
| `is_capital` | At most one true per faction. |
| `is_refugee` | True only for reserved respawn provinces. |
| `garrison` | Integer counts by unit type. |
| `protection_until` | Derived from the owner faction, not stored per province. |
| `last_attacker_id` | Last faction that captured this province; used for respawn placement. |

### 6.2 States

| State | Owner | Controller | Attackable | Claimable by capture |
|---|---|---|---|---|
| `neutral` | None | `none` | Yes | Yes |
| `owned` | Faction | `player` or `ai` | Yes, subject to protection/war | Yes |
| `rebel` | None | `rebel` | Yes | Yes |
| `refugee` | None | `none` | No | No |

`capital` is a flag on an `owned` province, not a separate state. `under_attack` is a derived query, not a state.

### 6.3 Transitions

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `neutral` | Hostile capture | Attacker wins or garrison is 0 | `owned` | Owner = attacker; level −1 (min 1); surviving attacker becomes garrison; support events. |
| `owned` | Hostile capture | Attacker wins or garrison is 0 | `owned` | Owner changes; level −1 (min 1); old owner loses province; capital handling; loot if capital. |
| `owned` | Rebel capture | Rebel wins or garrison is 0 | `rebel` | Owner cleared; level −1 (min 1), except no level drop if the capture triggers elimination; rebel group holds; capital handling; old owner may be eliminated. |
| `rebel` | Hostile capture | Attacker wins or garrison is 0 | `owned` | Rebel group destroyed; level −1 (min 1); capturer gets +0.5 support if a player; 2h grace starts. |
| `owned` | Abandonment dissolution | Player inactive 5 days and returns, or admin removal | `neutral` | Owner cleared; garrison removed; level unchanged; capital flag cleared; no loot/support. |
| `refugee` | Respawn | Player needs a capital | `owned` | Owner = player; capital; level 1; 0 troops; removed from refugee pool. |
| `owned` | Capital relocation away from a refugee-origin capital | Player pays relocation cost; another owned province exists | `refugee` | Owner cleared; garrison removed; capital flag cleared; returned to pool. **PROPOSED** |
| `owned` | Capital relocation from a normal capital | Player pays cost; another owned province exists | `owned` | Old province keeps owner and garrison; loses capital flag. |

### 6.4 Capital rules

- **MUST:** A faction has at most one capital.
- **MUST:** A capital produces money. **LOCKED:** the province's effective resource is money while it is a capital; this replaces its terrain resource for production.
- **MUST:** When a capital is captured, the capital flag is removed from the captured province.
- **MUST:** The defender must relocate the capital to another owned province or be eliminated.
- **LOCKED:** The relocation is automatic during the capture transaction: highest-level owned province, then lowest province ID, then highest garrison. The player does not get a choice in the middle of battle.
- **LOCKED:** A capital cannot be retreated from. The defender may reinforce or hold, but ceding the capital is a capture, not a retreat.
- **PROPOSED:** If a rebel or AI captures a capital, the same relocation/elimination rules apply. Rebels and AI do not gain the capital flag, loot, support, or Capital Breaker mark.
- **LOCKED:** The “capital events ×3” multiplier applies to **regional event modifiers** that occur in the capital, not to the one-time “Capital captured −5” event. Otherwise the explicit −5 would become −15 and contradict the table.
- **DEFAULT:** Capital capture gives the attacking player +5 support, 10% loot (capped at 500 gold equivalent), and the Capital Breaker cosmetic mark.
- **DEFAULT:** If the defender has no other province, they are eliminated and no loot is taken. The attacker still gets +5 support and the Capital Breaker mark. **PROPOSED** clarification.
- **DEFAULT:** A player may voluntarily relocate their capital once per season, in peace, for a cost. The cost is **TBD**.
- **MUST:** Voluntary relocation requires at least one other owned province and is rejected in war.
- **MUST:** The new capital gets the capital bonuses; the old province loses the flag.
- **PROPOSED:** If the old capital is a refugee-origin province, it returns to the refugee pool with no owner and no garrison. If it is a normal province, it remains owned and simply loses the capital flag.
- **PROPOSED:** A capture-triggered relocation does not consume the once-per-season voluntary relocation.
- **MUST:** Track `voluntary_relocation_used` per faction; it resets at season start and is set only by voluntary relocation.
- **TBD:** Resource-to-gold conversion values for the 500 gold-equivalent loot cap.

### 6.5 Refugee provinces

- **MUST:** Refugee provinces are selected at world generation on the map edge and numbered 4–6.
- **MUST:** They cannot be attacked, claimed, built on, or traded while unused.
- **MUST:** A used refugee province becomes a normal owned capital. It is no longer a refugee province.
- **PROPOSED:** If a player relocates away from a refugee-origin capital, that province returns to the refugee pool with no owner and no garrison.
- **PROPOSED:** If a refugee-origin capital is captured, it does not return to the pool. The pool is finite for the season.
- **MUST:** If the pool is empty, respawn falls back to neutral or AI provinces under §5.6.

### 6.6 Level rules

- **MUST:** Level is an integer from 1 to 5.
- **DEFAULT:** Troop cap is `100 × level`.
- **MUST:** A capture reduces level by 1, minimum 1.
- **MUST:** A rebel capture reduces level by 1, minimum 1, **unless the capture triggers elimination**. In that case the province becomes a rebel enclave with no further level drop. **DEFAULT** from `09` §8.3.
- **MUST:** No other event changes level downward except an explicit missile strike effect.
- **MUST:** A province at level 1 cannot be reduced below 1.
- **MUST:** A province's terrain resource does not change when captured.
- **LOCKED:** A province's effective resource becomes money while it is a capital, then reverts to its terrain resource when it loses the capital flag.

### 6.7 Zero-garrison provinces

A province can be owned with zero troops.

- It remains owned.
- It can be captured by any valid hostile attack without a battle.
- It does not become neutral automatically.
- It still counts for elimination (the owner is eliminated only when the count of owned provinces reaches zero, not when troops reach zero).
- Infantry growth resumes on the next economy tick if the owner still owns it and food is available.

---

## 7. Army and march state machine

### 7.1 Army states

| State | Meaning | Can be targeted | Can act |
|---|---|---|---|
| `garrison` | Stationed in a province. | Yes, as part of the province. | Launch, split, merge, defend. |
| `marching` | In transit. | No, except by abilities if allowed. | Recall only. |
| `resolving` | Atomic arrival transaction. | No | No |
| `destroyed` | Terminal. | No | No |

A march has a `purpose`: `attack`, `reinforce`, `transfer`, `return`, or `recall_return`.

### 7.2 March fields

| Field | Rule |
|---|---|
| `army_id` | Stable, monotonically created. Used for simultaneous-arrival ordering. |
| `owner_faction_id` | One owner. |
| `origin_province_id` | Must be owned by the owner at launch. |
| `target_province_id` | Must be valid at launch. |
| `mode` | `land`, `air`, or `strategic`. |
| `depart_at` | Server time of commit. |
| `arrive_at` | Computed at launch and immutable. |
| `units` | Integer counts by type. |
| `fatigue_until` | Per-army attack lockout. |
| `recallable` | True until arrival, with purpose-specific exceptions. |

### 7.3 Transitions

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `garrison` | Launch accepted | Origin owned; target valid; units >0; at least one combat unit; no fatigue; phase/range/protection/alliance guards pass | `marching` | Remove units from garrison; create march; schedule arrival. |
| `marching` | Recall accepted | Before `arrive_at`; recallable | `marching` (`recall_return`) | Apply recall penalty for attacks; reverse target/origin; set a new `arrive_at` from the current time. |
| `marching` | Abort (target no longer valid for the purpose) | Before arrival | `marching` (`return`) | No penalty; return to origin. |
| `marching` | Arrival event | `now >= arrive_at` | `resolving` | Lock the arrival; defender actions are closed. |
| `resolving` | Target owned by self | Any purpose | `garrison` | Merge into target garrison; may exceed troop cap. |
| `resolving` | Target owned by ally | Any purpose | `marching` (`return`) | No stationing; abort. |
| `resolving` | Target neutral/rebel/enemy | Purpose is `attack` | battle | Resolve battle. |
| `resolving` | Target neutral/rebel/enemy | Purpose is `reinforce`, `transfer`, `return`, or `recall_return` | `marching` (`return`) or `destroyed` | Abort; a non-attack march never fights. If it is already returning and the origin is hostile, redirect to the nearest owned province; if none, destroy. |
| `resolving` | Battle won and captured | — | `garrison` | Surviving units become the new garrison. |
| `resolving` | Battle lost | — | `destroyed` | All units removed. |
| any | Owner eliminated or season ends | — | `destroyed` | Remove all units; no refund. |

### 7.4 Launch guards

An attack launch is rejected unless all are true:

- origin is owned by the faction;
- target is a valid province and not a refugee province;
- target is not owned by the attacker;
- target is not owned by an ally;
- target is not a protected player faction;
- if target is player-owned, the current phase is war and both launch and arrival are inside the same war window;
- if target is neutral, AI, or rebel, the phase may be peace or war;
- the army contains at least one combat unit (infantry, tank, or aircraft);
- the army is not under attack fatigue;
- the movement mode and range are valid;
- the faction is not eliminated or finished;
- the player is not attempting to attack an ex-ally inside the 24-hour cooldown.

A reinforcement/transfer launch is rejected unless:

- origin and target are both owned by the faction;
- the target is adjacent for land movement, or within range for an all-air stack;
- the army contains at least one unit;
- the faction is active;
- the arrival for a reinforcement is strictly before the incoming attack it is meant to counter.

### 7.5 Movement modes and range

- **LOCKED:** Land movement is one adjacent province per march. Multi-hop movement is performed by successive orders after arrival.
- **LOCKED:** A stack containing any land unit moves as land, even if it also contains aircraft.
- **MUST:** An all-aircraft stack may move directly to a province within the current era's aircraft range, measured in adjacency hops.
- **MUST:** A stack's speed is the slowest unit's speed. The current era's speed values apply.
- **MUST:** A march's path is fixed at launch. For land, it is the single origin→target edge. For air, it is the direct target; no intermediate battles occur.
- **MUST:** No interception occurs in v1. Only the destination resolves a battle.

| Unit | March speed | Range |
|---|---|---|
| Infantry | 5 min per province | Land adjacency |
| Tank | 3 min per province | Land adjacency |
| Aircraft | 1 min per province | 3 hops at Era 1, up to 6 at Era 4 |
| Artillery/missile | **TBD** | 3 hops at Era 1, up to 10 at Era 4 |

- **DEFAULT:** Era speed bonus is +10% per era.
- **PROPOSED:** The era bonus is a speed multiplier; travel time = base time ÷ `(1 + 0.1 × (era − 1))`.
- **TBD:** Intermediate aircraft and artillery/missile range values by era; only the Era 1 and Era 4 endpoints are locked.
- **TBD:** Whether missile/artillery units form normal marching stacks or are strategic-only assets. Until decided, they may not be included in a normal attack stack.
- **TBD:** Ability range is not specified in `09`. This document does not assume abilities use aircraft range.

### 7.6 Split and merge

- **MUST:** Split is allowed only for a garrison in an owned province, in peace or war.
- **MUST:** A split creates a new army with a positive integer subset; the source may be left with zero units.
- **MUST:** Merge is allowed only when both armies are garrisons in the same owned province.
- **MUST:** A merge combines counts by type; it may exceed the province troop cap.
- **MUST:** Split and merge cannot occur during a march, battle, or elimination transaction.
- **MUST:** Fatigue is inherited by every split part and by a merged army, using the latest remaining `fatigue_until`.
- **PROPOSED:** A fatigued army cannot launch an attack, even if reinforced with fresh units.

### 7.7 Recall and abort

- **DEFAULT:** An attack march may be recalled before `arrive_at`. The penalty is `ceil(10% of each unit type)`, with at least one unit lost total if the army has any units. Oil already spent is not refunded.
- **TBD:** The meaning of “or the oil cost” in `09` §9.5. The current proposal treats it as “the oil cost is not refunded,” not as an alternative player choice.
- **PROPOSED:** A reinforcement or transfer march may be recalled with no troop loss.
- **PROPOSED:** A recalled army returns to its origin. If the origin is no longer owned by the faction, it returns to the nearest owned province; if none, it is destroyed.
- **PROPOSED:** The same redirect applies to any aborted reinforcement or transfer returning home, not only to a recall.
- **PROPOSED:** At `arrive_at`, recall is too late.
- **MUST:** If a recall reduces the army to zero units, the army is destroyed.

### 7.8 Defender agency

For each incoming hostile attack, the defender may choose one of:

| Action | Guard | Effect |
|---|---|---|
| **Hold** | Always available | No change; battle uses the current garrison plus any arrived reinforcement. |
| **Reinforce** | Adjacent owned province; one per incoming attack; arrival strictly before attacker | Creates a reinforcement march; on arrival it merges into the target garrison. |
| **Retreat** | At least one adjacent owned province; target is not the faction capital | Moves the entire garrison instantly to the chosen province; target becomes neutral with no garrison. |

Rules:

- **MUST:** All three actions are unavailable after `arrive_at`.
- **MUST:** Reinforcement must arrive strictly before the attacker. A launch that would arrive at or after the attacker is rejected.
- **MUST:** If the target is lost before a reinforcement arrives, the reinforcement aborts and returns.
- **LOCKED:** Retreat is instant, not a march. It cannot be intercepted.
- **PROPOSED:** Retreating units may exceed the destination's troop cap; growth/training in that province pauses until the garrison is below cap.
- **PROPOSED:** Retreating from a province cancels any running build order there; no refund.
- **LOCKED:** A capital cannot be retreated from; it must be held or captured.
- **MUST:** An offline defender simply holds. The offline defense bonus applies if the defender has no authenticated connection at battle resolution.

### 7.9 Army destruction

An army is destroyed when:

- it loses a battle;
- its owner is eliminated;
- the season ends;
- a recall or ability reduces it to zero;
- it is an in-flight army of an abandoned faction that is dissolved on return.

Destroyed units are removed from the game. They do not return to a pool.

---

## 8. Battle and damage state machine

### 8.1 Battle states

| State | Meaning | Defender actions |
|---|---|---|
| `incoming` | A hostile march exists and is before `arrive_at`. | Hold, reinforce, retreat. |
| `locked` | `now >= arrive_at`; resolution is due. | None. |
| `resolving` | Atomic combat transaction. | None. |
| `resolved` | Report exists. | None. |
| `cancelled` | Attacker recalled, aborted, or was destroyed before arrival. | None. |

A battle is created only when an attack arrives at a hostile or unowned target. A friendly arrival is a merge, not a battle.

- **MUST:** While a battle is `incoming`, the defender sees the countdown, attacker name, approximate strength, and a range-based battle estimate. **DEFAULT**
- **MUST:** The pre-battle estimate never reveals the exact outcome. **DEFAULT**

### 8.2 Resolution order

1. Confirm the attacker still exists and owns the army.
2. Confirm the target is still valid; if it is now self-owned, merge; if ally-owned, abort/return.
3. Assemble the defender garrison: current province troops plus all reinforcements that arrived before the attacker.
4. If the defender has zero combat units, capture immediately; no battle losses.
5. Compute both powers using §8.3.
6. Compare powers using unrounded values.
7. Apply loser destruction and winner losses.
8. If the defender loses and the attacker wins, transfer the province, reduce level, and set the surviving attacker as garrison.
9. Resolve capital capture, loot, relocation, and elimination.
10. Apply support events with caps.
11. Create the battle report and set attacker fatigue.
12. Notify both sides.

Steps 2–11 are one transaction. No economy tick or other battle may interleave.

### 8.3 Power formula

For each side:

```
unit_power_i = count_i × (attack_i if attacking, defense_i if defending)
             × counter_i
             × skill_multiplier_i
             × era_multiplier_i

side_power = Σ unit_power_i
           × defense_multiplier (defender only)
```

**LOCKED:** `counter_i` is the unit type's counter against the opposing **composition**, weighted by opposing combat-unit count share:

```
counter_i = Σ_j (opponent_count_j / opponent_combat_count) × counter_table[i][j]
```

- If the opponent has zero combat units, no battle occurs; the province is captured.
- **LOCKED:** The counter table is applied by the unit's own type against the opposing type. The same lookup is used for attackers and defenders.
- Counters apply only to combat units: infantry, tanks, and aircraft.
- `skill_multiplier_i` is the faction's national doctrine. **LOCKED:** the skill applies to the whole stack; the infantry weapon applies only to infantry. This makes Marcher, Defender, and Raider coherent national choices.
- `era_multiplier_i` is the owning faction's current era multiplier.
- `defense_multiplier` is defender-only: `1 + min(0.75, fortification + capital + offline)`, where fortification is +0.10 per level above 1, capital is +0.25, and offline is +0.15 if the defender has no authenticated connection at resolution.
- Support never affects power. **LOCKED**
- Terrain never affects power. **LOCKED**

Base combat stats and multipliers from `09` §9.4:

| Unit | Attack | Defense |
|---|---:|---:|
| Infantry | 10 | 10 |
| Tank | 30 | 20 |
| Aircraft | 40 | 10 |
| Missile/artillery | Region damage | Region damage |

| Era | Multiplier |
|---|---:|
| Era 1 | 1.0 |
| Era 2 | 1.3 |
| Era 3 | 1.7 |
| Era 4 | 2.2 |

Counter table:

| Unit type → opposing type | Infantry | Tank | Aircraft |
|---|---:|---:|---:|
| Infantry (rifles) | 1.0 | 0.5 | 0.3 |
| Infantry (anti-tank) | 0.8 | 1.5 | 0.3 |
| Infantry (anti-air) | 0.8 | 0.5 | 1.5 |
| Tank | 1.5 | 1.0 | 0.2 |
| Aircraft | 1.0 | 1.5 | 1.0 |

The weighted-average rule is how a mixed defender is handled. A pure stack uses its single column. A missile/artillery unit is not a normal combat participant. **DEFAULT:** The Era 1 long-range unit is artillery; from Era 2 it is a missile.

### 8.4 Winner and losses

- **MUST:** Higher power wins.
- **LOCKED:** An exact tie is won by the defender. The attacker loses all committed combat units. The defender retains ownership.
- **DEFAULT:** On an exact tie, the defender loses 50% of committed combat units, rounded half up and distributed by largest remainder. This replaces the normal winner-loss formula for the tie case. The share lives in config as `combat.tie_defender_loss_fraction`; the mutual-wipe variant is rejected.
- **MUST:** The loser loses all units.
- **MUST:** Except on an exact tie, winner losses are:

```
raw_winner_losses = (loser_power / winner_power) × winner_unit_count
```

- **LOCKED:** Round `raw_winner_losses` half up to the nearest integer. Distribute the integer loss across the winner's unit types in proportion to their counts using largest remainder.
- **PROPOSED:** A winner with zero units after losses still captures if it won. The province is owned with a zero garrison.
- **MUST:** A defender with zero units at arrival is captured without a battle; no winner losses are rolled.
- **MUST:** No unit can be lost twice in the same battle.

### 8.5 Battle report

The report must show:

- attacker and defender faction names;
- province and level;
- both sides' unit counts by type;
- base attack/defense values;
- counter multipliers and the opposing composition used;
- skill, era, fortification, capital, and offline multipliers;
- final unrounded power and displayed rounded power;
- winner, loser, and losses by unit type;
- capture result and new owner;
- loot and support changes;
- whether a retreat or reinforcement occurred.

### 8.6 Fatigue

- **DEFAULT:** The attacking army cannot launch another attack for 20 minutes after a battle.
- **MUST:** Fatigue starts when the battle resolves, including a loss.
- **MUST:** Fatigue does not reduce defense and does not block transfers or reinforcement.
- **MUST:** A capture without a battle does not apply fatigue.
- **PROPOSED:** Splitting a fatigued army gives both parts the remaining fatigue; merging uses the latest remaining fatigue.
- **PROPOSED:** A fatigued army cannot attack even if fresh units are merged into it.

### 8.7 Multiple attacks and simultaneous arrivals

- **MUST:** Each hostile march has its own incoming battle record.
- **MUST:** If two attacks arrive at the same timestamp, resolve in ascending `army_id`.
- **MUST:** The first resolution may change the owner. The second is evaluated against the new owner:
  - if the new owner is the second attacker, merge;
  - if the new owner is an ally of the second attacker, abort/return;
  - otherwise, fight the new owner.
- **MUST:** If a defender reinforcement and an attacker arrive at the same timestamp, the attacker's arrival wins; the reinforcement is too late. The reinforcement aborts/returns.
- **PROPOSED:** A defender may issue only one reinforcement per incoming attack. Multiple incoming attacks may each receive one reinforcement, subject to available troops and travel time.
- **PROPOSED:** A defender may retreat only once per province per resolution chain. After retreating, the province is neutral and later arrivals capture it.

### 8.8 Damage from abilities

Abilities are not normal battles.

| Ability | Effect | Cooldown | Era | Cost | Capture? |
|---|---|---:|---:|---|---|
| **Mobilization** | +30% infantry growth for 1 hour | 12h | 1+ | Money + food | No; self-buff |
| **Airstrike** | Remove 15% of current garrison | 6h | 1+ | Money + oil | No |
| **Missile Strike** | Remove a heavy percentage of garrison and reduce province level by 1, minimum 1 | 12h | 2+ | Money + oil + gold | No |

Rules:

- **MUST:** All abilities are **war-only** in v1. **DEFAULT** from `09` §9.7.
- **MUST:** Cooldowns are per faction, not per province. **DEFAULT**
- **MUST:** Mobilization targets the faction; Airstrike and Missile Strike target provinces, not marching armies.
- **MUST:** Abilities cannot target refugee provinces.
- **MUST:** Abilities cannot target protected factions.
- **MUST:** Abilities are resolved instantly on commit; there is no march and no defender agency window.
- **MUST:** A province reduced to zero garrison remains owned; only a capture changes ownership.
- **MUST:** Ability costs are deducted atomically. If the target is invalid, nothing is spent.
- **MUST:** Mobilization sets `mobilization_until = now + 1h`. Infantry growth is multiplied by 1.3 while active, in addition to support and food checks.
- **LOCKED:** A faction's ability cooldowns persist through elimination/respawn and clear at season end.
- **TBD:** Ability range. `09` does not state one. This document does not assume a range; the server must not silently make abilities global or range-limited.
- **DEFAULT:** A missile/artillery unit is one-shot when used for its region-damage attack. It is removed after the attack.
- **TBD:** Whether the Missile Strike ability also consumes a trained missile/artillery unit, or the ability's money + oil + gold cost is the only cost. `09` lists the ability cost but does not link it to a unit.
- **TBD:** Exact missile-strike garrison percentage and level-damage cap.

---

## 9. Resources, units, and inventory mutations

### 9.1 There is no item inventory

V1 has no equipment inventory, no loot boxes, no crafting materials, and no per-unit items. The mutable gameplay state is:

| State | Shape | Bound to |
|---|---|---|
| Resources | Five integer stockpiles | Faction |
| Units | Integer counts by type | Garrison or army |
| Build orders | Queue entries | Faction, targeting a province |
| Training orders | Queue entries | Faction, targeting a province |
| Research | Owned/available flags | Faction |
| Doctrine | One weapon, one skill | Faction |
| Trade listings/offers | Escrowed resources | Faction |
| Alliance | Membership and invitations | Faction |
| Support | One integer meter | Faction |
| Rebellion | One active group + grace timer | Faction |
| Cosmetics/pass | Account entitlements and progress | Account |

“Inventory change” in this document means a change to one of these records. There is no bag, no item stack, and no equipment slot.

### 9.2 Resource production

Base rates at level 1:

| Source | Rate | Status |
|---|---:|---|
| Non-capital province, its terrain resource | 10/hr | **DEFAULT** |
| Every province, money trickle | 5/hr | **DEFAULT** |
| Capital, effective money resource | 10/hr | **DEFAULT** |
| Capital, money trickle | 5/hr | **DEFAULT** |

Therefore a level-1 capital produces **15 money/hr** under this approved default. A level-1 non-capital produces 10 of its terrain resource plus 5 money per hour.

Production multipliers:

| Province level | Production multiplier | Troop cap |
|---:|---:|---:|
| 1 | 1.0× | 100 |
| 2 | 1.5× | 200 |
| 3 | 2.0× | 300 |
| 4 | 2.5× | 400 |
| 5 | 3.0× | 500 |

```
production_rate =
    base_rate
  × production_multiplier[level]
  × support_income_multiplier
  × water_shortage_multiplier
```

- **DEFAULT:** The multiplier applies to both the province's terrain resource and its 5/hr money trickle. For a capital, the 10/hr money base and 5/hr money trickle are summed before multipliers.
- `support_income_multiplier`: Stable/Uneasy 1.00; Unrest 0.85; Serious Unrest 0.70; Uprising 0.70. **PROPOSED**; the Uprising row in `09` lists rebels but no income number, so the Serious Unrest penalty is carried forward.
- `water_shortage_multiplier` is **TBD**. `09` says water shortage causes a production penalty but does not give the value.
- A capital's effective resource is money. Its terrain resource is suppressed while it is a capital. **LOCKED**

Production is applied on the 60-second economy tick with a per-faction, per-resource remainder accumulator:

```
exact_add = production_rate / 60
applied   = floor(exact_add + remainder)
remainder = exact_add + remainder - applied
```

The remainder is stored server-side. It is not shown as a resource.

### 9.3 Storage

- **DEFAULT:** Storage cap per resource = `500 × owned_province_count`.
- **MUST:** The cap applies to money, gold, food, water, and oil.
- **MUST:** The base formula gives a zero-province faction a cap of 0. The eliminated/spectator floor below overrides that case.
- **PROPOSED:** Production, loot, and refund additions are clamped to the cap; overflow is lost and logged.
- **DEFAULT:** Trade receipts are rejected if either side would overflow, per §11.6. This avoids silently destroying traded value.
- **PROPOSED:** When a faction loses provinces and its cap shrinks, excess above the new cap is removed on the next economy tick. The player receives a warning on the capture report.
- **DEFAULT:** Eliminated and spectator factions have a storage floor of 500 per resource, even at zero provinces. This preserves the locked “keep trade access” rule and avoids turning the 35% elimination loss into a 100% loss.
- **MUST:** A resource cannot be spent if the stockpile is below the cost. The transaction fails atomically.

### 9.4 Upkeep

| Upkeep | Rate | Timing | Shortage effect |
|---|---|---|---|
| Food | 1/hr per 10 infantry, all infantry owned | Economy tick | Support −0.5/hr; infantry growth stops |
| Water | 1/hr per owned province level | Economy tick | Support −0.5/hr; production penalty (value TBD) |
| Money | Advanced units; exact rates TBD | Economy tick | Support −0.3/hr if unpaid; production/training efficiency penalty (value TBD) |
| Oil | None while idle | — | Oil shortage blocks vehicle/missile training and use |

Rules:

- **MUST:** Upkeep is faction-wide, not per province.
- **PROPOSED:** Infantry in marching armies count for food upkeep.
- **MUST:** A shortage warning appears at least one economy tick before the penalty first applies. If the shortage persists, the penalty applies on the following tick.
- **MUST:** If a stockpile cannot pay a full tick's upkeep, it is reduced to zero and that resource is marked short for the tick. No debt is carried.
- **MUST:** Unpaid money upkeep does not destroy units immediately. It applies the support and efficiency penalties only.
- **MUST:** Food, water, and money shortages can stack.
- **MUST:** The stable-and-fed bonus of +0.2/hr applies only when food and water are fully paid, money upkeep is fully paid, and support is below 70.
- **MUST:** Support penalties are applied continuously as rates, not as one-time hits, using the remainder accumulator.
- **TBD:** Water-shortage production multiplier.
- **TBD:** Unpaid-money production/training efficiency penalty.

### 9.5 Resource mutation operations

| Operation | Guard | Effect |
|---|---|---|
| `produce` | Economy tick | Add per §9.2; clamp cap. |
| `upkeep` | Economy tick | Subtract up to available; set shortage flag if short. |
| `spend` | Intent or queue enqueue | Require full amount; atomic. |
| `refund` | Cancel/abort | Add refund; clamp cap; no negative. |
| `trade_escrow` | Listing/offer creation | Move from stockpile to escrow; not counted as available. |
| `trade_settle` | Acceptance | Move escrow to counterparty; apply tax; validate caps. |
| `loot` | Capital capture | Move 10% of defender stockpile to attacker, capped; see §9.6. |
| `elimination_loss` | Elimination | Remove 35%; clamp to new cap. |
| `season_reset` | Season end | Discard the world stockpile; meta entitlements persist. |

No operation may create a negative stockpile. No operation may move money to another player except through the defined trade system; money is not directly transferable.

### 9.6 Capital loot

- **DEFAULT:** The attacker takes 10% of the defender's stockpile, capped at 500 gold equivalent.
- **TBD:** The gold-equivalent value of money, food, water, and oil.
- **PROPOSED:** Compute 10% of each resource, convert each to gold equivalent, and if the total exceeds 500, scale every resource share by `500 / total`. Round each share down. Subtract the rounded shares from the defender, then add to the attacker with storage clamping.
- **PROPOSED:** If the defender is eliminated, no loot is taken, even if the capture is a capital.
- **PROPOSED:** If the defender survives the capture, loot reduces their stockpile immediately. They do not lose 35% unless a later event eliminates them.
- **PROPOSED:** If the attacker's storage cannot hold the loot, the excess is lost, not returned to the defender.

### 9.7 Unit mutations

| Operation | Guard | Effect |
|---|---|---|
| `grow_infantry` | Owned province, food available, below cap | Add accumulated infantry; clamp cap. |
| `train` | Queue completion, target owned, era/unit unlocked | Add units; clamp to cap; excess lost. |
| `launch` | Valid march | Move units from garrison to army. |
| `arrive_friendly` | Target owned by self | Merge into garrison; may exceed cap. |
| `arrive_capture` | Attacker wins | Surviving units become garrison; may exceed cap. |
| `battle_loss` | Battle | Remove loser units and winner losses. |
| `ability_damage` | Ability | Remove units by percentage. |
| `recall_penalty` | Attack recall | Remove 10% rounded up. |
| `retreat` | Defender agency | Move entire garrison to adjacent owned province. |
| `split` | Garrison | Move a positive subset to a new army. |
| `merge` | Two garrisons in same owned province | Add counts. |
| `eliminate` | Faction eliminated | Remove all units everywhere. |

Rules:

- **MUST:** A unit count is an integer and never negative.
- **LOCKED:** Troop cap applies to growth and training. It does **not** prevent an arriving, retreating, or capturing army from exceeding the cap.
- **MUST:** A province above its cap stops growth and rejects new training for that province until it is below cap.
- **MUST:** Splitting and merging conserve total unit counts.
- **DEFAULT:** Training completion that would exceed the cap adds only up to the cap; the excess is lost and reported.

### 9.8 Inventory invariants

- Total units = sum of all garrisons + sum of all marching armies + units destroyed by explicit events.
- No event may duplicate units.
- Every resource change has an audit row with a reason code.
- Every trade has matching escrow, settlement, or refund rows.
- Every queue item has exactly one terminal state.
- Every entitlement is account-scoped and has no gameplay effect.

---

## 10. Build, training, research, and doctrine

### 10.1 Build queue

- **DEFAULT:** One national build queue. Slots default to 1 and can be upgraded to 2. Slot-upgrade cost and timing are **TBD**.
- **DEFAULT:** Orders are processed FIFO. At most one order is `running` at a time.
- **MUST:** An order targets exactly one owned province.
- **MUST:** A province can have at most one build order at a time.
- **MUST:** A province at level 5 cannot be targeted.
- **MUST:** Cost is deducted at enqueue.
- **MUST:** The order reserves a queue slot.
- **MUST:** Build time starts at enqueue and continues offline and during war.

Province upgrade table from `09` §7.4:

| Level | Troop cap | Production | Upgrade money | Build time | Fortification |
|---:|---:|---:|---:|---:|---:|
| 1 | 100 | 1.0× | — | — | +0% |
| 2 | 200 | 1.5× | 100 | 1h | +10% |
| 3 | 300 | 2.0× | 250 | 2h | +20% |
| 4 | 400 | 2.5× | 500 | 4h | +30% |
| 5 | 500 | 3.0× | 1,000 | 8h | +40% |

- **MUST:** Non-capital upgrades also cost the province's own resource equal to the listed money cost, unless config overrides it. Capital upgrades cost money for both components. **DEFAULT**
- **MUST:** Level 1 is the starting level; there is no level-0 upgrade order.

Build item states:

| State | Meaning | Player-cancel refund |
|---|---|---|
| `queued` | Waiting for the running slot. | 50% **DEFAULT** |
| `running` | Timer active. | 50% **DEFAULT** |
| `completed` | Level applied. | No cancel |
| `cancelled` | Removed. | Per trigger |

Transitions:

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| — | Enqueue | Slot free, province owned, level <5, resources paid | `queued` | Deduct cost; reserve slot. |
| `queued` | Previous order completes/cancels | Slot free | `running` | Start timer; emit notification. |
| `running` | Timer reaches zero | Province still owned | `completed` | Level +1; update production, cap, fortification; free slot. |
| `running` | Province captured | — | `cancelled` | 50% refund; free slot. **DEFAULT** |
| `queued` | Province captured | — | `cancelled` | 50% refund; free slot. **DEFAULT** |
| `queued`/`running` | Player cancels | — | `cancelled` | 50% refund; free slot. **DEFAULT** |
| any | Faction eliminated or season ends | — | `cancelled` | No refund; free slot. |

### 10.2 Training queue

- **DEFAULT:** One national training queue, separate from the build queue. Slots default to 1 and can be upgraded to 2. Slot-upgrade cost is **TBD**.
- **DEFAULT:** Batch-based, not per-unit. A batch has a unit type, count, target province, cost, and duration.
- **MUST:** Training continues offline and during war.
- **MUST:** Only tanks, aircraft, and missile/artillery use the training queue. Infantry grows automatically.
- **MUST:** The unit type must be unlocked by the current era.
- **MUST:** The target province must be owned.
- **MUST:** Cost is deducted at enqueue.
- **PROPOSED:** At enqueue, require `current garrison + all queued training for the province ≤ troop cap`. This is a reservation, not a guarantee if the cap later falls.
- **DEFAULT:** At completion, add only up to the target's current cap; excess is lost and reported.
- **DEFAULT:** If the target is captured, cancel the order and refund 50%, whether queued or running. This mirrors the build-cancel rule.
- **MUST:** If the faction is eliminated or the season ends, the order is cancelled; no refund.

Training item states mirror build states. **DEFAULT:** cancel refunds are 50% for queued and 50% for running, mirroring the build queue.

**TBD:** Training times, batch sizes, costs, and missile-unit integration.

### 10.3 Infantry growth

- **DEFAULT:** +20 infantry/hr per province level, capped.
- **MUST:** Growth is automatic and does not use the training queue.
- **MUST:** Growth is applied every economy tick with a remainder accumulator.
- **MUST:** Growth stops if food is short, the province is not owned, the province is at/above cap, or the owner is eliminated/finished.
- **PROPOSED:** Growth uses the same multiplier as `support_income_multiplier`.
- **MUST:** Growth is multiplied by 1.3 while Mobilization is active.
- **MUST:** Neutral, rebel, and refugee provinces do not grow infantry.
- **MUST:** AI provinces do not use the player infantry growth rule. They use the AI replenishment rule, whose exact model is **TBD**.

### 10.4 Research

Research is instant. There is no research queue.

Tech states:

| State | Meaning |
|---|---|
| `locked` | Era or prerequisite not met. |
| `available` | Can be purchased now. |
| `owned` | Purchased. |

Transitions:

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `locked` | Era opens or prerequisite purchased | Calendar and gate pass | `available` | Emit availability. |
| `available` | Purchase | Enough money and any required gold; gate pass; era open | `owned` | Deduct costs; apply effects; recalculate availability. |
| `available`/`owned` | Season ends | — | reset in next world | No carry-over of power. |

Rules:

- **MUST:** Era 2 opens on day 8, Era 3 on day 16, Era 4 on day 24. **DEFAULT**
- **MUST:** The 3-of-5 gate applies only to the first tech of the next era. It counts main techs in the previous era; side branches do not count. Players may skip two main techs. **DEFAULT**
- **MUST:** A tech cannot be purchased before its era opens, even if its prerequisite is owned.
- **DEFAULT:** Research costs money; late-era techs may also cost gold. Exact costs are **TBD**.
- **DEFAULT:** Research includes infantry weapon/skill side branches and small economic production/storage bonuses. Exact economic-tech effects are **TBD**.
- **DEFAULT:** No catch-up discount and no tech stealing. The era calendar is the main pacing.
- **MUST:** Research is retained through elimination, respawn, and abandonment return.
- **MUST:** Research resets at season end for the next world.

### 10.5 Doctrine

- **DEFAULT:** One national infantry weapon and one national skill.
- **MUST:** Doctrine can be changed only in peace.
- **MUST:** A change is atomic: pay cost, replace the old choice, apply the new multiplier on the next battle.
- **MUST:** A doctrine change during war is rejected.
- **LOCKED:** Weapon applies only to infantry. Skill applies to the whole stack.
- **TBD:** Doctrine change cost.

| Choice | Effect |
|---|---|
| **Rifles** | Balanced infantry row in the counter table. |
| **Anti-tank** | Infantry uses the anti-tank row: 1.5× vs tanks, 0.8× vs infantry, 0.3× vs aircraft. |
| **Anti-air** | Infantry uses the anti-air row: 1.5× vs aircraft, 0.8× vs infantry, 0.5× vs tanks. |
| **Defender** | +20% defense while defending an owned province. |
| **Raider** | +20% attack while attacking a province not owned by self or an ally. |
| **Marcher** | +25% march speed. |

- **MUST:** Marcher affects speed only, not power.
- **MUST:** Defender and Raider are mutually exclusive because only one skill is active.
- **LOCKED:** Defender/Raider apply to the whole stack; the weapon applies only to infantry.

### 10.6 Queue and research edge cases

- A queued order whose province is captured is cancelled. A running order whose province is captured is cancelled with no refund.
- A queue slot is freed on completion, cancellation, elimination, or season end.
- If the server restarts with overdue completions, process them FIFO once each. Do not grant extra completions or duplicate units.
- If two completions share a timestamp, process by ascending queue item ID.
- A completed build that raises a province above the troop cap does not remove troops; it only raises the cap.
- A completed training batch cannot create units in a province no longer owned. The order is cancelled before completion.

---

## 11. Trade state machine

### 11.1 Trade forms

| Form | Parties | Currency | Tax | Status |
|---|---|---|---|---:|
| **Market listing** | Seller and any eligible buyer | Gold only | 5% | **DEFAULT** |
| **Direct offer** | Two factions | Gold only | 5% non-ally (**PROPOSED**), 0% if allies | **DEFAULT** |
| **State exchange** | Faction and system | Gold only | Spread | **DEFAULT** |

“Gold-only” means gold is the only currency. Money cannot be sent to another player. Food, water, and oil are tradeable; money is not. Trades exchange gold for one tradeable resource, or one tradeable resource for gold. The exact bundle rules are **TBD**.

### 11.2 Eligibility

A faction can trade only when:

- it is active or a spectator with a stockpile;
- the world is in peace;
- the account is at least 24 hours old;
- the daily trade limit is not exhausted: **DEFAULT** 5 trades and 500 gold moved per faction per world day, including state-exchange trades;
- **PROPOSED:** the trade's gold value does not exceed the remaining daily gold allowance, and accepting it would not be the sixth trade;
- the faction is not eliminated during the transaction;
- the counterparty is not the same faction;
- for direct ally trades, the alliance is active and not locked by war.

**DEFAULT:** Daily limits reset at the start of each world day (server UTC). **PROPOSED:** Alt-account suspicion may flag or limit an account, but it does not silently block a legitimate trade. A player has at most one faction per world, so this is the world-scoped reading of `09`'s "per player per day."

### 11.3 Market listing state machine

| State | Meaning | Escrow |
|---|---|---|
| `open` | Visible and acceptable. | Seller's offered resource is escrowed. |
| `accepted` | Buyer paid; settlement complete. | Escrow released to buyer. |
| `cancelled` | Seller cancelled or faction eliminated. | Escrow returned. |
| `expired` | Listing lifetime ended. | Escrow returned. |

Transitions:

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| — | Create listing | Peace, eligible, resources available | `open` | Escrow resource; reserve listing. |
| `open` | Buyer accepts | Peace, buyer has gold, buyer has resource space, seller has gold space, limits pass | `accepted` | Atomic swap; 5% tax burned; update limits. |
| `open` | Seller cancels | — | `cancelled` | Return escrow; free listing. |
| `open` | Lifetime ends | — | `expired` | Return escrow. |
| `open` | War starts | — | `open` but frozen | No new accepts until peace. **PROPOSED** |
| `open` | Seller eliminated | — | `cancelled` | Return escrow before elimination loss. **PROPOSED** |
| any | Season ends | — | `cancelled` | Return escrow for audit; then freeze. |

**TBD:** Listing lifetime. Recommendation: 24 hours.

### 11.4 Direct offer state machine

| State | Meaning | Escrow |
|---|---|---|
| `pending` | Sent to one counterparty. | Offeror's resource is escrowed. |
| `accepted` | Counterparty accepted. | Settlement complete. |
| `declined` | Counterparty refused. | Escrow returned. |
| `cancelled` | Offeror cancelled. | Escrow returned. |
| `expired` | Lifetime ended. | Escrow returned. |

Rules:

- **MUST:** Only one counterparty can accept.
- **MUST:** Acceptance is atomic and revalidates both stockpiles and caps.
- **MUST:** A direct offer to an ally is tax-free; a direct offer to a non-ally uses the 5% tax. **DEFAULT**
- **DEFAULT:** Offers freeze at war start and resume at peace.
- **PROPOSED:** If either faction is eliminated, its offers cancel and escrow returns before the elimination package.

**TBD:** Offer lifetime.

### 11.5 State exchange

- **DEFAULT:** The state exchange lets a faction buy or sell food, water, or oil for gold at a fixed rate with a wide spread. Player trades should be better.
- **DEFAULT:** Exchange trades count toward the 5-trade and 500-gold daily limits.
- **TBD:** Exact fixed prices and spread. `09` says fixed prices with a wide spread; this document does not make them dynamic.
- **MUST:** The exchange is instant and transactional.
- **MUST:** It obeys storage caps and gold availability.
- **MUST:** It cannot be used to transfer value to another player.
- **MUST:** No tax is added; the spread is the fee. **DEFAULT**

### 11.6 Tax and settlement

- **LOCKED:** The 5% market tax is deducted from the gold received by the party selling the resource, and burned. The buyer pays the listed price.
- **LOCKED:** Ally direct trades have no tax. Non-ally direct trades use the same 5% tax on the gold-receiving side.
- **DEFAULT:** Tax is rounded down to an integer, with a minimum of 1 gold when the gold received is positive. Ally direct trades remain zero.
- **MUST:** Settlement validates both sides' storage. If either would overflow, the acceptance is rejected and the listing/offer remains open.
- **MUST:** No partial settlement.

### 11.7 Trade and war

- **MUST:** Trade is peace-only.
- **PROPOSED:** When war starts, open listings and pending offers are frozen, not cancelled. They become acceptable again at peace.
- **PROPOSED:** A trade accepted in the same transaction as a phase boundary uses the phase at commit time. If the phase is war, it is rejected.
- **MUST:** Alliance-locked trade rules follow §12.

---

## 12. Alliance state machine

### 12.1 Alliance states

| Entity | States |
|---|---|
| Alliance | `active`, `dissolved` |
| Membership | `member`, `leader` |
| Invitation | `pending`, `accepted`, `declined`, `expired`, `cancelled` |

### 12.2 Formation and membership

- **LOCKED:** Maximum 3 factions per alliance.
- **MUST:** A faction can be in at most one alliance.
- **LOCKED:** Formed in peace only.
- **LOCKED:** Locked during war. No joining, leaving, inviting, kicking, or accepting during war.
- **LOCKED:** Leave in peace only.
- **LOCKED:** Leaving costs −5 support and starts a 24-hour cooldown:
  - cannot attack an ex-ally for 24 hours;
  - cannot join a new alliance for 24 hours.
- **LOCKED:** Alliances are diplomatic and economic, not military.
- **LOCKED:** No stationing troops in allied provinces, no joint attacks, no shared commands, no shared victory, no alliance award.

### 12.3 Permissions

**LOCKED:**

- The leader invites and kicks.
- Any member may leave voluntarily in peace.
- The leader may not kick during war.
- An eliminated member keeps membership, shared vision, and direct-trade access, but cannot invite, kick, or lead.
- If the leader is eliminated or abandoned, leadership transfers to the earliest-joined active member.

**PROPOSED:**

- The leader may not disband the alliance directly. If the leader leaves, leadership transfers or the alliance dissolves.
- If no active member exists, the alliance remains but has no acting leader until a member respawns.

The LOCKED permissions above were approved on 2026-10-23 and are part of the v1 rule set.

### 12.4 Transitions

| Current | Trigger | Guard | Next | Side effects |
|---|---|---|---|---|
| `none` | Invitation accepted | Peace, inviter is leader, alliance <3, target active and unallied, target not in join cooldown | `member` | Add member; shared vision; shared color. |
| `none` | Invitation declined/expired | — | `none` | Remove invitation. |
| `member` | Leave | Peace | `none` | −5 support; 24h ex-ally attack cooldown; 24h join cooldown; free slot. |
| `member` | Kick | Peace, actor is leader | `none` | No −5 support **DEFAULT**; 24h ex-ally attack cooldown; 24h join cooldown. |
| `leader` | Leave | Peace | `none` | -5 support; pass leadership to earliest-joined active member; if none, dissolve; apply cooldowns to the leaving leader. |
| `leader` | Abandoned | 5 days inactive | `none` | Remove; pass leadership; no support/cooldown for the abandoned player. |
| any | War starts | — | same | Freeze membership and invitations. |
| any | War ends | — | same | Unfreeze at the next peace tick. |
| `active` | Season ends | — | `dissolved` | No carry-over. |

### 12.5 Invitations

- **MUST:** An invitation is for one faction and one alliance.
- **PROPOSED:** A faction can have at most one pending invitation at a time.
- **MUST:** An invitation cannot be accepted in war.
- **PROPOSED:** An invitation expires after 24 hours.
- **MUST:** A leader cannot invite a faction already in an alliance.
- **MUST:** The invitee sees the alliance name, leader, members, and shared-vision state before accepting.

### 12.6 Benefits and limits

- **LOCKED:** Allies see each other's exact army sizes for garrisons.
- **PROPOSED:** In-flight armies are included in shared vision.
- **LOCKED:** Direct ally trades are tax-free.
- **LOCKED:** Shared map color.
- **LOCKED:** No stationing.
- **LOCKED:** No joint attacks or shared commands.
- **LOCKED:** No shared victory.
- **LOCKED:** No alliance award.
- **MUST:** An ally cannot attack an ally. The server rejects the launch.
- **MUST:** After leaving or being kicked, the ex-ally attack cooldown blocks attacks in both directions for 24 hours.
- **MUST:** The cooldown does not block trade, shared vision removal, or map viewing.
- **MUST:** The join cooldown blocks joining any alliance for 24 hours.
- **PROPOSED:** If an ex-ally joins a different alliance after the cooldown, the old pair's attack cooldown still applies until its own timer expires.

### 12.7 War lock edge cases

- If war starts while an invitation is pending, the invitation remains pending but cannot be accepted until peace. It expires on its normal timer.
- If war starts while a member wants to leave, the leave is rejected until peace.
- If a member is eliminated during war, membership persists. Elimination is not a leave.
- If a member is abandoned during war, the administrative removal happens immediately but does not create a join slot until peace. **PROPOSED**
- If an alliance drops below 3 members during war, it cannot refill until peace.

---

## 13. Support and rebellion state machine

### 13.1 Support meter

| Range | State | Income/growth | Other |
|---:|---|---|---|
| 60–100 | Stable | 100% | No penalty |
| 40–59 | Uneasy | 100% | Warning tone |
| 25–39 | Unrest | 85% | — |
| 15–24 | Serious Unrest | 70% | — |
| 0–14 | Uprising | 70% **PROPOSED** | Rebels spawn |

- **MUST:** Support is an integer from 0 to 100.
- **MUST:** It starts at 60 at world spawn.
- **MUST:** It updates every economy tick and immediately on one-time events.
- **MUST:** Support does not affect combat power. **LOCKED**
- **DEFAULT:** Respawn resets support to 60. Without a reset, a player eliminated below 15 support would immediately face another uprising.

### 13.2 Continuous drivers

Applied per hour, with a per-faction remainder:

| Driver | Rate |
|---|---:|
| Food shortage | −0.5/hr |
| Water shortage | −0.5/hr |
| Unpaid money upkeep | −0.3/hr |
| Stable and fed | +0.2/hr, cap 70 |

Rules:

- **MUST:** Shortages stack.
- **MUST:** The stable-and-fed bonus applies only when food, water, and money upkeep are all paid.
- **MUST:** The +0.2/hr bonus cannot raise support above 70.
- **MUST:** Continuous changes clamp to 0–100.

### 13.3 Regional events

| Event | Support effect | Recipient |
|---|---:|---|
| Enemy captures a province | −0.1 | Province owner |
| Defended successfully | +0.1 | Defender |
| Captured a province | +0.1 | Attacker |
| Heavy losses in a battle | −0.1 | Side with heavy losses |
| Bombing or missile damage | −0.1 | Province owner |
| Capital regional event | ×3 | Event recipient |

- **PROPOSED:** The regional cap is ±1.0 **net** per province per world day. Events beyond the cap are discarded, not deferred.
- **MUST:** The capital ×3 multiplier applies before the daily cap.
- **DEFAULT:** “Heavy losses” means a side lost at least 50% of its committed combat units in that battle. It can apply to a winner or loser, once per side per battle.
- **LOCKED:** The capital ×3 multiplier applies to regional events only. The one-time “Capital captured −5” is not multiplied.
- **MUST:** Regional events from a rebel capture count as “enemy captures a province” for the owner.
- **MUST:** A rebel group is not a faction and receives no support.

### 13.4 One-time events

| Event | Support effect | Recipient | Cap |
|---|---:|---|---|
| Leave an alliance | −5 | Leaving faction | Not capped |
| Win a major battle | +1 | Winner | Not capped |
| Capital captured | −5 | Defender | Not capped |
| Defeat a rebel group | +0.5 | Player who defeats it | Not capped |

- **MUST:** One-time events apply immediately and atomically with their cause.
- **MUST:** “Win a major battle” requires a threshold. **TBD:** the threshold. Recommendation: a battle involving at least 200 total combat units, or a capital battle.
- **MUST:** A player who defeats a rebel group gets +0.5. An AI who defeats it gives no player support.
- **PROPOSED:** The defender of a capital capture records the −5 in the battle report and history. If the capture also eliminates the defender, the respawn reset to 60 supersedes the −5 on the live meter.

### 13.5 Rebellion states

| Faction rebellion state | Meaning |
|---|---|
| `none` | No active group, no grace. |
| `active` | Exactly one rebel group exists and holds or is taking a province. |
| `grace` | The group was defeated; no new group until the timer ends. |

Rebel group states:

| Group state | Meaning |
|---|---|
| `spawned` | Created this transaction; battle pending. |
| `holding` | Holds a rebel enclave. |
| `defeated` | Removed; grace starts for the origin faction. |

### 13.6 Spawn rules

- **LOCKED:** One active rebellion at a time.
- **LOCKED:** Spawn when support drops below 15, in the weakest province.
- **LOCKED:** No new group until the current group is defeated, then a 2-hour grace.
- **LOCKED:** Rebels take one province and hold it as a neutral rebel enclave. They do not expand.
- **LOCKED:** Rebel strength scales with the era.
- **LOCKED:** Rebels are PvE and use the same combat rules.
- **LOCKED:** Rebel capture drops province level by 1, minimum 1, unless it triggers elimination.

**Execution (step 4 is LOCKED; the remaining steps stay PROPOSED):**

1. On the economy tick, if support <15, rebellion state is `none`, and the faction owns at least one province:
2. Select the weakest province by lowest total garrison; tie by lowest level; tie by lowest province ID.
3. Create a rebel army scaled to the current era.
4. Resolve an immediate battle against that province's garrison. There is no defender-agency window for a rebel uprising. **LOCKED.**
5. If the rebel wins, the province becomes a rebel enclave, the group becomes `holding`, and the owner suffers the capture support event. If it was the owner's last province, the owner is eliminated and the province does **not** lose a level, per the `09` exception.
6. If the rebel loses, the group becomes `defeated`, the defender gets +0.5 support if it is a player, and the origin faction enters `grace` for 2 hours.
7. If the faction is eliminated, no new rebellion is scheduled. The active group persists as an independent enclave.

**TBD:** Exact rebel army size by era and the “weakest” tie-break if the product owner wants a different one.

### 13.7 Defeat and grace

- **MUST:** Defeating a rebel group gives the defeating player +0.5 support.
- **MUST:** The origin faction enters a 2-hour grace period after its group is defeated, regardless of who defeats it.
- **MUST:** If support is still below 15 when grace ends, a new group can spawn on the next economy tick.
- **MUST:** If support is at or above 15 when grace ends, no group spawns until support drops below 15 again.
- **PROPOSED:** Capturing a rebel enclave also counts as a province capture for the +0.1 regional event.
- **PROPOSED:** A rebel group that captures a capital triggers the defender's capital relocation/elimination and the −5 capital event. Rebels get no +5, loot, or mark.

### 13.8 Support edge cases

- Support at exactly 15 is Serious Unrest, not Uprising. The spawn check is `< 15`.
- Support at exactly 60 is Stable.
- Support at exactly 70 is the cap for the stable-and-fed bonus; the bonus cannot push above 70.
- Support at 0 clamps; continued negative drivers do not create debt.
- A faction with no provinces cannot spawn new rebels.
- A faction in `grace` that is eliminated does not carry grace into the respawn; the new rebellion state is `none`. **PROPOSED**
- An active rebel group persists through the origin faction's elimination and respawn. It remains the faction's one active rebellion until defeated. **LOCKED**
- If a rebel group is defeated in the same tick as a new support drop below 15, grace still applies; no immediate respawn.
- If a province is captured while it has a queued build order, the order cancels before the support event is applied.

---

## 14. AI warlord state machine

### 14.1 Faction state

| State | Meaning |
|---|---|
| `active` | Holds at least one province. |
| `eliminated` | Holds zero provinces; removed permanently. |

AI warlords never respawn. They are not player factions, do not use the player elimination package, and are ineligible for awards.

### 14.2 Decision cycle

| Phase | Trigger | Action |
|---|---|---|
| `idle` | No decision due. | Wait. |
| `evaluating` | AI decision tick. | Score targets and choose one action. |
| `marching` | An AI army is in flight. | Continue; no new order from that army. |
| `defending` | An AI province has an incoming attack. | Archetype decides hold, reinforce, or retreat. |
| `retreating` | Archetype chooses retreat. | Move garrison to an adjacent AI-owned province. |
| `eliminated` | Last province lost. | Remove faction and all armies. |

**PROPOSED:** AI evaluates once per 60-second economy tick, in ascending `ai_id` order. Each warlord may issue at most one new order per tick. The exact cadence remains tunable.
**MUST:** AI decisions log the seed, visible inputs, chosen action, and result so they can be replayed in tests.

### 14.3 Allowed actions

- Attack neutral, AI, or rebel provinces at any time.
- Attack player provinces only during war, with both launch and arrival inside the same war window.
- Reinforce or retreat when defending, according to archetype.
- Hold.
- Replenish garrisons through the AI strength-scaling rule.

AI cannot:

- attack a protected player;
- attack a refugee province;
- attack an ally (AI has no alliances);
- trade, use the pass, buy cosmetics, or join an alliance;
- receive titles or awards;
- respawn;
- use player build/training/research queues unless a future design explicitly says so.

### 14.4 AI economy and strength

- **DEFAULT:** AI garrison sizes and unit tiers rise at the era boundaries: days 8, 16, and 24.
- **TBD:** Exact replenishment rate, resource abstraction, training model, and whether AI uses the same unit costs.
- **MUST:** AI never receives free units during an active battle. Replenishment happens on an economy tick.
- **MUST:** AI garrisons obey the same combat formula as players.
- **PROPOSED:** AI units are capped by province troop capacity for replenishment.

### 14.5 Archetypes and defender agency

| Archetype | Attack tendency | Defender behavior |
|---|---|---|
| **Garrison** | Low | Defends, reinforces, rarely attacks |
| **Raider** | High; attacks weak neighbors in war | Retreats when losing |
| **Expansionist** | Takes neutral land anytime; grows toward the player map | Holds and expands |

**TBD:** Exact aggression scores, target scoring, reinforcement thresholds, and retreat thresholds. These must be configurable, not hardcoded.

**DEFAULT:** No dynamic rubber-banding. AI strength changes only through era scaling and normal map play.

### 14.6 AI elimination

When an AI loses its last province:

1. Mark it `eliminated`.
2. Destroy all its armies, including in-flight armies.
3. Remove its map color and shared-vision entries.
4. Rebel enclaves are independent map state; AI elimination does not remove them. Only the AI’s owned provinces are gone.
5. **PROPOSED:** No loot. **DEFAULT:** No respawn. **LOCKED:** No award.

### 14.7 AI and player capital capture

- AI can capture a player capital.
- The player suffers capital capture: −5 support, relocation or elimination.
- **PROPOSED:** The AI does not gain loot, +5 support, a capital flag, or the Capital Breaker mark.
- **PROPOSED:** The captured province becomes an AI-owned normal province.

### 14.8 AI and rebellion

- AI can attack and capture rebel enclaves.
- Defeating a rebel group gives no support to AI.
- The origin player’s 2-hour grace still starts. **PROPOSED**

---

## 15. Season end, awards, and reset

### 15.1 Freeze

At `season_end = T0 + 30 days`:

1. Stop accepting all intents except read-only queries and account claims.
2. Cancel every march with `arrive_at >= season_end`. Marches with `arrive_at < season_end` resolve first.
3. Stop all build and training queues.
4. Stop production, upkeep, support, rebellion, and AI decisions.
5. Cancel all trade listings and offers; return escrow for audit.
6. Snapshot the final state exactly once.
7. Calculate awards and generate the recap.

The season never ends early, even if one faction dominates. **LOCKED**

### 15.2 Final snapshot fields

- province ownership, level, resource, capital flags, garrisons;
- faction resources, support, era, research, doctrine;
- total troops by faction;
- alliance membership at freeze;
- join time and last-seen time;
- score components and total score.

Title eligibility inputs (player control and linked social identity at freeze) are recorded in `season_results`; account auth and pass/entitlement state are not embedded in the world snapshot.

### 15.3 Awards

| Award | Rule | Eligibility |
|---|---|---|
| **Conqueror** | Most provinces held at freeze | Player-controlled, linked account, active at freeze |
| **Best Nation** | Highest score at freeze | Player-controlled, linked account, active at freeze |

Score:

```
score = 10 × provinces_held
      + economy_score
      + army_score
      + support_score
```

- **TBD:** The scaling constants and the exact economy, army, and support components. They live in config, not logic.
- **DEFAULT:** Tie-breaker is total troops, then earlier join time.
- **LOCKED:** If still tied, use the lower faction ID as the deterministic final tie-breaker.
- **MUST:** Store player-control and linked social-identity status at freeze in `season_results`; a title flag requires both.
- **LOCKED:** AI is not eligible.
- **LOCKED:** No alliance award.
- **LOCKED:** Conqueror and Best Nation can be the same faction.
- **LOCKED:** A player must have linked a Google or Apple identity before the freeze to receive a title or season history. Unlinked guests receive the recap but no title/history credit.
- **LOCKED:** A faction controlled by AI at freeze is ineligible. A player who returned and is player-controlled at freeze is eligible.
- **PROPOSED:** If no eligible faction exists, no award is granted and the recap states why.

### 15.4 Titles, history, and cosmetics

- Titles are account-bound and persist across seasons.
- Season history records the world, final rank, award, province count, and score.
- Cosmetics persist.
- Power does not persist: provinces, armies, resources, research, support, alliances, and trade reset in the next world.

### 15.5 Reset and next world

- A new world uses the same Vardania geometry with fresh ownership, resources, AI, and spawns.
- The player account keeps identity, linked social identity, pass, entitlements, titles, and history.
- A player may pre-register for the next open world.
- A finished world remains readable for the recap and history.

### 15.6 Offline at season end

A player who is offline at freeze still receives the final state and recap on next login. For title eligibility, the linked social-identity and player-control checks use the state at freeze, not the login time.

---

## 16. Account meta-state: pass, shop, and cosmetics

### 16.1 Boundary

This section defines state transitions only. Cosmetic shop pricing, catalog, exact pass XP/mission values, and the reward catalog remain **TBD**.

### 16.2 Season pass

| Entity | States |
|---|---|
| Pass | `inactive`, `active`, `expired` |
| Premium track | `locked`, `unlocked` |
| Reward | `locked`, `claimable`, `claimed`, `auto_claimed` |

Rules:

- **DEFAULT:** The pass is account-wide.
- **DEFAULT:** Pass progress is earned in any world; rewards are account-wide.
- **DEFAULT:** The pass term is a rolling 30 days from purchase; it may cross a season boundary and is configurable for playtests.
- **DEFAULT:** Price is $5 per 30-day pass.
- **MUST:** The pass has a free track and a premium track.
- **DEFAULT:** Progression is passive XP from normal play plus daily/weekly mission bonuses.
- **DEFAULT:** Content is 20-30 rewards: 8-10 free and 15-20 premium.
- **DEFAULT:** Rewards are identity cosmetics only: banners, flags, titles, profile badges, map pins, and capital monuments.
- **MUST:** Purchasing premium mid-season unlocks premium rewards already earned on the track. They become claimable, not duplicated.
- **MUST:** Buying levels is not allowed.
- **MUST:** A reward cannot be claimed twice.
- **DEFAULT:** Unclaimed rewards auto-claim at expiry.
- **MUST:** Pass rewards are cosmetic only. Nothing affects combat, economy, support, research, or matchmaking.
- **MUST:** Pass XP and missions never grant premium currency or gameplay power.

**TBD:** Exact XP values, mission definitions/cadence, and the reward catalog. The pass is account-wide and rolling 30 days from purchase by default.

### 16.3 Cosmetic shop

| Entity | States |
|---|---|
| Purchase | `pending`, `paid`, `failed`, `refunded` |
| Entitlement | `granted`, `revoked` |
| Equip state | `unequipped`, `equipped` |

Rules:

- **MUST:** The shop sells identity cosmetics only: banners, flags, titles, emblems, or similar.
- **DEFAULT:** The launch catalog is limited. Shop items are evergreen; pass-exclusive rewards are seasonal and do not overlap with the shop.
- **MUST:** Purchases are direct real-money transactions. No premium currency, loot boxes, marketplace, trading, or randomized paid items.
- **MUST:** No cosmetic changes combat, economy, support, research, or pass XP.
- **MUST:** Entitlements are account-wide and permanent unless refunded or revoked.
- **PROPOSED:** A refund revokes the entitlement and unequips it if active.
- **MUST:** A purchase is idempotent; retrying a payment callback cannot grant twice.
- **MUST:** A failed purchase grants nothing and does not consume the player's money.

**TBD:** Catalog, prices, rotation, refund window, and platform receipt validation.

### 16.4 Guest and linked accounts

- Guest-first: a player can play without linking a social identity.
- Linking is required for season rewards, titles, purchases, and cross-device access. **LOCKED**
- A linked account can have one identity across devices.
- A guest who links keeps world progress and entitlements earned while a guest, except titles/history that require linking at freeze. **PROPOSED**
- Account recovery and deletion flows are required before public launch. Exact handling is **TBD**.

---

## 17. Client and session state

### 17.1 Client states

| State | Meaning | Allowed actions |
|---|---|---|
| `boot` | App starting. | None |
| `loading` | Fetching world state. | None |
| `connected` | Live server state. | Normal intents. |
| `reconnecting` | Connection lost; retrying. | None |
| `offline` | No connection. | Read-only cached view. |
| `finished` | World ended. | Recap and account claims. |
| `error` | Unrecoverable session error. | Retry/login. |

### 17.2 Authority and resync

- **MUST:** The client never applies a battle, trade, purchase, or capture locally as final.
- **MUST:** On reconnect, the client fetches a fresh snapshot and reconciles all visible state.
- **MUST:** The client displays the server time offset; the war clock is server-derived.
- **PROPOSED:** The client does not queue intents while offline. The player must retry after reconnection. This avoids duplicate or stale orders.
- **MUST:** An intent sent with an old world version is rejected; the client refreshes.

### 17.3 Error codes

Stable codes include:

`PHASE_CLOSED`, `TARGET_PROTECTED`, `TARGET_ALLY`, `TARGET_REFUGEE`, `TARGET_SELF`, `OUT_OF_RANGE`, `NOT_ADJACENT`, `NO_TROOPS`, `NO_COMBAT_UNITS`, `FATIGUED`, `INSUFFICIENT_RESOURCES`, `STORAGE_FULL`, `QUEUE_FULL`, `PROVINCE_BUSY`, `LEVEL_MAX`, `ERA_LOCKED`, `GATE_LOCKED`, `ALLIANCE_LOCKED`, `ALLIANCE_FULL`, `COOLDOWN`, `DAILY_LIMIT`, `TRADE_FROZEN`, `WORLD_FINISHED`, `SEASON_ENDED`, `IDEMPOTENT_REPLAY`, `STALE_STATE`, `INTERNAL_ERROR`.

- **MUST:** Each rejection includes a code and a human-readable reason.
- **MUST:** A rejection never partially mutates state.

### 17.4 Information visibility

- Own and allied army counts are exact. **LOCKED**
- Enemy army counts are approximate bands. **DEFAULT**
- Support is public exact; the national meter is visible on the map at all times. **LOCKED** (`09` §8.1)
- The server always knows exact counts; the client receives a band for enemies.
- Battle reports reveal the exact forces that fought, after resolution.
- There is no fog of war. The whole map is visible. **LOCKED**
- There is no chat surface: no global chat, direct messages, emotes, pings, or taunts. **LOCKED**

### 17.5 Notifications

Notify on:

- war start and war end;
- incoming attack;
- battle resolved;
- province captured or lost;
- capital captured;
- eliminated/respawned;
- build/training complete;
- research available;
- rebellion spawned/defeated;
- trade accepted/declined/expired;
- alliance invite/accept/leave/kick;
- pass reward claimable;
- season end/recap.

**MUST:** Notifications are in-game only in v1. Push notifications and email reminders are out of scope.

---

## 18. Edge case catalog

This catalog is the implementation checklist. A rule here is not optional; it is the expected server behavior.

### 18.1 Time, phase, and world

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 1 | PvP attack launched in peace, arrives in war | Reject. Both launch and arrival must be inside the same war window. | **DEFAULT** |
| 2 | PvP attack launched in war, arrival at or after `war_end` | Reject at launch. | **DEFAULT** |
| 3 | PvP arrival exactly at `war_start` | Allowed; start is inclusive. | **DEFAULT** |
| 4 | PvP arrival exactly at `war_end` | Rejected; end is exclusive. | **DEFAULT** |
| 5 | Defender retreats at exactly `arrive_at` | Too late. The attack resolves. | **PROPOSED** |
| 6 | Admin change leaves a PvP march arriving after `war_end` | Cancel and return with no loss; log. | **LOCKED** |
| 7 | Season ends while a march is in flight | Arrival before `season_end` resolves; arrival at/after is cancelled. | **LOCKED** |
| 8 | Open world fills before day 4 | Transition to `running` immediately; no more joins; create the next open world. | **DEFAULT** |
| 9 | Join window closes with fewer than 20 humans | World runs with the joined players; no AI backfill and no reopening. | **DEFAULT** |
| 10 | Player joins during war | Allowed if the world is open; 24h protection applies. | **DEFAULT** |
| 11 | Spawn fails after account selection | No partial faction; retry or pre-register. | **DEFAULT** |
| 12 | World generation fails validation | Do not publish; retry with a new seed. | **DEFAULT** |
| 13 | Server restarts mid-tick | Replay committed events; no duplicate production, completions, or battles. | **MUST** |

### 18.2 Movement and arrival

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 14 | Land attack targets a non-adjacent province | Reject. Land is one edge per march. | **PROPOSED** |
| 15 | Stack contains land and aircraft | Moves as land; one edge, slowest speed. | **PROPOSED** |
| 16 | All-aircraft stack targets a province beyond range | Reject. | **DEFAULT** |
| 17 | Attack target becomes self-owned before arrival | Merge into the garrison; no battle. | **PROPOSED** |
| 18 | Attack target becomes ally-owned before arrival | Abort and return; no stationing. | **PROPOSED** |
| 19 | Attack target becomes neutral or rebel before arrival | Resolve as a capture/battle against the current state. | **PROPOSED** |
| 20 | Origin province is captured while the army is in flight | The army continues; no supply or recall origin requirement. | **PROPOSED** |
| 21 | Owner is eliminated while an army is in flight | Destroy the army. | **MUST** |
| 22 | Recall is issued at exactly `arrive_at` | Too late; the attack resolves. | **PROPOSED** |
| 23 | Recall penalty rounds to zero | Lose at least 1 unit total if the army has any units. | **DEFAULT** |
| 24 | Recall reduces the army to zero | Army destroyed; no return. | **MUST** |
| 25 | Reinforcement arrives at the same timestamp as the attacker | Too late; reinforcement aborts and returns. | **PROPOSED** |
| 26 | Two attacks arrive at the same timestamp | Resolve by ascending `army_id`; the first changes the province before the second. | **PROPOSED** |
| 27 | Defender retreats, then attacker recalls | Province stays neutral; no capture. | **PROPOSED** |
| 28 | Defender retreats with no adjacent owned province | Retreat unavailable; hold or reinforce. | **PROPOSED** |
| 29 | Defender retreats from a capital | Prohibited; the capital must be held or captured. | **PROPOSED** |
| 30 | Retreat destination is over troop cap | Allowed; growth/training pauses until below cap. | **PROPOSED** |
| 31 | Transfer targets an allied province | Reject; no stationing. | **LOCKED** |
| 32 | Attack targets an ally | Reject. | **LOCKED** |
| 33 | Attack targets an ex-ally inside 24h cooldown | Reject. | **LOCKED** |
| 34 | Attack targets a protected faction | Reject. | **DEFAULT** |
| 35 | Attack targets a refugee province | Reject. | **MUST** |
| 36 | Attack targets self | Reject. | **MUST** |
| 37 | Player attacks neutral/AI/rebel in peace | Allowed. | **DEFAULT** |
| 38 | Player attacks a player in peace | Reject. | **LOCKED** |
| 39 | AI attacks a player in peace | Reject. | **LOCKED** |
| 40 | Missile/artillery is included in a normal attack stack | Reject until the missile-unit model is approved. | **TBD** |

### 18.3 Battle, capture, and death

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 41 | Defender has zero combat units at arrival | Capture with no battle and no winner losses. | **MUST** |
| 42 | Attacker has zero combat units at launch | Reject. | **MUST** |
| 43 | Exact power tie | Defender wins; attacker loses all; defender loses 50%; defender retains ownership. | **LOCKED**; 50% is **DEFAULT** |
| 44 | Winner's losses round to its entire army | It still captures; province has zero garrison. | **PROPOSED** |
| 45 | Defender loses province but has another province | Province transfers; capital relocates if needed; no elimination. | **MUST** |
| 46 | Defender loses last province | Eliminate; destroy armies/queues; apply loss package; respawn or spectator. | **MUST** |
| 47 | Capital captured, defender has another province | 10% loot (cap 500 gold equivalent); auto-relocate to highest-level owned province. | **PROPOSED** |
| 48 | Capital captured, defender has no other province | No loot; attacker still gets +5 support and Capital Breaker; defender eliminated/respawns. | **PROPOSED** |
| 49 | Rebel captures a capital | Defender relocates/eliminates and suffers −5; rebels get no loot/+5/mark. | **PROPOSED** |
| 50 | AI captures a player capital | Defender relocates/eliminates and suffers −5; AI gets no loot/+5/capital flag. | **PROPOSED** |
| 51 | Airstrike reduces garrison to zero | Province remains owned with zero garrison; next hostile attack captures. | **PROPOSED** |
| 52 | Missile Strike hits a level-1 province | Level stays 1. | **PROPOSED** |
| 53 | Ability targets a protected or refugee province | Reject; no cost spent. | **MUST** |
| 53a | Ability used in peace | Reject; all abilities are war-only in v1. | **DEFAULT** |
| 54 | Ability kills enough troops to capture | It never captures; only a normal attack capture changes ownership. | **MUST** |
| 55 | Attacker wins but all its units die | Capture still occurs with zero garrison. | **PROPOSED** |
| 56 | Battle report includes a retreat | Report marks `retreated` and shows no battle losses for the retreating garrison. | **PROPOSED** |
| 57 | Fatigue after a battle | 20-minute attack lock on the attacking army; defense/transfer allowed. | **DEFAULT** |
| 58 | Fatigued army splits | Both parts inherit the remaining fatigue. | **PROPOSED** |
| 59 | Fresh troops merge into a fatigued army | Army remains fatigued. | **PROPOSED** |
| 60 | Capture without battle | No fatigue. | **PROPOSED** |

### 18.4 Resources, queues, and research

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 61 | Production would overflow storage | Clamp; excess lost and logged. | **PROPOSED** |
| 62 | Province loss shrinks storage below stockpile | Excess removed on the next economy tick; warning shown. | **PROPOSED** |
| 62a | Player is eliminated with resources above 500 | Apply the 35% loss, then clamp to the 500-per-resource floor; a spectator keeps the same floor. | **DEFAULT** |
| 63 | Upkeep cannot be paid | Stockpile goes to zero; shortage flag; support penalty. | **MUST** |
| 64 | Food, water, and money are all short | Penalties stack. | **MUST** |
| 65 | Trade receipt would overflow buyer storage | Reject the acceptance; listing/offer remains. | **DEFAULT** |
| 66 | Loot would overflow attacker storage | Clamp; excess lost. | **PROPOSED** |
| 67 | Build order's province is captured while queued | Cancel; 50% refund. | **DEFAULT** |
| 68 | Build order's province is captured while running | Cancel; 50% refund. | **DEFAULT** |
| 69 | Player cancels a queued build | 50% refund. | **DEFAULT** |
| 70 | Player cancels a running build | 50% refund. | **DEFAULT** |
| 71 | Training target's cap falls before completion | Complete only up to cap; excess lost. | **PROPOSED** |
| 72 | Training target is captured | Cancel; no refund. | **MUST** |
| 73 | Season ends with queue items pending | Cancel all; no refund. | **PROPOSED** |
| 74 | Server restarts with overdue queue items | Process FIFO once each; no duplicates. | **MUST** |
| 75 | Era opens while player is offline | Tech becomes available; it is not auto-purchased. | **MUST** |
| 76 | Doctrine change attempted in war | Reject. | **MUST** |
| 77 | Infantry growth reaches cap | Growth stops; no overflow. | **MUST** |
| 78 | Food is short | Infantry growth stops. | **MUST** |
| 79 | Arriving army exceeds troop cap | Allowed; growth/training pauses until below cap. | **LOCKED** |
| 80 | Player splits all troops out of a province | Allowed; province has zero garrison. | **PROPOSED** |
| 81 | Player merges armies in transit | Reject. | **MUST** |
| 82 | Player merges in an allied province | Reject. | **LOCKED** |

### 18.5 Support and rebellion

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 83 | Support is exactly 15 | Serious Unrest; no spawn. Spawn check is `<15`. | **MUST** |
| 84 | Support is below 15 with an active group | No new group. | **LOCKED** |
| 85 | Support is below 15 during grace | No spawn until grace ends. | **LOCKED** |
| 86 | Support is at/above 15 when grace ends | No spawn until it drops below 15 again. | **MUST** |
| 87 | Rebel group is defeated by AI | No player +0.5; origin faction still gets 2h grace. | **PROPOSED** |
| 88 | Rebel group captures the last province | Player eliminated; rebel enclave remains; no level drop because the capture triggered elimination; respawn support resets to 60. | **PROPOSED** |
| 89 | Rebel group captures a non-last province | Province becomes rebel; level −1; owner −0.1 support. | **MUST** |
| 90 | Rebel group loses | Defender gets +0.5 if a player; 2h grace. | **MUST** |
| 91 | Another player retakes a rebel enclave | Capturer gets +0.5 and +0.1 capture; origin faction gets 2h grace. | **PROPOSED** |
| 92 | AI retakes a rebel enclave | No +0.5; origin faction gets 2h grace. | **PROPOSED** |
| 93 | Rebel captures a capital | Defender relocates/eliminates and suffers −5; no rebel loot/+5. | **PROPOSED** |
| 94 | Player respawns with an active rebel group | Support resets to 60; the group persists as the same active rebellion. | **PROPOSED** |
| 95 | Player is eliminated below 15 support | Elimination resets support to 60; no immediate new uprising. | **PROPOSED** |
| 96 | Regional events exceed cap | Cap at ±1.0 net per province per day; discard excess. | **MUST** |
| 97 | Capital regional event | Apply ×3, then the daily cap; the one-time capital −5 is not ×3. | **PROPOSED** |

### 18.6 Trade and alliance

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 98 | Trade acceptance lands exactly on war start | Use the phase at commit; war rejects. | **PROPOSED** |
| 99 | War starts with open listings | Freeze; do not cancel; resume at peace. | **DEFAULT** |
| 100 | Seller is eliminated with an open listing | Cancel and return escrow before the 35% loss. | **PROPOSED** |
| 101 | Buyer has no storage space | Reject; listing remains. | **DEFAULT** |
| 102 | Seller has no gold storage space | Reject; listing remains. | **DEFAULT** |
| 103 | Two buyers accept one direct offer | Atomic first acceptance wins; the other is rejected. | **MUST** |
| 104 | Ally leaves | −5 support; 24h ex-ally attack and join cooldowns; ally trade benefit ends. | **LOCKED** |
| 105 | Member is kicked | No -5; 24h ex-ally attack and join cooldowns. | **DEFAULT** |
| 106 | Leader leaves | Leadership passes to earliest-joined active member; if none, dissolve. | **LOCKED** |
| 107 | War starts with a pending invite | Invite remains pending; cannot accept until peace; expires normally. | **PROPOSED** |
| 108 | Eliminated player is in an alliance | Membership, shared vision, and trade access persist; cannot be attacked. | **LOCKED** |
| 109 | Abandoned player is in an alliance | Removed immediately; no new member until peace. | **PROPOSED** |
| 110 | Alliance would exceed 3 members | Reject the invite/acceptance. | **LOCKED** |
| 111 | Ally attack attempted | Reject. | **LOCKED** |
| 112 | Ex-ally attacks after 24h | Allowed. | **LOCKED** |
| 113 | Alliance at season end | Dissolve; no carry-over. | **PROPOSED** |

### 18.7 Player, session, and season

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 114 | Player loses last province with armies in flight | Destroy those armies. | **MUST** |
| 115 | Player loses last province with queues running | Cancel; no refund. | **PROPOSED** |
| 116 | No refugee province for respawn | Fall back to neutral/AI; if none, spectator. | **PROPOSED** |
| 117 | Respawn fallback captures an AI's last province | That AI is eliminated. | **PROPOSED** |
| 118 | Respawn with zero troops | Allowed; infantry growth rebuilds. | **PROPOSED** |
| 119 | Protected player is attacked | Reject. | **DEFAULT** |
| 120 | Protected player attacks a player | Protection ends immediately. | **PROPOSED** |
| 121 | Protected player attacks AI/neutral | Protection remains. | **PROPOSED** |
| 122 | Player is inactive 5 days | AI takeover; remove from alliance. | **DEFAULT** |
| 123 | Player returns after AI takeover | Dissolve old faction; respawn under elimination package. | **PROPOSED** |
| 124 | AI-controlled faction was eliminated before return | Treat returning player as eliminated; respawn if possible. | **PROPOSED** |
| 125 | Spectator and a respawn location appears | Auto-respawn with 24h protection. | **DEFAULT** |
| 126 | Season ends while player is a spectator | `finished`; no title. | **PROPOSED** |
| 127 | Guest is unlinked at freeze | Recap only; no title or season history. | **LOCKED** |
| 128 | Guest links before freeze | Eligible for titles/history. | **PROPOSED** |
| 129 | Player is offline at freeze | Eligibility uses freeze state; recap on next login. | **PROPOSED** |
| 130 | No eligible player at freeze | No award; recap explains. | **PROPOSED** |
| 131 | Conqueror tie after total troops and join time | Lower faction ID wins. | **LOCKED** |
| 132 | Same faction wins both awards | Allowed. | **LOCKED** |
| 133 | One faction dominates early | Season still runs to day 30. | **LOCKED** |

### 18.8 AI

| # | Case | Expected rule | Status |
|---:|---|---|---|
| 134 | AI loses last province with an army in flight | Destroy the army; AI eliminated permanently. | **MUST** |
| 135 | AI attack would arrive after `war_end` | Reject at launch. | **LOCKED** |
| 136 | AI attacks a player in peace | Reject. | **LOCKED** |
| 137 | AI attacks neutral/AI in peace | Allowed. | **DEFAULT** |
| 138 | AI captures a rebel enclave | No player +0.5; origin faction grace starts. | **PROPOSED** |
| 139 | AI captures a player capital | Player relocates/eliminates and suffers −5; AI gets no loot/flag. | **PROPOSED** |
| 140 | AI evaluates while a player is protected | It cannot target that player. | **DEFAULT** |
| 141 | AI has no valid target | Hold; do not idle-spam invalid orders. | **PROPOSED** |

---

## 19. Invariants and test matrix

### 19.1 Global invariants

| ID | Invariant |
|---|---|
| INV-01 | Every province has at most one owner and one controller type. |
| INV-02 | Every faction has at most one capital. |
| INV-03 | A player account has at most one faction per world. |
| INV-04 | Every unit belongs to exactly one garrison or army. |
| INV-05 | Unit counts are integers and never negative. |
| INV-06 | Resource amounts are integers and never negative. |
| INV-07 | No resource is created without a spawn grant, production, loot, trade, refund, or exchange cause. |
| INV-08 | No resource is destroyed without an upkeep, cost, tax, loss, elimination, overflow, or season-reset cause. |
| INV-09 | A battle transaction applies losses, capture, capital effects, elimination, and support events exactly once. |
| INV-10 | No PvP march arrives outside its war window. |
| INV-11 | No action resolves after `season_end`. |
| INV-12 | Every queue item has exactly one terminal state. |
| INV-13 | Every trade has escrow plus settlement or refund. |
| INV-14 | Every entitlement is account-scoped and has no gameplay effect. |
| INV-15 | Replaying an event or idempotency key never duplicates state. |
| INV-16 | The map remains connected; no capture or respawn creates an unreachable province. |
| INV-17 | A faction with zero provinces is eliminated, spectator, or AI-controlled; it is never silently active. |
| INV-18 | Support is clamped to 0–100 and never affects combat power. |
| INV-19 | There is never more than one active rebellion per faction. |
| INV-20 | Refugee provinces are never normal attack targets while unused. |

### 19.2 Test suites

| Suite | What it proves | Minimum cases |
|---|---|---:|
| **T-TIME** | Phase boundaries, war-window validation, season freeze, server clock | 20 |
| **T-MOVE** | Adjacency, air range, target changes, recall, simultaneous arrivals, retreat | 25 |
| **T-COMBAT** | Power formula, counters, ties, rounding, losses, capture, fatigue | 30 |
| **T-CAPITAL** | Loot, relocation, elimination, rebel/AI capital capture, Capital Breaker | 15 |
| **T-ECON** | Production, storage, upkeep, shortages, loot, overflow, rounding | 25 |
| **T-QUEUE** | Build/training lifecycle, capture, cancellation, restart, cap changes | 20 |
| **T-SUPPORT** | Thresholds, drivers, regional caps, rebel spawn/defeat/grace, respawn reset | 20 |
| **T-TRADE** | Escrow, tax, ally tax-free, caps, war freeze, elimination, daily limits | 20 |
| **T-ALLY** | Max 3, war lock, leader transfer, kick/leave cooldowns, shared vision | 15 |
| **T-PLAYER** | Join, protection, elimination, respawn, spectator, abandonment return | 20 |
| **T-AI** | Archetypes, war-only player attacks, no respawn, AI elimination, era scaling | 15 |
| **T-SEASON** | Freeze, awards, tie-breakers, eligibility, recap, reset | 15 |
| **T-REPLAY** | Snapshot + event replay, idempotency, restart, concurrency | 15 |
| **T-FUZZ** | Random valid/invalid intents preserve all invariants | 10k+ runs |

### 19.3 Required deterministic tests

At minimum, automate these exact cases:

1. PvP launch in peace is rejected.
2. PvP arrival at `war_end` is rejected.
3. Defender action at `arrive_at` loses the race.
4. Two attacks at the same timestamp resolve by `army_id`.
5. Attack target becomes self-owned and merges.
6. Attack target becomes ally-owned and aborts.
7. Recall at `arrive_at` is too late.
8. Exact power tie follows the approved tie rule.
9. Winner losses round and distribute correctly across mixed units.
10. Capture reduces level by 1, minimum 1.
11. Capital capture loot is capped and relocated correctly.
12. Last-province loss eliminates and destroys in-flight armies.
13. Respawn uses a refugee first, then neutral/AI, then spectator.
14. Support at 14 spawns; support at 15 does not.
15. Active rebellion blocks a second group.
16. Grace blocks a spawn until it expires.
17. Rebel capture of a last province eliminates the player.
18. Storage overflow is clamped and logged.
19. Queue item cancels correctly when its province is captured.
20. Server restart does not duplicate production or completions.
21. Trade escrow returns on cancellation and elimination.
22. Ally leave applies −5 and both cooldowns.
23. War locks alliance membership changes.
24. AI cannot attack a player in peace.
25. Season freeze cancels late marches and awards exactly once.

### 19.4 Property tests

- Random resource deltas never produce a negative balance.
- Random unit splits/merges conserve total counts.
- Random battle powers produce a winner and losses within `[0, winner_count]`.
- Random event replays produce the same state hash.
- Random valid seasons never produce two active rebellions for one faction.
- Random marches never arrive outside their permitted window.

---

## 20. Open questions and proposed defaults

### 20.1 The tie decision (approved 2026-10-23)

**Decision:** An exact combat-power tie is won by the defender. The attacker loses all committed combat units. The defender loses 50% of committed combat units, rounded half up and distributed by largest remainder. The defender retains ownership.

**Status:** **LOCKED** for the rule; the 50% share is **DEFAULT** and must live in config as `combat.tie_defender_loss_fraction`. The mutual-wipe variant is rejected.

**Why:** it is deterministic, preserves the defender advantage, avoids leaving a defender-owned zero-garrison province, and needs no random roll.

**Test impact:** `03` §18.3 case 43; `07` P5-E2-T3; `09` §9.4.

### 20.2 Approved defaults (2026-10-23)

Items already marked **DEFAULT** in `09` are not repeated here. On 2026-10-23 the product owner approved items 1–16 and 18–41 as v1 defaults. Item 17 remains **TBD** and is tracked by `D-TBD-SUPPORT`. The rationale below records why each approved item was accepted.

| # | Approvedd v1 default | Section | Rationale |
|---:|---|---|---|
| 1 | Land movement is one adjacent province per march | §7.5 | Approved; makes chokepoints meaningful and matches the tutorial's adjacent march. |
| 2 | A stack with any land unit moves as land | §7.5 | Approved. |
| 3 | Defender retreat neutralizes the province and is instant | §7.8 | Approved; prevents retreat-and-keep. |
| 4 | A capital cannot be retreated from | §6.4 | Approved; makes capital defense decisive. |
| 5 | Capital effective resource is money; level-1 capital produces 15 money/hr | §9.2 | Approved; clarifies the capital economy. |
| 6 | Capital auto-relocates to highest-level owned province | §6.4 | Approved; battle resolution cannot wait for a choice. |
| 7 | Capital ×3 applies to regional events only, not the one-time −5 | §6.4 | Approved; avoids an accidental −15. |
| 8 | Respawn resets support to 60 | §5.4 | Approved; prevents an instant second uprising. |
| 9 | Respawn province is level 1 with 0 troops | §5.5 | Approved; matches “lose army” and the 24h protection window. |
| 10 | Abandonment return dissolves the old AI faction | §5.7 | Approved; matches “respawns like an eliminated player.” |
| 11 | Protected player loses protection by attacking a player | §5.3 | Approved; closes the untouchable-attacker exploit. |
| 12 | Spectators auto-respawn when a location appears | §5.2 | Approved; avoids a dead account. |
| 13 | Recall loses 10% rounded up, minimum 1 total | §7.7 | Approved; makes recall a real cost. |
| 14 | Winner losses round half up and distribute by unit-count share using largest remainder | §8.4 | Approved; deterministic and fair. |
| 15 | Skill applies to the whole stack; weapon applies only to infantry | §8.3 | Approved; makes national doctrine coherent. |
| 16 | “Heavy losses” means ≥50% of committed combat units | §13.3 | Approved; otherwise every battle triggers it. |
| 17 | Major battle threshold for +1 support | §13.4 | TBD; recommendation: ≥200 total combat units or a capital battle. |
| 18 | Rebel uprising resolves immediately with no defender window | §13.6 | Approved; support warnings are the counterplay. |
| 19 | Active rebel group persists through elimination/respawn | §13.8 | Approved; avoids deleting map state. |
| 20 | Queue refunds: 50% for any cancellation, including capture; elimination/season-end gives no refund | §10.1 | Approved; matches the `09` build-cancel rule and keeps capture losses predictable. |
| 21 | Training over cap loses excess | §10.2 | Approved; simplest deterministic rule. |
| 22 | Trade receipts that overflow storage are rejected | §11.6 | Approved; prevents silent loss. |
| 23 | Market tax is charged to the gold-receiving side and burned | §11.6 | Approved; keeps buyer prices readable. |
| 24 | Trade freezes at war start rather than cancels | §11.7 | Approved; avoids destroying pending deals. |
| 25 | Alliance leader invites/kicks; leadership passes to earliest active member | §12.3 | Approved; fills a gap in `09`. |
| 26 | Kick has no −5 but does start both 24h cooldowns | §12.4 | Approved; distinguishes voluntary betrayal from removal. |
| 27 | Eliminated players keep alliance but cannot lead | §12.3 | Approved; matches “keeps alliance access.” |
| 28 | Unlinked guest gets recap but no title/history | §15.3 | Approved; matches “linking required.” |
| 29 | AI-controlled faction at freeze is ineligible for awards | §15.3 | Approved; prevents abandoned-faction titles. |
| 30 | Underfilled open world runs without AI backfill | §4.5 | Approved; keeps composition stable. |
| 31 | First war window is 18h after `T0` | §3.4 | Approved; guarantees a full first peace. |
| 32 | PvP march is cancelled if admin time change breaks the window | §3.3 | Approved; preserves the invariant. |
| 33 | Season-end arrival uses `< season_end` | §15.1 | Approved; consistent with end-exclusive intervals. |
| 34 | Conqueror/Best Nation final tie-break is lower faction ID | §15.3 | Approved; deterministic. |
| 35 | Eliminated/spectator storage floor is 500 per resource | §5.4, §9.3 | Approved; preserves "keep trade access" and the 35% loss rule. |
| 36 | Ability cooldowns persist through respawn and clear at season end | §8.8 | Approved; prevents respawn cooldown resetting. |
| 37 | Troop cap limits growth/training but not arriving, retreating, or capturing armies | §9.7 | Approved; otherwise a winning army would have to disband to fit the cap. |
| 38 | Mixed-stack counters use the opposing count-share-weighted average | §8.3 | Approved; gives a deterministic multiplier without pairwise damage. |
| 39 | Counter lookup is the same on attack and defense | §8.3 | Approved; anti-tank infantry and tanks should be strong in both roles. |
| 40 | Production multipliers apply to both the terrain resource and the 5/hr money trickle | §9.2 | Approved; keeps the level table meaningful for money. |
| 41 | Market tax rounds down with a 1-gold minimum on positive gold receipts | §11.6 | Approved; prevents zero-tax micro-trades. |

### 20.3 TBD register surfaced by this document

This is the subset of open values that this document's mechanisms depend on, not the full `09` §20 list.

> TBD #1 (exact tie rule) was resolved by D-TIE on 2026-10-23; see §8.4 and §20.1. The numbering below is retained so cross-document references stay stable. There are 23 open TBDs.

| # | TBD | Section | Why it blocks |
|---:|---|---|---|
| 2 | Missile/artillery region-damage model and whether Missile Strike consumes a trained unit | §7.5, §8.8 | Unit training, combat, abilities |
| 3 | Ability range | §8.8 | Targeting validation |
| 4 | Missile Strike garrison percentage and level-damage cap | §8.8 | Damage resolution |
| 5 | Water-shortage production multiplier | §9.2 | Economy |
| 6 | Unpaid-money production/training efficiency penalty | §9.4 | Economy |
| 7 | Gold-equivalent values for loot | §9.6 | Capital loot |
| 8 | Training costs, times, batch sizes, and queue slot-upgrade costs | §10.1, §10.2 | Training queue |
| 9 | Doctrine change cost | §10.5 | Research |
| 10 | Trade listing/offer lifetime, bundle rules, and state-exchange rates/spread | §11 | Trade |
| 11 | AI decision cadence, target scoring, replenishment, retreat thresholds | §14 | AI |
| 12 | Major battle threshold | §13.4 | Support |
| 13 | Rebel army size by era | §13.6 | Rebellion |
| 14 | Score constants and economy/army/support components | §15.3 | Awards |
| 15 | Exact pass XP values, mission definitions/cadence, and reward catalog | §16.2 | Meta |
| 16 | Shop catalog, prices, refund window, receipt validation | §16.3 | Meta |
| 17 | In-game notification presentation and priority | §17.5 | Notifications |
| 18 | Recall “or the oil cost” interpretation | §7.7 | Recall |
| 19 | Whether AI uses player build/training/research queues | §14.4 | AI |
| 20 | Account deletion, ban, and guest-merge edge cases | §16.4 | Account |
| 21 | Research tech costs and late-era gold requirements | §10.4 | Research |
| 22 | Voluntary capital relocation cost | §6.4 | Capital |
| 23 | Intermediate aircraft and artillery/missile range values by era | §7.5 | Movement |
| 24 | Economic tech production/storage bonus magnitudes | §10.4 | Research |

### 20.4 Promotion checklist

Before implementation depends on any item in this document:

1. Product owner approves or changes each **PROPOSED** rule.
2. Approved rules are promoted into `specs/09-v1-design-lock.md` with the correct `DEFAULT` or `LOCKED` tag.
3. Resolved **TBD** values are promoted with their config key names.
4. This document is updated to remove `PROPOSED` and point at the locked rule.
5. `plan/01-requirements.md` gains or updates acceptance criteria for any newly locked rule.
6. No implementation starts from a `PROPOSED` or `TBD` line.

---

## 21. Quick reference: state transition summary

```
World:      creating -> open -> running -> finished

Phase:      peace -> war -> peace ... -> finished

Player:     pending_spawn -> active -> eliminated -> active
                              |             |
                              |             +-> spectator
                              +-> ai_controlled -> eliminated -> active
                              +-> finished

Province:   neutral -> owned -> rebel -> owned
                       |         |
                       +-> neutral (abandonment)
            refugee -> owned

Army:       garrison -> marching -> resolving -> garrison
                                     |-> destroyed
                        |-> marching (return/recall)
                        |-> destroyed

Battle:     incoming -> locked -> resolving -> resolved
                    |-> cancelled

Build:      queued -> running -> completed
                |         |
                +-> cancelled

Training:   queued -> running -> completed
                |         |
                +-> cancelled

Trade:      open -> accepted
              |-> cancelled
              |-> expired

Alliance:   active -> dissolved
Membership: none -> member -> leader -> none
Invite:     pending -> accepted/declined/expired/cancelled

Support:    stable <-> uneasy <-> unrest <-> serious <-> uprising
Rebellion:  none -> active -> grace -> none
```

---

*End of `plan/03-gameplay-rules.md`.*

