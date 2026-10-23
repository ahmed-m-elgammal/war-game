# Nation Strategy Game: Design Overview

> **Working title: The Succession.** Setting: **Vardania**.
>
> **V1 authority:** see [09-v1-design-lock.md](09-v1-design-lock.md). Where it conflicts with this overview or files `01`–`08`, the v1 lock wins.
>
> **V1 framing:** one country, many factions. Players lead factions/warlord movements inside Vardania, not separate nations. The original vision used separate countries; for v1, “country” means “faction.” V1 worlds are **20–24 human factions + 10–15 AI warlords** on **80–100 provinces**, not 20–50 players.

## One-paragraph pitch

A browser-first, pixel-art strategy game set in **Vardania**, one fictional country in civil war. Players lead **factions/warlord movements**, not separate nations. Each world holds **20–24 human factions plus 10–15 AI warlords** across **80–100 provinces** and runs a **30-day season**. Every day has **18 hours of peace** (build, research, trade, farm AI, form alliances) and **6 hours of war** (live PvP attacks). Factions manage **five resources**, keep their **people's support** high, and march **armies through four tech eras** (WW1 → WW2 → Modern → Advanced). Persistent progression is **cosmetic only**, so PvP stays fair.

## Design pillars

1. **Clear over detailed.** Few numbers, big readable UI, low-res pixel art. If a screen is crowded, cut something.
2. **Three systems, one country.** Economy, politics, and army all affect each other (shortages → unrest → rebels).
3. **Peace builds, war decides.** Peace time is calm and strategic. War time is short and dramatic.
4. **Fair PvP.** No paid power. Persistent unlocks are cosmetic only. New seasons reset power.
5. **Never dead.** AI countries and rebels fill the world so it never feels empty.

## Document index

| File | Contents |
|---|---|
| `AGENTS.md` | Rules for AI agents and teammates working from these docs |
| `01-world-and-seasons.md` | Worlds, seasons, daily cycle, joining, awards, elimination |
| `02-economy.md` | Five resources, production, spending, region levels |
| `03-politics-and-support.md` | Supporters vs Opponents meter, penalties, rebels |
| `04-military-and-eras.md` | Units, infantry skills/weapons, eras, research tree, combat |
| `05-alliances-and-trade.md` | Alliances, betrayal rules, open market, direct offers |
| `06-map-and-art.md` | Map design, region data, pixel-art rules, icon list |
| `07-tech-architecture.md` | Stack, server rules, data model, networking |
| `08-roadmap-and-open-questions.md` | Milestones, defaults to review, open questions (original roadmap) |
| `09-v1-design-lock.md` | **V1 authority:** all locked design decisions, scope, build order, decision log, risks |

## Status legend (used in every file)

- **LOCKED**: decided by the product owner. Do not change without approval.
- **DEFAULT**: a suggested value. Change freely after playtesting.
- **TBD**: not decided yet. Ask before building.

## Decisions at a glance

> **Superseded for v1.** Some rows below reflect the original vision. The authoritative v1 decisions — players per world, faction framing, mobile, revenue, map scale, and more — are in `09-v1-design-lock.md`.

| Area | Decision | Status |
|---|---|---|
| Platform | Browser first, mobile later via Capacitor | LOCKED |
| Players per world | 20-50 humans + AI countries | LOCKED |
| Season length | 30 days | LOCKED |
| Daily cycle | 6 h war, 18 h peace, same window for everyone in a world | LOCKED |
| Attacks | Live; defender auto-resolved by server when offline | LOCKED |
| Resources | Money, Gold, Food, Water, Oil | LOCKED |
| Gold | Trade currency between players | LOCKED |
| Politics | One national Supporters vs Opponents meter, plus small regional modifiers | LOCKED |
| Low support | Penalties first, rebel AI armies if it keeps dropping | LOCKED |
| Units | Fixed types (infantry, tanks, aircraft, missiles), infantry have skills and weapons | LOCKED |
| Troop production | Infantry grows free; advanced units cost resources | LOCKED |
| Progression | Research tree, resources + tier requirements | LOCKED |
| Eras | WW1, WW2, Modern, Advanced; calendar opens each era | LOCKED |
| Alliances | Max 3 players, locked during war | LOCKED |
| Trade | Open market + direct offers | LOCKED |
| Start | 1 region (capital) | LOCKED |
| Elimination | Respawn elsewhere, 30-40% resources lost | LOCKED |
| Late joiners | Placed in a new world that starts fresh | LOCKED |
| Persistent upgrades | Cosmetic only | LOCKED |
| Revenue | Free at launch, cosmetic shop later | LOCKED |
| Map | One map to start, flat low-res pixel look | LOCKED |
| Stack | TypeScript, Phaser 3, Capacitor, Node + Colyseus, PostgreSQL | LOCKED |
| Team | Humans + AI agents | LOCKED |

## Glossary

- **World**: one running game instance with its own map state, players, and 30-day clock.
- **Season**: the 30-day life of a world.
- **Region**: one claimable area of the map. Players start with one (the capital).
- **Capital**: a player's starting region. Special defense bonus.
- **Support**: the national approval meter (Supporters vs Opponents).
- **Era**: a tech tier (WW1, WW2, Modern, Advanced).
- **War window**: the daily 6-hour period when PvP is allowed.
- **AI region / AI country**: server-controlled targets for farming and early expansion.
