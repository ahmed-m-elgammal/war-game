# 03. Politics and Support

## Concept (LOCKED)

Every country has **one national meter: Supporters vs Opponents**. It is shown as a two-color bar (supporters vs opponents) plus a number from 0 to 100.

- Events in **regions**, especially during war, add **small modifiers** (about ±0.1 each) to the national meter. **LOCKED**
- Low support causes **penalties first**, then **rebel AI armies** if it keeps dropping. **LOCKED**

## The meter

| Item | Value | Status |
|---|---|---|
| Range | 0-100 | DEFAULT |
| Starting value | 60 | DEFAULT |
| Update frequency | Every server tick | DEFAULT |
| Display | Two-color bar + number | LOCKED idea |

## What changes support (all DEFAULT values)

### National drivers (per hour)

| Driver | Effect per hour |
|---|---|
| Food shortage | -0.5 |
| Water shortage | -0.5 |
| Unpaid upkeep (money shortage) | -0.3 |
| No shortages and money positive | +0.2 (up to 70) |

### Regional events (small modifiers, ±0.1 each)

| Event in a region | Effect |
|---|---|
| Region captured by an enemy | -0.1 |
| Region attacked and defended | +0.1 |
| Region captured from AI or an enemy | +0.1 |
| Heavy troop losses in the region | -0.1 |
| Region bombed (aircraft or missile) | -0.1 |

Rules for regional modifiers:

- Each region can change the national meter by at most **±1.0 per day**, so one bad war cannot collapse a country. **DEFAULT**
- Capital events count **×3**. **DEFAULT**

### One-time events

| Event | Effect |
|---|---|
| Leaving an alliance | -5 |
| Winning a major battle | +1 |
| Capital captured | -5 |

## Consequences of low support (LOCKED order, DEFAULT thresholds)

| Support | State | Effect |
|---|---|---|
| 60-100 | Stable | None |
| 40-59 | Uneasy | Warning icon shown |
| 25-39 | Unrest | **-15%** money income and infantry growth |
| 15-24 | Serious unrest | **-30%** income and infantry growth |
| below 15 | Uprising | Penalties continue, and **rebel AI armies spawn** in your weakest regions |

## Rebels

- Rebels are AI armies controlled by the server. **LOCKED**
- They spawn in the player's weakest region (lowest troop count) and try to take it. **DEFAULT**
- Spawn rate: 1 rebel group per hour while support is below 15. **DEFAULT**
- Rebel strength scales with the era (stronger in later eras). **DEFAULT**
- A region taken by rebels becomes neutral (AI-like) and can be retaken by anyone. **DEFAULT**
- Defeating rebels gives **+0.5** support per group. **DEFAULT**

## Rebels count as PvE

Rebels are the "fight AI" enemy that appears from your own politics. They do not need a separate combat system. They use the same combat rules as normal AI regions (see `04-military-and-eras.md`).

## UI (clear and simple)

- One bar at the top: supporters (blue side), opponents (red side).
- Small icons show what is pushing the number down (food, water, losses).
- A short text: "Stable", "Uneasy", "Unrest", "Uprising".
