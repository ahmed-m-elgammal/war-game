# 01. World and Seasons

## Worlds

| Rule | Value | Status |
|---|---|---|
| Human players per world | 20-50 | LOCKED |
| AI countries | Fill all empty land so the map is never empty | LOCKED |
| Season length | 30 days, each world has its own clock | LOCKED |
| Maps | One fictional map to start | LOCKED |
| Multiple worlds | Several worlds can run at once, in different season days | LOCKED |
| World list screen | Simple list: world name, day X/30, player count, war window time | DEFAULT |

## Daily cycle

Every day has two phases. Times are server time (UTC) and are the same for everyone in a world.

| Phase | Length | What is allowed |
|---|---|---|
| **Peace** | 18 hours | Build, upgrade regions, research, train units, trade, form or leave alliances, attack AI regions |
| **War** | 6 hours | Everything in peace, plus PvP attacks between players. Alliances are locked. |

- The war window start time is chosen per world when it is created. Pick it for the main player time zone. **LOCKED** (fixed time; **DEFAULT** for the exact hours).
- AI regions can be attacked at any time, in peace and war. **LOCKED**
- PvP attacks are only allowed during war. **LOCKED**
- Attacks are live: the attacker sends troops and watches them march. **LOCKED**
- If the defender is offline, the server resolves the defense automatically from their stats. **LOCKED**
- Offline defense gets a small protection bonus so being offline is not punished too hard (default +15%). **DEFAULT**

## Joining a world

- A world accepts new players for its **first 3 days**. After that it is closed. **DEFAULT**
- Late joiners are placed in a **new world that starts fresh**. **LOCKED**
- Every new country gets **24 hours of start protection** (cannot be attacked by players). **DEFAULT**
- New players start with **1 region: the capital**, then grow by taking AI regions. **LOCKED**

## Season end and awards

- When day 30 ends, the world closes and results are calculated. **LOCKED**
- Two awards, both **cosmetic titles** that carry over to later seasons: **LOCKED**

| Award | How it is decided |
|---|---|
| **Conqueror** | Most regions held on day 30 |
| **Best Nation** | Highest total score |

Total score formula (DEFAULT, tune later):

```
score = regions_held * 10
      + economy_score      (sum of production per hour of all resources, scaled)
      + army_score         (total unit value, scaled)
      + support_score      (support meter value, 0-100)
```

- Tie-breaker: higher total troops, then earlier join time. **DEFAULT**

## What carries over to the next season

| Carries over | Resets |
|---|---|
| Country name, flag, titles, season history, cosmetics | Regions, army, resources, research, alliances, support |

**LOCKED**: identity stays, power resets. Everyone starts equal each season.

## Elimination

A player is eliminated when they lose **all** their regions.

1. The player **respawns elsewhere**, not near their old location. **LOCKED**
2. They respawn on an unclaimed or AI region away from the attacker. **DEFAULT**
3. **30-40% of their resources are removed** (default 35%). The removed resources disappear and are not given to the attacker. **LOCKED** range, **DEFAULT** exact value.
4. They keep research progress but lose their army. **DEFAULT**
5. They get 24 hours of start protection again. **DEFAULT**

## Abandoned countries

- If a player is inactive for 5 days, their country becomes AI-controlled. **DEFAULT**
- If they return, they respawn like an eliminated player. **DEFAULT**

## Capturing a region

- A captured region fully changes owner to the attacker. **DEFAULT**
- The region's level drops by 1 on capture (minimum 1). **DEFAULT**
- Capturing a player's **capital** gives the attacker a bonus and forces the loser to move their capital to another owned region (if they have none, they are eliminated). **DEFAULT**
