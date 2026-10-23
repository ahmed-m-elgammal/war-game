# 04. Military and Eras

## Unit types (LOCKED)

Four fixed unit types, plus skills and weapons on infantry. Each era has a stronger version of each type with a new pixel icon.

| Type | Role | Cost to produce |
|---|---|---|
| **Infantry** | Cheap, holds ground, the only unit with skills and weapons | **Free**, grows in regions |
| **Tank** | Strong on land, good against infantry | Money + Oil, trained in a queue |
| **Aircraft** | Fast, can strike any region in reach | Money + Oil, trained in a queue |
| **Missile / long-range** | One-shot long-range strike, expensive | Money + Oil (+ Gold for elite), trained in a queue |

In Era 1, "long-range" is **artillery** (shorter range). From Era 2 it becomes **missiles**. **DEFAULT**

## Troop production (LOCKED)

- **Infantry grows for free** in every owned region, up to the region's troop cap (see `02-economy.md`). Growth stops if food runs out.
- **Tanks, aircraft, and missiles** cost resources and are trained in a **queue** (1 queue per country, can be upgraded). **DEFAULT**
- Growth default: **+20 infantry per hour per region level**, up to the cap. **DEFAULT**

## Infantry skills and weapons (LOCKED idea, DEFAULT set)

Keep it small so the UI stays clean. Each infantry group (or the whole country) has **1 skill and 1 weapon** chosen from a small set.

| Weapons (default) | Effect |
|---|---|
| Rifles | Balanced |
| Anti-tank | Strong against tanks |
| Anti-air | Strong against aircraft |

| Skills (default) | Effect |
|---|---|
| Defender | +20% defense in own regions |
| Raider | +20% attack on enemy regions |
| Marcher | +25% march speed |

Skills and weapons are unlocked via the research tree.

## Counters (DEFAULT)

| Attacker \ Defender | Infantry | Tank | Aircraft |
|---|---|---|---|
| Infantry (rifles) | 1.0× | 0.5× | 0.3× |
| Infantry (anti-tank) | 0.8× | 1.5× | 0.3× |
| Infantry (anti-air) | 0.8× | 0.5× | 1.5× |
| Tank | 1.5× | 1.0× | 0.2× |
| Aircraft | 1.0× | 1.5× | 1.0× |
| Missile | Hits the **region**: removes 20% of garrison and damages level | | |

## Combat (DEFAULT, keep simple)

1. Attacker sends a group from region A to region B. It marches over time (speed depends on unit type and era).
2. On arrival, both sides' power is calculated:

```
power = sum(unit_count * unit_attack_or_defense * counter_multiplier)
        * skill_bonus * era_bonus * terrain_or_capital_bonus
```

3. The side with higher power wins. Losses are proportional: the loser loses all units, the winner loses units equal to `loser_power / winner_power * winner_count` (never below 0).
4. If the attacker wins and the region's garrison reaches 0, the region changes owner.
5. **Capital defense bonus:** +25%. **DEFAULT**

Combat is calculated on the **server**. The client only plays the march and battle animation.

## Offline defense (LOCKED idea)

When a defender is offline, the server resolves the fight using the defender's current stats, plus a +15% protection bonus. **DEFAULT**

## Special abilities during war (TBD, DEFAULT idea)

Optional, cost resources, cooldown-based. Add only after core combat works.

| Ability | Effect | Cooldown | Era |
|---|---|---|---|
| Mobilization | +30% infantry growth for 1 hour | 12 h | 1+ |
| Airstrike | Aircraft hit one region, remove 15% garrison | 6 h | 1+ |
| Missile strike | Heavy damage to one region at long range | 12 h | 2+ |

## Eras (LOCKED)

Four eras. The **calendar opens each era**, and **research unlocks tech inside it**.

| Era | Name | Opens on season day | Notes |
|---|---|---|---|
| 1 | WW1 | Day 1 | Infantry, early tanks, biplanes, artillery |
| 2 | WW2 | Day 8 | Better tanks, fighters/bombers, first missiles |
| 3 | Modern | Day 16 | Modern armor, jets, guided missiles |
| 4 | Advanced | Day 24 | Drones, advanced missiles, high-tech units |

- Era dates are **DEFAULT** and tunable.
- Players cannot skip an era: before the calendar opens it, the tech is locked. **LOCKED**
- Players who do not research fall behind and face a tech gap. **LOCKED**
- Use **generic names** only (for example "Light Tank", "Fighter"), no real model names. **LOCKED**

## Research tree (LOCKED rules)

- Tech costs **resources**. **LOCKED**
- Tech has **tier requirements**: you must unlock earlier tech first. **LOCKED**
- Tiers match the eras. To unlock the first tech of an era you must have researched a set number of techs from the previous era (default: **at least 3**). **DEFAULT**
- Research is instant on payment (no timers). **DEFAULT**

Example branch (DEFAULT):

```
Era 1: Rifles -> Entrenchment (Defender) -> Light Tank -> Biplane -> Artillery
Era 2: Anti-tank weapon -> Medium Tank -> Fighter -> Rocket (first missile)
Era 3: Anti-air weapon -> Main Battle Tank -> Jet -> Guided Missile
Era 4: Drone -> Advanced Tank -> Stealth Aircraft -> Long-Range Missile
```

## Art impact

4 unit types × 4 eras = **16 unit icons** (see `06-map-and-art.md`).
