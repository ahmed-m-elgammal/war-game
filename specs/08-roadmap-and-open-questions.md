# 08. Roadmap and Open Questions

## Milestones (LOCKED order)

Each milestone must be **playable** before the next one starts. The game runs on the **real server from the start**, even when played solo.

| Milestone | Scope | Done when |
|---|---|---|
| **Alpha 1: Core loop** | Map, regions, troop march, AI regions, 5 resources, region upgrades, support meter with penalties and rebels. Friends can join the same world. | A player can grow from 1 region by taking AI regions, manage resources, and survive rebels |
| **Alpha 2: War** | Daily war window, live PvP attacks, offline auto-defense, start protection, elimination and respawn | A group of friends can play full war days |
| **Alpha 3: Depth** | Research tree and 4 eras, advanced units (tank, aircraft, missile), alliances with locks and betrayal rules, trade (market + direct offers) | A full 30-day season can be played end to end |
| **Beta** | Seasons and awards, world list, cosmetics and titles, Capacitor Android/iOS builds, polish | Real players can join new worlds and keep their titles |
| **Later** | Cosmetic shop, push notifications, chat and moderation, more maps | After retention is proven |

## Suggested build order inside Alpha 1

1. Low-res map + region mask + tap to select a region
2. Server world room + shared state
3. Troop growth and caps
4. Troop march and combat vs AI regions
5. Resources and region upgrades
6. Support meter, penalties, rebels
7. Basic UI (top bar, region panel)

## Defaults to review (all DEFAULT, change after playtesting)

| Area | Default |
|---|---|
| Offline defense bonus | +15% |
| Start protection | 24 hours |
| World join window | First 3 days |
| Abandonment | Inactive 5 days becomes AI-controlled |
| Capture level drop | -1 level (min 1) |
| Capital defense bonus | +25% |
| Resource loss on elimination | 35% (range 30-40%) |
| Starting resources | Money 500, Food 200, Water 200, Oil 50, Gold 0 |
| Infantry growth | +20 per hour per level |
| Era dates | Days 1 / 8 / 16 / 24 |
| Research prerequisite | 3 techs from the previous era |
| Support thresholds | 60 / 40 / 25 / 15 |
| Regional support modifier | ±0.1, daily cap ±1.0 per region |
| Betrayal | -5 support, 24h cooldown |
| Market tax | 5% |
| Trade limits | 5 trades/day, 500 Gold/day |
| Score formula | See `01-world-and-seasons.md` |
| Map size | 60-100 regions |

## Open questions (TBD, ask the product owner)

1. **Game name and country theme names.** Final title, country name, region names.
2. **War window hours.** Exact UTC start time for the first world.
3. **Special abilities.** Keep, cut, or change the three abilities (Mobilization, Airstrike, Missile strike)?
4. **Alliance award.** Add a shared alliance victory later?
5. **Login method.** Email only, or social login too?
6. **Push notifications.** Which events (attack incoming, war starting, support low)?
7. **Chat and moderation.** In-game chat, alliance chat only, or none at first?
8. **Region ownership display.** Show every player's name on the map or only in the region panel?
9. **Accessibility.** Language support beyond English?
10. **Rebel behavior.** Should rebels also attack neighbors, or only hold regions?

## Risks to watch

| Risk | Mitigation |
|---|---|
| Too much scope | Build in milestone order, keep each playable |
| Empty world early | AI countries, rebels, small world size (20-50) |
| Time zone problems | One fixed window per world, offline auto-defense, worlds grouped by region |
| Snowballing | Season reset, capture level drop, start protection, elimination respawn |
| Alt-account abuse | Trade limits, tax, minimum account age, flagging |
| Economy confusion (5 resources) | One clear job per resource, icons and warnings |
| Balance | All numbers in config, bot clients, time-travel test mode |
