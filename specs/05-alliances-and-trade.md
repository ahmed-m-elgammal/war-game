# 05. Alliances and Trade

## Alliances (LOCKED)

| Rule | Value | Status |
|---|---|---|
| Max alliance size | **3 players** | LOCKED |
| Formed during | Peace time | LOCKED |
| Allies attacking each other during war | **Not allowed** | LOCKED |
| Alliance changes during war | **Locked** (no joining or leaving) | LOCKED |
| Leaving an alliance | Allowed in peace only | LOCKED |

With 20-50 players per world, this gives roughly 7 to 16 alliances, so no single group can dominate.

## How an alliance is formed

1. A player sends an alliance invite to another player (peace only).
2. The other player accepts or declines.
3. A third member can be invited the same way (max 3 total).
4. The alliance gets a name and a shared pixel emblem (cosmetic).

## Betrayal rules (DEFAULT, suggested)

Betrayal stays possible but costs something.

| Rule | Value |
|---|---|
| Leaving an alliance (peace only) | **-5 support** (the people dislike betrayal) |
| Cooldown before you can attack an ex-ally | **24 hours** (one full war window) |
| Cooldown before joining a new alliance | 24 hours |

This closes the "leave right before war, then strike" loophole.

## Alliance benefits (DEFAULT)

- Shared **ally list** and map colors (allies shown in a team color).
- Allies can **send resources** to each other through trade (see below).
- Allies can **see each other's army size** on the map (not exact unit types).
- No shared victory: the Conqueror and Best Nation awards go to **individuals**. **DEFAULT** (TBD: add an alliance award later if wanted)

## Trade (LOCKED)

Two ways to trade, both during **peace**.

| Method | How it works |
|---|---|
| **Open market** | A player posts a listing ("sell 100 Food for 5 Gold"). Anyone can buy it. |
| **Direct offers** | A player sends an offer to one specific player. They accept or decline. |

### Currency rules (LOCKED)

- **Gold is the trade currency.** Items on the market are priced in Gold.
- **Money cannot be sent** to other players.
- Tradeable goods: **Food, Water, and Oil**, always paid for in **Gold**. Money is never tradeable. **DEFAULT**

### Abuse protection (DEFAULT, tune later)

| Rule | Value |
|---|---|
| Market tax (removed from the trade) | 5% |
| Daily trade limit per player | 5 trades, 500 Gold total |
| Minimum account age to trade | 24 hours in the world |
| Alt-account check | Flag accounts that repeatedly send everything to one player |
| Trade history | Logged in the database for review |

## UI notes

- Market: one list with filters (resource), sorted by price. Big Gold price, small pixel icons.
- Offers: an inbox with accept / decline buttons.
- Show the tax before confirming.
