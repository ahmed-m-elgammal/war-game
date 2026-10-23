-- WARGAME v1 physical schema — planning baseline.
--
-- This is the target shape for `packages/db/src/schema` and the first Drizzle
-- migration. It is intentionally written as plain PostgreSQL so it can be
-- reviewed without a TypeScript build.
--
-- Authority:
--   specs/09-v1-design-lock.md      v1 scope and locked rules
--   plan/03-gameplay-rules.md       state transitions and invariants
--   plan/05-architecture.md         persistence/ownership model
--   plan/06-data-model.md           entity/field/storage mapping
--
-- Conventions:
--   * `game` is the application schema. Supabase Auth owns `auth.users`.
--   * `account_id` is a Supabase Auth UUID; there is no application email column.
--   * World-scoped entity ids are per-world BIGINTs for deterministic replay.
--   * Static map/config data is NOT stored here. It lives in packages/map-data
--     and packages/config, versioned by `map_id`/`config_version`.
--   * Projection tables are read models. The room snapshot + ordered input log
--     are the authority for live gameplay (05 §9).
--   * No table is deleted by gameplay. Retention/archival is a separate job.
--
-- This file is not a production migration yet. Review with `plan/06-data-model.md`
-- before generating Drizzle migrations.

create schema if not exists game;

/* -------------------------------------------------------------------------- */
/* Enumerations                                                               */
/* -------------------------------------------------------------------------- */

create type game.account_status as enum ('active', 'banned', 'disabled', 'merged');
create type game.entitlement_kind as enum ('pass', 'cosmetic', 'title', 'badge');
create type game.entitlement_source as enum ('revenuecat', 'season_award', 'admin_grant', 'promo');
create type game.entitlement_status as enum ('active', 'expired', 'revoked');
create type game.cosmetic_slot as enum (
  'flag', 'emblem', 'banner', 'title', 'map_pin', 'capital_monument',
  'nameplate', 'profile_badge'
);
create type game.pass_period_status as enum ('active', 'expired', 'revoked');
create type game.pass_reward_state as enum ('locked', 'claimable', 'claimed', 'auto_claimed');
create type game.mission_state as enum ('active', 'completed', 'claimed', 'expired');
create type game.shop_item_kind as enum ('pass', 'cosmetic');
create type game.revenuecat_status as enum ('received', 'processed', 'ignored', 'failed');

create type game.world_status as enum ('creating', 'open', 'running', 'finished');
create type game.operational_state as enum ('paused', 'quarantined', 'archived');
create type game.faction_kind as enum ('player', 'ai');
create type game.faction_state as enum (
  'pending_spawn', 'active', 'eliminated', 'spectator', 'ai_controlled', 'finished'
);
create type game.rebellion_faction_state as enum ('none', 'active', 'grace');
create type game.rebellion_state as enum ('spawned', 'holding', 'defeated');
create type game.controller_type as enum ('none', 'player', 'ai', 'rebel');
create type game.resource_type as enum ('money', 'gold', 'food', 'water', 'oil');
create type game.tradeable_resource as enum ('food', 'water', 'oil');
create type game.unit_type as enum ('infantry', 'tank', 'aircraft', 'artillery');
create type game.doctrine_weapon as enum ('rifles', 'anti_tank', 'anti_air');
create type game.doctrine_skill as enum ('defender', 'raider', 'marcher');
create type game.ability_type as enum ('mobilization', 'airstrike', 'missile_strike');
create type game.ai_archetype as enum ('garrison', 'raider', 'expansionist');

create type game.army_state as enum ('garrison', 'marching', 'resolving', 'destroyed');
create type game.army_purpose as enum (
  'attack', 'reinforce', 'transfer', 'return', 'recall_return'
);
create type game.movement_mode as enum ('land', 'air', 'strategic');
create type game.battle_result as enum (
  'attacker_win', 'defender_win', 'capture_no_battle', 'aborted'
);

create type game.alliance_state as enum ('active', 'dissolved');
create type game.alliance_role as enum ('leader', 'member');
create type game.invitation_state as enum (
  'pending', 'accepted', 'declined', 'expired', 'cancelled'
);
create type game.leave_reason as enum ('left', 'kicked', 'abandoned', 'dissolved');
create type game.trade_kind as enum ('market_listing', 'direct_offer', 'state_exchange');
create type game.trade_offer_state as enum (
  'open', 'pending', 'accepted', 'declined', 'cancelled', 'expired'
);
create type game.trade_log_state as enum ('settled', 'rejected', 'cancelled', 'returned');
create type game.queue_state as enum ('queued', 'running', 'completed', 'cancelled');

create type game.world_event_type as enum (
  'join', 'command', 'admin', 'season', 'system', 'account'
);
create type game.event_actor_type as enum ('account', 'faction', 'admin', 'system');
create type game.report_target_type as enum ('account', 'faction');
create type game.report_state as enum ('open', 'reviewed', 'actioned', 'dismissed');

/* -------------------------------------------------------------------------- */
/* Schema metadata                                                            */
/* -------------------------------------------------------------------------- */

create table game.schema_meta (
  id boolean primary key default true check (id),
  schema_version text not null,
  applied_at timestamptz not null default now()
);

comment on table game.schema_meta is
  'Single-row application schema version. Readiness fails on mismatch (05 §9.8).';

/* -------------------------------------------------------------------------- */
/* Account and meta-state                                                     */
/* -------------------------------------------------------------------------- */

create table game.accounts (
  account_id uuid primary key,
  display_name text not null,
  display_name_key text not null,
  status game.account_status not null default 'active',
  is_guest boolean not null default true,
  merged_into uuid null references game.accounts (account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  banned_until timestamptz null,
  ban_reason text null,
  version bigint not null default 0 check (version >= 0),

  constraint accounts_display_name_len check (char_length(display_name) between 1 and 32),
  constraint accounts_merged_self check (merged_into is null or merged_into <> account_id),
  constraint accounts_merged_status check (
    (status = 'merged' and merged_into is not null)
    or (status <> 'merged' and merged_into is null)
  ),
  constraint accounts_ban_reason check (status <> 'banned' or banned_until is not null)
);

comment on table game.accounts is
  'Application profile. Supabase Auth owns identity and provider email; this table has no email column (SD-04).';
comment on column game.accounts.merged_into is
  'Guest merge survivor pointer. Logical FK to auth.users(id); enforced by the server, not a cross-schema FK.';

create index accounts_display_name_key_idx on game.accounts (display_name_key);
create index accounts_last_seen_idx on game.accounts (last_seen_at);

create table game.account_entitlements (
  entitlement_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references game.accounts (account_id),
  kind game.entitlement_kind not null,
  catalog_id text not null,
  source game.entitlement_source not null,
  source_event_id text null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz null,
  status game.entitlement_status not null default 'active',
  revoked_at timestamptz null,
  revocation_reason text null,
  metadata jsonb not null default '{}'::jsonb,

  constraint entitlement_time_order check (expires_at is null or expires_at > granted_at),
  constraint entitlement_pass_expiry check (kind <> 'pass' or expires_at is not null),
  constraint entitlement_revenuecat_event check (
    source <> 'revenuecat' or source_event_id is not null
  ),
  constraint entitlement_revoked_time check (
    (status = 'revoked' and revoked_at is not null)
    or (status <> 'revoked' and revoked_at is null)
  )
);

create unique index account_entitlements_source_event_idx
  on game.account_entitlements (account_id, source_event_id, catalog_id)
  where source_event_id is not null;
create unique index account_entitlements_one_active_cosmetic_idx
  on game.account_entitlements (account_id, catalog_id)
  where kind = 'cosmetic' and status = 'active';
create index account_entitlements_account_status_idx
  on game.account_entitlements (account_id, status, kind);
create index account_entitlements_expiry_idx
  on game.account_entitlements (expires_at)
  where status = 'active' and expires_at is not null;

create table game.account_cosmetics (
  account_id uuid not null references game.accounts (account_id),
  slot game.cosmetic_slot not null,
  catalog_id text not null,
  equipped_at timestamptz not null default now(),
  primary key (account_id, slot)
);

comment on table game.account_cosmetics is
  'Equipped cosmetic per slot. Ownership is checked against account_entitlements by the server.';

create table game.pass_periods (
  pass_period_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references game.accounts (account_id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source_entitlement_id uuid not null references game.account_entitlements (entitlement_id),
  status game.pass_period_status not null default 'active',
  created_at timestamptz not null default now(),

  constraint pass_period_time_order check (ends_at > starts_at),
  constraint pass_period_source_unique unique (source_entitlement_id)
);

comment on table game.pass_periods is
  'One rolling 30-day pass term per pass entitlement. Repeated purchase/stacking semantics remain a product TBD; this shape supports non-overlapping periods.';

create table game.pass_progress (
  pass_period_id uuid primary key references game.pass_periods (pass_period_id),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 0 check (level >= 0),
  premium_unlocked boolean not null default false,
  updated_at timestamptz not null default now()
);

create table game.pass_reward_claims (
  pass_period_id uuid not null references game.pass_periods (pass_period_id),
  reward_id text not null,
  state game.pass_reward_state not null default 'locked',
  claimed_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (pass_period_id, reward_id),

  constraint pass_reward_claimed_time check (
    (state in ('claimed', 'auto_claimed') and claimed_at is not null)
    or (state in ('locked', 'claimable') and claimed_at is null)
  )
);

create table game.missions (
  account_id uuid not null references game.accounts (account_id),
  mission_id text not null,
  period_key text not null,
  progress integer not null default 0 check (progress >= 0),
  target integer not null check (target > 0),
  state game.mission_state not null default 'active',
  completed_at timestamptz null,
  claimed_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (account_id, mission_id, period_key),

  constraint mission_completed_time check (
    (state in ('completed', 'claimed') and completed_at is not null)
    or (state = 'active' and completed_at is null)
    or state = 'expired'
  ),
  constraint mission_claimed_time check (
    (state = 'claimed' and claimed_at is not null)
    or (state <> 'claimed' and claimed_at is null)
  )
);

comment on table game.missions is
  'Pass mission progress. Static mission definitions live in config; there is no campaign quest log.';

create table game.shop_items (
  item_id text primary key,
  kind game.shop_item_kind not null,
  slot game.cosmetic_slot null,
  name text not null,
  description text not null default '',
  price_usd_cents integer not null check (price_usd_cents >= 0),
  store_product_id text null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shop_item_slot check (
    (kind = 'cosmetic' and slot is not null)
    or (kind = 'pass' and slot is null)
  )
);

comment on table game.shop_items is
  'Static/seed catalog. Web is read-only; mobile IAP is the purchase path (SD-03).';

create unique index shop_items_store_product_idx
  on game.shop_items (store_product_id)
  where store_product_id is not null;

create table game.revenuecat_events (
  event_id text primary key,
  account_id uuid null references game.accounts (account_id),
  app_user_id text not null,
  event_type text not null,
  product_id text null,
  entitlement_ids text[] not null default '{}'::text[],
  event_at timestamptz not null,
  payload jsonb not null,
  status game.revenuecat_status not null default 'received',
  processed_at timestamptz null,
  error text null,

  constraint revenuecat_processed_time check (
    (status in ('processed', 'ignored') and processed_at is not null)
    or (status in ('received', 'failed') and processed_at is null)
  )
);

comment on table game.revenuecat_events is
  'Webhook idempotency/audit. event_id is the provider event id. No client customerInfo is authority.';

create index revenuecat_events_account_idx on game.revenuecat_events (account_id, event_at);

/* -------------------------------------------------------------------------- */
/* World and persistence                                                      */
/* -------------------------------------------------------------------------- */

create table game.worlds (
  world_id uuid primary key,
  name text not null,
  map_id text not null,
  config_version text not null,
  status game.world_status not null default 'creating',
  operational_state game.operational_state null,
  started_at timestamptz null,
  join_deadline timestamptz null,
  season_end timestamptz null,
  max_humans smallint not null check (max_humans between 20 and 24),
  ai_count smallint not null check (ai_count between 10 and 15),
  province_count smallint not null check (province_count between 80 and 100),
  version bigint not null default 0 check (version >= 0),
  last_tick bigint not null default 0 check (last_tick >= 0),
  last_event_seq bigint not null default 0 check (last_event_seq >= 0),
  final_snapshot_seq bigint null check (final_snapshot_seq is null or final_snapshot_seq > 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz null,

  constraint world_started check (status = 'creating' or started_at is not null),
  constraint world_join_deadline check (
    started_at is null or join_deadline is null or join_deadline >= started_at
  ),
  constraint world_season_end check (
    started_at is null or season_end is null or season_end > started_at
  ),
  constraint world_finished_time check (status <> 'finished' or finished_at is not null),
  constraint world_finished_snapshot check (
    status <> 'finished' or final_snapshot_seq is not null
  ),
  constraint world_operational_state check (
    operational_state is null or status in ('open', 'running', 'finished')
  )
);

comment on table game.worlds is
  'World metadata and the public lifecycle. Paused/quarantined/archived are overlays, not public lifecycle states.';

create index worlds_status_idx on game.worlds (status, started_at);

create table game.world_leases (
  world_id uuid primary key references game.worlds (world_id),
  owner_id text not null,
  lease_version bigint not null default 0 check (lease_version >= 0),
  lease_expires_at timestamptz not null,
  heartbeat_at timestamptz not null,
  acquired_at timestamptz not null default now(),

  constraint lease_expiry_order check (lease_expires_at > acquired_at)
);

comment on table game.world_leases is
  'Single-writer lease with fencing. Every snapshot/event write includes lease_version (05 §9.5).';

/* Factions are created before events/projections that reference them. */
create table game.factions (
  world_id uuid not null references game.worlds (world_id),
  faction_id bigint not null check (faction_id > 0),
  account_id uuid null references game.accounts (account_id),
  kind game.faction_kind not null,
  state game.faction_state not null,
  name text not null,
  name_key text not null,
  emblem_id text not null,
  color_id text not null,
  capital_province_id smallint null check (
    capital_province_id is null or capital_province_id between 1 and 254
  ),
  support smallint not null default 60 check (support between 0 and 100),
  support_remainder numeric(18, 6) not null default 0
    check (support_remainder >= 0 and support_remainder < 1),
  rebellion_state game.rebellion_faction_state not null default 'none',
  rebellion_grace_until timestamptz null,
  protection_until timestamptz null,
  era smallint not null default 1 check (era between 1 and 4),
  voluntary_relocation_used boolean not null default false,
  build_slots smallint not null default 1 check (build_slots between 1 and 2),
  training_slots smallint not null default 1 check (training_slots between 1 and 2),
  doctrine_weapon game.doctrine_weapon null,
  doctrine_skill game.doctrine_skill null,
  ai_archetype game.ai_archetype null,
  ai_state jsonb null,
  public_score bigint not null default 0 check (public_score >= 0),
  joined_at timestamptz not null,
  last_seen_at timestamptz null,
  abandoned_at timestamptz null,
  eliminated_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (world_id, faction_id),

  constraint faction_name_len check (char_length(name) between 1 and 32),
  constraint faction_ai_account check (
    (kind = 'ai' and account_id is null and ai_archetype is not null)
    or (kind = 'player' and account_id is not null
      and (ai_archetype is null or state = 'ai_controlled'))
  ),
  constraint faction_ai_controlled_archetype check (
    state <> 'ai_controlled' or ai_archetype is not null
  ),
  constraint faction_ai_no_capital check (
    kind <> 'ai' or capital_province_id is null
  ),
  constraint faction_rebellion_grace check (
    (rebellion_state = 'grace' and rebellion_grace_until is not null)
    or (rebellion_state <> 'grace' and rebellion_grace_until is null)
  ),
  constraint faction_ai_state_object check (
    ai_state is null or jsonb_typeof(ai_state) = 'object'
  )
);

comment on table game.factions is
  'Per-world faction projection. Live authority is the room snapshot; account is null only for AI warlords.';
comment on column game.factions.support is
  'Public exact support, 0-100. `09` §8.1 makes the meter visible at all times.';

create unique index factions_account_world_idx
  on game.factions (world_id, account_id)
  where account_id is not null;
create index factions_world_state_idx on game.factions (world_id, state);
create index factions_name_key_idx on game.factions (world_id, name_key);

create table game.faction_resources (
  world_id uuid not null,
  faction_id bigint not null,
  resource_type game.resource_type not null,
  amount bigint not null default 0 check (amount >= 0),
  remainder numeric(18, 6) not null default 0
    check (remainder >= 0 and remainder < 1),
  updated_at timestamptz not null default now(),

  primary key (world_id, faction_id, resource_type),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id)
);

comment on table game.faction_resources is
  'Five integer stockpiles plus fixed-point remainders. Never a single JSON blob for authoritative state.';

create table game.faction_techs (
  world_id uuid not null,
  faction_id bigint not null,
  tech_id text not null,
  purchased_at timestamptz not null default now(),

  primary key (world_id, faction_id, tech_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id)
);

create table game.doctrine_log (
  world_id uuid not null,
  change_id bigint not null check (change_id > 0),
  faction_id bigint not null,
  old_weapon game.doctrine_weapon null,
  new_weapon game.doctrine_weapon null,
  old_skill game.doctrine_skill null,
  new_skill game.doctrine_skill null,
  changed_at timestamptz not null default now(),

  primary key (world_id, change_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id)
);

create table game.rebellions (
  world_id uuid not null references game.worlds (world_id),
  rebellion_id bigint not null check (rebellion_id > 0),
  origin_faction_id bigint not null,
  province_id smallint not null check (province_id between 1 and 254),
  state game.rebellion_state not null,
  spawned_at timestamptz not null default now(),
  defeated_at timestamptz null,

  primary key (world_id, rebellion_id),
  foreign key (world_id, origin_faction_id) references game.factions (world_id, faction_id),

  constraint rebellion_defeated_time check (
    (state = 'defeated' and defeated_at is not null)
    or (state in ('spawned', 'holding') and defeated_at is null)
  )
);

create unique index rebellions_one_active_per_origin_idx
  on game.rebellions (world_id, origin_faction_id)
  where state in ('spawned', 'holding');

create table game.world_regions (
  world_id uuid not null references game.worlds (world_id),
  province_id smallint not null check (province_id between 1 and 254),
  owner_faction_id bigint null,
  controller_type game.controller_type not null,
  rebel_group_id bigint null,
  last_attacker_faction_id bigint null,
  level smallint not null default 1 check (level between 1 and 5),
  terrain_resource game.resource_type not null,
  is_capital boolean not null default false,
  is_refugee boolean not null default false,
  captured_at timestamptz null,
  updated_at timestamptz not null default now(),

  primary key (world_id, province_id),
  foreign key (world_id, owner_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, rebel_group_id) references game.rebellions (world_id, rebellion_id),
  foreign key (world_id, last_attacker_faction_id) references game.factions (world_id, faction_id),

  constraint region_controller check (
    (controller_type = 'none' and owner_faction_id is null and rebel_group_id is null)
    or (controller_type in ('player', 'ai')
        and owner_faction_id is not null and rebel_group_id is null)
    or (controller_type = 'rebel'
        and owner_faction_id is null and rebel_group_id is not null)
  ),
  constraint region_capital_owner check (
    not is_capital
    or (owner_faction_id is not null and controller_type = 'player')
  ),
  constraint region_refugee_state check (
    not is_refugee
    or (owner_faction_id is null and rebel_group_id is null and level = 1)
  )
);

comment on table game.world_regions is
  'Per-world province projection. `troops` is derived from garrison armies plus neutral garrisons (view province_garrison), not stored here.';

create index world_regions_owner_idx on game.world_regions (world_id, owner_faction_id);
create unique index world_regions_one_capital_idx
  on game.world_regions (world_id, owner_faction_id)
  where is_capital;
create index world_regions_rebel_idx on game.world_regions (world_id, rebel_group_id)
  where rebel_group_id is not null;

create table game.neutral_garrisons (
  world_id uuid not null,
  province_id smallint not null,
  unit_type game.unit_type not null,
  count bigint not null check (count > 0),

  primary key (world_id, province_id, unit_type),
  foreign key (world_id, province_id) references game.world_regions (world_id, province_id)
);

comment on table game.neutral_garrisons is
  'Static-ish neutral province garrisons. Neutral provinces have no faction/army owner; these rows are deleted on capture.';

/* Circular references: add after both sides exist. */
alter table game.factions
  add constraint factions_capital_region_fk
  foreign key (world_id, capital_province_id)
  references game.world_regions (world_id, province_id)
  deferrable initially deferred;

alter table game.rebellions
  add constraint rebellions_province_fk
  foreign key (world_id, province_id)
  references game.world_regions (world_id, province_id)
  deferrable initially deferred;

create table game.support_daily (
  world_id uuid not null,
  faction_id bigint not null,
  province_id smallint not null,
  world_day smallint not null check (world_day between 1 and 30),
  net_delta numeric(8, 3) not null default 0,
  updated_at timestamptz not null default now(),

  primary key (world_id, faction_id, province_id, world_day),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, province_id) references game.world_regions (world_id, province_id)
);

comment on table game.support_daily is
  'Regional-event accounting for the ±1 net per province per day cap. The cap remains PROPOSED in 03 §13.3.';

create table game.armies (
  world_id uuid not null references game.worlds (world_id),
  army_id bigint not null check (army_id > 0),
  owner_faction_id bigint null,
  rebel_group_id bigint null,
  state game.army_state not null,
  purpose game.army_purpose null,
  mode game.movement_mode null,
  location_province_id smallint null,
  origin_province_id smallint null,
  target_province_id smallint null,
  depart_at timestamptz null,
  arrive_at timestamptz null,
  fatigue_until timestamptz null,
  recallable boolean not null default false,
  created_at timestamptz not null default now(),
  destroyed_at timestamptz null,

  primary key (world_id, army_id),
  foreign key (world_id, owner_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, rebel_group_id) references game.rebellions (world_id, rebellion_id),
  foreign key (world_id, location_province_id) references game.world_regions (world_id, province_id),
  foreign key (world_id, origin_province_id) references game.world_regions (world_id, province_id),
  foreign key (world_id, target_province_id) references game.world_regions (world_id, province_id),

  constraint army_owner_xor check (
    (owner_faction_id is not null) <> (rebel_group_id is not null)
  ),
  constraint army_state_shape check (
    (state = 'garrison'
      and location_province_id is not null
      and origin_province_id is null
      and target_province_id is null
      and purpose is null
      and mode is null
      and depart_at is null
      and arrive_at is null)
    or (state in ('marching', 'resolving')
      and location_province_id is null
      and origin_province_id is not null
      and target_province_id is not null
      and purpose is not null
      and mode is not null
      and depart_at is not null
      and arrive_at is not null)
    or (state = 'destroyed' and destroyed_at is not null)
  ),
  constraint army_time_order check (
    depart_at is null or arrive_at is null or arrive_at > depart_at
  ),
  constraint army_origin_target check (
    origin_province_id is null or target_province_id is null
    or origin_province_id <> target_province_id
  ),
  constraint army_garrison_recallable check (state <> 'garrison' or not recallable)
);

comment on table game.armies is
  'Every army is in exactly one state/place. Garrison armies make province troops; troops are never stored on world_regions.';

create index armies_arrival_idx on game.armies (world_id, state, arrive_at);
create index armies_owner_idx on game.armies (world_id, owner_faction_id);
create index armies_rebel_idx on game.armies (world_id, rebel_group_id)
  where rebel_group_id is not null;

create table game.army_units (
  world_id uuid not null,
  army_id bigint not null,
  unit_type game.unit_type not null,
  count bigint not null check (count > 0),

  primary key (world_id, army_id, unit_type),
  foreign key (world_id, army_id) references game.armies (world_id, army_id)
);

create table game.battle_log (
  world_id uuid not null references game.worlds (world_id),
  battle_id bigint not null check (battle_id > 0),
  province_id smallint not null,
  attacker_controller_type game.controller_type not null
    check (attacker_controller_type in ('player', 'ai', 'rebel')),
  attacker_faction_id bigint null,
  defender_controller_type game.controller_type not null
    check (defender_controller_type in ('none', 'player', 'ai', 'rebel')),
  defender_faction_id bigint null,
  attacker_army_id bigint not null,
  defender_army_ids bigint[] not null default '{}'::bigint[],
  started_at timestamptz not null,
  resolved_at timestamptz not null,
  result game.battle_result not null,
  province_level_before smallint not null check (province_level_before between 1 and 5),
  province_level_after smallint not null check (province_level_after between 1 and 5),
  attacker_power numeric(18, 6) not null check (attacker_power >= 0),
  defender_power numeric(18, 6) not null check (defender_power >= 0),
  attacker_units jsonb not null,
  defender_units jsonb not null,
  attacker_losses jsonb not null,
  defender_losses jsonb not null,
  attacker_multipliers jsonb not null,
  defender_multipliers jsonb not null,
  loot jsonb not null default '{}'::jsonb,
  support_changes jsonb not null default '{}'::jsonb,
  new_owner_faction_id bigint null,
  public_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  primary key (world_id, battle_id),
  foreign key (world_id, province_id) references game.world_regions (world_id, province_id),
  foreign key (world_id, attacker_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, defender_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, attacker_army_id) references game.armies (world_id, army_id),
  foreign key (world_id, new_owner_faction_id) references game.factions (world_id, faction_id),
  constraint battle_time_order check (resolved_at >= started_at),
  constraint battle_attacker_shape check (
    (attacker_controller_type in ('player', 'ai') and attacker_faction_id is not null)
    or (attacker_controller_type = 'rebel' and attacker_faction_id is null)
  ),
  constraint battle_defender_shape check (
    (defender_controller_type in ('player', 'ai') and defender_faction_id is not null)
    or (defender_controller_type in ('none', 'rebel') and defender_faction_id is null)
  )
);

comment on table game.battle_log is
  'Permanent battle audit. Exact forces/powers are exposed only to involved factions after resolution.';

create index battle_log_province_idx on game.battle_log (world_id, province_id, resolved_at);

/* -------------------------------------------------------------------------- */
/* Alliances and trade                                                        */
/* -------------------------------------------------------------------------- */

create table game.alliances (
  world_id uuid not null references game.worlds (world_id),
  alliance_id bigint not null check (alliance_id > 0),
  name text not null,
  name_key text not null,
  leader_faction_id bigint null,
  state game.alliance_state not null default 'active',
  created_at timestamptz not null default now(),
  dissolved_at timestamptz null,

  primary key (world_id, alliance_id),
  foreign key (world_id, leader_faction_id) references game.factions (world_id, faction_id),

  constraint alliance_name_len check (char_length(name) between 1 and 32),
  constraint alliance_dissolved_time check (
    (state = 'dissolved' and dissolved_at is not null)
    or (state = 'active' and dissolved_at is null)
  )
);

create unique index alliances_active_name_idx
  on game.alliances (world_id, name_key)
  where state = 'active';

create table game.alliance_members (
  world_id uuid not null,
  membership_id bigint not null check (membership_id > 0),
  alliance_id bigint not null,
  faction_id bigint not null,
  role game.alliance_role not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz null,
  leave_reason game.leave_reason null,

  primary key (world_id, membership_id),
  foreign key (world_id, alliance_id) references game.alliances (world_id, alliance_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),

  constraint alliance_member_leave_shape check (
    (left_at is null and leave_reason is null)
    or (left_at is not null and leave_reason is not null)
  )
);

create unique index alliance_members_one_active_idx
  on game.alliance_members (world_id, faction_id)
  where left_at is null;
create unique index alliance_members_one_leader_idx
  on game.alliance_members (world_id, alliance_id)
  where role = 'leader' and left_at is null;
create index alliance_members_alliance_idx
  on game.alliance_members (world_id, alliance_id)
  where left_at is null;

create table game.alliance_invitations (
  world_id uuid not null,
  invitation_id bigint not null check (invitation_id > 0),
  alliance_id bigint not null,
  inviter_faction_id bigint not null,
  invitee_faction_id bigint not null,
  state game.invitation_state not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz null,

  primary key (world_id, invitation_id),
  foreign key (world_id, alliance_id) references game.alliances (world_id, alliance_id),
  foreign key (world_id, inviter_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, invitee_faction_id) references game.factions (world_id, faction_id),

  constraint invitation_time_order check (expires_at > created_at),
  constraint invitation_response_time check (
    (state = 'pending' and responded_at is null)
    or (state <> 'pending' and responded_at is not null)
  ),
  constraint invitation_not_self check (inviter_faction_id <> invitee_faction_id)
);

create unique index alliance_invitations_one_pending_idx
  on game.alliance_invitations (world_id, invitee_faction_id)
  where state = 'pending';

create table game.trade_offers (
  world_id uuid not null references game.worlds (world_id),
  offer_id bigint not null check (offer_id > 0),
  kind game.trade_kind not null check (kind in ('market_listing', 'direct_offer')),
  seller_faction_id bigint not null,
  buyer_faction_id bigint null,
  resource game.tradeable_resource not null,
  amount bigint not null check (amount > 0),
  price_gold bigint not null check (price_gold > 0),
  state game.trade_offer_state not null,
  escrow_amount bigint not null default 0 check (escrow_amount >= 0),
  tax_gold bigint not null default 0 check (tax_gold >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  frozen_at timestamptz null,
  resolved_at timestamptz null,

  primary key (world_id, offer_id),
  foreign key (world_id, seller_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, buyer_faction_id) references game.factions (world_id, faction_id),

  constraint trade_offer_time_order check (expires_at > created_at),
  constraint trade_offer_buyer_shape check (
    (kind = 'market_listing' and buyer_faction_id is null)
    or (kind = 'direct_offer' and buyer_faction_id is not null)
  ),
  constraint trade_offer_not_self check (buyer_faction_id is null or buyer_faction_id <> seller_faction_id),
  constraint trade_offer_escrow_shape check (
    state not in ('open', 'pending') or escrow_amount = amount
  ),
  constraint trade_offer_escrow_zero check (
    state in ('open', 'pending') or escrow_amount = 0
  )
);

create index trade_offers_open_idx
  on game.trade_offers (world_id, state, resource, expires_at);
create index trade_offers_seller_idx on game.trade_offers (world_id, seller_faction_id);

create table game.trade_log (
  world_id uuid not null references game.worlds (world_id),
  trade_id bigint not null check (trade_id > 0),
  offer_id bigint null,
  kind game.trade_kind not null,
  seller_faction_id bigint not null,
  buyer_faction_id bigint null,
  resource game.tradeable_resource not null,
  amount bigint not null check (amount > 0),
  gold bigint not null check (gold >= 0),
  tax_gold bigint not null default 0 check (tax_gold >= 0),
  state game.trade_log_state not null,
  reason text null,
  created_at timestamptz not null default now(),

  primary key (world_id, trade_id),
  foreign key (world_id, offer_id) references game.trade_offers (world_id, offer_id),
  foreign key (world_id, seller_faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, buyer_faction_id) references game.factions (world_id, faction_id),
  constraint trade_log_offer_shape check (
    (kind = 'state_exchange' and offer_id is null)
    or (kind <> 'state_exchange' and offer_id is not null)
  )
);

comment on table game.trade_log is
  'Permanent trade audit. State exchange rows have offer_id null and kind state_exchange.';

create table game.trade_daily (
  world_id uuid not null,
  faction_id bigint not null,
  world_day smallint not null check (world_day between 1 and 30),
  trades_count integer not null default 0 check (trades_count >= 0),
  gold_moved bigint not null default 0 check (gold_moved >= 0),
  updated_at timestamptz not null default now(),

  primary key (world_id, faction_id, world_day),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id)
);

comment on table game.trade_daily is
  'Daily trade counters for 5 trades / 500 gold per faction per world day. Reset at the world-day boundary; server-owned.';

/* -------------------------------------------------------------------------- */
/* Queues and cooldowns                                                       */
/* -------------------------------------------------------------------------- */

create table game.build_queue (
  world_id uuid not null,
  order_id bigint not null check (order_id > 0),
  faction_id bigint not null,
  province_id smallint not null,
  from_level smallint not null check (from_level between 1 and 4),
  to_level smallint not null check (to_level between 2 and 5),
  state game.queue_state not null default 'queued',
  enqueued_at timestamptz not null default now(),
  started_at timestamptz null,
  finishes_at timestamptz null,
  cost_money bigint not null default 0 check (cost_money >= 0),
  cost_resource_type game.resource_type null,
  cost_resource_amount bigint not null default 0 check (cost_resource_amount >= 0),
  refund_amount bigint not null default 0 check (refund_amount >= 0),
  cancel_reason text null,
  completed_at timestamptz null,

  primary key (world_id, order_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, province_id) references game.world_regions (world_id, province_id),

  constraint build_level_order check (to_level = from_level + 1),
  constraint build_cost_resource_shape check (
    (cost_resource_type is null and cost_resource_amount = 0)
    or (cost_resource_type is not null and cost_resource_amount > 0)
  ),
  constraint build_state_time check (
    (state = 'queued'
      and started_at is null and finishes_at is null
      and completed_at is null and cancel_reason is null)
    or (state = 'running'
      and started_at is not null and finishes_at is not null
      and completed_at is null and cancel_reason is null)
    or (state = 'completed'
      and started_at is not null and finishes_at is not null
      and completed_at is not null and cancel_reason is null)
    or (state = 'cancelled'
      and completed_at is null and cancel_reason is not null)
  ),
  constraint build_finish_order check (finishes_at is null or started_at is null or finishes_at > started_at)
);

create unique index build_queue_one_running_idx
  on game.build_queue (world_id, faction_id)
  where state = 'running';
create unique index build_queue_one_active_per_province_idx
  on game.build_queue (world_id, province_id)
  where state in ('queued', 'running');

create table game.training_queue (
  world_id uuid not null,
  order_id bigint not null check (order_id > 0),
  faction_id bigint not null,
  province_id smallint not null,
  unit_type game.unit_type not null check (unit_type <> 'infantry'),
  count bigint not null check (count > 0),
  state game.queue_state not null default 'queued',
  enqueued_at timestamptz not null default now(),
  started_at timestamptz null,
  finishes_at timestamptz null,
  cost_money bigint not null default 0 check (cost_money >= 0),
  cost_resource_type game.resource_type null,
  cost_resource_amount bigint not null default 0 check (cost_resource_amount >= 0),
  refund_amount bigint not null default 0 check (refund_amount >= 0),
  cancel_reason text null,
  completed_at timestamptz null,

  primary key (world_id, order_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, province_id) references game.world_regions (world_id, province_id),

  constraint training_cost_resource_shape check (
    (cost_resource_type is null and cost_resource_amount = 0)
    or (cost_resource_type is not null and cost_resource_amount > 0)
  ),
  constraint training_state_time check (
    (state = 'queued'
      and started_at is null and finishes_at is null
      and completed_at is null and cancel_reason is null)
    or (state = 'running'
      and started_at is not null and finishes_at is not null
      and completed_at is null and cancel_reason is null)
    or (state = 'completed'
      and started_at is not null and finishes_at is not null
      and completed_at is not null and cancel_reason is null)
    or (state = 'cancelled'
      and completed_at is null and cancel_reason is not null)
  ),
  constraint training_finish_order check (finishes_at is null or started_at is null or finishes_at > started_at)
);

create unique index training_queue_one_running_idx
  on game.training_queue (world_id, faction_id)
  where state = 'running';

create table game.ability_cooldowns (
  world_id uuid not null,
  faction_id bigint not null,
  ability game.ability_type not null,
  ready_at timestamptz not null,
  last_used_at timestamptz not null,

  primary key (world_id, faction_id, ability),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  constraint ability_cooldown_order check (ready_at > last_used_at)
);

create table game.ex_ally_cooldowns (
  world_id uuid not null,
  faction_a_id bigint not null,
  faction_b_id bigint not null,
  until timestamptz not null,
  reason game.leave_reason not null check (reason in ('left', 'kicked')),

  primary key (world_id, faction_a_id, faction_b_id),
  foreign key (world_id, faction_a_id) references game.factions (world_id, faction_id),
  foreign key (world_id, faction_b_id) references game.factions (world_id, faction_id),
  constraint ex_ally_order check (faction_a_id < faction_b_id)
);

/* -------------------------------------------------------------------------- */
/* Ordered input log, snapshots, receipts                                     */
/* -------------------------------------------------------------------------- */

create table game.world_events (
  world_id uuid not null references game.worlds (world_id),
  seq bigint not null check (seq > 0),
  type game.world_event_type not null,
  command_type text null,
  actor_type game.event_actor_type not null,
  actor_account_id uuid null references game.accounts (account_id),
  actor_faction_id bigint null,
  command_id uuid null,
  effective_at timestamptz not null,
  priority smallint not null default 80 check (priority between 0 and 80),
  payload jsonb not null,
  lease_version bigint not null check (lease_version >= 0),
  created_at timestamptz not null default now(),

  primary key (world_id, seq),
  foreign key (world_id, actor_faction_id) references game.factions (world_id, faction_id),

  constraint world_event_actor_shape check (
    (actor_type = 'system' and actor_account_id is null and actor_faction_id is null)
    or (actor_type = 'account' and actor_account_id is not null and actor_faction_id is null)
    or (actor_type = 'admin' and actor_account_id is not null and actor_faction_id is null)
    or (actor_type = 'faction'
      and actor_faction_id is not null and actor_account_id is null)
  ),
  constraint world_event_payload_object check (jsonb_typeof(payload) = 'object')
);

comment on table game.world_events is
  'Ordered input/audit log. Replay applies committed input events; audit-only rows are skipped. Order is (effective_at, priority, seq).';

create index world_events_order_idx on game.world_events (world_id, effective_at, priority, seq);
create index world_events_command_idx on game.world_events (world_id, command_id)
  where command_id is not null;

create table game.world_snapshots (
  world_id uuid not null references game.worlds (world_id),
  seq bigint not null check (seq > 0),
  tick bigint not null check (tick >= 0),
  effective_at timestamptz not null,
  state_gzip bytea not null,
  state_hash bytea not null,
  last_event_seq bigint not null check (last_event_seq >= 0),
  config_version text not null,
  lease_version bigint not null check (lease_version >= 0),
  created_at timestamptz not null default now(),

  primary key (world_id, seq),

  constraint snapshot_gzip_nonempty check (octet_length(state_gzip) > 0),
  constraint snapshot_hash_sha256 check (octet_length(state_hash) = 32)
);

comment on table game.world_snapshots is
  'Compressed canonical JSON snapshots. Snapshot writes are fenced by lease_version; a snapshot is not a command-ack dependency.';

create index world_snapshots_created_idx on game.world_snapshots (world_id, created_at);

alter table game.worlds
  add constraint worlds_final_snapshot_fk
  foreign key (world_id, final_snapshot_seq)
  references game.world_snapshots (world_id, seq)
  deferrable initially deferred;

create table game.command_receipts (
  account_id uuid not null references game.accounts (account_id),
  command_id uuid not null,
  world_id uuid not null references game.worlds (world_id),
  faction_id bigint null,
  command_type text not null,
  result_code text not null,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,

  primary key (account_id, command_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  constraint command_receipt_expiry check (expires_at > created_at),
  constraint command_receipt_payload_object check (jsonb_typeof(result_payload) = 'object')
);

comment on table game.command_receipts is
  'Durable idempotency results. command_id is client-generated and unique per account, not per world.';

create index command_receipts_world_idx on game.command_receipts (world_id, created_at);
create index command_receipts_expiry_idx on game.command_receipts (expires_at);

/* -------------------------------------------------------------------------- */
/* Season results, admin, moderation                                          */
/* -------------------------------------------------------------------------- */

create table game.season_results (
  world_id uuid not null references game.worlds (world_id),
  faction_id bigint not null,
  account_id uuid null references game.accounts (account_id),
  rank smallint not null check (rank >= 1),
  province_count smallint not null check (province_count >= 0),
  total_troops bigint not null default 0 check (total_troops >= 0),
  economy_score bigint not null default 0 check (economy_score >= 0),
  army_score bigint not null default 0 check (army_score >= 0),
  support_score bigint not null default 0 check (support_score >= 0),
  total_score bigint not null default 0 check (total_score >= 0),
  is_player_controlled boolean not null,
  is_linked boolean not null,
  is_conqueror boolean not null default false,
  is_best_nation boolean not null default false,
  title_ids text[] not null default '{}'::text[],
  recap jsonb not null default '{}'::jsonb,
  final_snapshot_seq bigint not null,
  created_at timestamptz not null default now(),

  primary key (world_id, faction_id),
  foreign key (world_id, faction_id) references game.factions (world_id, faction_id),
  foreign key (world_id, final_snapshot_seq) references game.world_snapshots (world_id, seq),
  constraint season_result_ai_account check (
    account_id is not null or not is_player_controlled
  ),
  constraint season_result_award_eligibility check (
    (not is_conqueror and not is_best_nation)
    or (is_player_controlled and is_linked)
  )
);

create unique index season_results_one_conqueror_idx
  on game.season_results (world_id)
  where is_conqueror;
create unique index season_results_one_best_nation_idx
  on game.season_results (world_id)
  where is_best_nation;
create unique index season_results_account_idx
  on game.season_results (world_id, account_id)
  where account_id is not null;

comment on table game.season_results is
  'Final per-faction results. A faction may win both titles; partial unique indexes enforce one winner per award per world.';

create table game.admin_audit (
  audit_id bigint generated always as identity primary key,
  actor_account_id uuid not null references game.accounts (account_id),
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text not null,
  before_state jsonb null,
  after_state jsonb null,
  created_at timestamptz not null default now()
);

create index admin_audit_created_idx on game.admin_audit (created_at);

create table game.name_reports (
  report_id bigint generated always as identity primary key,
  reporter_account_id uuid not null references game.accounts (account_id),
  target_type game.report_target_type not null,
  target_id text not null,
  reason text not null,
  state game.report_state not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_by uuid null references game.accounts (account_id),
  reviewed_at timestamptz null,
  resolution text null,

  constraint report_review_shape check (
    (state = 'open' and reviewed_by is null and reviewed_at is null)
    or (state <> 'open' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index name_reports_state_idx on game.name_reports (state, created_at);

/* -------------------------------------------------------------------------- */
/* Derived views                                                              */
/* -------------------------------------------------------------------------- */

create view game.province_garrison
with (security_invoker = true) as
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
group by g.world_id, g.province_id, g.unit_type;

comment on view game.province_garrison is
  'Derived province troops from garrison armies plus neutral garrisons. This is the read-model replacement for 09s world_regions.troops column.';

/* -------------------------------------------------------------------------- */
/* Defense in depth                                                           */
/* -------------------------------------------------------------------------- */

-- Supabase `anon`/`authenticated` must not reach game tables directly. The
-- runtime role is provisioned outside this file (05 §9.9). No permissive
-- policies are declared here; deployment decides whether the runtime role
-- bypasses RLS or receives explicit service policies.
do $$
declare
  tbl record;
begin
  for tbl in
    select tablename
    from pg_tables
    where schemaname = 'game'
  loop
    execute format('alter table game.%I enable row level security', tbl.tablename);
  end loop;
end $$;

revoke all on schema game from public;

insert into game.schema_meta (schema_version)
values ('2026-10-23.1')
on conflict (id) do update set
  schema_version = excluded.schema_version,
  applied_at = now();
