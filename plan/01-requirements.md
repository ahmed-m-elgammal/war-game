# 01. Game Requirements and Scope

> **Project:** The Succession
> **Document:** `plan/01-requirements.md`
> **Version:** 1.0 — requirements baseline
> **Date:** 2026-10-23
> **Status:** Draft for product-owner review
> **Authority:** [`specs/09-v1-design-lock.md`](../specs/09-v1-design-lock.md). Where this document and the design lock disagree, the design lock wins.
> **Companions:** [`plan/02-game-design.md`](02-game-design.md) (gameplay design: loop, combat, rewards, UI, outcomes) and [`plan/03-gameplay-rules.md`](03-gameplay-rules.md) (execution rules, state machines, and edge cases).
> **Audience:** Product, design, engineering, QA, art, and operations.

---

## 1. Purpose

This document translates the v1 design lock into a buildable and testable requirements baseline. It defines:

- what the game is and who it is for;
- target devices and the control promise;
- art style and presentation rules;
- offline behavior;
- save and persistence requirements;
- what is explicitly in and out of scope.

It does **not** replace the design lock. Exact rules, numbers, and systems remain in `specs/09-v1-design-lock.md`. This document states the requirements those rules must satisfy.

**Requirement language:**

- **MUST** — required for v1. Failure blocks launch.
- **SHOULD** — expected, but may be deferred with product-owner approval.
- **DEFAULT** — inherited starting value; tune in config and playtests.
- **TBD** — unresolved; do not build a hidden assumption.

**Requirement IDs:** `FR` functional, `NFR` non-functional, `PR` platform, `AR` art, `OFF` offline, `CR` controls, `SR` save.

---

## 2. Product definition

### 2.1 What the game is

**The Succession** is a browser-first, phone-first, pixel-art strategy game set in **Vardania**, one fictional country in civil war. Players lead **factions/warlord movements**, not separate nations. Each world holds **20–24 human factions plus 10–15 AI warlords** across **80–100 provinces** and runs a **30-day season**.

Every day has **18 hours of peace** and **6 hours of war**. Peace is for building, research, trade, training, and taking AI/neutral land. War is the only time PvP attacks are allowed. At the end of day 30, two titles are awarded: **Conqueror** (most provinces) and **Best Nation** (highest score). Power resets every season; identity, titles, and cosmetics persist.

| Fact | v1 requirement |
|---|---|
| Working title | **The Succession** |
| Setting | **Vardania**, fictional civil-war country |
| Genre | Persistent-world, phone-first, pixel-art strategy |
| Players per world | 20–24 human factions + 10–15 AI warlords |
| Provinces per world | 80–100 |
| Refugee provinces | 4–6 reserved, unclaimable normally |
| Starting force | 50 infantry; 500 money, 200 food, 200 water, 50 oil, 0 gold (**DEFAULT**) |
| Season length | 30 days, fixed end |
| Daily cycle | 18h peace / 6h war; war beats: 90m opening, 3h reinforcement, 90m land grab |
| Resources | Money, gold, food, water, oil |
| Eras | WW1, WW2, Modern, Advanced (days 1, 8, 16, 24) |
| Unit types | Infantry, tank, aircraft, missile/artillery |
| Alliances | Max 3, diplomatic/economic, locked in war |
| Trade | Gold-only; market, direct offers, state exchange |
| Victory | Conqueror and Best Nation at day 30 |
| Monetization | $5 season pass + limited cosmetic shop; no pay-to-win |
| Platforms | Mobile web + Capacitor Android/iOS; desktop web secondary |
| Audience | Core strategy players, 16+ |
| Offline | Always online; offline defense only |

### 2.2 Core loop

```
Economy funds the military
        ↓
Military changes the map
        ↓
Map gains and losses move support
        ↓
Support changes income/growth and spawns rebels
        ↓
Rebels force military spending
        ↓
Back to the economy
```

Every system can hurt the other two. Growth is never free.

### 2.3 Session and season shape

- A typical session is **5–20 minutes**: check queues, collect resources, set orders, scout the map, and act during war.
- The **war window is the daily appointment**. Players should want to return for it.
- The **season is the long arc**: 30 days, with era gates on days 8, 16, and 24.
- The game is asynchronous by default. Players do not need to be online at the same time, except to defend live.
- The game is **always online**. There is no offline play, solo campaign, or local save.

### 2.4 What makes it different

1. **One country, many factions.** The map is a civil war, not a lobby of separate nations.
2. **The 18/6 daily cycle.** Peace is safe and productive; war is short, scheduled, and dramatic.
3. **Power resets, identity persists.** A 30-day season is a complete story, not an endless grind.
4. **Phone-first but not shallow.** Five resources, support, eras, alliances, and trade fit a 390px screen.
5. **Fair PvP.** Cosmetics only; no paid power, resources, or pass levels.
6. **No chat, no noise.** Coordination happens externally; the game stays focused on the map.

### 2.5 Game modes and player model

- **Persistent multiplayer worlds** with AI warlords. This is the only game mode in v1.
- **No single-player campaign.**
- **No offline mode.**
- **Multiple worlds** may run at once; a player may join more than one world. **DEFAULT.**
- **One faction per account per world. DEFAULT.**
- **No cross-world transfer of power.** Cosmetics, titles, and entitlements are account-wide; provinces, armies, resources, and research are per world.

### 2.6 Monetization

- **$5 season pass**, free and premium tracks, identity cosmetics only. **DEFAULT:** account-wide rolling 30-day term from purchase; it may cross a season boundary and is configurable for playtests.
- **Limited cosmetic shop**, identity cosmetics only, direct purchase, no premium currency, no loot boxes.
- **No pay-to-win.** Nothing purchasable may affect provinces, armies, resources, research, support, combat, or pass levels.

### 2.7 Success metrics — DEFAULT

The three headline outcomes are **new-player understanding/return**, **war-window return**, and **day-30 season completion**.

| Metric | Target |
|---|---|
| New players who capture within 15 minutes | 80% |
| Day-2 return | 40% |
| Active players who join at least one war window per week | 50% |
| Players active on day 30 | 30% |
| World uptime / latency | 99.5% / <200ms intent round-trip |

---

## 3. Audience

### 3.1 Primary audience

**Core strategy players, 16+.**

They:

- enjoy Risk, Civilization-style systems, board-game economies, and classic browser strategy;
- like planning, map reading, and trade-offs more than reflex or twitch play;
- accept a daily check-in rhythm and a 30-day commitment;
- play on a phone but expect real depth;
- want competition without pay-to-win;
- are comfortable with external coordination (Discord or similar) because v1 has no in-game chat.

### 3.2 Secondary audiences

- **Friend groups and small communities** who want a shared 30-day civil-war story.
- **Lapsed browser-strategy players** who want a modern, fair, phone-friendly version of the genre.
- **Board-game groups** who want an asynchronous map game between sessions.

### 3.3 Not for

- Children under 16.
- Players seeking instant matches, twitch combat, or a solo/offline campaign.
- Players who require in-game global chat or a social hub.
- Players who expect pay-to-win acceleration.
- Players who want a console/VR/gamepad experience.

### 3.4 Age rating and content

- **Target: 16+.**
- War theme, abstract pixel combat, no gore.
- No real countries, leaders, parties, or political content.
- Online interactions and purchases are present.
- **Final ESRB/PEGI/Apple/Google rating: TBD.** The 16+ target is a product requirement, not a legal rating.

### 3.5 Accessibility baseline

- Colorblind-safe encoding: shapes and patterns, not color alone.
- Minimum touch target: **44px** (DEFAULT).
- Readable at **390px** width.
- No hover-only actions.
- Keyboard focus visible on desktop.
- Full WCAG 2.1 AA audit: **TBD**; not a v1 launch claim.

---

## 4. Platforms and target devices

### 4.1 Platform matrix

| ID | Platform | Priority | Requirement |
|---|---|---|---|
| PR-001 | Mobile web (iOS Safari, Android Chrome) | **Primary** | Playable in portrait at 390px CSS width; touch-first |
| PR-002 | Capacitor Android app | **Primary** | Native build; safe areas; platform IAP |
| PR-003 | Capacitor iOS app | **Primary** | Native build; safe areas; platform IAP |
| PR-004 | Desktop web (Chrome, Edge, Firefox, Safari) | **Secondary** | Mouse + keyboard supported; 1280×720+ |
| PR-005 | Tablet web | **Opportunistic** | Uses the responsive phone/desktop layout; no dedicated tablet UI in v1 |
| PR-006 | Console, VR, gamepad | **Out** | Not supported in v1 |

- **Browser support:** current and previous major versions of Chrome, Edge, Firefox, and Safari. **Exact minimum versions: TBD.**
- **Mobile OS support:** exact iOS/Android minimums **TBD**; target devices from the last four years.
- **Orientation:** **portrait-first** on phones. Mobile landscape support is **TBD**.
- **Safe areas:** notches, rounded corners, and home indicators must not cover controls or critical numbers.

### 4.2 Performance targets — DEFAULT

| Metric | Target |
|---|---|
| Client frame rate | 60fps target on mid-range 2022+ phones |
| Intent round-trip | <200ms under normal load |
| World uptime | 99.5% |
| Concurrent worlds per small VPS | 3–5, load-tested |
| Cold load | Playable map within 5 seconds on a good connection |
| Reconnect | Restore current state without a full-page reload |

### 4.3 Network requirements

- **Always online.** Internet required for all play.
- Minimum practical connection: 4G or stable broadband. **DEFAULT.**
- No offline gameplay, no local authoritative simulation.
- Graceful reconnect with a clear “reconnecting” state.
- If the connection drops during an action, the server resolves the action by its own rules; the client reconciles on reconnect.

---

## 5. Art style and presentation requirements

### 5.1 Visual direction — field map / war room

The game looks like a **physical command map**: warm paper, ink borders, stamped labels, chunky province colors, NATO-ish unit symbols, and big numbers. A subtle terminal/CRT accent is reserved for the war clock and alert states.

| ID | Requirement | Acceptance criteria |
|---|---|---|
| AR-001 | Field-map / war-room direction | Map reads as paper/ink, not a generic dashboard; war clock has a distinct terminal accent |
| AR-002 | 16-color palette | No more than 16 base colors per screen; faction, AI, neutral, and alert colors are distinct |
| AR-003 | Low-res pixel art | Low-res mask (target 320×180); nearest-neighbor scaling; no anti-aliasing |
| AR-004 | Icon set | ~29 icons: 5 resources, 16 unit icons (4 types × 4 eras), 8 UI icons |
| AR-005 | Big numbers, few numbers | Province and resource panels show only decision-critical numbers |
| AR-006 | Colorblind-safe | Ownership, alerts, and unit types use shape/pattern as well as color |
| AR-007 | Curated identity | Faction emblems and flags are preset; no user-uploaded images |
| AR-008 | No gore, no real politics | Abstract pixel units; invented names; no real flags, leaders, or parties |

### 5.2 UI rules

- Phone-first, 390px baseline; safe areas respected.
- The **war clock, support meter, and five resources are always visible** on the map; the clock shows peace/war state and time to transition.
- Primary navigation is **Research, Trade, Alliance, Army, Pass**.
- Icons first, text second.
- One modal layer at a time; the map remains context.
- Destructive actions require confirmation.
- Loading, error, empty, and offline states are designed.
- The war window is the loudest state on the screen.

### 5.3 Audio — DEFAULT

- Minimal cues: UI clicks, march drums, battle impacts, war-window horn, ambient map loop.
- No full music/orchestral score in v1; licensed music is out of scope.
- Audio must be mutable and must not autoplay before user interaction.

### 5.4 Content rules

- No real country, leader, party, or weapon names.
- No real-world political content.
- No gore or graphic violence.
- Faction names pass a profanity filter; emblems are curated presets.

---

## 6. Offline requirements

**Confirmed direction: always online; offline defense only.**

| ID | Requirement | Acceptance criteria |
|---|---|---|
| OFF-001 | No offline gameplay | Without a network connection, the player can see a reconnect screen but cannot issue or resolve game actions |
| OFF-002 | Server continues simulation | Production, upkeep, build/training timers, support, marches, and era gates continue while the player is offline |
| OFF-003 | Offline defense | If a player is attacked while offline, the server auto-resolves defense with the **+15% offline defense bonus** |
| OFF-004 | Reconnect restores state | On reconnect, the client receives the current server state; no local state overwrites the server |
| OFF-005 | No local authority | The client cannot create resources, units, captures, trades, or purchases while disconnected |
| OFF-006 | Notifications are not a gameplay dependency | The in-game war clock is authoritative; push notifications are out of v1; email reminders are removed |
| OFF-007 | Abandonment | 5 days inactive → the faction is AI-controlled; returning player respawns like an eliminated player |
| OFF-008 | Start protection | A new player has 24h protection; offline status does not extend it |

**Consequence:** a player can lose a province while offline. That is intended. The 24h start protection and the 18h peace window are the safety valves.

---

## 7. Controls

**Confirmed direction: phone-first; touch primary, mouse/keyboard supported on desktop; no gamepad.**

### 7.1 Touch

| ID | Requirement | Acceptance criteria |
|---|---|---|
| CR-001 | Tap to select | Tapping a province opens its panel; tapping an action executes or opens confirmation |
| CR-002 | No hover dependency | Every action and tooltip is reachable by tap, not hover |
| CR-003 | Large targets | Interactive targets are at least 44×44px (DEFAULT) |
| CR-004 | No precision gestures | No pinch, multi-touch, or drag gesture is required to complete a core action |
| CR-005 | Scrollable panels | Long lists scroll; the map remains reachable |
| CR-006 | Confirm destructive actions | Attack, leave alliance, purchase, and abandon require explicit confirmation |

### 7.2 Mouse and keyboard

| ID | Requirement | Acceptance criteria |
|---|---|---|
| CR-007 | Mouse parity | Every touch action is available with a mouse click |
| CR-008 | Keyboard access | Primary screens and actions are reachable by keyboard; focus is visible |
| CR-009 | Escape closes | `Esc` closes the top modal or cancels the current selection |
| CR-010 | Text input | Faction and display-name fields use standard text input and validation; social sign-in is handled by the provider UI |
| CR-011 | Shortcut map | Exact keyboard shortcuts are **TBD**; the requirement is that no core action is mouse-only |

### 7.3 Input rules

- The game must be fully playable at 390px width with touch only.
- Desktop is a supported secondary experience, not a separate game.
- No gamepad, console, or VR controls in v1.
- Map pan/zoom is **not required** in v1; the map must be usable as a fitted view. If playtests show crowding, pan/zoom can be added later. **DEFAULT.**

---

## 8. Save requirements

### 8.1 Authority and model

| ID | Requirement | Acceptance criteria |
|---|---|---|
| SR-001 | Server-authoritative saves | All faction, world, army, resource, research, alliance, trade, pass, and purchase state lives on the server |
| SR-002 | Autosave | State is persisted continuously through server ticks; snapshots every 60 seconds and on key events |
| SR-003 | No manual save slots | There is no save/load menu; the world is always live |
| SR-004 | No offline saves | The client does not store an authoritative save; local storage is limited to token, settings, and cache |
| SR-005 | Crash recovery | On restart, the server reloads the latest snapshot and safe events without duplicating resources, units, or purchases |

### 8.2 Accounts and identity

| ID | Requirement | Acceptance criteria |
|---|---|---|
| SR-006 | Guest first | A new player can start with a guest account and a persistent device token |
| SR-007 | Social link | A guest can link a Google or Apple identity; this enables cross-device login, season rewards, history, and purchases |
| SR-008 | Guest risk is explicit | The UI warns that clearing browser storage without linking a social identity loses the account |
| SR-009 | Linking gate | End-of-season titles, season history, cross-device access, and purchases require a linked Google or Apple identity |
| SR-010 | One faction per world | One account has at most one faction per world; multiple worlds are allowed. **DEFAULT.** |

### 8.3 What persists

- Account identity, linked social identity, guest token.
- Faction name, emblem preset, color.
- Titles, season history, cosmetics, pass entitlements, shop entitlements.
- Settings and accessibility preferences.
- Purchase receipts and entitlement state.

### 8.4 What resets each season

- Provinces, armies, resources, research, support, alliances, market state, and world rank.
- Power does not transfer between worlds or seasons.
- Cosmetics and titles are the only permanent progression.

### 8.5 Backup and recovery

- Daily database backups; restore tested before launch.
- Snapshot recovery drill before launch.
- Trade, purchase, and entitlement changes are audit-logged.
- Account deletion and data export: **TBD/legal**, required before public launch.

### 8.6 What is not saved

- No local save file.
- No cloud save slot selection.
- No offline progress authored by the client.
- No cross-world army/resource transfer.

---

## 9. Scope

### 9.1 In scope for v1

- Full **30-day seasons**; multiple rolling worlds; world list.
- **20–24 human factions + 10–15 AI warlords**; **80–100 provinces**; Vardania.
- Economy, support/rebels, PvP war window, defender/attacker agency, elimination/respawn.
- Research/eras, advanced units, alliances, trade, **special abilities**.
- **$5 season pass + limited cosmetic shop.**
- **Guest first, Google/Apple link**; **Android/iOS Capacitor builds**.
- Field-map art direction; phone-first UI; colorblind-safe.
- Server-authoritative saves; PostgreSQL; snapshots; time-travel and bot tests.
- Admin/moderation tools for names, emblems, reports, and renames.
- Metrics instrumentation for the three success targets.

### 9.2 Explicitly out of scope

- Global chat, voice, emotes, pings, or an in-game social hub.
- Multiple maps; the only map is Vardania.
- Naval units, islands requiring transport, or terrain combat modifiers.
- Fog of war and scouting; exact enemy troop counts.
- Tactical battle minigames or real-time control of battles; combat resolves on arrival.
- Alliance stationing, joint attacks, shared victory, or an alliance award.
- Player-created worlds; advanced AI diplomacy.
- Localization beyond English.
- Cosmetic marketplace/trading; premium currency; loot boxes.
- User-uploaded images, avatars, or free-text chat.
- Full music/orchestral audio.
- Public-scale infrastructure beyond the initial VPS capacity; scale after load tests.
- Offline play, solo campaign, or local saves.
- Gamepad, console, or VR support.
- Push notifications and email reminders.
- Cross-world transfer of power or resources.
- Pay-to-win of any kind.
- Real-world politics, countries, leaders, or weapon names.

### 9.3 Conditional scope and risk

V1 is **Beta-level scope**: multiple worlds, pass, shop, mobile, and abilities. The design lock recommends a deferral order if the schedule slips:

1. Mobile app.
2. Cosmetic shop.
3. Special abilities.

The core season, war window, economy, support, research, alliances, trade, and pass are the last things to cut. **Any deferral requires product-owner approval.** This document treats all three as in scope.

---

## 10. Functional requirements

> All requirements are **MUST** unless marked otherwise. “Source” points to the design-lock section.

### 10.1 World, season, and map

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| FR-001 | Create persistent worlds with 20–24 human factions, 10–15 AI warlords, and 80–100 provinces; run each for 30 days | A world can be created with valid counts; every faction spawns; the day counter advances; state survives a server restart | §5.1–5.2 |
| FR-002 | Award **Conqueror** (most provinces) and **Best Nation** (highest score) at day 30; never end a season early | At day 30 both titles are assigned; a dominant faction does not trigger an early end; a recap is available | §5.2 |
| FR-003 | Enforce 18h peace / 6h war and expose the three war beats (90m opening, 3h reinforcement/counterattack, 90m land grab); PvP attacks only launch and arrive inside the war window; AI attacks players only during war | The window is fixed per world and identical for all factions; the war clock shows the current beat; PvP intent outside the window is rejected; a late-arriving attack is blocked or warned; AI attacks on players occur only in war; AI/neutral attacks work anytime | §5.3, §12.3 |
| FR-004 | Provide a world list (`open`, `running`, `finished`) and rolling auto-created worlds with a 3-day join window | The list shows day, players, war window, and status; joining is blocked after day 3; a new world opens when the current open one fills or closes; late joiners can pre-register | §5.1, §13.1 |
| FR-005 | Eliminate players with no provinces; respawn them in a reserved refugee province (4–6 per world) with 35% resource loss, research retained, army lost, and 24h protection | Elimination triggers; respawn is away from the attacker; resources fall by 35%; research remains; protection applies; fallback to neutral/AI province; spectator if none | §5.4 |
| FR-006 | Capture provinces fully, drop their level by 1, apply capital-capture effects, and allow one voluntary capital relocation per season in peace for a cost (**DEFAULT**) | Ownership changes; level drops to a minimum of 1; capital capture gives +5 support, a **Capital Breaker** cosmetic mark, and capped loot; defender loses 5 support and moves capital or is eliminated (no loot on elimination); the new capital gets capital bonuses; voluntary relocation works once and returns a refugee province to the pool | §5.4–5.5 |
| FR-007 | Implement Vardania as one contiguous landmass with 80–100 provinces, adjacency, no navy, and visual-only terrain | Every province is land-reachable; no naval actions exist; terrain has no combat effect; the map loads at the target resolution | §5.1, §6.1 |
| FR-008 | Assign spaced random capitals with food and water within 2 hops, an adjacent weak neutral target, and no adjacent player capital | The generator validates every capital; invalid maps are rejected or regenerated; every player has a legal first target | §6.2 |
| FR-009 | Show province owner, resource, level, troops, capital status, protection, and warnings; exact own/allied counts and approximate enemy bands | The province panel matches server state; enemy counts are bands; own/allied counts are exact; capital/protection icons appear; no fog of war | §6.3, §13.2 |

### 10.2 Economy

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| FR-010 | Implement money, gold, food, water, and oil with production, storage, capital money production, and a 1-minute tick | Production matches config; storage caps apply (DEFAULT: 500 × provinces owned per resource); the capital produces money; resources never go negative; ticks run every minute | §7.1–7.2 |
| FR-011 | Deduct food, water, and money upkeep; use oil for training/operations; warn before shortages; apply the correct penalties | Upkeep is deducted each tick; warnings precede penalties; food/water shortages apply support and production penalties; units do not vanish immediately | §7.3 |
| FR-012 | Implement province levels 1–5 with troop caps, production multipliers, fortification, upgrade costs, and build times | Upgrades deduct resources, start a timer, complete, and apply level/fortification/cap; cancel refunds 50% (**DEFAULT**); capital and non-capital resource costs differ | §7.4 |
| FR-013 | Provide one national build queue and one national training queue; both timed and offline-safe; instant research | Orders queue and complete while offline; research unlocks instantly on payment; queue slots can be upgraded; timers are visible | §7.5, §10.1 |
| FR-014 | Provide an open market, direct offers, gold-only pricing, 5% tax, daily limits, minimum account age, state exchange, and tax-free ally trades | Trades validate resources and gold, apply tax, respect limits and account age, and are logged; the state exchange always has prices; ally direct trades are tax-free | §7.7, §11.2 |
| FR-015 | Implement support 0–100 starting at 60, thresholds 60/40/25/15, penalties, drivers, regional/one-time events, and no combat effect | Support updates each tick and on events; threshold penalties apply; capital events count ×3; the combat formula does not include support | §8.1–8.2 |
| FR-016 | Implement rebels: one active rebellion below 15, spawn in the weakest province, no new group until defeated +2h grace, take one province and hold, +0.5 support on defeat, era scaling | One rebellion at a time; no spawn during active/grace; rebel capture becomes neutral and drops the province level by 1 (minimum 1, unless it triggers elimination); defeat grants support; rebels do not expand | §8.3 |

### 10.3 Military

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| FR-017 | Implement infantry, tank, aircraft, and missile/artillery (Era 1: artillery; Era 2+: missiles); free infantry growth; advanced unit training; counters; era unlocks; national doctrine (changeable in peace for a cost; **DEFAULT**) | Units grow/train per rules; counters apply; advanced units are blocked without resources/era; one weapon and one skill are active nationally; doctrine changes are peace-only; missiles/artillery do region damage, not normal unit combat | §9.1–9.3 |
| FR-018 | Resolve combat with the power formula: stats, era, counters, skill, fortification/capital/offline, additive cap +75%; loser loses all, winner loses proportionally; capture on zero garrison | Battle result matches the formula; the report lists factors; the cap is enforced; capture changes owner; the surviving army stays | §9.4 |
| FR-019 | Give the defender an incoming-attack panel and reinforce/retreat/hold actions; allow attacker recall with a 10% penalty; resolve offline defense with +15% | Defender can act before arrival; one reinforcement per incoming attack; retreat cedes the province and saves troops; hold fights; recall costs 10% of the force or the oil cost; offline defense applies +15% | §9.6 |
| FR-020 | Enforce march speeds, aircraft/missile ranges, slowest-stack speed, PvP arrival window, 20-minute battle fatigue, split/merge in owned provinces, and army location after capture | Timers and ranges match config; combined stacks use the slowest speed; fatigue blocks repeat attacks; split/merge works only in owned provinces; the army stays in the captured province | §9.5 |
| FR-021 | Implement Mobilization, Airstrike, and Missile Strike with costs, cooldowns, era gates, war-only use, and province targets | Abilities are unavailable in peace, on cooldown, or in the wrong era; costs are deducted; effects apply; cooldowns start | §9.7 |

### 10.4 Research, alliances, AI, and meta

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| FR-022 | Implement four eras at days 1/8/16/24, a 3-of-5 main-tech gate, paid instant research, side branches, no research queue, no tech stealing, and no catch-up discount | Eras open on schedule; the gate blocks the next era until 3 of 5 are owned; research deducts the configured cost and unlocks instantly; no research queue, steal, or catch-up exists; effects apply | §10 |
| FR-023 | Implement max-3 alliances: peace-only formation, war lock, leave −5 support and 24h cooldown, shared vision, tax-free direct trade, shared color; membership persists through elimination (**DEFAULT**); abandoned players are removed; no stationing, joint attacks, or chat | Invite/accept works only in peace; war locks membership; leaving applies −5 support and a 24h cooldown on joining a new alliance and attacking ex-allies; allies see exact armies and trade tax-free; eliminated members remain; abandoned players leave; no shared army actions exist | §11 |
| FR-024 | Implement 10–15 AI warlords with archetypes, era scaling, player attacks only in war, no awards, no respawn, and no attacks on protected or refugee players (**DEFAULT**) | AI acts per archetype; no AI attacks on players in peace; AI scales at era days; protected/refugee players are safe from AI; eliminated AI stays gone | §12 |
| FR-025 | Onboard a guest into an open world with a tutorial, starting force/resources, a first capture in 5-10 minutes, and a Google/Apple link prompt after the first session | A guest joins with 50 infantry and the configured starting stockpile (**DEFAULT:** 500 money / 200 food / 200 water / 50 oil / 0 gold); tutorial steps appear; 80% of new guests capture within 15 minutes (target 5–10); the link prompt appears; rewards/purchases are gated | §13.1, §22.2 |
| FR-026 | Link a guest account to Google or Apple; enable cross-device login; require linking for rewards, history, and purchases; warn about guest loss | Linking works; cross-device login works; the gates are enforced; the guest-risk warning is shown | §13.1, §15.5 |
| FR-027 | Provide a season recap, leaderboard, personal stats, titles, next-world link, and persistent profile history | The recap appears at day 30; titles are assigned; the profile persists across seasons; the next-world link works | §5.2, §13.2 |
| FR-028 | Provide the $5 season pass: free/premium tracks, hybrid XP, missions, 20-30 identity cosmetics, configured term (**DEFAULT:** rolling 30 days from purchase, account-wide), mid-season retroactive premium claims, no level buying, auto-claim | Purchase unlocks premium; XP is earned from play/missions; mid-season buyers receive already-earned premium rewards; rewards claim; expiry matches the configured term; no power is granted | §14.2 |
| FR-029 | Provide the limited cosmetic shop: identity cosmetics, direct purchase, account-wide and permanent, no premium currency, no loot boxes, no pass-exclusive overlap | The catalog loads; purchase grants a permanent entitlement; entitlements sync; items have no gameplay effect | §14.3 |
| FR-030 | Ship Capacitor Android/iOS builds with safe areas, touch controls, and platform IAP; the web storefront is read-only; entitlements sync cross-platform | Builds install and run; safe areas are respected; IAP works; entitlements sync; store requirements pass | §14.4, §15.7 |
| FR-031 | Provide moderation tools for faction names, curated emblems, reports, and renames | The profanity filter runs; reports are recorded; renames are possible; admin actions are logged; no chat exists | §15.6 |
| FR-032 | Instrument the success metrics: first capture, day-2 return, war-window participation, day-30 active, uptime, latency | Events are logged; a dashboard shows the metrics; no PII is collected beyond policy | §22.2 |
| FR-033 | Enforce server authority and anti-abuse on every action | The client cannot change state; rate limits apply; trades are logged; alt-account flags exist; no client-trusted resources/cooldowns | §15.2, §15.6 |

---

## 11. Non-functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| NFR-001 | **Performance:** target 60fps on a mid-range 2022+ phone; intent round-trip under 200ms under normal load; map playable within 5 seconds on a good connection | Frame-rate and latency budgets are measured on a reference device; regressions block release |
| NFR-002 | **Reliability:** 99.5% world uptime; snapshots every 60 seconds and on key events; daily backups | A restore drill succeeds before launch; a killed server resumes without duplicate resources, units, or purchases |
| NFR-003 | **Security:** server-authoritative state; rate limits on actions; secrets outside the client; no client-trusted resources, cooldowns, or combat results | A client-tampering test cannot create value; abusive request bursts are throttled; secrets are not in the bundle |
| NFR-004 | **Data integrity:** resource, trade, upgrade, battle, pass, and purchase changes are transactional and idempotent | Repeated requests do not double-apply; trade and purchase audit logs reconcile |
| NFR-005 | **Accessibility:** colorblind-safe shapes/patterns; 44px touch targets; readable contrast at 390px; no hover-only actions; visible keyboard focus | An accessibility checklist passes; a colorblind review covers map ownership and alerts |
| NFR-006 | **Compatibility:** current and previous major Chrome, Edge, Firefox, and Safari; iOS/Android Capacitor builds; 390px phone baseline; 1280×720+ desktop | A device/browser matrix passes; safe areas do not obscure controls on notched phones |
| NFR-007 | **Localization:** English only in v1; user-facing strings are externalized so translation is possible later | No hard-coded user-facing strings in components; a string table exists |
| NFR-008 | **Observability:** structured logs, error tracking, uptime/latency metrics, and alerts for world failures and payment errors | A staging incident can be traced from alert to log to the affected world |
| NFR-009 | **Privacy and legal:** 16+ content target; terms, privacy policy, refund policy, tax handling, age rating, account deletion, and data export before public launch | Legal review signs off; store privacy labels match actual data collection |
| NFR-010 | **Fairness:** purchases are cosmetic/identity only; no paid resources, power, research, support, pass levels, or combat advantage; no loot boxes or premium currency | A purchase audit shows no gameplay effect; the shop and pass contain only identity items |
| NFR-011 | **Moderation and safety:** profanity-filtered faction names; curated emblems; report and rename flow; no chat or user-uploaded images | Offensive names/emblems can be reported and renamed; no free-text social surface exists |
| NFR-012 | **Maintainability:** TypeScript end-to-end; game numbers in config, not hard-coded; server logic separated from UI | A balance change can ship without a client rewrite; config is validated at load |
| NFR-013 | **Testing:** unit, integration, bot, time-travel, and load tests cover economy, combat, support, trades, season end, and purchases | The test suite runs in CI; a full 30-day season can be simulated quickly |
| NFR-014 | **Mobile store compliance:** platform IAP on Android/iOS; privacy labels; age rating; no external checkout link in the app where prohibited | Both store submissions pass review; mobile purchases reconcile through RevenueCat; the web storefront has no checkout |
| NFR-015 | **Scalability:** multiple isolated worlds; 3–5 worlds per small VPS at target load; horizontal growth without cross-world state leaks | A load test covers the target world count; one world cannot read or mutate another world’s state |
| NFR-016 | **Time authority:** server time (UTC) governs season days, war windows, era gates, queues, cooldowns, and protection; the client only displays time | Time-travel tests prove gates and windows use server time; changing the device clock cannot change game state |

---

## 12. Launch acceptance criteria

A v1 launch candidate is accepted only when all of the following are true.

### 12.1 Player journey

- [ ] A new guest can join an open world and complete a first capture: **target 5–10 minutes**, success gate **80% within 15 minutes**.
- [ ] The tutorial explains production, upkeep, training, attack, and the war window without requiring chat.
- [ ] The guest is prompted to link Google or Apple after the first session; the risk of losing a guest account is explicit.
- [ ] A linked account can log in on a second device and resume the same faction.
- [ ] A player can find the world list, join window, war clock, support, research, alliance, trade, pass, and shop from the phone UI.

### 12.2 Season and systems

- [ ] A full **30-day season** can be simulated end-to-end and awards **Conqueror** and **Best Nation** at day 30.
- [ ] PvP attacks are blocked outside the war window; attacks that would arrive late are blocked or warned.
- [ ] AI warlords act during peace and war, but attack players only during war.
- [ ] Economy, upkeep, shortages, province upgrades, build/training queues, and instant research match the design lock.
- [ ] Support thresholds, one active rebellion, grace period, and rebel capture work.
- [ ] Combat, counters, fortification/capital/offline bonuses, the +75% cap, defender agency, recall penalty, and capture work.
- [ ] All four eras open on days 1/8/16/24 and the 3-of-5 gate blocks the next era correctly.
- [ ] Alliances enforce max 3, peace-only formation, war lock, leave penalty/cooldown, shared vision, and tax-free ally trade.
- [ ] Capital relocation, alliance membership on elimination, and AI protection of new/refugee players work.
- [ ] Trade tax, daily limits, account-age gate, state exchange, and audit logs work.
- [ ] Mobilization, Airstrike, and Missile Strike are war-only, era-gated, costed, and cooled down.
- [ ] Elimination, refugee respawn, 35% resource loss, research retention, 24h protection, and AI takeover after 5 days of inactivity function correctly.

### 12.3 Meta, money, and platforms

- [ ] The $5 pass grants free/premium tracks, XP, missions, and identity cosmetics for the configured term (**DEFAULT:** rolling 30 days from purchase); it grants no power.
- [ ] The cosmetic shop sells identity items only; purchases are account-wide and sync across web and mobile.
- [ ] Android and iOS Capacitor builds install, respect safe areas, use platform IAP, and pass store review.
- [ ] The web storefront is fully browsable with no checkout; mobile IAP entitlements reconcile across platforms.
- [ ] Names, emblems, reports, and renames have moderation coverage.
- [ ] Metrics for first capture, day-2 return, war-window participation, day-30 active, uptime, and latency are live.

### 12.4 Quality gates

- [ ] Reference-device performance meets NFR-001.
- [ ] Restore drill and load test meet NFR-002 and NFR-015.
- [ ] No open P0 or P1 defects.
- [ ] Unit, integration, bot, time-travel, and load suites pass in CI.
- [ ] 390px phone layout, desktop layout, and notched-phone safe areas pass visual QA.
- [ ] Colorblind, touch-target, contrast, and keyboard-focus checks pass.
- [ ] Terms, privacy, refunds, tax, age rating, deletion, and export are ready for the launch jurisdiction.
- [ ] The out-of-scope list in §9.2 is still accurate; any addition has product-owner approval.

---

## 13. Confirmed decisions and open questions

### 13.1 Confirmed for this requirements baseline

| Decision | Value |
|---|---|
| Audience | Core strategy players, **16+** |
| Offline model | **Always online; offline defense only** |
| Device/control promise | **Phone-first; touch + mouse/keyboard; no gamepad** |
| Requirements format | **Formal IDs and acceptance criteria** |
| Season | 30 days, fixed end |
| World size | 20–24 humans + 10–15 AI; 80–100 provinces |
| Daily cycle | 18h peace / 6h war |
| Victory | Conqueror and Best Nation at day 30 |
| Monetization | $5 pass + limited cosmetic shop; cosmetics only |
| Pass term | Account-wide rolling 30 days from purchase, **DEFAULT**; may cross a season boundary; tune after playtests |
| Accounts | One faction per world; multiple worlds allowed |
| V1 extras | Special abilities, cosmetic shop, mobile builds |
| Chat | None in v1 |

### 13.2 Open questions and TBDs

These are intentionally not decided by this document. Do not silently pick a value.

| Area | Open question | Owner |
|---|---|---|
| Platforms | Exact minimum iOS, Android, and browser versions | Engineering |
| Platforms | Mobile landscape support and tablet layout | Design/engineering |
| Map | Validate fit-to-width at 390px; pan/zoom is optional and approved | Design/engineering |
| Season | War-window start time per world | Product/ops |
| Controls | Exact keyboard shortcut map | Design |
| Accessibility | Confirm the 44px touch-target baseline and whether to claim WCAG 2.1 AA | Product/design |
| Legal | Launch jurisdiction, entity, terms, privacy, refunds, tax | Legal/business |
| Age rating | Final ESRB/PEGI/Apple/Google rating | Product/legal |
| Payments | RevenueCat configuration and mobile IAP product IDs; no Stripe | Engineering/business |
| Balance | Exact production, costs, combat, ability cooldowns, pass XP, score constants | Design |
| Content | Pass cosmetic list and shop catalog | Art/product |
| Naming | Trademark/search clearance for **The Succession** | Business/legal |
| Lore | Vardania region names, faction names, emblem set | Narrative/art |
| Infrastructure | EC2 region/size/OS, domain names, backup RPO/RTO, and container registry; Sentry is the only observability vendor | Engineering |
| Delivery | Team capacity, timeline, and budget | Product |
| Data | Account deletion and export workflow | Legal/engineering |

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **World** | One persistent 30-day Vardania map with its own factions, provinces, and ranking |
| **Faction** | A player’s warlord movement within a world; the unit of ownership and progression |
| **Province** | A map tile with an owner, resource, level, garrison, and fortification |
| **Season** | The fixed 30-day arc of a world, ending in two awards |
| **Peace** | The 18-hour daily window for building, research, trade, and AI/neutral attacks |
| **War** | The 6-hour daily window when PvP attacks are allowed |
| **Support** | A 0–100 measure of a faction’s internal legitimacy; affects income/growth and can spawn rebels |
| **Era** | One of four technology ages, opening on days 1, 8, 16, and 24 |
| **Pass** | The $5 free/premium cosmetic progression track; **DEFAULT:** account-wide rolling 30 days from purchase |
| **Identity cosmetic** | A cosmetic that changes nameplate, emblem, flag, map skin, or profile presentation; never power |
| **Server time** | UTC time used for seasons, war windows, era gates, queues, cooldowns, and protection |
| **Offline defense** | Server auto-resolution of a defense while the defender is disconnected, with a +15% bonus |
| **Refugee province** | One of 4–6 reserved respawn locations outside the normal capital contest |
| **Conqueror** | End-of-season title for the faction holding the most provinces |
| **Best Nation** | End-of-season title for the faction with the highest score |

---

*End of `01-requirements.md`. Next planning document: implementation plan derived from §17 of the design lock.*

