# 07. Tech Architecture

## Stack (LOCKED)

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Client | Phaser 3 (pixel art mode) in the browser |
| Mobile | Capacitor wraps the same web build as an Android and iOS app |
| Game server | Node.js + Colyseus (WebSockets, state sync) |
| Database | PostgreSQL |
| Hosting | One small VPS to start |

## Golden rule: the server decides everything (LOCKED)

- All game logic runs on the server: combat, production, trades, research, timing, elimination.
- The client only **displays state** and **sends intents** (for example: "send 40 troops from region 12 to region 15").
- The server validates every intent (owner, range, resources, phase).
- Never trust the client for resources, troops, or time.

## Server structure

```
server/
  rooms/WorldRoom.ts        # one Colyseus room per world
  systems/
    economy.ts              # production, upkeep, storage
    support.ts              # support meter, penalties, rebels
    combat.ts               # march, battle, capture
    research.ts             # tech tree rules
    alliances.ts            # invites, locks, cooldowns
    market.ts               # listings, offers, tax, limits
    clock.ts                # peace/war windows, season day, era gates
    ai.ts                   # AI countries and rebels
  config/                   # ALL numbers live here (JSON/TS)
  db/                       # PostgreSQL access
client/
  scenes/                   # Phaser scenes (Map, UI)
  ui/                       # panels, bars, market, research
  net/                      # Colyseus client
shared/
  types.ts                  # shared types between client and server
```

## One room per world

- Each world is one Colyseus room with its own season clock.
- The room keeps the live state in memory and **saves snapshots to PostgreSQL** regularly (default every 60 seconds) and on every important event (capture, trade, elimination). **DEFAULT**
- On server restart, the world reloads from the last snapshot.

## Time model

| Item | Default |
|---|---|
| Server tick for economy/support | Every 1 minute |
| Combat/march update | Every 1 second while marches exist |
| Time source | Server time (UTC) only |
| Phase check | Each tick: is `now` inside the world's 6-hour war window? |
| Era check | Each tick: has the season day reached the era's opening day? |

## Offline handling

- No code runs on the player's device while they are away. The server keeps ticking.
- Offline defense is calculated by the server when an attack arrives (see `04-military-and-eras.md`).
- Push notifications for attacks are a later feature (TBD).

## Data model (PostgreSQL)

| Table | Key fields |
|---|---|
| `accounts` | id, email/login, created_at, cosmetics, titles, season_history |
| `worlds` | id, name, start_time, war_window_start, status, max_players |
| `countries` | id, world_id, account_id, name, flag, support, resources (money, gold, food, water, oil), research, alliance_id, protection_until |
| `regions` | id, world_id, owner_id, resource_type, level, troops, is_capital |
| `armies` | id, world_id, owner_id, from_region, to_region, units, depart_time, arrive_time |
| `alliances` | id, world_id, name, members, locked_until |
| `market_listings` | id, world_id, seller_id, resource, amount, price_gold, created_at |
| `trade_log` | id, world_id, from_id, to_id, resource, amount, gold, time |
| `season_results` | id, world_id, account_id, regions, score, awards |

Cosmetic slots (flag, skin, title) exist from day 1 so the shop can be added later. **LOCKED**

## Security and fairness

- Server-authoritative logic (see golden rule).
- Rate limit every intent.
- Log all trades. Flag alt-account patterns (see `05-alliances-and-trade.md`).
- Accounts: email login first; social login later (TBD).
- No paid power. Nothing sold can affect combat or economy. **LOCKED**

## Mobile with Capacitor

1. Build the web client.
2. Add Capacitor (`@capacitor/core`, `@capacitor/cli`), then add Android and iOS platforms.
3. Use `npx cap copy` to copy web assets into the native projects.
4. Add touch controls, safe-area support, and responsive resizing from the start of the web client, so mobile is an easy next step.
5. Test on a phone-sized screen (390 px wide) during all web development.

## Testing

- Unit tests for every system's core rule (production, support thresholds, combat power, alliance locks, trade limits).
- A **bot client** that connects to a world and plays randomly, to test load and edge cases.
- A **time-travel test mode** that fast-forwards the clock so war windows and eras can be tested in minutes.

## Performance notes

- Troop streams (many moving arrows) are drawn with pooled sprites or particles, not one object per soldier.
- The server sends only changes (Colyseus delta sync), not the full state.
