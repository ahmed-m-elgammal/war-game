# 02. Game Design Document

> **Project:** The Succession
> **Document:** `plan/02-game-design.md`
> **Version:** 1.0 — design baseline
> **Date:** 2026-10-23
> **Status:** Draft for product-owner review
> **Authority:** [`specs/09-v1-design-lock.md`](../specs/09-v1-design-lock.md). If this GDD and the design lock disagree, the design lock wins.
> **Companions:** [`plan/01-requirements.md`](01-requirements.md) (requirements and acceptance criteria) and [`plan/03-gameplay-rules.md`](03-gameplay-rules.md) (execution rules, state machines, and edge cases).
> **Audience:** Design, engineering, art, QA, and product.

This document describes how the game **plays**: the loop, objectives, progression, enemies, combat, rewards, difficulty, UI, and outcomes. It does not replace the design lock or the requirements baseline. Exact numbers are stated here as **DEFAULT/LOCKED** where the design lock provides them, or marked **TBD** and live in config.

**Interpretation lock for this document:**

- **Levels** means **province levels 1–5 and era progression**. There are no campaign missions or account levels.
- **Items** means **resources, units, abilities, and cosmetics**. There is no inventory, equipment, or randomized item loot system.
- **Difficulty** means **one difficulty**, expressed through AI archetypes, era scaling, and player competition. There is no easy/normal/hard selector.
- **Enemies** means **other players, AI warlords, and rebels**. There is no separate bestiary, boss ladder, or bandit faction.

---

## 1. Executive summary

**One sentence:** *The Succession* is a 30-day, phone-first, pixel-art civil-war strategy game where 20–24 players and 10–15 AI warlords fight for one country across 18 hours of peace and 6 hours of war each day.

**One paragraph:** You are a warlord in **Vardania**, a fictional country in civil war. You start with one capital, 50 infantry, and a starting stockpile that supports your first choice: upgrade or expand. During peace you build, feed your army, research, trade, and take neutral or AI land. During the daily war window, player attacks open and the map becomes a live contest. You can lose provinces, armies, and your capital, but you are not permanently out: you respawn in a refugee province, keep your research, and rejoin the fight. At the end of day 30, the faction with the most provinces earns **Conqueror**, and the highest score earns **Best Nation**. They can be the same faction. Power resets; titles and cosmetics persist.

| Fact | Design answer |
|---|---|
| Genre | Persistent-world, asynchronous, phone-first strategy |
| Setting | Vardania, one fictional country in civil war |
| Player role | Warlord/faction leader, not a separate nation |
| World | 20–24 humans + 10–15 AI; 80–100 provinces |
| Session | 5–20 minutes, with a daily 6-hour war window |
| Season | 30 days, fixed end |
| Scope | Beta-level v1: full season, multiple worlds, pass, shop, mobile, abilities |
| Core verb | **Take and hold ground without collapsing internally** |
| Win condition | Conqueror (most provinces) or Best Nation (highest score) |
| Loss condition | No permanent game over; elimination causes respawn |
| Monetization | $5 pass + limited cosmetic shop; cosmetics only |
| Platforms | Mobile web, Capacitor Android/iOS; desktop web secondary |
| Audience | Core strategy players, 16+ |

### 1.1 What the player actually does

1. Check the map, production, upkeep, queues, and support.
2. Choose one or two actions that fit the current constraint.
3. Send an army, upgrade a province, research, trade, or prepare for war.
4. Return when the march resolves or when the war window opens.
5. Read the result, adjust, and repeat until day 30.

The game is not about clicking fast. It is about **reading the map, managing scarcity, and choosing when to spend your army**.

**Scope note:** v1 is **Beta-level scope**, not Alpha 3. The full 30-day season, multiple rolling worlds, pass, cosmetic shop, mobile builds, and special abilities are in scope. If the schedule slips, the approved fallback order is **mobile → shop → abilities**, and only with product-owner approval. The core season, war window, economy, support, research, alliances, trade, and pass are the last things to cut.

---

## 2. Design pillars

| Pillar | What it means | What it forbids |
|---|---|---|
| **One country, many factions** | The map is a civil war inside Vardania, not a lobby of separate nations. Every player is a claimant. | Separate countries, separate maps, “nation vs nation” framing |
| **The 18/6 appointment** | Peace is safe and productive; war is short, scheduled, and dramatic. The war window is the daily appointment. | Constant free-for-all PvP, surprise attacks at arbitrary times |
| **Power resets, identity persists** | A season is a complete 30-day story. Provinces and armies reset; titles, history, and cosmetics remain. | Endless power creep, paid permanent stats |
| **Every system has a cost** | Economy, military, support, and diplomacy pull against each other. Growth is never free. | One dominant strategy with no trade-off |
| **Phone-first, not shallow** | Five resources, support, eras, alliances, and war fit a 390px screen without becoming a spreadsheet. | Desktop-only UI, tiny text, hover-only actions |
| **Fair PvP, no noise** | Cosmetics only; no paid power. No global chat, no pings, no emotes. | Pay-to-win, loot boxes, chat moderation burden |
| **Readable war room** | The map looks like a physical command map: paper, ink, stamped labels, big numbers. | Generic dashboard UI, visual clutter, hidden modifiers |

### 2.1 The pillar test

Every proposed feature must answer:

1. Does it make the map more readable or the choice more interesting?
2. Does it fit a 5–20 minute phone session?
3. Does it preserve the 18/6 rhythm?
4. Does it create a trade-off rather than a straight upgrade?
5. Can a new player understand it without chat?

If the answer is no, it is not v1.

---

## 3. Player fantasy and experience goals

### 3.1 The fantasy

**“I am not a nation. I am the claimant who can hold the country together.”**

The player is a warlord with a name, an emblem, and a color. The fantasy is not building a civilization from scratch; it is **taking a broken country, province by province, while keeping your own people fed and loyal**.

The map tells the story:

- a capital star that can change hands;
- a border that grows too fast and starts to starve;
- a support bar that turns green, then amber, then red;
- a rebel enclave that appears in your weakest province;
- a war window where the border moves.

No scripted campaign is needed. The systems generate the story.

### 3.2 Experience goals by time scale

| Time | The player should feel |
|---|---|
| **First 10 minutes** | “I understand this map, I captured something, and I have a real choice.” |
| **First session** | “I know when the war window is and what I need to prepare.” |
| **Day 2** | “My choices from yesterday mattered; I have a reason to check back.” |
| **First war window** | “The map is alive, but I am not overwhelmed.” |
| **First setback** | “I lost ground, but I know why and I can recover.” |
| **Day 30** | “That was a complete 30-day story, and I want to see my recap.” |

### 3.3 Audience

- **Primary:** core strategy players, 16+, who like Risk, board-game economies, and classic browser strategy.
- **Secondary:** friend groups, lapsed browser-strategy players, and board-game groups.
- **Not for:** children under 16, twitch/instant-action players, solo/offline campaign players, chat-first social players, and pay-to-win players.

Detailed audience and platform requirements are in [`01-requirements.md`](01-requirements.md) §3–4.

### 3.4 What the player should never feel

- That they need to be online all day.
- That a hidden modifier decided a battle.
- That they lost permanently because they slept.
- That spending money made them stronger.
- That they need to read a wiki before their first capture.

---

## 4. Core gameplay loop

### 4.1 The central tension

The game has three engines that can each starve the other two. Territory is the scoreboard they fight over:

```
Economy  →  funds  →  Military
   ↑                     │
   │                     ▼
Support  ←  territory  ←  Map
```

- **Economy** funds units, upgrades, research, and trade.
- **Military** takes and holds provinces.
- **Support** punishes overexpansion and shortages.
- **Territory (the scoreboard)** feeds the economy but raises upkeep and exposure.

The player is always choosing which engine to feed and which risk to accept.

### 4.2 The loop

```
        ┌──────────────────────────────────────────┐
        │  Read the map, resources, support, clock  │
        └───────────────────┬──────────────────────┘
                            ▼
        ┌──────────────────────────────────────────┐
        │  Choose: build / train / research / trade │
        │          / attack / defend / wait         │
        └───────────────────┬──────────────────────┘
                            ▼
        ┌──────────────────────────────────────────┐
        │  Spend resources, start timers, commit    │
        │  army, accept exposure                    │
        └───────────────────┬──────────────────────┘
                            ▼
        ┌──────────────────────────────────────────┐
        │  Result: province, loss, report, support  │
        │  change, new constraint                   │
        └───────────────────┬──────────────────────┘
                            ▼
        ┌──────────────────────────────────────────┐
        │  Adjust, recover, prepare for next window │
        └──────────────────────────────────────────┘
```

### 4.3 Loop by time scale

| Scale | Length | What happens | Player decision |
|---|---:|---|---|
| **Moment** | Seconds | Tap a province, inspect a stack, confirm an order | Is this the right target? |
| **Session** | 5–20 min | Collect, queue, train, trade, march, read reports | What is the one constraint to fix? |
| **Day** | 24h, split 18/6 | Peace production then war window | Do I prepare, attack, defend, or recover? |
| **Era** | Days 1, 8, 16, 24 | New tech and unit tier | Do I spend on research or on the map? |
| **Season** | 30 days | Territory, alliances, support, endgame | Am I playing for Conqueror or Best Nation? |

### 4.4 The map is the menu

There is no separate campaign map, mission list, or quest log. The map is the main screen and the source of objectives:

- a weak neutral province is an invitation;
- a red support bar is a warning;
- a rebel enclave is a debt;
- a capital star is a war goal;
- a resource icon is a reason to expand in that direction;
- the war clock is the appointment.

The tutorial overlay is the only scripted objective sequence. After the first capture, the player sets their own goals.

### 4.5 What the player is always deciding

1. **Upgrade or expand?** Fortification and troop cap versus more provinces and more upkeep.
2. **Army or infrastructure?** Units protect territory; upgrades and research make the next army better.
3. **Support or speed?** Fast conquest can trigger unrest and rebels.
4. **Trade or hoard?** Gold buys missing resources, but limits and tax matter.
5. **Ally or stay independent?** Shared vision and tax-free trade versus the risk of a locked alliance during war and a 24h exit cooldown.
6. **Attack now or hold?** The war window is short; a failed attack costs the army and the initiative.
7. **Play for provinces or score?** Conqueror and Best Nation can diverge in the endgame.

---

## 5. Player objectives

### 5.1 Objective hierarchy

| Horizon | Objective | How it is communicated |
|---|---|---|
| **First session** | Capture one neutral province; understand the capital and war clock; link Google/Apple after the session | Tutorial overlay |
| **Daily** | Keep production and upkeep positive; use the war window; protect support | Map HUD, warnings, war clock |
| **Weekly** | Reach the next era; hold a coherent border; build one alliance or trade route | Era calendar, leaderboard, map |
| **Season** | Finish as Conqueror or Best Nation; leave a story worth a recap | Leaderboard, score, season recap |
| **Meta** | Earn titles, history, cosmetics, and pass progress | Profile, pass, recap |

### 5.2 Immediate objectives

The first ten minutes are deliberately narrow:

1. **This is your capital.** It produces money.
2. **This neutral province is weak.** Send your 50 infantry.
3. **Watch the march.** Battle resolves on arrival.
4. **You captured it.** Choose: upgrade the capital or expand.
5. **This is the war clock.** AI and neutral provinces can be attacked anytime. Players only during war.

The player should finish the tutorial with:

- one captured province;
- one queued upgrade or training order;
- one understood constraint (food, water, money, or support);
- one reason to return (a timer or the war window).

### 5.3 Daily objectives

A normal day is not a checklist. It is a set of tensions:

- **Feed the army.** Food and water are passive drains.
- **Keep money positive.** Advanced units have upkeep.
- **Use the build/training queue.** Timers continue offline.
- **Watch support.** Shortages and losses move the meter.
- **Prepare for war.** Repair, reinforce, research, trade, or position.
- **Use the war window for PvP.** Defend or attack a player; take neutral/AI land anytime.

### 5.4 Weekly objectives

- Reach the next era (days 8, 16, 24).
- Hold a border that matches your army and support.
- Establish at least one trade relationship or alliance.
- Improve your score without collapsing your economy.
- Decide whether you are a contender for Conqueror, Best Nation, or both.

### 5.5 Season objectives

At day 30:

- **Conqueror:** most provinces held.
- **Best Nation:** highest score.
- **Personal:** a recap worth sharing, a title, a cosmetic, and a reason to join the next world.

Survival is the baseline; the two titles are the season objectives.

### 5.6 What is not an objective

- No mandatory daily quest checklist.
- No campaign mission chain.
- No “kill 10 rats” tasks.
- No forced tutorial after the first capture.
- No account level grind.

The pass has missions and XP, but they are **optional cosmetic progression**, not the game’s win condition.

---

## 6. Progression

### 6.1 Four progression layers

| Layer | Scope | Persists? | What it changes |
|---|---|---|---|
| **Province levels** | Per province, 1–5 | No; resets with world | Troop cap, production, fortification |
| **Eras and research** | Per faction, Era 1–4 | No; resets each season | Unit tiers, doctrine, economic techs |
| **Territory, support, score** | Per faction, live | No; resets each season | Map power, income, rebellion risk, ranking |
| **Identity and pass** | Account-wide | Yes | Titles, history, cosmetics, pass rewards |

**There is no account level.** The pass has XP, but it buys no power. A new player and a veteran start every season with the same rules.

### 6.2 Province levels — fortress first

| Level | Troop cap | Production | Upgrade money | Build time | Fortification |
|---|---:|---:|---:|---:|---:|
| 1 | 100 | 1.0× | — | — | +0% |
| 2 | 200 | 1.5× | 100 | 1h | +10% |
| 3 | 300 | 2.0× | 250 | 2h | +20% |
| 4 | 400 | 2.5× | 500 | 4h | +30% |
| 5 | 500 | 3.0× | 1,000 | 8h | +40% |

- **Fortification and troop cap are the main value.** Production is secondary. This keeps upgrading competitive with expansion.
- Non-capital upgrades also cost the province’s own resource; the resource component equals the money cost unless config overrides it.
- Capital upgrades cost money for both components.
- Build time starts when the order is placed and continues offline and during war.
- Cancel refunds **50%**. **DEFAULT.**
- A captured province loses one level, minimum 1. A rebel capture does the same unless it triggers elimination.

### 6.3 Era progression

| Era | Theme | Opens | Gate | What it changes |
|---|---|---:|---|---|
| **1** | WW1 | Day 1 | None | Rifles, entrenchment, light tanks, biplanes, artillery |
| **2** | WW2 | Day 8 | Own 3 of Era 1’s 5 main techs | Anti-tank, medium tanks, fighters, rocket artillery, combined arms |
| **3** | Modern | Day 16 | Own 3 of Era 2’s 5 main techs | Anti-air, main battle tanks, jets, guided missiles, precision doctrine |
| **4** | Advanced | Day 24 | Own 3 of Era 3’s 5 main techs | Drones, advanced tanks, stealth aircraft, long-range missiles, network warfare |

- The **calendar opens the era**; research unlocks the tools inside it.
- You cannot enter Era 2 before day 8, even with three techs.
- You can skip up to two main techs per era.
- Research is **instant on payment**. There is no research timer and no research queue.
- Research costs money, plus gold for late-era techs. Exact costs are **TBD** and live in config.
- No tech stealing, no catch-up discount. A player who skips research faces a real gap.

### 6.4 Research shape

**Linear eras with side branches. LOCKED.**

Each era has:

- **5 main techs** that gate the next era.
- **Infantry weapon branches:** rifles, anti-tank, anti-air.
- **Infantry skill branches:** Defender, Raider, Marcher.
- **Economic side branches:** small production/storage bonuses.

Example main track:

| Era | Main track example |
|---|---|
| 1 | Rifles → Entrenchment (Defender) → Light Tank → Biplane → Artillery |
| 2 | Anti-tank → Medium Tank → Fighter → Rocket Artillery → Combined Arms |
| 3 | Anti-air → Main Battle Tank → Jet → Guided Missile → Precision Doctrine |
| 4 | Drone → Advanced Tank → Stealth Aircraft → Long-Range Missile → Network Warfare |

The exact tree, costs, and prerequisites are in config. The design rule is: **the era calendar is the pacing; research is the choice inside it.**

### 6.5 Army progression

- **Infantry** grows automatically if fed and under the province troop cap: **+20/hr per province level**, cap **100 × level**.
- **Tanks, aircraft, and missiles/artillery** require the training queue, money, and oil; elite missiles also need gold.
- **Era 1 long-range unit is artillery. Era 2+ is missiles.**
- Unit stats and availability scale by era. Base stats are in §10.4; exact tier stats are config.
- **National doctrine:** one infantry weapon and one skill for the whole faction. Changeable in peace for a cost. **DEFAULT.**
- No per-group doctrine in v1.

### 6.6 Meta progression

Persists across seasons and worlds:

- faction name, emblem preset, color;
- titles (Conqueror, Best Nation, season-specific marks);
- season history and personal stats;
- identity cosmetics: banners, flags, titles, profile badges, map pins, capital monuments;
- pass entitlements and shop entitlements;
- settings and accessibility preferences.

Resets each season:

- provinces, armies, resources, research, support, alliances.

**Power resets. Identity persists.** This is the compact between seasons.

### 6.7 Progression pacing

| Phase | Days | What the player is learning | Main tension |
|---|---:|---|---|
| **Opening** | 1–7 | First capture, upkeep, queues, support, war clock | Expand or stabilize |
| **First escalation** | 8–15 | Era 2, alliances, trade, player borders | Tech or territory |
| **Midgame** | 16–23 | Era 3, larger armies, capital pressure | Support and supply lines |
| **Endgame** | 24–30 | Era 4, score race, final wars | Conqueror or Best Nation |

---

## 7. Levels and world structure

### 7.1 What “levels” means

This game has **two level systems**, and no third:

1. **Province levels 1–5** — local power, troop cap, production, fortification.
2. **Eras 1–4** — global technology and unit tiers.

There are **no campaign levels, no mission stages, and no account levels**. The world itself is the level.

### 7.2 World composition

| Element | Count / rule |
|---|---|
| Human factions | 20–24 |
| AI warlords | 10–15, each holding 2–4 provinces |
| Provinces | 80–100 |
| Reserved refugee provinces | 4–6 |
| Neutral provinces | 25–40 |
| Player capitals | 20–24 |
| AI provinces | 24–36 |
| Map | One contiguous landmass; water only at the edges; no navy |
| Terrain | Visual and narrative only; no combat modifiers |
| Worlds | Multiple rolling worlds; one “open” world at a time |

The same Vardania geometry is used for every world; ownership, resources, and AI setup are generated per world. These are ranges; the generator picks a combination that sums to the world target of 80–100. The design lock gives 12 AI warlords × 2–3 provinces as a concrete example for the 24–36 AI-province budget.

### 7.3 World lifecycle

- **Open:** accepting players for the first **3 days**.
- **Running:** day 4–30; no new joins.
- **Finished:** day 30; recap and awards.
- A new open world is created when the current one fills or its join window closes.
- Late joiners go to the next open world, or pre-register if none exists.
- Start protection: **24 hours**.
- Abandonment: **5 days inactive** → AI-controlled; returning player respawns like an eliminated player.

### 7.4 Map and starting placement

Capitals are assigned by the server, not chosen by players.

Each capital is guaranteed:

1. At least one **food** and one **water** province within 2 hops.
2. One adjacent **weak neutral province** for the first conquest.
3. No adjacent player capital inside the minimum spacing.
4. A mix of nearby resource access; never all one type.
5. A buffer of neutral/AI land before the nearest player border.

The generator validates every constraint. If it cannot satisfy them, it regenerates.

### 7.5 Province types

| Type | What it is | Can be attacked? | Notes |
|---|---|---|---|
| **Player capital** | Faction seat; money production; +25% defense | Yes, during war | Capture gives the attacker a mark and capped loot; defender must relocate or is eliminated |
| **Player province** | Normal owned territory | Yes, during war | Exact troop counts visible to owner/allies; enemy sees a band |
| **AI warlord province** | AI-held territory | Yes, anytime | AI scales with era; no awards; no respawn |
| **Neutral province** | Unclaimed land | Yes, anytime | First conquest target; resource mix matters |
| **Refugee province** | Reserved respawn edge province | No, normally | 4–6 per world; used for respawns and capital relocation |
| **Rebel enclave** | Province held by rebels | Yes | Appears below 15 support; one active rebellion; can be retaken |

### 7.6 Information model

- **Own and allied provinces:** exact troop counts.
- **Enemy provinces:** approximate band, e.g. `100–200`; band width scales with army size.
- **No fog of war.**
- **No scouting action in v1.**
- **Battle estimate:** a range, not an exact outcome.
- **Battle report:** both powers, every multiplier, losses, and capture result. No hidden modifiers.
- **Allies** see each other’s exact army sizes through shared vision.

The map is fully visible; the uncertainty is in enemy strength, not in geography.

### 7.7 The world is the scoreboard

The leaderboard shows faction names, provinces, score, and titles. The map shows owner color and faction name in the province panel, not on every province, to avoid clutter.

There is no separate “world level” or “map completion” percentage. The scoreboard and the map are the same thing.

---

## 8. Enemies

### 8.1 Enemy categories

| Enemy | Who controls it | When it can attack players | Respawns? | Eligible for awards? |
|---|---|---|---|---|
| **Human faction** | Another player | War window only (PvP) | Yes, via elimination rules | Yes |
| **AI Garrison** | Server AI | War window only | No | No |
| **AI Raider** | Server AI | War window only, weak neighbors | No | No |
| **AI Expansionist** | Server AI | War window only; takes neutral land anytime | No | No |
| **Rebels** | Server PvE | Spawn below 15 support; same combat rules | No; one active group | No |

AI can fight AI and take neutral land at any time. It cannot attack a player outside the war window, under start protection, or in a refugee province.

### 8.2 AI warlords

- **10–15 per world**, each holding 2–4 provinces.
- Each has one primary archetype and a simple aggression score.
- AI does not form alliances or negotiate.
- AI strength scales with the era: garrison sizes and unit tiers rise at days 8, 16, and 24.
- **No dynamic rubber-banding.**
- AI does not compete for Conqueror or Best Nation.
- AI can be eliminated and **does not respawn**. **DEFAULT.**
- Behavior is deterministic enough to test, with seeded RNG per world for unpredictability.

| Archetype | Behavior | What it teaches the player |
|---|---|---|
| **Garrison** | Defends, reinforces, rarely attacks | Fortification and patience |
| **Raider** | Attacks weak neighbors during war, retreats when losing | Defensive depth and reserve troops |
| **Expansionist** | Takes neutral land anytime, grows toward the player map | The cost of leaving neutral land uncontested |

### 8.3 Rebels

Rebels are a **support punishment**, not a separate faction.

- Spawn when support drops **below 15**.
- Spawn in the **weakest province**.
- **One active rebellion at a time. LOCKED.**
- No new group until the current one is defeated, then a **2-hour grace period**.
- Rebels **take one province and hold it** as a neutral rebel enclave. They do not expand.
- The province can be retaken by the owner or anyone else.
- Rebel strength scales with the era.
- Defeating rebels gives **+0.5 support**.
- Rebels use the same combat rules and are PvE.
- Rebel capture drops the province level by 1, minimum 1, unless it triggers elimination.

Rebels are the visible consequence of ignoring support. They are not a grind and not a second game.

### 8.4 Enemy intel

- No bestiary, no scouting, no fog of war.
- Enemy troop counts are bands; own/allied counts are exact.
- Battle estimates are ranges.
- Battle reports show the math after the fact.
- There is no hidden “AI cheat” multiplier. AI difficulty comes from archetype, era scaling, and numbers.

### 8.5 What “enemy” does not mean

- No monsters, bosses, or unique enemy units.
- No bandit faction beyond rebels.
- No enemy campaign ladder.
- No separate PvE mode.
- No enemy diplomacy tree.

---

## 9. Items, resources, units, and abilities

### 9.1 What “items” means

There is **no inventory, no equipment slots, and no randomized item loot**. The things a player uses are:

| Category | Examples | Gameplay effect |
|---|---|---|
| **Resources** | Money, gold, food, water, oil | Fund production, upkeep, training, research, trade, abilities |
| **Units** | Infantry, tank, aircraft, missile/artillery | Take, hold, and damage provinces |
| **Abilities** | Mobilization, Airstrike, Missile Strike | War-only province effects with cooldowns |
| **Cosmetics** | Flags, banners, titles, map pins, monuments | Identity only; no power |

Capital capture can transfer resources as loot; that is a stockpile transfer, not an item drop. This keeps the UI readable on a phone and avoids a second progression system that the season reset would have to absorb.

### 9.2 Resources

| Resource | Job | Main source | Shortage consequence |
|---|---|---|---|
| **Money** | Build, upgrade, train, research, unit upkeep | Most provinces + capital | Blocks building/training; unpaid upkeep lowers support |
| **Gold** | Trade currency; elite tech | Rare mining provinces (~1 in 10) | Blocks market and elite research |
| **Food** | Feeds infantry | Farms | Infantry growth stops; −0.5 support/hr |
| **Water** | Feeds provinces/cities | Water provinces | Production penalty; −0.5 support/hr |
| **Oil** | Tanks, aircraft, missiles; operations | Oil fields | Blocks advanced training and abilities; no support penalty by itself |

- **Money is never tradeable.** Gold is the only trade currency.
- Food, water, and oil are tradeable.
- Gold is intentionally scarce; it is the currency that makes trade and elite research meaningful.

### 9.3 Units

| Unit | Role | Production | Notes |
|---|---|---|---|
| **Infantry** | Holds ground, cheap, food-fed | Free growth: **+20/hr per province level**, cap **100 × level** | One national weapon + skill doctrine |
| **Tank** | Breaks infantry, weak to aircraft | Money + oil, timed queue | Strong vs infantry; poor vs aircraft |
| **Aircraft** | Strikes tanks and regions | Money + oil, timed queue | Range; strong vs tanks |
| **Missile / artillery** | Region damage, siege | Money + oil; gold for elite | One-shot; damages garrison and province level |

- **Era 1 long-range unit is artillery. Era 2+ is missiles.**
- Tanks, aircraft, and missiles require the training queue.
- Infantry grows automatically if fed and under the province troop cap.
- All units are capped by the province’s troop capacity.
- Unit stats and availability scale by era; base combat stats are in §10.4.

### 9.4 Abilities

Abilities are **war-only** in v1. **DEFAULT.**

| Ability | Effect | Cooldown | Era | Cost |
|---|---|---:|---:|---|
| **Mobilization** | +30% infantry growth for 1 hour | 12h | 1+ | Money + food |
| **Airstrike** | 15% garrison damage to one province | 6h | 1+ | Money + oil |
| **Missile Strike** | Heavy garrison damage + province level damage | 12h | 2+ | Money + oil + gold |

- Abilities target **provinces**, not marching armies.
- Cooldowns are per faction, not per province.
- Balance numbers are **DEFAULT/TBD** and live in config.
- UI: abilities panel during war, confirm target, show cooldown and cost.

### 9.5 Cosmetics

Cosmetics are **identity only**:

- flags and emblems;
- banners;
- titles and profile badges;
- map pins;
- capital monuments;
- nameplate styling.

They can come from the pass, the shop, or season awards. They never change production, combat, support, research, or score.

### 9.6 What is not an item

- No equippable gear.
- No consumable cards or boosts.
- No randomized item drops or loot boxes.
- No premium currency.
- No item trading or marketplace.
- No pay-to-win resources, units, or research.

---

## 10. Combat

### 10.1 Design goals

Combat must be:

- **readable** — the player can see why a battle was won or lost;
- **server-resolved** — no client-side outcome;
- **decisive** — a lost army matters;
- **defensible** — the defender has agency before arrival;
- **fast to resolve** — no tactical minigame or real-time control;
- **compatible with the war window** — PvP attacks must launch and arrive inside it.

### 10.2 Combat flow

```
Choose target → launch army → march timer → incoming warning
      → defender reinforces / retreats / holds
      → battle resolves on arrival
      → battle report → capture or retreat → army stays or returns
```

### 10.3 Power formula

```
power = Σ count × (attack or defense)
        × counter
        × skill
        × era
        × fortification/capital
        × offline
```

- **Winner:** higher power.
- **Loser:** loses all units.
- **Winner losses:** except on an exact tie, `loser_power / winner_power × winner_count`.
- **Capture:** if the defender’s garrison reaches 0, the attacker captures the province. The surviving army stays as the new garrison.
- **Tie handling:** exact ties are won by the defender; the attacker loses all committed units and the defender loses 50% of committed units. This replaces the winner-loss formula for the tie case. **LOCKED** rule; the 50% share is **DEFAULT** and config-driven.

### 10.4 Modifiers and base stats

**Base stats (DEFAULT):**

| Unit | Attack | Defense |
|---|---:|---:|
| Infantry | 10 | 10 |
| Tank | 30 | 20 |
| Aircraft | 40 | 10 |
| Missile / artillery | Region damage | Region damage |

**Era multipliers:** `1.0 / 1.3 / 1.7 / 2.2`.

**Defense bonuses:**

| Bonus | Value |
|---|---:|
| Fortification | +10% per level above 1 |
| Capital | +25% |
| Offline defense | +15% |
| Cap | Additive, **+75% maximum** |

- Bonuses are **additive**, then capped at +75%. **LOCKED.**
- **Support does not affect combat power.** The consequence of low support is rebels, not a hidden battle modifier.
- The battle report shows both powers, each multiplier, losses, and the capture result. No hidden modifiers.

### 10.5 Counters

| Attacker → | Infantry | Tank | Aircraft |
|---|---:|---:|---:|
| Infantry (rifles) | 1.0 | 0.5 | 0.3 |
| Infantry (anti-tank) | 0.8 | 1.5 | 0.3 |
| Infantry (anti-air) | 0.8 | 0.5 | 1.5 |
| Tank | 1.5 | 1.0 | 0.2 |
| Aircraft | 1.0 | 1.5 | 1.0 |

Missiles do **region damage**, not normal unit combat.

### 10.6 Infantry doctrine

| Choice | Effect |
|---|---|
| **Rifles** | Balanced |
| **Anti-tank** | 1.5× against tanks |
| **Anti-air** | 1.5× against aircraft |
| **Defender** | +20% defense in your own provinces |
| **Raider** | +20% attack in enemy provinces |
| **Marcher** | +25% march speed |

- One weapon and one skill are active for the whole faction.
- Unlocked by research.
- Can be changed in peace for a cost. **DEFAULT.**
- No per-group doctrine in v1.

### 10.7 Losses and capture

- The loser loses **all units** in the battle.
- The winner loses a share of its force equal to `loser_power / winner_power`.
- If the defender’s garrison reaches zero, the attacker captures the province.
- The surviving attacker becomes the new garrison.
- The captured province loses one level, minimum 1.
- The army does not teleport home; it stays in the captured province.
- A failed attack can leave the attacker exposed for the rest of the war window.

### 10.8 Movement and timing

- Land units move province-to-province along the adjacency graph.
- Aircraft and missiles have range.
- **March speeds (DEFAULT):**
  - Infantry: **5 min per province**.
  - Tank: **3 min per province**.
  - Aircraft: **1 min per province**; range 3 at Era 1, up to 6 at Era 4.
  - Artillery/missile range: 3 at Era 1, up to 10 at Era 4.
  - Era speed bonus: **+10% per era**.
- Combined stacks move at the **slowest unit’s speed**.
- Split and merge armies in owned provinces.
- PvP attacks must **launch and arrive inside the war window**. The server blocks or warns before launch.
- **Battle fatigue:** the same army cannot attack again for **20 minutes** after a battle. **DEFAULT.**
- The army stays in the captured province; it does not teleport home.

### 10.9 Defender and attacker agency

**Defender (online):**

- Sees the incoming attack, countdown, attacker name, and approximate strength.
- Can **reinforce** from adjacent owned provinces: one reinforcement per incoming attack. **DEFAULT.**
- Can **retreat** the garrison to an adjacent owned province, ceding the province but saving the troops.
- Can **hold** and fight.
- Battle resolves on arrival. No tactical minigame.

**Attacker:**

- Can **recall** before arrival with a penalty: **10% of troops lost**, or the oil cost. **DEFAULT.**
- Recall creates feint-and-response play and prevents suicidal attacks.

**Offline defender:**

- Server auto-resolves with **+15% defense**.
- No other bonus. The standing garrison and fortification are what they are.

### 10.10 Battle report

The report must show:

- attacker and defender;
- both final powers;
- each multiplier (counter, skill, era, fortification/capital, offline);
- losses on both sides;
- capture result;
- any loot or capital effect.

The report is the trust contract. If the player cannot see why they lost, the combat design has failed.

### 10.11 Worked example — illustrative only

> All modifiers are 1.0. This is a formula example, not a balance target.

- Attacker: 100 infantry, 10 attack each → **1,000 power**.
- Defender: 50 infantry, 10 defense each → **500 power**.
- Attacker wins.
- Defender loses all 50 infantry.
- Attacker losses: `500 / 1,000 × 100 = 50` infantry.
- Attacker survives with 50 infantry and captures the province.

This shows the intended feel: even a winning attack can cost half the force. Combat is a spend, not a free swap.

### 10.12 Capital capture

When a capital is captured:

- **Attacker:** +5 support, the cosmetic **“Capital Breaker”** mark, and capped loot: **10% of the defender’s stockpile, cap 500 gold equivalent**.
- **Defender:** −5 support and must move the capital to another owned province.
- If the defender has no other province, they are eliminated and normal elimination rules apply; **no loot** on elimination.
- The new capital gets the capital bonuses: money production, +25% defense, support events ×3.
- A player may voluntarily relocate their capital once per season in peace for a cost. **DEFAULT.** This returns a refugee province to the pool.

Capital capture is a **war goal**, not an instant-win button. It hurts, but the season continues.

---

## 11. Economy and support loop

### 11.1 Production and upkeep

- Each non-capital province produces **one resource** plus a small amount of money.
- **Base production:** 10/hr of its resource, 5/hr money at level 1.
- **Production multiplier:** +50% per level: `1.0× / 1.5× / 2.0× / 2.5× / 3.0×`.
- **Storage:** `500 × number of provinces owned`, per resource.
- **Capital always produces money.**
- **Server tick:** economy and support update every **1 minute**.

**Upkeep — three passive drains:**

- **Food:** 1/hr per 10 infantry.
- **Water:** 1/hr per province level.
- **Money:** per-unit upkeep for tanks, aircraft, and missiles; exact rates in config.
- **Oil:** spent on training and operations, **not** idle upkeep.

**Shortage rules:**

- Warning first, at least one tick before the penalty.
- **Unpaid money upkeep:** −0.3 support/hr and a production/training efficiency penalty. Units do not disappear immediately.
- **Food shortage:** infantry growth stops; −0.5 support/hr.
- **Water shortage:** production penalty; −0.5 support/hr.
- **Oil shortage:** advanced training and abilities blocked; no support penalty by itself.

### 11.2 Queues

- **One national build queue.**
- **One national training queue.**
- Both are timed and continue offline and during war.
- Queue slots can be upgraded with resources. **DEFAULT:** +1 slot per upgrade, max 2 each.
- **Research is instant on payment.** No research timer, no research queue.
- Training times for tanks, aircraft, and missiles are batch-based, not per-unit. **DEFAULT.**
- UI shows the queue, remaining time, and cancel option.

### 11.3 Trade

- **Open market + direct offers. Peace only.**
- **Gold is the only trade currency.** Food, water, and oil are tradeable. Money is not.
- **Market tax:** 5%. **Allies trade directly tax-free.**
- **Daily limits:** 5 trades and 500 gold per faction per world day (the world-scoped reading of "per player"). Minimum account age 24h. All trades logged.
- **State exchange backstop:** the server always buys and sells food, water, and oil at fixed prices with a wide spread. Player trades are better. Exchange trades count toward daily limits. No tax; the spread is the fee.
- **Alt-account checks:** flag repeated one-way transfers and new-account feeding. Review, don’t auto-ban.
- **Trade UI:** filters, big gold price, tax shown before confirm, history.

Trade exists to solve **local scarcity**, not to become a second economy. The state exchange guarantees the player is never fully stuck.

### 11.4 Support meter

- **0–100, starts at 60.**
- One national meter, two-color bar plus number, visible on the map at all times.
- Updates every tick (1 minute).
- **Support does not affect combat power. LOCKED.**

| Range | State | Effect |
|---:|---|---|
| 60–100 | **Stable** | No penalty |
| 40–59 | **Uneasy** | No penalty; warning tone |
| 25–39 | **Unrest** | −15% income and growth |
| 15–24 | **Serious Unrest** | −30% income and growth |
| 0–14 | **Uprising** | Rebels spawn |

### 11.5 Support drivers

**Continuous (per hour):**

| Driver | Support |
|---|---:|
| Food shortage | −0.5/hr |
| Water shortage | −0.5/hr |
| Unpaid money upkeep | −0.3/hr |
| Stable and fed | +0.2/hr, up to 70 |

**Regional events (small modifiers, ±0.1 each):**

- Enemy captures a province: −0.1.
- Defended successfully: +0.1.
- Captured a province: +0.1.
- Heavy losses in a battle: −0.1.
- Bombing or missile damage: −0.1.
- Cap: ±1.0 per province per day.
- **Capital events count ×3.**

**One-time events:**

- Leave an alliance: −5.
- Win a major battle: +1.
- Capital captured: −5.
- Defeat a rebel group: +0.5.

### 11.6 Rebels

The full rebel loop is in §8.3. In economy terms:

- Support below 15 creates a **PvE debt**.
- The rebellion takes one province and holds it.
- Retaking it costs army and time.
- Defeating it gives +0.5 support.
- The 2-hour grace period prevents an immediate second rebellion.

### 11.7 Anti-snowball

The brakes are structural, not artificial catch-up bonuses:

- Upkeep and water costs rise with size.
- Food and money shortages punish overextension.
- Captured provinces lose a level.
- Support penalties and rebels punish unstable expansion.
- Elimination and respawn return a player to the map.
- The season resets power every 30 days.

**No explicit underdog bonuses in v1. DEFAULT.** If playtests show a runaway leader, tune upkeep and support before adding catch-up mechanics.

---

## 12. Alliances and diplomacy

### 12.1 The only formal pact

An alliance is the only formal diplomatic relationship defined in v1. There is no reputation stat.

| Rule | Value |
|---|---|
| Max size | **3 factions** |
| Formed | **Peace only** |
| War | **Locked** — no joining, leaving, or inviting |
| Leave | **Peace only**; −5 support; 24h cooldown |
| Cooldown effects | Cannot attack an ex-ally for 24h; cannot join a new alliance for 24h |
| Kicking | Leader can kick in peace; same 24h cooldown |
| Elimination | Membership persists through elimination; abandoned players are removed |
| Award | No alliance award; awards are individual |

### 12.2 Benefits

- **Shared vision:** allies see each other’s exact army sizes.
- **Tax-free direct trades:** no 5% market tax on direct ally trades.
- **Shared map color:** allies are visually grouped.
- **Non-aggression:** enforced by the 24h attack cooldown after leaving.

### 12.3 What alliances cannot do

- No stationing troops in allied provinces.
- No joint attacks or shared commands.
- No shared victory.
- No in-game chat, voice, emotes, or pings.

### 12.4 Communication

Coordination happens externally (Discord or similar). The alliance screen must make membership, invites, shared vision, and the war-lock status very clear. The game does not provide a chat surface, so the UI must compensate with readable status.

### 12.5 Betrayal

Betrayal is visible through the 24h cooldown and the −5 support hit. There is no hidden reputation stat. If you leave an alliance, the consequence is explicit.

---

## 13. Rewards

### 13.1 In-season rewards

| Source | Reward | Persists? |
|---|---|---|
| Capturing a province | Territory, production, troop cap, map position | No; season |
| Capital capture | +5 support, **Capital Breaker** cosmetic mark, capped loot | Mark persists; loot is season |
| Winning battles | Survival, captured ground, battle report, support events | No; season |
| Defeating rebels | +0.5 support, province recovery | No; season |
| Era research | New units, doctrine, economic techs | No; season |
| Leaderboard | Rank, score, title contention | No; season |

**Loot rule:** capital capture gives **10% of the defender’s stockpile, cap 500 gold equivalent**. No loot on elimination.

### 13.2 End-of-season rewards

- **Conqueror** — most provinces held at the end.
- **Best Nation** — highest score at the end.
- **Season recap** — leaderboard, personal stats, titles, next-world link.
- **Profile history** — past seasons, titles, cosmetics.
- **Identity persistence** — faction name, emblem, color, titles, season history, cosmetics.

The design lock names two awards. The leaderboard is the recognition; the two titles are the win.

### 13.3 Season pass

| Field | Design |
|---|---|
| Price | **$5 per 30-day pass** |
| Structure | **Free track + premium track** |
| Progression | **Hybrid:** passive XP from normal play + daily/weekly mission bonuses |
| Rewards | **Identity cosmetics only:** banners, flags, titles, profile badges, map pins, capital monuments |
| Content | **20–30 rewards:** 8–10 free, 15–20 premium |
| Buying levels | **No** |
| Mid-season purchase | Yes; retroactively claims earned premium rewards |
| Expiry | Rolling 30 days from purchase; **account-wide**; may cross a season boundary |
| Progress | Earned in any world; rewards account-wide |
| Unclaimed rewards | Auto-claim at expiry. **DEFAULT.** |

**Term:** account-wide rolling 30 days from purchase is **DEFAULT**; it may cross a season boundary. The term may be tuned after playtests; it is not a per-world pass.

### 13.4 Cosmetic shop

- **Limited launch catalog.**
- Identity cosmetics only: flags/emblems, banners, map pins, titles, capital monuments.
- **Direct real-money purchase.** No premium currency in v1.
- **Account-wide and permanent.**
- **No overlap with pass-exclusive rewards.** Pass items are seasonal; shop items are evergreen.
- Prices **TBD**.
- No loot boxes, no randomized paid cosmetics.

### 13.5 Payments

- **Web:** browsable, read-only storefront. No checkout.
- **Mobile:** Apple App Store / Google Play IAP via RevenueCat for digital goods. Do not link to web checkout inside the mobile app.
- **Entitlements are account-bound** and sync across platforms.
- Webhooks, receipts, refunds, and fraud checks are part of v1.
- Legal terms, privacy, refunds, tax/VAT, and age rating are launch blockers.

### 13.6 Reward philosophy

1. **Power resets; identity persists.**
2. **No pay-to-win.** Nothing purchasable affects provinces, armies, resources, research, support, combat, or pass levels.
3. **No loot boxes.** No randomized paid cosmetics.
4. **No power rewards from the pass.** The pass is a cosmetic identity track.
5. **The season is the reward.** The story, the title, and the recap are the point.

### 13.7 Reward matrix

| Reward | Source | Power? | Permanent? |
|---|---|---:|---|
| Provinces | Capture | Yes, within season | No |
| Resources | Production, trade, loot | Yes, within season | No |
| Units | Training/growth | Yes, within season | No |
| Research | Payment | Yes, within season | No |
| Support | Play | Yes, within season | No |
| Conqueror / Best Nation | Day 30 | No | Yes, title/history |
| Capital Breaker | Capital capture | No | Yes, mark |
| Pass cosmetics | Pass | No | Yes |
| Shop cosmetics | Purchase | No | Yes |
| Season history | Day 30 | No | Yes |

---

## 14. Difficulty and balance

### 14.1 One difficulty

There is **one difficulty**. There is no easy/normal/hard selector, no difficulty slider, and no separate PvE/PvP tuning.

Difficulty comes from:

- other players;
- AI archetypes and era scaling;
- the map and starting placement;
- the 18/6 rhythm;
- upkeep, support, and rebels;
- the fixed 30-day clock.

### 14.2 AI difficulty

| Lever | Behavior |
|---|---|
| Archetype | Garrison, Raider, Expansionist |
| Era scaling | Garrison sizes and unit tiers rise at days 8, 16, 24 |
| Aggression | One simple aggression score per warlord |
| Respawn | AI does not respawn. **DEFAULT.** |
| Rubber-banding | **None.** |
| Awards | AI does not compete for Conqueror or Best Nation |

AI is not a difficulty setting. It is a **world pressure system**.

### 14.3 New-player difficulty

The opening is deliberately protected:

- **24h start protection.**
- Spaced capitals with food/water within 2 hops.
- An adjacent weak neutral province for the first capture.
- A buffer of neutral/AI land before the nearest player border.
- Tutorial overlay; no forced tutorial after the first capture.
- First capture in **5–10 minutes**.
- No PvP attacks outside war.
- No AI attacks on protected or refugee players.

The new-player experience is not “easy mode.” It is a **safe runway into the same rules**.

### 14.4 Anti-snowball

- Upkeep and water costs rise with size.
- Food and money shortages punish overextension.
- Captured provinces lose a level.
- Support penalties and rebels punish unstable expansion.
- Elimination and respawn return a player to the map.
- Season reset every 30 days.
- No explicit underdog bonuses in v1. **DEFAULT.**

If playtests show a runaway leader, tune **upkeep and support** before adding catch-up mechanics.

### 14.5 Balance levers

| Area | Levers | Location |
|---|---|---|
| Economy | Base production, multipliers, storage, upkeep, upgrade costs/times | Config |
| Combat | Unit stats, era multipliers, counters, doctrine, fortification cap, losses | Config |
| Support | Driver rates, thresholds, regional caps, rebel strength | Config |
| AI | Archetype mix, aggression, era scaling, target selection | Config |
| Trade | Tax, daily limits, state exchange spread, account-age gate | Config |
| Pass | XP curve, mission list, reward count | Config |
| Season | Peace/war split, join window, protection, abandonment | Config |

**All numbers live in config, not in logic.** Exact values are **TBD** where the design lock says so.

### 14.6 What difficulty is not

- Not a selectable mode.
- Not dynamic rubber-banding.
- Not a hidden AI bonus.
- Not pay-to-win.
- Not “the AI cheats because it is behind.”
- Not a reason to add catch-up research or underdog damage bonuses.

---

## 15. UI and UX

### 15.1 UX principles

1. **The map is the context.** Every panel opens over the map; the player never loses their place.
2. **Few numbers per section.** Icons first, text second. Big numbers for decisions, small numbers for detail.
3. **The war clock is always visible.** Peace/war state and time to transition.
4. **Support and resources are always visible.** The top bar is the pulse of the faction.
5. **Exact for yours, approximate for enemies.** Own/allied counts are exact; enemy counts are bands.
6. **One modal layer at a time.** No modal stacked on a modal.
7. **Destructive actions confirm.** Attack, leave alliance, purchase, abandon.
8. **No hidden modifiers.** The battle report shows the math.
9. **No chat surface.** Status and shared vision replace conversation.
10. **Phone-first at 390px.** Desktop is a secondary layout, not a separate game.

### 15.2 Screen map

| Screen | Purpose | Primary actions |
|---|---|---|
| **World list** | Open/running/finished worlds; day, players, war window, join | Join, pre-register, inspect |
| **Map** | Main screen; top bar support/resources/clock; bottom nav | Select province, open panels, issue orders |
| **Province panel** | Owner, resource, level, troops, fortification, actions | Attack, upgrade, reinforce, retreat |
| **Research** | Eras, 3-of-5 gate, side branches, costs | Buy tech instantly |
| **Market** | Listings, direct offers, state exchange, tax, limits | Trade, list, accept |
| **Alliance** | Members, invites, shared vision, trade shortcut, lock status | Invite, accept, leave, kick |
| **Army / Orders** | Build queue, training queue, armies in motion | Queue, cancel, split/merge, recall |
| **Pass** | Free/premium tracks, XP, missions, rewards, purchase | Claim, buy, inspect |
| **Shop** | Identity cosmetics, direct purchase | Buy, equip |
| **Profile** | Titles, season history, cosmetics, settings | Equip, inspect, change settings |
| **Incoming attack** | Countdown, attacker, approximate strength, reinforce/retreat/hold | Defend |
| **Battle report** | Power, bonuses, losses, capture | Read |
| **Season recap** | Leaderboard, personal stats, titles, next world | Inspect, join next |

Detailed screen specs, phone wireframes, and HUD tokens: `plan/08-screens-and-hud.md`.

### 15.3 Map HUD

**Top bar:**

- support meter and number;
- five resources;
- war clock: peace/war state and time to next transition.

**Bottom navigation:**

- Research;
- Trade;
- Alliance;
- Army;
- Pass.

**Map icons:**

- owner color;
- resource icon;
- level pips;
- troop count (own/allied exact; enemy band);
- capital star;
- protection shield;
- incoming-attack warning.

**Province panel:**

- owner, resource, level, troops, fortification;
- actions appropriate to the state;
- exact own/allied counts, approximate enemy bands.

### 15.4 Core interaction flow

```
Tap province
  → province panel
  → choose action
  → confirm cost and target
  → server returns intent/march timer
  → defender sees incoming warning
  → battle resolves on arrival
  → battle report
  → map updates
```

**Example — first capture:**

1. Tap the adjacent neutral province.
2. Panel shows: neutral, level 1, weak garrison, resource icon.
3. Tap **Attack**.
4. Confirm: send 50 infantry; march 5 minutes; arrival inside peace (AI/neutral allowed).
5. March dot moves along the adjacency line.
6. On arrival, battle report shows powers and losses.
7. Map flips ownership; support may tick; tutorial advances.

**No tactical screen.** The player commits the army and the server resolves it.

### 15.5 War clock states

| State | Duration | What the player sees | What changes |
|---|---:|---|---|
| **Peace** | 18h | Calm clock; build/trade/train | PvP blocked; AI/neutral attacks allowed |
| **Opening clash** | First 90m | Clock turns loud; war horn; border alerts | PvP opens; alliances locked |
| **Reinforcement / counterattack** | Middle 3h | Incoming panels; reinforce/retreat prompts | Defender agency is most valuable |
| **Land grab** | Last 90m | Countdown urgency; capture opportunities | Last chance to arrive inside the window |
| **Closed** | After 6h | Clock returns to peace; reports settle | PvP blocked again; cleanup |

The beats are a **rhythm and UI state**, not extra combat rules. The hard rule is: PvP attacks must launch and arrive inside the six-hour war window.

### 15.6 Onboarding

**First session flow:**

1. **Guest account.** No email required.
2. Pick display name, faction name, emblem preset, and color.
3. Join the current open world, or pre-register if none exists.
4. Spawn in a capital province with 50 infantry and the starting stockpile.
5. Tutorial overlay:
   - “This is your capital. It produces money.”
   - “This neutral province is weak. Send your 50 infantry.”
   - “Watch the march. The battle resolves on arrival.”
   - “You captured it. Now choose: upgrade your capital or expand.”
   - “This is the war clock. AI and neutral provinces can be attacked anytime. Players only during war.”
6. First capture in **5–10 minutes**.
7. After the first session, prompt to link a Google or Apple identity.
8. No forced tutorial after the first capture. The map is the tutorial.

**Linking gate:** season rewards, titles, season history, cross-device access, and purchases require a linked Google or Apple identity.

### 15.7 Feedback and states

- **Timers:** every queue, march, cooldown, and protection has a visible countdown.
- **Warnings:** support thresholds, food/water/money shortages, incoming attacks, war-window closing.
- **Battle report:** both powers, each multiplier, losses, capture, loot.
- **Loading:** skeleton or map-first load; no blank screen.
- **Error:** clear retry; no lost intent without explanation.
- **Offline:** reconnect screen; server state on return; no offline play.
- **Notifications:** in-game war clock is authoritative; push and email reminders are out of v1.

### 15.8 Art and audio

**Art direction — field map / war room:**

- warm paper, ink borders, stamped labels;
- chunky province colors;
- NATO-ish unit symbols;
- big numbers, few numbers;
- subtle terminal/CRT accent only for the war clock and alerts;
- **16-color palette**; one main color per faction; AI/neutral muted tints;
- **~29 icons**: 5 resources, 16 unit icons (4 types × 4 eras), 8 UI icons;
- low-res mask (target 320×180), nearest-neighbor scaling, no anti-aliasing;
- moving dots/arrows for marches; pooled sprites and particles;
- curated flag/emblem presets; no user-uploaded images; faction names pass a profanity filter.

**Audio (minimal, DEFAULT):**

- UI clicks;
- march drums;
- battle impacts;
- war-window horn;
- ambient map loop.

Full music/orchestral score is **TBD**; v1 ships with the minimal set above.

### 15.9 Accessibility

- Colorblind-safe shapes and patterns, not color alone.
- Minimum touch target: **44px**. **DEFAULT.**
- Readable at **390px** width.
- No hover-only actions.
- Visible keyboard focus on desktop.
- Contrast checks on paper/ink palette.
- Full WCAG 2.1 AA audit: **TBD**; not a v1 launch claim.

### 15.10 What the UI is not

- No chat, voice, emotes, or pings.
- No inventory or equipment screen.
- No campaign map or mission ladder.
- No tactical battle screen.
- No difficulty selector.
- No premium currency store.
- No loot-box opening animation.

---

## 16. Win, loss, and season end

### 16.1 Win conditions

At day 30, two individual titles are awarded:

| Title | Condition |
|---|---|
| **Conqueror** | Most provinces held at the end |
| **Best Nation** | Highest score at the end |

**Score formula:**

```
score = provinces held × 10
      + economy score
      + army score
      + support score
```

- Scaling constants live in config. **TBD.**
- Tie-breaker: **total troops**, then **earlier join**.
- The season **never ends early**, even if one faction dominates.
- AI is not eligible for either award.
- There is no alliance award.

### 16.2 Loss and setback

There is **no permanent game over** in normal play.

**Elimination:**

- Triggered when a player loses all provinces.
- Respawn in a reserved **refugee province**, away from the attacker.
- Lose **35% of resources** (30–40% range).
- Keep research.
- Lose the army.
- Gain **24h protection**.
- Refugee provinces: **4–6 edge provinces**, unclaimable normally.
- If the pool is empty: use any neutral/AI province.
- If no province exists: spectator until next season.

Elimination is a **setback and a comeback story**, not a deletion.

### 16.3 Abandonment

- **5 days inactive** → faction becomes AI-controlled.
- Returning player respawns like an eliminated player.
- Abandoned players are removed from their alliance.
- The world does not pause for absent players.

### 16.4 Season end

At day 30:

1. Freeze the world.
2. Calculate Conqueror and Best Nation.
3. Assign titles and history.
4. Show the season recap: leaderboard, personal stats, titles, next-world link.
5. Reset power: provinces, armies, resources, research, support, alliances.
6. Persist identity: name, emblem, color, titles, history, cosmetics, pass/shop entitlements.

There is no “next season carry-over” of power. The reset is the point.

### 16.5 Outcome table

| Outcome | Trigger | Result | Permanent? |
|---|---|---|---|
| **Conqueror** | Most provinces at day 30 | Title, recap, history | Yes, title/history |
| **Best Nation** | Highest score at day 30 | Title, recap, history | Yes, title/history |
| **Eliminated** | No provinces | Respawn in refugee province, 35% resource loss, research kept, army lost, 24h protection | No; season continues |
| **Abandoned** | 5 days inactive | AI takes over; returning player respawns like eliminated | No; season continues |
| **Spectator** | No respawn province available | Watch until next season | No; next season |
| **Season end** | Day 30 | Awards, recap, reset | Power resets; identity persists |

### 16.6 What is not a win/loss

- No permanent account deletion on elimination.
- No alliance victory.
- No early “domination” win.
- No pay-to-win rescue.
- No “game over” screen that ends the player’s season.
- No separate solo campaign ending.

---

## 17. Player journey

### 17.1 First session — minute by minute

| Time | Player experience | Design intent |
|---:|---|---|
| 0–1 min | Guest, name, faction, emblem, color | Zero friction; identity before commitment |
| 1–3 min | Spawn in capital; tutorial overlay | Understand money and the map |
| 3–5 min | Send 50 infantry to adjacent neutral | First real order; short march |
| 5–10 min | Capture; choose upgrade or expand | First meaningful trade-off |
| 10-15 min | Queue build/training; see war clock; link Google/Apple | Reason to return; account safety |

### 17.2 The 30-day arc

| Phase | Days | Player focus | Question | Emotional beat |
|---|---:|---|---|---|
| **Opening** | 1–7 | First captures, upkeep, support, war clock | “Can I hold what I take?” | Discovery |
| **First escalation** | 8–15 | Era 2, alliances, trade, player borders | “Who can I work with?” | Belonging |
| **Midgame** | 16–23 | Era 3, larger armies, capital pressure | “Where is my weak border?” | Pressure |
| **Endgame** | 24–29 | Era 4, score race, final wars | “What am I willing to spend?” | Commitment |
| **Awards** | 30 | Recap, titles, next world | “Was that a story?” | Closure |

### 17.3 What brings the player back

- A build/training timer finishing.
- The war window opening.
- An incoming attack warning.
- A support threshold warning.
- A new era opening.
- A pass mission or reward.
- An alliance situation.
- The leaderboard.

There are no push notifications in v1. The in-game clock and the player’s own routine are the appointment.

---

## 18. Design constraints and out of scope

### 18.1 Hard design constraints

These are not negotiable in v1:

- No real countries, leaders, parties, or weapon names.
- No gore or graphic violence.
- No global chat, voice, emotes, or pings.
- No pay-to-win.
- No loot boxes or premium currency.
- No offline play.
- No gamepad, console, or VR.
- No inventory or equipment.
- No campaign missions or account levels.
- No difficulty selector.
- No tactical battle minigame.
- No enemy bestiary or boss ladder.
- No alliance stationing, joint attacks, or shared victory.
- No fog of war or scouting.
- No separate map geometries or navy.

### 18.2 Out of scope

The authoritative out-of-scope list is in [`01-requirements.md`](01-requirements.md) §9.2. This GDD adds no features to it.

### 18.3 What to do when a feature conflicts

If a proposed feature conflicts with a pillar or a hard constraint:

1. Cut it from v1.
2. Log it as a future idea.
3. Do not hide it behind a toggle or a default.
4. Do not let it distort the core season.

---

## 19. Open design questions

The authoritative TBD list is in [`01-requirements.md`](01-requirements.md) §13.2 and [`specs/09-v1-design-lock.md`](../specs/09-v1-design-lock.md) §20.

GDD-specific questions that must be answered before implementation are listed below. The exact-power tie was resolved on 2026-10-23: defender wins; attacker loses all; defender loses 50% (DEFAULT/config).

| Area | Question | Why it matters |
|---|---|---|
| **Combat** | Exact unit tier stats, training times, and tech costs | Needed for balance and UI |
| **AI** | Archetype mix, aggression scores, target selection | Needed for a believable, testable AI |
| **Score** | Scaling constants for economy, army, and support score | Defines Best Nation |
| **Pass** | XP curve, mission list, reward catalog | Defines the 30-day cosmetic track |
| **Shop** | Launch catalog and prices | Defines the limited shop |
| **Season** | War-window start time per world | Defines the daily appointment |
| **Map** | Fitted view vs. pan/zoom at 390px | Defines the core interaction |
| **Legal** | Jurisdiction, terms, privacy, refunds, tax, age rating | Launch blocker |
| **Lore** | Vardania region names, faction names, emblem set | Needed for content and art |
| **Naming** | Trademark/search clearance for **The Succession** | Launch blocker |

Do not invent answers in code. Mark them in config and escalate.

---

## 20. Design commandments

1. **The map is the menu.** If the player is not reading the map, the UI is doing too much.
2. **The war window is the appointment.** Protect the 18/6 rhythm.
3. **Every system has a cost.** If an action has no trade-off, it is not a decision.
4. **Power resets; identity persists.** The season is the unit of competition.
5. **No hidden modifiers.** The battle report is the trust contract.
6. **No pay-to-win.** Cosmetics are the only thing for sale.
7. **No chat.** If the game needs chat to explain itself, simplify the game.
8. **Phone-first, not shallow.** Depth comes from choices, not from tiny buttons.
9. **A setback is a story.** Elimination is a comeback, not a deletion.
10. **Day 30 should feel like an ending.** The recap is the reward.

---

## Appendix A. Known default values

> Quick reference only. The design lock’s values and status tags are authoritative; tune only where the design lock marks **DEFAULT**. Exact config lives in the implementation.

| Area | Value |
|---|---|
| Season length | 30 days |
| Peace / war | 18h / 6h |
| War beats | 90m opening / 3h reinforcement / 90m land grab |
| Join window | 3 days |
| Start protection | 24h |
| Abandonment | 5 days |
| Elimination resource loss | 35% |
| Refugee provinces | 4–6 |
| Players per world | 20–24 |
| AI warlords | 10–15 |
| Provinces | 80–100 |
| Max alliance | 3 |
| Ex-ally attack cooldown | 24h |
| Market tax | 5% |
| Trades per day | 5 |
| Gold per day | 500 |
| Min account age to trade | 24h |
| Support start | 60 |
| Support thresholds | 60 / 40 / 25 / 15 |
| Rebel grace | 2h |
| Capital loot | 10% of stockpile, cap 500 gold equivalent |
| Capital defense | +25% |
| Fortification | +10% per level above 1 |
| Offline defense | +15% |
| Defense cap | +75% |
| Era opens | Day 1 / 8 / 16 / 24 |
| Era gate | 3 of 5 main techs |
| Starting infantry | 50 |
| Starting resources | 500 money, 200 food, 200 water, 50 oil, 0 gold |
| Province upgrade money | 100 / 250 / 500 / 1,000 |
| Troop caps | 100 / 200 / 300 / 400 / 500 |
| Production multipliers | 1.0× / 1.5× / 2.0× / 2.5× / 3.0× |
| Storage | 500 × provinces owned, per resource |
| March speed | Infantry 5m / tank 3m / aircraft 1m per province |
| Battle fatigue | 20 minutes |
| Base stats | Infantry 10/10; tank 30/20; aircraft 40/10 |
| Era multipliers | 1.0 / 1.3 / 1.7 / 2.2 |
| Pass price | $5 |
| Pass rewards | 20–30: 8–10 free, 15–20 premium |
| Pass term | Rolling 30 days from purchase, account-wide (**DEFAULT**) |
| Shop | Direct purchase, account-wide, permanent |

---

## Appendix B. Design review checklist

Before a feature enters the build:

- [ ] Does it fit one of the design pillars?
- [ ] Does it make the map more readable or the choice more interesting?
- [ ] Does it fit a 5–20 minute phone session?
- [ ] Does it respect the 18/6 rhythm?
- [ ] Does it create a trade-off rather than a straight upgrade?
- [ ] Is it readable at 390px with touch only?
- [ ] Is the server authoritative?
- [ ] Are all numbers in config?
- [ ] Does it avoid pay-to-win, chat, inventory, campaign levels, and a difficulty selector?
- [ ] Can a new player understand it without a wiki?
- [ ] Is there an automated test for its core rule?
- [ ] Does it still work after elimination, respawn, and season reset?
- [ ] Is it on the v1 scope list?

If a feature fails the checklist, it is not ready.

---

*End of `02-game-design.md`. The next planning document should translate this GDD into the implementation plan described in `specs/09-v1-design-lock.md` §17.*

