# 02. Economy

## Five resources (LOCKED)

| Resource | Job | Where it comes from | If you run out |
|---|---|---|---|
| **Money** | Pays for building, region upgrades, unit training, research, upkeep. Cannot be sent to other players. | Most regions | Cannot build or train; upkeep unpaid lowers support |
| **Gold** | The **trade currency** between players. Rare. | A few mining regions | Cannot buy on the market |
| **Food** | Feeds your people and troops | Farmland regions | **Support drops**; infantry growth stops |
| **Water** | Keeps cities and farms running | Water/river regions | **Production and support drop** |
| **Oil** | Fuels tanks, aircraft, missiles | Oil regions | Vehicles and missiles cannot be trained or used |

## Regions produce resources

- Each region has **one resource type**, shown as a pixel icon on the map. **DEFAULT**
- Each region also produces a small amount of **money**. **DEFAULT**
- Gold regions are rare: about 1 in 10 regions. **DEFAULT**
- Production is added every server tick (see tech doc), based on region level.

### Starting values (placeholders, tune in playtests)

| Item | Value |
|---|---|
| Base production per region (level 1) | 10 of its resource per hour |
| Money per region (level 1) | 5 per hour |
| Production growth per level | +50% per level |
| Storage cap per resource | 500 × number of regions owned |
| Food upkeep | 1 food per hour per 10 troops |

## Region levels (LOCKED idea, DEFAULT numbers)

- Regions have levels 1-5.
- Upgrading costs money plus the region's resource.
- A higher level gives **more troop capacity** and **faster production**.

| Level | Troop cap (infantry) | Production multiplier | Upgrade cost (money) |
|---|---|---|---|
| 1 | 100 | 1.0× | n/a |
| 2 | 200 | 1.5× | 100 |
| 3 | 300 | 2.0× | 250 |
| 4 | 400 | 2.5× | 500 |
| 5 | 500 | 3.0× | 1000 |

## What resources are spent on

| Spend | Uses |
|---|---|
| Region upgrades | Money (+ region resource) |
| Training tanks, aircraft, missiles | Money + Oil (and Gold for elite versions) |
| Research | Money (+ Gold for late eras) |
| Special abilities during war | Money + Oil (see `04-military-and-eras.md`) |
| Trading | Gold (and any resource on the market) |

Persistent upgrades between seasons are **cosmetic only** and never use in-season resources. **LOCKED**

## Starting resources (DEFAULT)

| Resource | Amount |
|---|---|
| Money | 500 |
| Food | 200 |
| Water | 200 |
| Oil | 50 |
| Gold | 0 |

## Early game loop

1. Start with 1 capital region and a small free infantry army.
2. Attack nearby AI regions (any time) to gain more regions and resources.
3. Upgrade regions, research, and prepare for the first war window.
4. Trade with other players during peace, using Gold.

## Shortage rules (LOCKED link to politics)

Shortages of Food and Water lower **support** (see `03-politics-and-support.md`). Always show a warning icon before a shortage happens.
