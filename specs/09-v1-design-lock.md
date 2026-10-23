# 09. V1 Design Lock — The Succession

> **Status: V1 AUTHORITY.** This file records the decisions made in the design grilling on 2026-10-22. Where it conflicts with `01`-`08`, **this file wins for v1**. The older docs remain the original vision and can be updated later.
>
> **Revision 2026-10-23:** SD-01 through SD-04 in `plan/04-technology-decisions.md` §17.1 are applied below: Google/Apple linking replaces email linking; purchases require a linked social identity; the web storefront is read-only and all purchases are mobile IAP; email reminders are removed.

| Field | Value |
|---|---|
| Working title | **The Succession** |
| Setting | **Vardania**, one fictional country in civil war |
| V1 scope | A complete 30-day season, multiple rolling worlds, season pass, cosmetic shop, mobile builds, special abilities |
| Monetization | $5 season pass + limited cosmetic shop; cosmetics only, no pay-to-win |
| Primary success metrics | New-player understanding/return, war-window return, day-30 season completion |
| Authority | This file supersedes `01`–`08` for v1 |

---

## 0. How to read this document

- **LOCKED (v1):** decided by the product owner. Do not change without approval.
- **DEFAULT:** implement as written, but keep the value in config. Tune in playtests.
- **TBD:** not decided. Stop and ask. Do not invent a rule.
- All times are **server UTC**.
- **The server decides everything.** The client displays state and sends intents.
- All numbers live in config files, never scattered in logic.
- No real country, leader, party, or weapon names. Vardania is invented.

---

## 1. The game in one breath

A 30-day, browser-first, pixel-art strategy game. **20–24 players** and **10–15 AI warlords** fight over **Vardania**, one fictional country in civil war. Every day has **18 hours of peace** (build, research, trade, farm AI, ally) and **6 hours of war** (live PvP). Five resources, one support meter, four eras, four unit types, max-3 alliances, gold-only trade. At the end of day 30, two cosmetic titles: **Conqueror** and **Best Nation**. Power resets; identity persists.

---

## 2. The promise

This is not “conquer the world.” It is **“make a small faction matter for 30 days.”**

The player is a cabinet, not a clicker: economy, general, diplomat. The map is the biography of their decisions. The clock is the drama. The fantasy is competence under pressure and a story worth telling when the season ends.

---

## 3. Design pillars

1. **Clear over detailed.**
2. **Three systems, one faction:** economy, politics, army. Every system can hurt the other two.
3. **Peace builds, war decides.** The 18/6 cycle is the product.
4. **Fair PvP.** Cosmetics only. No paid power.
5. **Never dead.** AI warlords, rebels, rolling worlds, respawns.
6. **The daily appointment.** Players should know when the war window is and want to be there.
7. **Identity persists, power resets.** Titles, cosmetics, and history survive; provinces and armies do not.

---

## 4. The core machine

```
Economy funds military
      ↓
Military changes the map
      ↓
Map gains/losses move support
      ↓
Support changes income/growth and spawns rebels
      ↓
Rebels force military spending
      ↓
Back to economy
```

Every loop has a cost. Growth is never free.

---

## 5. World and season

### 5.1 The world

- **One country: Vardania.** Players lead **factions/warlord movements**, not separate nations. The old docs’ “country” means “faction” for gameplay purposes.
- **20–24 human factions per world.**
- **10–15 AI warlords**, each holding 2–4 provinces.
- **80–100 provinces total**, including **4–6 reserved refugee provinces**.
- **One contiguous landmass.** Water only at the edges. No navy, no islands requiring transport. Every province reachable by land.
- **Terrain is visual only.** No terrain combat modifiers in v1. Chokepoints come from the province adjacency graph.
- **Multiple worlds** run at once. All use the same Vardania geometry; ownership, resources, and AI setup are generated per world.
- **Rolling auto-created worlds:** one “open” world accepting players. When it fills or its 3-day join window closes, the next opens automatically.
- **World list:** name, day X/30, players, war window, status (`open`, `running`, `finished`).
- **Join window:** first 3 days of a world. Late joiners go to the next open world. If none exists, they can pre-register for the next one.
- **Start protection:** 24 hours.
- **Abandonment:** 5 days inactive → AI-controlled. Returning player respawns like an eliminated player.

### 5.2 The season

- **30 days per world.**
- **Fixed end on day 30.** No early end, even if one faction dominates.
- **Two awards:**
  - **Conqueror** — most provinces held at the end.
  - **Best Nation** — highest score at the end.
- **Score** = provinces held × 10 + economy score + army score + support score. Scaling constants in config. Tie-breaker: total troops, then earlier join, then lower faction ID. **LOCKED.**
- **Award eligibility:** a player must have linked a Google or Apple identity before the freeze; an unlinked guest receives the recap but no title or history. An AI-controlled faction at freeze is ineligible. **LOCKED.**
- **Season end:** an arrival before `season_end` resolves; an arrival at or after it is cancelled. **LOCKED.**
- **Season recap:** leaderboard, personal stats, titles, next world.
- **Identity persists:** faction name, emblem preset, color, titles, season history, cosmetics.
- **Power resets:** provinces, army, resources, research, alliances, support.

### 5.3 Daily cycle

- **Peace 18h, war 6h.** Fixed window per world, same for everyone.
- **War window rhythm:**
  - Opening clash: first 90 minutes.
  - Reinforcement/counterattack: middle 3 hours.
  - Land grab: last 90 minutes.
- **Peace:** build, upgrade, research, train, trade, form/leave alliances, attack AI/neutral.
- **War:** everything in peace, plus **PvP attacks**. Alliances locked.
- **PvP attacks must launch and arrive inside the war window.** The server blocks or warns if arrival is after close.
- **AI attacks on players only during war.** AI can fight AI and take neutral land anytime.
- **AI/neutral provinces can be attacked anytime.**

### 5.4 Elimination and respawn

- Lose all provinces → **eliminated**.
- Respawn in a **reserved refugee province**, away from the attacker, with **24h protection**.
- Lose **35% of resources** (30–40% range). Keep research. Lose army.
- Respawn resets support to **60** and places the player in a level-1 province with **0 troops**. **DEFAULT.**
- A protected player loses protection immediately by attacking or capturing a player-owned province. **LOCKED.**
- A returning abandoned player dissolves the old AI faction. **LOCKED.**
- A spectator auto-respawns when a respawn location appears. **DEFAULT.**
- **Refugee provinces:** 4–6 edge provinces, unclaimable normally, used only for respawns.
- A player may **relocate their capital once per season in peace** for a cost; this returns a refugee province to the pool. **DEFAULT.**
- If the pool is empty: use any neutral/AI province; if none, spectator until next season.
- **Alliance membership persists through elimination. DEFAULT.** Abandoned players are removed from their alliance.

### 5.5 Capture and capitals

- Captured province changes owner fully. **Level drops by 1, minimum 1.**
- **Capital capture:**
  - Attacker: **+5 support**, cosmetic **“Capital Breaker”** mark, and **capped loot** (10% of defender’s stockpile, cap 500 gold equivalent).
  - Defender: **−5 support**, must move capital to another owned province.
  - If no other province, defender is eliminated and normal elimination rules apply (no loot).
- The new capital gets the capital bonuses.
- Capture-triggered relocation is automatic to the highest-level owned province; the defender does not choose mid-battle. **LOCKED.**
- A capital cannot be retreated from. **LOCKED.**
- The capital ×3 applies to regional events only; the one-time −5 is not multiplied. **LOCKED.**
- **Rebel capture** also drops the province level by 1, minimum 1, unless it triggers elimination.
- **Capital province:**
  - Always produces **money**.
  - **+25% defense.**
  - Support events count **×3**.
  - High-value target; capture is a war goal.

## 6. Map, placement, and information

### 6.1 The map

**Vardania** is a river-valley republic with mountain passes, a dense central core, and a contested capital. The map is one contiguous landmass with water only at the edges.

- **80–100 provinces.** Player capitals 20–24; AI warlord provinces 24–36 (12 warlords × 2–3); neutral provinces 25–40; reserved refugee provinces 4–6. These are ranges; the generator picks a combination that sums to the world’s target (80–100).
- **Adjacency graph creates chokepoints.** No terrain combat modifiers; terrain is visual and narrative only.
- **Low-res mask** (target 320×180), one unique color per province, nearest-neighbor scaling.
- **Static province data:** id, name, neighbors, terrain (visual), mask color.
- **Per-world province state:** owner, resource type, level, troops, capital flag, protection timer.
- **Resource distribution:** roughly 1 in 10 provinces is gold; food, water, oil, and money are distributed in clusters. Every capital is money.
- **Map shows:** owner color, resource icon, level pips, troop count (own/allied exact; enemy band), capital star, protection shield, incoming-attack warning.
- **No fog of war.** The whole map is visible; only enemy troop counts are uncertain.

### 6.2 Starting placement

Capitals are assigned by the server, not chosen by players. **Spaced random capitals.**

Each capital is guaranteed:

1. At least one **food** and one **water** province within 2 hops.
2. One adjacent **weak neutral province** for the first conquest.
3. No adjacent player capital inside the minimum spacing.
4. A mix of nearby resource access; never all one type.
5. A buffer of neutral/AI land before the nearest player border.

The generator validates all constraints before the world opens. If it cannot satisfy them, it regenerates.

### 6.3 Information

- **Own and allied provinces:** exact troop counts.
- **Enemy provinces:** approximate band, e.g. `100–200`. The band width scales with army size.
- **No scouting action in v1.** No fog of war.
- **Battle estimate** shows a range, not an exact outcome.
- **Battle report** shows power, bonuses, losses, and capture result.
- **Allies see exact army sizes** through the alliance shared-vision benefit.

---

## 7. Economy

### 7.1 The five resources

| Resource | Job | Main source | Shortage consequence |
|---|---|---|---|
| **Money** | Build, upgrade, train, research, unit upkeep | Most provinces + capital | Blocks building/training; unpaid upkeep lowers support |
| **Gold** | Trade currency; elite tech | Rare mining provinces (~1 in 10) | Blocks market and elite research |
| **Food** | Feeds infantry | Farms | Infantry growth stops; −0.5 support/hr |
| **Water** | Feeds provinces/cities | Water provinces | Production penalty; −0.5 support/hr |
| **Oil** | Tanks, aircraft, missiles; operations | Oil fields | Blocks advanced training and operations |

**Money is never tradeable.** Gold is the only trade currency.

### 7.2 Production

- Each non-capital province produces **one resource** plus a small amount of money.
- **Base production:** 10/hr of its resource, 5/hr money at level 1.
- **Production multiplier:** +50% per level: 1.0× / 1.5× / 2.0× / 2.5× / 3.0×.
- **Storage:** 500 × number of provinces owned, per resource.
- **Capital always produces money.** A level-1 capital produces **15 money/hr** (10 base + 5 trickle). **DEFAULT.**
- **Production multipliers apply to both the terrain resource and the 5/hr money trickle.** **DEFAULT.**
- **Server tick:** economy and support update every **1 minute**.

### 7.3 Upkeep — three passive drains

- **Food:** 1/hr per 10 infantry.
- **Water:** 1/hr per province level.
- **Money:** per-unit upkeep for tanks, aircraft, and missiles. Exact rates in config.
- **Oil:** spent on training and operations, **not** idle upkeep.

**Shortage rules:**

- Warning first, at least one tick before the penalty.
- Unpaid money upkeep: −0.3 support/hr and a production/training efficiency penalty. Units do not disappear immediately.
- Food shortage: infantry growth stops; −0.5 support/hr.
- Water shortage: production penalty; −0.5 support/hr.
- Oil shortage: advanced training and abilities blocked; no support penalty by itself.

### 7.4 Province levels — fortress first

| Level | Troop cap | Production | Upgrade money | Build time | Fortification |
|---|---:|---:|---:|---:|---:|
| 1 | 100 | 1.0× | — | — | +0% |
| 2 | 200 | 1.5× | 100 | 1h | +10% |
| 3 | 300 | 2.0× | 250 | 2h | +20% |
| 4 | 400 | 2.5× | 500 | 4h | +30% |
| 5 | 500 | 3.0× | 1,000 | 8h | +40% |

- Non-capital upgrades also cost the province’s own resource. The resource component equals the listed money cost unless config overrides it.
- Capital upgrades cost money for both components.
- **Fortress first:** fortification and troop cap are the main value. Production is secondary. This keeps upgrading competitive with expansion.
- **Build time** applies from the moment the order is placed; it continues offline and during war.
- **Cancel:** 50% refund. **DEFAULT.** Capture also cancels a queued/running order with a 50% refund; elimination or season end cancels with no refund. **DEFAULT.**
- The troop cap limits growth and training, but does not prevent an arriving, retreating, or capturing army from exceeding it. **LOCKED.**

### 7.5 Queues

- **One national build queue.**
- **One national training queue.**
- Both are timed and continue offline and during war.
- Queue slots can be upgraded with resources. **DEFAULT:** +1 slot per upgrade, max 2 each.
- **Research is instant on payment.** No research timer.
- Training times for tanks, aircraft, and missiles live in config. **DEFAULT:** batch-based, not per-unit.
- Training completion that would exceed the cap adds only up to the cap; the excess is lost. **DEFAULT.**
- Capture cancels a queued/running training order with a 50% refund; elimination or season end cancels with no refund. **DEFAULT.**
- UI shows the queue, remaining time, and cancel option.

### 7.6 Starting state

- **1 capital province**, level 1, producing money.
- **50 infantry. DEFAULT.**
- **Resources:** Money 500, Food 200, Water 200, Oil 50, Gold 0.
- **24h start protection.**
- **Tutorial target:** one adjacent weak neutral province. First capture in **5–10 minutes**.
- The first upgrade is affordable if the player saves; the first session should offer a real choice between upgrading and expanding.

### 7.7 Trade

- **Open market + direct offers.** Peace only.
- **Gold is the only trade currency.** Food, water, and oil are tradeable. Money is not.
- **Market tax:** 5%. **Allies trade directly tax-free.**
- **Tax side:** the 5% is deducted from the gold received by the seller (the gold-receiving side) and burned; the buyer pays the listed price. Tax rounds down with a 1-gold minimum on positive gold receipts. **LOCKED.**
- **Storage:** a trade receipt that would overflow either side's storage is rejected; the listing/offer remains open. **LOCKED.**
- **War freeze:** existing listings and offers freeze at war start and resume at peace; they are not cancelled. **DEFAULT.**
- **Daily limits:** 5 trades and 500 gold per player per day (per faction in a world; trade is world-scoped). Minimum account age 24h. All trades logged.
- **State exchange backstop:** the server always buys and sells food, water, and oil at fixed prices with a **wide spread**. Player trades are better. Exchange trades count toward daily limits. No tax; the spread is the fee.
- **Alt-account checks:** flag repeated one-way transfers and new-account feeding. Review, don’t auto-ban.
- **Trade UI:** filters, big gold price, tax shown before confirm, history.

### 7.8 Anti-snowball

The brakes are structural, not artificial catch-up bonuses:

- Upkeep and water costs rise with size.
- Food and money shortages punish overextension.
- Captured provinces lose a level.
- Support penalties and rebels punish unstable expansion.
- Elimination and respawn return a player to the map.
- The season resets power every 30 days.

**No explicit underdog bonuses in v1. DEFAULT.** If playtests show a runaway leader, tune upkeep and support before adding catch-up mechanics.

## 8. Politics and support

### 8.1 The meter

- **0–100, starts at 60.**
- One national meter, two-color bar plus number, visible on the map at all times.
- Updates every tick (1 minute).

| Range | State | Effect |
|---:|---|---|
| 60–100 | **Stable** | No penalty |
| 40–59 | **Uneasy** | No penalty; warning tone |
| 25–39 | **Unrest** | −15% income and growth |
| 15–24 | **Serious Unrest** | −30% income and growth |
| 0–14 | **Uprising** | Rebels spawn |

**Support does not affect combat power. LOCKED.** The military consequence of low support is rebels, not a hidden battle modifier.

### 8.2 Drivers

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

### 8.3 Rebels

- **One active rebellion at a time. LOCKED.**
- Spawn when support drops below 15, in the weakest province.
- **No new group spawns until the current group is defeated, then a 2-hour grace period.**
- Rebels **take one province and hold it** as a neutral rebel enclave. They do not expand.
- The province can be retaken by the owner or anyone else.
- Rebel strength scales with the era.
- Defeating rebels gives **+0.5 support**.
- Rebels are PvE and use the same combat rules.
- Rebel capture drops the province level by 1, minimum 1, unless it triggers elimination.

**Why this shape:** the original hourly spawn was a treadmill. One active rebellion plus a grace period makes rebellion a dramatic event, not an offline death spiral.

---

## 9. Military

### 9.1 Units

| Unit | Role | Production | Notes |
|---|---|---|---|
| **Infantry** | Holds ground, cheap, food-fed | Free growth: +20/hr per province level, cap 100 × level | One national weapon + skill doctrine |
| **Tank** | Breaks infantry, weak to aircraft | Money + oil, timed queue | Strong vs infantry; poor vs aircraft |
| **Aircraft** | Strikes tanks and regions | Money + oil, timed queue | Range; strong vs tanks |
| **Missile / artillery** | Region damage, siege | Money + oil; gold for elite | One-shot; damages garrison and province level |

- **Era 1 long-range unit is artillery. Era 2+ is missiles.**
- Tanks, aircraft, and missiles require the training queue.
- Infantry grows automatically if fed and under the troop cap.
- All units are capped by the province’s troop capacity.

### 9.2 Infantry doctrine

- **National doctrine:** one weapon type and one skill for the whole faction. This keeps the UI readable.
- **Weapons:**
  - **Rifles** — balanced.
  - **Anti-tank** — 1.5× against tanks.
  - **Anti-air** — 1.5× against aircraft.
- **Skills:**
  - **Defender** — +20% defense in your own provinces.
  - **Raider** — +20% attack in enemy provinces.
  - **Marcher** — +25% march speed.
- Unlocked by research. Can be changed in peace for a cost. **DEFAULT.**
- No per-group doctrine in v1.

### 9.3 Counters

| Attacker → | Infantry | Tank | Aircraft |
|---|---:|---:|---:|
| Infantry (rifles) | 1.0 | 0.5 | 0.3 |
| Infantry (anti-tank) | 0.8 | 1.5 | 0.3 |
| Infantry (anti-air) | 0.8 | 0.5 | 1.5 |
| Tank | 1.5 | 1.0 | 0.2 |
| Aircraft | 1.0 | 1.5 | 1.0 |

Missiles do **region damage**, not normal unit combat.

**Mixed stacks:** `counter` is the opposing combat-unit count-share-weighted average; the same lookup applies on attack and defense. **LOCKED.**

### 9.4 Combat formula

```
power = Σ count × (attack or defense)
        × counter
        × skill
        × era
        × fortification/capital
        × offline
```

- **Winner:** higher power.
- **Winner losses:** except on an exact tie, `loser_power / winner_power × winner_count`. Round half up to the nearest integer, then distribute by unit-count share using largest remainder. **LOCKED.**
- **Exact tie:** defender wins; attacker loses all committed units; defender loses 50% of committed units. This replaces the winner-loss formula for the tie case. **LOCKED** rule; the 50% share is **DEFAULT** and config-driven.
- **Loser:** loses all units.
- **Capture:** if the defender’s garrison reaches 0, the attacker captures the province. The surviving army stays as the new garrison.
- **Base stats (DEFAULT):** infantry 10 attack / 10 defense; tank 30 / 20; aircraft 40 / 10; missile region damage.
- **Era multipliers:** 1.0 / 1.3 / 1.7 / 2.2.
- **Defense bonuses:** fortification +10% per level above 1; capital +25%; offline +15%. **Additive, capped at +75%. LOCKED.**
- **Battle report:** shows both powers, each multiplier, losses, and the capture result. No hidden modifiers.

### 9.5 Movement and marches

- Land units move province-to-province along the adjacency graph. A march moves **one adjacent province**; multi-hop movement requires successive orders. **LOCKED.**
- A stack containing any land unit moves as land, even if it also contains aircraft. **LOCKED.**
- Aircraft and missiles have range.
- **March speeds (DEFAULT):**
  - Infantry: 5 min per province.
  - Tank: 3 min per province.
  - Aircraft: 1 min per province; range 3 at Era 1, up to 6 at Era 4.
  - Artillery/missile range: 3 at Era 1, up to 10 at Era 4.
  - Era speed bonus: +10% per era.
- Combined stacks move at the **slowest unit’s speed**.
- Split and merge armies in owned provinces.
- **PvP attacks must arrive inside the war window.** The server blocks or warns before launch.
- **Battle fatigue:** the same army cannot attack again for **20 minutes** after a battle. **DEFAULT.**
- The army stays in the captured province; it does not teleport home.

### 9.6 Defender and attacker agency

**Defender (online):**

- Sees the incoming attack, countdown, attacker name, and approximate strength.
- Can **reinforce** from adjacent owned provinces (one reinforcement per incoming attack, DEFAULT).
- Can **retreat** the garrison to an adjacent owned province, ceding the province but saving the troops. Retreat is instant, neutralizes the province, and cannot be used from a capital. **LOCKED.**
- Can **hold** and fight.
- Battle resolves on arrival. No tactical minigame.

**Attacker:**

- Can **recall** before arrival with a small penalty: **10% of committed troops, rounded up, minimum 1 total**. **DEFAULT.** Oil treatment remains **TBD** (`03` §20.3 #18).
- Recall creates feint-and-response play and prevents suicidal attacks.

**Offline defender:**

- Server auto-resolves with **+15% defense**.
- No other bonus. The defender’s standing garrison and fortification are what they are.

### 9.7 Special abilities — v1

| Ability | Effect | Cooldown | Era | Cost |
|---|---|---|---:|---|
| **Mobilization** | +30% infantry growth for 1 hour | 12h | 1+ | Money + food |
| **Airstrike** | 15% garrison damage to one province | 6h | 1+ | Money + oil |
| **Missile Strike** | Heavy garrison damage + province level damage | 12h | 2+ | Money + oil + gold |

- Abilities target **provinces**, not marching armies.
- Cooldowns are per faction, not per province. They persist through elimination/respawn and clear at season end. **LOCKED.**
- Balance numbers are **DEFAULT/TBD** and live in config.
- UI: abilities panel during war, confirm target, show cooldown and cost.
- All abilities are war-only in v1. **DEFAULT.**

### 9.8 Capital

- **+25% defense.**
- Support events **×3**.
- Produces **money**.
- Capture rules in §5.5.
- Relocation when captured; optional once-per-season peacetime relocation for a cost. **DEFAULT.**

## 10. Research and eras

### 10.1 The four eras

| Era | Theme | Opens |
|---|---|---:|
| **1** | WW1 | Day 1 |
| **2** | WW2 | Day 8 |
| **3** | Modern | Day 16 |
| **4** | Advanced | Day 24 |

- The era **calendar** opens the era. Research unlocks the tools inside it.
- **Research is instant on payment.** No timers.
- Each era has **5 main techs** plus small side branches for infantry weapons and skills.
- To unlock the next era’s first tech, the player must own **any 3 of the 5 main techs** from the previous era. Players can skip 2.
- The calendar still gates the era; you cannot enter Era 2 before day 8 even with 3 techs.

### 10.2 Shape

**Linear eras with side branches. LOCKED.**

Example main track:

- **Era 1:** Rifles → Entrenchment (Defender) → Light Tank → Biplane → Artillery.
- **Era 2:** Anti-tank → Medium Tank → Fighter → Rocket Artillery → Combined Arms.
- **Era 3:** Anti-air → Main Battle Tank → Jet → Guided Missile → Precision Doctrine.
- **Era 4:** Drone → Advanced Tank → Stealth Aircraft → Long-Range Missile → Network Warfare.

Side branches:

- Infantry weapons: rifles, anti-tank, anti-air.
- Infantry skills: Defender, Raider, Marcher.
- Economic techs: small production/storage bonuses.

### 10.3 Costs and catch-up

- Research costs money, plus gold for late-era techs. Exact costs in config. **TBD.**
- No tech stealing.
- No catch-up discount in v1. **DEFAULT.** A player who does not research faces a real tech gap.
- Research is instantaneous, so a rich player can catch up quickly; the era calendar is the main pacing.
- No research queue in v1.

---

## 11. Alliances and social

### 11.1 Rules

- **Maximum 3 factions per alliance.**
- **Formed in peace only.**
- **Locked during war.** No joining, leaving, or inviting during the war window.
- **Leave in peace only.**
- Leaving costs **-5 support** and starts a **24-hour cooldown**:
  - Cannot attack an ex-ally for 24h.
  - Cannot join a new alliance for 24h.
- **Leader invites and kicks.** If the leader is eliminated or abandoned, leadership passes to the earliest-joined active member. **LOCKED.**
- **Kick has no -5 support**, but starts both 24h cooldowns. **DEFAULT.**
- **Eliminated players keep membership but cannot invite, kick, or lead.** **LOCKED.**
- Alliances are **diplomatic and economic**, not military. **LOCKED.**

### 11.2 Benefits

- **Shared vision:** allies see each other’s exact army sizes.
- **Tax-free direct trades:** no 5% market tax on direct ally trades.
- **Shared map color:** allies are visually grouped.
- **Non-aggression:** enforced by the 24h attack cooldown after leaving.
- **No stationing troops in allied provinces.**
- **No joint attacks or shared commands.**
- **No shared victory.**

### 11.3 Communication

- **No in-game chat in v1. LOCKED.**
- Coordination happens externally (Discord or similar).
- The alliance screen must make membership, invites, shared vision, and the war-lock status very clear.
- No global chat, no emotes, no pings in v1.

### 11.4 Termination and elimination

- A player can be kicked by the alliance leader in peace.
- Kicking has the same 24h cooldown as leaving. **DEFAULT.**
- **Alliance membership persists through elimination. DEFAULT.** The player has no map presence until respawn but keeps shared vision and trade access.
- Abandoned players (5 days inactive) are removed from the alliance.
- No alliance award. Awards are individual. **LOCKED.**

### 11.5 Reputation

- The world leaderboard shows faction names, provinces, score, and titles.
- The map shows owner color and faction name in the province panel, not on every province (avoids clutter).
- Betrayal is visible through the 24h cooldown and the support hit. There is no hidden reputation stat in v1.

## 12. AI

### 12.1 Composition

- **10–15 AI warlords**, each holding 2–4 provinces.
- **25–40 neutral provinces** between them.
- AI factions are part of the world, not a backdrop. They can be attacked, eliminated, and can take land.

### 12.2 Archetypes

| Archetype | Behavior |
|---|---|
| **Garrison** | Defends its provinces, reinforces, rarely attacks |
| **Raider** | Attacks weak neighbors during war, retreats when losing |
| **Expansionist** | Takes neutral land anytime, grows toward the player map |

- Each AI warlord has one primary archetype and a simple aggression score.
- AI does not form alliances or negotiate.
- AI can fight other AI and take neutral land at any time.

### 12.3 Rules

- **AI attacks player provinces only during the war window. LOCKED.**
- AI does not attack players under start protection or in refugee provinces.
- AI strength scales with the era: garrison sizes and unit tiers rise at days 8, 16, and 24.
- No dynamic rubber-banding.
- AI does not compete for the two awards.
- AI can be eliminated.
- **AI does not respawn. DEFAULT.** The map naturally consolidates; refugee provinces guarantee player respawns.
- AI behavior must be deterministic enough to test and unpredictable enough to feel alive. Seeded RNG per world.

### 12.4 Testing

- A **bot client** plays full seasons at accelerated speed to test balance, AI behavior, and server load.
- AI decisions are logged and replayable.
- Time-travel mode can fast-forward economy, support, and era gates.

---

## 13. Onboarding, UX, and art

### 13.1 First session

1. **Guest account.** No email required. Player picks a display name, faction name, emblem preset, and color.
2. Joins the current **open world** (or pre-registers if none).
3. Spawns in a capital province. Tutorial overlay, not a scripted campaign:
   - “This is your capital. It produces money.”
   - “This neutral province is weak. Send your 50 infantry.”
   - “Watch the march. The battle resolves on arrival.”
   - “You captured it. Now choose: upgrade your capital or expand.”
   - “This is the war clock. AI and neutral provinces can be attacked anytime. Players only during war.”
4. **First capture within 5–10 minutes.**
5. After the first session, prompt to **link a Google or Apple account**. Linking is required for end-of-season titles, season history, cross-device access, and purchases.
6. **No forced tutorial** after the first capture. The map is the tutorial.

### 13.2 Screens

| Screen | Purpose |
|---|---|
| **World list** | Open/running/finished worlds; day, players, war window, join |
| **Map** | Main screen; top bar support/resources/clock; bottom bar Research, Trade, Alliance, Army, Pass |
| **Province panel** | Owner, resource, level, troops, fortification, actions |
| **Research** | Eras, 3-of-5 gate, side branches, costs |
| **Market** | Listings, direct offers, state exchange, tax, limits |
| **Alliance** | Members, invites, shared vision, trade shortcut, lock status |
| **Army / Orders** | Build queue, training queue, armies in motion |
| **Pass** | Free/premium tracks, XP, missions, rewards, purchase |
| **Shop** | Identity cosmetics, direct purchase |
| **Profile** | Titles, season history, cosmetics, settings |
| **Incoming attack** | Countdown, attacker, approximate strength, reinforce/retreat/hold |
| **Battle report** | Power, bonuses, losses, capture |
| **Season recap** | Leaderboard, personal stats, titles, next world |

### 13.3 UI rules

- **Phone-first, 390px baseline.** Safe areas. Large touch targets.
- **Few numbers per section.** Icons first, text second.
- **War clock always visible.** Peace/war state, time to next transition.
- **Colorblind-safe:** shapes and patterns, not color alone.
- **Enemy counts approximate; own/allied exact.**
- **One modal layer at a time.** The map stays as context.
- **All destructive actions confirm.**
- **Loading, error, and offline states** are designed, not afterthoughts.
- The war window is the loudest thing on the screen.

### 13.4 Art direction — field map / war room

- **Warm paper, ink borders, stamped labels, chunky province colors, NATO-ish unit symbols, big numbers.**
- Subtle terminal/CRT accent only for the war clock and alert states.
- **16-color palette.** One main color per faction; AI and neutral use distinct muted tints.
- **~29 icons:** 5 resources, 16 unit icons (4 types × 4 eras), 8 UI icons.
- **Low-res mask**, nearest-neighbor scaling, no anti-aliasing.
- Moving dots/arrows for marches; pooled sprites and particles.
- **Curated flag/emblem presets**, not user-uploaded images. Faction names pass a profanity filter. This keeps moderation manageable without chat.
- **Audio (minimal, DEFAULT):** UI clicks, march drums, battle impacts, war-window horn, ambient map loop. Full music is TBD.

## 14. Monetization

### 14.1 Principles

- **Free to play. Cosmetics only. No paid power. LOCKED.**
- No resource packs, no troop boosts, no paid research, no paid pass levels.
- The game must be fully playable without spending money.
- Purchases require a linked Google or Apple identity. Guest accounts can play but cannot buy.

### 14.2 Season Pass — v1

| Field | Decision |
|---|---|
| Price | **$5 per 30-day pass** |
| Structure | **Free track + premium track** |
| Progression | **Hybrid:** passive XP from normal play + daily/weekly mission bonuses |
| Rewards | **Identity cosmetics only:** banners, flags, titles, profile badges, map pins, capital monuments |
| Content | 20–30 rewards: 8–10 free, 15–20 premium |
| Buying levels | **No** |
| Mid-season purchase | Yes; retroactively claims earned premium rewards |
| Expiry | Rolling 30 days from purchase; **account-wide**; may cross a season boundary. |
| Progress | Earned in any world; rewards are account-wide |
| Unclaimed rewards | Auto-claim at expiry. **DEFAULT.** |

**Why account-wide rather than per-world:** the game has multiple rolling worlds and mobile IAP. A single 30-day pass is easier to explain, easier to sell on mobile, and avoids fragmenting progress across worlds. **DEFAULT; revisit if per-world passes prove more valuable.**

### 14.3 Cosmetic shop — v1

- **Limited launch catalog.**
- Identity cosmetics only: flags/emblems, banners, map pins, titles, capital monuments.
- **Direct real-money purchase.** No premium currency in v1.
- **Account-wide and permanent.**
- **No overlap with pass-exclusive rewards.** Pass items are seasonal; shop items are evergreen.
- Prices TBD.
- No loot boxes, no randomized paid cosmetics.

### 14.4 Payments

- **Web:** browsable, read-only storefront. No checkout.
- **Mobile:** Apple App Store / Google Play IAP via RevenueCat for digital goods. Platform rules require it; do not link to web checkout inside the mobile app.
- **Entitlements are account-bound** and sync across platforms.
- Webhooks, receipts, refunds, and fraud checks are part of v1.
- **Legal:** terms of service, privacy policy, refund policy, tax/VAT handling, and age rating are launch blockers.

---

## 15. Tech architecture

### 15.1 Stack — LOCKED

- **TypeScript everywhere.**
- **Phaser 3** client.
- **Colyseus** server.
- **PostgreSQL** database.
- One small VPS to start.
- Browser-first; Capacitor wrapper for Android/iOS in v1.

### 15.2 Server authority

- The client sends **intents**: move, attack, upgrade, train, research, trade, ally, buy.
- The server validates ownership, adjacency, range, resources, phase, cooldowns, and protection.
- The client never computes a battle result, resource balance, or map change.
- All timestamps are server UTC.

### 15.3 World runtime

- **One Colyseus room per world.**
- Multiple worlds per process; capacity target **3–5 concurrent worlds per small VPS**, load-tested.
- **Snapshots every 60 seconds** and on key events (capture, elimination, season end, purchase).
- On crash/restart, reload the latest snapshot and replay safe events.
- **Ticks:**
  - Economy and support: every 1 minute.
  - Marches and combat: every 1 second while marches exist.
  - Client sync: delta updates; no full-map spam.

### 15.4 Data model

Core tables:

- `accounts` - guest token, auth identity, created_at, cosmetics, titles, season_history, entitlements. No app-level email column.
- `worlds` — id, name, start_time, war_window_start, status, max_players, map_id.
- `map_provinces` — static: id, name, neighbors, terrain, mask_color.
- `world_regions` — world_id, province_id, owner_id, resource_type, level, troops, is_capital, protection_until.
- `factions` — world_id, account_id, name, emblem, color, support, resources, research, alliance_id, protection_until, doctrine.
- `armies` — id, world_id, owner_id, from, to, units JSON, depart_time, arrive_time, state.
- `alliances` — id, world_id, name, members, locked_until.
- `market_listings`, `trade_log`.
- `season_results`, `season_passes`, `pass_progress`, `missions`.
- `shop_items`, `purchases`.
- `build_queue`, `training_queue`.
- `battle_log`.

**Static map data is separate from per-world state.** This is required for multiple worlds using the same Vardania geometry. Physical names and normalized child tables are refined in `plan/06-data-model.md`; for example, `market_listings` plus direct offers are implemented as `trade_offers`, and province troops are derived from garrison armies plus neutral garrisons rather than stored on `world_regions`.

### 15.5 Auth

- **Guest first:** persistent device token, created instantly.
- **Google/Apple link later:** link a guest account to a Google or Apple identity; login on another device.
- **Linking required** for season rewards, titles, purchases, and cross-device play.
- Account recovery and deletion flows are required before public launch.
- Rate-limit login and linking attempts.

### 15.6 Security and anti-abuse

- Server-side validation of every action.
- Rate limits per account and per IP.
- Trade logs and one-way transfer flags.
- Alt-account checks for market feeding and alliance abuse.
- No client trust for resources, cooldowns, or battle outcomes.
- Admin/moderation tools for names, flags, and reports.
- Secrets in environment variables; no secrets in the client bundle.

### 15.7 Mobile

- **Capacitor** wrapper for Android and iOS.
- Safe areas, touch targets, responsive layout, no hover-dependent UI.
- Platform IAP for digital goods.
- Store review, privacy labels, age rating, and screenshots are launch tasks.
- If mobile slips, the web build must not be blocked by it.

### 15.8 Testing

- **Unit tests** for core rules: production, upkeep, support, combat, capture, trade, research, pass XP.
- **Integration tests** for auth, linking, payments, entitlements, world lifecycle.
- **Bot client** for full-season simulations and load tests.
- **Time-travel mode** for economy, support, and era gates.
- **Snapshot recovery drill** before launch.
- **Balance tests** with accelerated seasons.

### 15.9 Ops

- TLS, domain, backups, monitoring, logging, error tracking, alerts.
- Daily database backups; restore tested.
- Graceful shutdown: snapshot before exit.
- Status page or at least a public status channel.
- Cost target: one small VPS for v1; scale worlds before scaling hardware.

## 16. V1 scope

### 16.1 In scope

- Full **30-day seasons**; multiple rolling worlds; world list.
- **20–24 players + 10–15 AI warlords**; **80–100 provinces**; Vardania.
- Economy, support/rebels, PvP war window, defender/attacker agency, elimination/respawn.
- Research/eras, advanced units, alliances, trade, **special abilities**.
- **$5 season pass + limited cosmetic shop.**
- **Guest first, Google/Apple link**; **Android/iOS Capacitor builds**.
- Field-map art direction; phone-first UI; colorblind-safe.
- Server-authoritative; PostgreSQL; snapshots; time-travel and bot tests.

### 16.2 Out of scope

- Global chat (external Discord only).
- Multiple maps (one map: Vardania).
- Naval units, islands requiring transport, terrain combat modifiers.
- Fog of war and scouting; exact enemy troop counts.
- Alliance stationing, joint attacks, shared victory, alliance award.
- Player-created worlds; advanced AI diplomacy.
- Localization beyond English.
- Cosmetic marketplace/trading; premium currency.
- Voice, emotes, user-uploaded images.
- Full music/orchestral audio (minimal cues only).
- Public-scale infrastructure beyond initial VPS capacity; scale after load tests.

### 16.3 Scope risk — read this

This is **Beta-level scope**, not Alpha 3. It includes multiple worlds, a pass, a shop, mobile builds, and special abilities. That is a large build.

If the schedule slips, the lowest-risk deferral order is:

1. **Mobile app** (web stays launch-ready).
2. **Cosmetic shop** (pass still monetizes).
3. **Special abilities** (defender agency still carries the war).

The core season, war window, economy, support, research, alliances, trade, and pass are the last things to cut. **Any deferral requires product-owner approval; this is a recommendation, not a scope change.**

---

## 17. Build order

| Phase | Deliverable | Playable gate |
|---|---|---|
| **0. Foundation** | Repo, shared types, DB schema, static Vardania map, Colyseus room, guest auth, config | Two clients see the same map |
| **1. Alpha 1 — core loop** | Map, regions, march, AI/neutral, five resources, upgrades, build/training queues, support/rebels, basic UI | One player captures a province and upgrades a region |
| **2. Alpha 2 — war** | War window, PvP, defender reinforce/retreat/hold, attacker recall, offline defense, elimination/respawn, protection | Two players fight a full war window |
| **3. Alpha 3 — depth** | Research/eras, advanced units, alliances, trade, special abilities | A full 30-day season can be played end to end |
| **4. Beta systems** | Multiple worlds/list, season awards/recap, pass, shop, mobile wrapper | Two worlds run at once; pass purchase works |
| **5. Hardening** | Load tests, bot client, time-travel, security, payments, legal, store review | 24-player world survives a full season |
| **6. Launch** | Rolling worlds, $5 pass, shop, mobile builds, monitoring | Public/friends launch |

Each phase must be playable before the next starts. Do not build the pass before the war window works.

---

## 18. Decision log

| # | Area | Decision | Status |
|---:|---|---|---|
| 1 | Core fantasy | One country, many factions; players are warlords, not nations | LOCKED |
| 2 | Title | **The Succession** | LOCKED (trademark check TBD) |
| 3 | Setting | **Vardania** | LOCKED |
| 4 | World size | 20–24 players, 80–100 provinces | LOCKED |
| 5 | Victory | Two titles, fixed 30 days | LOCKED |
| 6 | War window | 6 hours, three-beat rhythm | LOCKED |
| 7 | Start placement | Spaced random capitals; food/water/weak-neutral guarantees | LOCKED |
| 8 | Map shape | One contiguous landmass; no navy; terrain visual only | LOCKED |
| 9 | First session | Fast first conquest; light tutorial | LOCKED |
| 10 | Upkeep | Food/water/money passive; oil for operations | LOCKED |
| 11 | Capital | Always produces money | LOCKED |
| 12 | Upgrade value | Fortress first | LOCKED |
| 13 | Market liquidity | State exchange backstop | LOCKED |
| 14 | Queues | Timed build/training; instant research | LOCKED |
| 15 | Rebellion | One active rebellion + 2h grace | LOCKED |
| 16 | Rebel behavior | Take one province and hold | LOCKED |
| 17 | Support in combat | No combat effect | LOCKED |
| 18 | Defender agency | Reinforce, retreat, or hold | LOCKED |
| 19 | Window boundary | Attacks must arrive inside the war window | LOCKED |
| 20 | Intel | Exact own/allied; approximate enemy | LOCKED |
| 21 | Attacker recall | Recall with a small penalty | LOCKED |
| 22 | Research shape | Linear eras + side branches; 3-of-5 gate | LOCKED |
| 23 | Alliances | Diplomatic and economic only | LOCKED |
| 24 | Chat | None in v1 | LOCKED |
| 25 | AI world | 10–15 AI warlords + neutral land | LOCKED |
| 26 | AI aggression | Attacks players only during war | LOCKED |
| 27 | Respawn fallback | Reserved refugee provinces | LOCKED |
| 28 | Capital capture | Support + capped loot | LOCKED |
| 29 | Combat model | Power comparison | LOCKED |
| 30 | Defense stacking | Additive, capped at +75% | LOCKED |
| 31 | V1 scope | Full 30-day season | LOCKED |
| 32 | Joining | Multiple worlds with a world list | LOCKED |
| 33 | World lifecycle | Rolling auto-created worlds | LOCKED |
| 34 | Login | Guest first, link later | LOCKED |
| 35 | Link timing | After first session; required for rewards | LOCKED |
| 36 | Art | Field map / war room | LOCKED |
| 37 | Success metrics | New-player return + war-window return + day-30 completion | LOCKED |
| 38 | Monetization | $5 pass at launch; final extras round adds limited shop | LOCKED |
| 39 | Pass structure | Free track + premium track | LOCKED |
| 40 | Pass progression | Hybrid passive XP + missions | LOCKED |
| 41 | Pass rewards | Identity cosmetics only | LOCKED |
| 42 | Pass price | $5 | LOCKED |
| 43 | V1 extras | Special abilities, cosmetic shop, mobile app | LOCKED |
| 44 | Pass term | Account-wide rolling 30 days from purchase | DEFAULT |
| 45 | Capital relocation | Once per season in peace, for a cost | DEFAULT |
| 46 | Alliance on elimination | Membership persists | DEFAULT |
| 47 | AI respawn | None | DEFAULT |
| 48 | Trade limits | 5 trades/day, 500 gold/day, 5% tax | DEFAULT |
| 49 | Audio | Minimal cues, no full music | DEFAULT |
| 50 | Build queues | One national build + one national training | DEFAULT |
| 51 | Infantry doctrine | National; one weapon + one skill | DEFAULT |
| 52 | Battle fatigue | 20 minutes | DEFAULT |
| 53 | March speeds | Config defaults in §9.5 | DEFAULT |
| 54 | Unit stats | Config defaults in §9.4 | DEFAULT |
| 55 | Pass unclaimed rewards | Auto-claim at expiry | DEFAULT |
| 56 | Movement | Land movement is one adjacent province per march | LOCKED |
| 57 | Movement | A stack containing any land unit moves as land | LOCKED |
| 58 | Retreat | Retreat is instant and neutralizes the province | LOCKED |
| 59 | Retreat | A capital cannot be retreated from | LOCKED |
| 60 | Capital economy | A level-1 capital produces 15 money/hr; its effective resource is money | DEFAULT |
| 61 | Capital relocation | Capture-triggered relocation is automatic to the highest-level owned province | LOCKED |
| 62 | Capital events | The capital x3 applies to regional events only, not the one-time -5 | LOCKED |
| 63 | Respawn | Respawn resets support to 60 | DEFAULT |
| 64 | Respawn | The respawn province is level 1 with 0 troops | DEFAULT |
| 65 | Abandonment | Abandonment return dissolves the old AI faction | LOCKED |
| 66 | Protection | A protected player loses protection by attacking a player | LOCKED |
| 67 | Spectator | Spectators auto-respawn when a respawn location appears | DEFAULT |
| 68 | Recall | Recall loses 10% rounded up, minimum 1 total | DEFAULT |
| 69 | Combat | Winner losses round half up and distribute by largest remainder | LOCKED |
| 70 | Doctrine | Skill applies to the whole stack; weapon applies only to infantry | LOCKED |
| 71 | Support | "Heavy losses" means at least 50% of committed combat units | DEFAULT |
| 72 | Rebellion | A rebel uprising resolves immediately with no defender window | LOCKED |
| 73 | Rebellion | An active rebel group persists through elimination and respawn | LOCKED |
| 74 | Queues | Cancellation refunds 50%, including capture; elimination/season end refunds nothing | DEFAULT |
| 75 | Training | Training over cap loses the excess | DEFAULT |
| 76 | Trade | Trade receipts that would overflow storage are rejected | LOCKED |
| 77 | Trade | Market tax is charged to the gold-receiving side and burned | LOCKED |
| 78 | Trade | Trade freezes at war start rather than cancelling | DEFAULT |
| 79 | Alliances | Leader invites/kicks; leadership passes to the earliest active member | LOCKED |
| 80 | Alliances | Kick has no -5 but starts both 24h cooldowns | DEFAULT |
| 81 | Alliances | Eliminated players keep alliance membership but cannot lead | LOCKED |
| 82 | Awards | An unlinked guest gets the recap but no title or history | LOCKED |
| 83 | Awards | An AI-controlled faction at freeze is ineligible | LOCKED |
| 84 | Worlds | An underfilled open world runs without AI backfill | DEFAULT |
| 85 | War window | The first war window begins 18h after T0 | DEFAULT |
| 86 | War window | A PvP march is cancelled if an admin time change breaks the window | LOCKED |
| 87 | Season end | Season-end arrival uses `< season_end` | LOCKED |
| 88 | Awards | The final tie-break is lower faction ID | LOCKED |
| 89 | Storage | Eliminated/spectator storage floor is 500 per resource | DEFAULT |
| 90 | Abilities | Ability cooldowns persist through respawn and clear at season end | LOCKED |
| 91 | Troop cap | The cap limits growth/training but not arriving, retreating, or capturing armies | LOCKED |
| 92 | Combat | Mixed-stack counters use the opposing count-share-weighted average | LOCKED |
| 93 | Combat | Counter lookup is the same on attack and defense | LOCKED |
| 94 | Economy | Production multipliers apply to the terrain resource and the 5/hr money trickle | DEFAULT |
| 95 | Trade | Market tax rounds down with a 1-gold minimum on positive gold receipts | DEFAULT |

Rows 56-95 were approved on 2026-10-23 from `03` §20.2 items 1-16 and 18-41. Item 17 (major-battle support threshold) remains TBD under `D-TBD-SUPPORT`.

## 19. Changes to the existing specs

Where this file and `01`–`08` disagree, **this file wins for v1**.

| File | Main change | Reason |
|---|---|---|
| `README.md` | Players 20–50 → 20–24 + 10–15 AI; one country/many factions; title and country named; monetization and mobile updated | Resolves map scale and identity contradictions |
| `01-world-and-seasons.md` | Faction framing; fixed 30 days; refugee respawns; capital capture; AI aggression rule | Makes the world coherent with one country |
| `02-economy.md` | Capital produces money; food/water/money upkeep; fortress-first upgrades; timed build queue; state exchange | Closes the economy loop and fixes upgrade ROI |
| `03-politics-and-support.md` | One active rebellion + grace; rebels take one province and hold; no combat effect | Removes the death spiral and keeps combat readable |
| `04-military-and-eras.md` | Stats table; fortification cap; defender/attacker agency; window boundary; abilities in v1; terrain bonuses removed | Fills the missing combat rules |
| `05-alliances-and-trade.md` | Diplomatic/economic alliances; tax-free ally trades; no chat; state exchange; limits kept | Makes alliances useful without shared armies |
| `06-map-and-art.md` | Vardania, 80–100 provinces, field-map art, no navy, exact/approx intel, curated emblems | Locks the map and visual identity |
| `07-tech-architecture.md` | Static map vs. per-world regions; guest/social auth; payments; pass/shop tables; mobile; multiple worlds | Supports the actual v1 scope |
| `08-roadmap-and-open-questions.md` | V1 is Beta-level; build order, success metrics, open questions updated | Records the real scope and risks |

---

## 20. Open questions and TBDs

These are **not** decided. Do not invent answers in code.

1. Exact unit stats, tech costs, build/training times, and march speeds. The values in this doc are starting points; tune in playtests.
2. War window start time per world. Config; default to the primary player base’s evening.
3. World capacity per VPS. Load-test target: 3–5 concurrent worlds.
4. RevenueCat/IAP product details, tax/VAT, refunds, terms, privacy, age rating.
5. Mobile store review timeline; RevenueCat/IAP product setup. Mobile must not link to an external checkout for digital goods.
6. Pass term: account-wide rolling 30 days from purchase; chosen; revisit after playtests.
7. Shop catalog, prices, and pass-exclusive overlap.
8. AI respawn/replenishment. Chosen none; revisit if the map empties too fast.
9. Alliance membership on elimination. Chosen persists; revisit if it creates ghost advantages.
10. Capital relocation and refugee-pool recycling. Chosen once per season in peace; tune the cost.
11. Score formula scaling constants.
12. Pass mission list and XP curve.
13. Moderation for faction names and emblem presets.
14. Localization. English only in v1.
15. Audio direction; minimal cues only for now.
16. Accessibility specifics beyond colorblind-safe shapes and large touch targets.
17. Trademark/search check for “The Succession.”
18. Lore: province names, AI warlord names, flag/emblem presets, capital name.
19. Account deletion, data export, privacy compliance.
20. Anti-cheat and alt-account detection details.
21. Time-travel and bot tooling.
22. Deployment, backups, monitoring, and alerting.
23. Team capacity and timeline.

---

## 21. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Beta-level scope** | High | Phase the build; defer mobile → shop → abilities only with approval; protect the core season and pass |
| Monetization perception | Medium | Cosmetics only; no paid power or pass levels; transparent pricing |
| Pass distorts play | Medium | Hybrid XP; normal-play missions; no mandatory grind |
| Mobile IAP complexity | High | Web-first; Capacitor after core; platform IAP; cross-platform entitlements |
| Map/AI budget | Medium | Generator constraints; test 24 players + 15 AI; validate resource access |
| War-window retention | Medium | In-game clock; world list shows the window; no email reminders |
| Support death spiral | Medium | One active rebellion + grace; playtest offline scenarios |
| Snowballing | Medium | Upkeep, water, capture level drop, respawn, season reset |
| Trade liquidity | Low/Medium | State exchange; monitor gold supply |
| No in-game chat | Medium | External Discord; clear alliance UI; revisit for public launch |
| Guest identity loss | Medium | Link prompt; rewards require linking; recovery code |
| AI passivity | Medium | Archetypes, era scaling, bot tests |
| Multiple-world operations | High | Room isolation, snapshots, load tests, graceful shutdown |
| Legal/payments | High | Budget time for terms, privacy, refunds, tax, age rating |
| Name collision | Low | Trademark/search check before public launch |

---

## 22. Definition of done and success targets

### 22.1 Acceptance criteria

- A new guest can join an open world, complete the tutorial, capture a province, and return on day 2.
- A full 30-day season runs without crashes with 20–24 players + AI.
- The world list correctly shows open, running, and finished worlds.
- PvP attacks only launch and arrive inside the war window.
- Defenders can reinforce, retreat, or hold; offline defense resolves correctly.
- Elimination and respawn work, including refugee provinces and 24h protection.
- All five resources produce, store, upkeep, and trade correctly.
- Support thresholds, penalties, and the one-active-rebellion loop work.
- Four eras unlock on schedule; the 3-of-5 gate works; units unlock.
- Alliances cap at 3, lock in war, and apply the leave/betrayal rules.
- The market, direct offers, state exchange, tax, and daily limits work.
- AI warlords use their archetypes and attack players only in war.
- The pass has free/premium tracks, XP, missions, rewards, and a $5 purchase.
- The shop sells identity cosmetics only, account-wide, with entitlements.
- Mobile builds handle safe areas, touch, and IAP; store review passes.
- Special abilities have cooldowns, era gates, and a clear UI.
- Server authority, rate limits, trade logs, and alt checks are in place.
- Unit, integration, bot, time-travel, and load tests pass.
- Terms, privacy, refunds, tax, and age rating are published.

### 22.2 Success targets — DEFAULT, tune after launch

- **80%** of new players capture a province within 15 minutes.
- **40%** return on day 2.
- **50%** of active players join at least one war window per week.
- **30%** of players are active on day 30.
- **99.5%** uptime; no data loss; **<200ms** intent latency.

The three headline metrics are: **new-player understanding and return**, **war-window return**, and **day-30 season completion**.

---

## Appendix A. Config defaults

> All values are starting points. They live in config and are tuned in playtests.

| Area | Value |
|---|---|
| Season length | 30 days |
| Peace / war | 18h / 6h |
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
| Build time | 1h / 2h / 4h / 8h |
| Production multiplier | 1.0× / 1.5× / 2.0× / 2.5× / 3.0× |
| Troop caps | 100 / 200 / 300 / 400 / 500 |
| Storage | 500 × provinces |
| Base production | 10/hr resource, 5/hr money |
| Food upkeep | 1/hr per 10 infantry |
| Water upkeep | 1/hr per province level |
| Battle fatigue | 20 min |
| March speed | Infantry 5 min, tank 3 min, aircraft 1 min per province |
| Recall penalty | 10% of troops |
| Pass price | $5 |
| Pass term | 30 days, account-wide |
| Pass rewards | 8–10 free, 15–20 premium |

---

*End of v1 design lock.*







