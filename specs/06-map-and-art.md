# 06. Map and Art

## Map (LOCKED)

- **One map to start.** It is a **fictional country** inspired by the shape and geography of a real region, with invented region names and no real politics. **LOCKED**
- About **60-100 regions** in total (enough for 20-50 players plus AI). **DEFAULT**
- Each player starts with **1 region** (capital). The rest start as AI or neutral regions. **LOCKED**
- Regions have neighbors. Troops can only march between neighboring regions, except aircraft and missiles, which have a range. **DEFAULT**

## Region data

| Field | Type | Notes |
|---|---|---|
| `id` | number | Unique, matches the color ID on the map mask |
| `name` | string | Invented name |
| `owner` | player id / `ai` / `neutral` | |
| `resource_type` | `money`/`food`/`water`/`oil`/`gold` | One type per region |
| `level` | 1-5 | |
| `troops` | number | Infantry garrison |
| `troops_cap` | number | From level |
| `neighbors` | list of region ids | |
| `is_capital` | boolean | |
| `terrain` | string | Optional visual only (DEFAULT) |

## Look (LOCKED): "pixels with little work"

The goal is a clear pixel look that is cheap to produce.

- **Flat-colored regions drawn at low resolution and scaled up** with nearest-neighbor scaling, so the edges look chunky and pixelated.
- **Palette of about 16 colors.** One main color per player. A different tint for AI and neutral regions.
- **Small pixel icons** on top of regions (resource, level, troop number).
- **Bold pixel font, big numbers.** Troop counts must be readable on a phone.
- Troops are shown as small **moving dots or arrows**, like the reference ad.

## How the map is built

1. Draw the map as a **low-res bitmap** (for example 320 × 180 pixels).
2. Each region is filled with a **unique color ID** in a hidden **mask image**.
3. The mask is used for **click detection**: read the pixel under the finger, look up the region id.
4. The visible map is drawn from the region owner colors, not from the mask.
5. Scale up with `pixelArt: true` in the engine so edges stay sharp.

## MVP icon list (fewer than 30 icons)

| Group | Count | Items |
|---|---|---|
| Resources | 5 | Money, Gold, Food, Water, Oil |
| Unit icons | 16 | 4 types × 4 eras (infantry, tank, aircraft, missile) |
| Region/UI | about 8 | Level star, capital star, shield (protection), warning, alliance, trade, research, rebel |

Total about 29 icons, each 16×16 or 24×24 pixels. **DEFAULT**

## Screens (clear and simple)

| Screen | Content |
|---|---|
| **Map** | Main screen. Top bar: support bar, resources, war/peace clock. Bottom bar: Research, Trade, Alliance, Army |
| **Region panel** | Tap a region: owner, resource, level, troops, buttons (upgrade, send troops) |
| **Research** | Tree by era, locked/unlocked states |
| **Market** | Listings and offers |
| **Alliance** | Members and invites |
| **World list** | Worlds with day X/30 and war window time |

## Design rules

1. Never more than **a few numbers per screen section**.
2. Always show the **war/peace clock** at the top.
3. Warnings use **icons first, text second**.
4. All colors must stay readable for **color-blind players** (add shapes or patterns, not only colors). **DEFAULT**
5. UI must work on a **phone-sized screen** first (the browser is tested at 390 px wide).

## Naming and theme

- All names are invented. No real country, leader, or party names.
- Unit names are generic ("Light Tank", "Fighter", "Guided Missile").
