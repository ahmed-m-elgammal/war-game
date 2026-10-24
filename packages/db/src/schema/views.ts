/**
 * Derived Read-Model Views
 *
 * Implements SQL views for aggregated state projection. The `province_garrison`
 * view replaces the legacy world_regions.troops column by summing stationed
 * garrison armies and neutral garrisons.
 */

import { sql } from "drizzle-orm";
import { bigint, smallint, uuid } from "drizzle-orm/pg-core";
import { gameSchema, unitTypeEnum } from "./enums.js";

export const provinceGarrison = gameSchema
  .view("province_garrison", {
    worldId: uuid("world_id").notNull(),
    provinceId: smallint("province_id").notNull(),
    unitType: unitTypeEnum("unit_type").notNull(),
    count: bigint("count", { mode: "number" }).notNull()
  })
  .with({ securityInvoker: true }).as(sql`
    select
      g.world_id,
      g.province_id,
      g.unit_type,
      sum(g.count)::bigint as count
    from (
      select
        a.world_id,
        a.location_province_id as province_id,
        au.unit_type,
        au.count
      from game.armies a
      join game.army_units au
        on au.world_id = a.world_id
       and au.army_id = a.army_id
      where a.state = 'garrison'

      union all

      select
        ng.world_id,
        ng.province_id,
        ng.unit_type,
        ng.count
      from game.neutral_garrisons ng
    ) g
    group by g.world_id, g.province_id, g.unit_type
  `);
