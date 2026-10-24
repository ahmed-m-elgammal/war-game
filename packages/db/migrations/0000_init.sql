CREATE SCHEMA IF NOT EXISTS "game";
--> statement-breakpoint
CREATE TYPE "game"."ability_type" AS ENUM('mobilization', 'airstrike', 'missile_strike');--> statement-breakpoint
CREATE TYPE "game"."account_status" AS ENUM('active', 'banned', 'disabled', 'merged');--> statement-breakpoint
CREATE TYPE "game"."ai_archetype" AS ENUM('garrison', 'raider', 'expansionist');--> statement-breakpoint
CREATE TYPE "game"."alliance_role" AS ENUM('leader', 'member');--> statement-breakpoint
CREATE TYPE "game"."alliance_state" AS ENUM('active', 'dissolved');--> statement-breakpoint
CREATE TYPE "game"."army_purpose" AS ENUM('attack', 'reinforce', 'transfer', 'return', 'recall_return');--> statement-breakpoint
CREATE TYPE "game"."army_state" AS ENUM('garrison', 'marching', 'resolving', 'destroyed');--> statement-breakpoint
CREATE TYPE "game"."battle_result" AS ENUM('attacker_win', 'defender_win', 'capture_no_battle', 'aborted');--> statement-breakpoint
CREATE TYPE "game"."controller_type" AS ENUM('none', 'player', 'ai', 'rebel');--> statement-breakpoint
CREATE TYPE "game"."cosmetic_slot" AS ENUM('flag', 'emblem', 'banner', 'title', 'map_pin', 'capital_monument', 'nameplate', 'profile_badge');--> statement-breakpoint
CREATE TYPE "game"."doctrine_skill" AS ENUM('defender', 'raider', 'marcher');--> statement-breakpoint
CREATE TYPE "game"."doctrine_weapon" AS ENUM('rifles', 'anti_tank', 'anti_air');--> statement-breakpoint
CREATE TYPE "game"."entitlement_kind" AS ENUM('pass', 'cosmetic', 'title', 'badge');--> statement-breakpoint
CREATE TYPE "game"."entitlement_source" AS ENUM('revenuecat', 'season_award', 'admin_grant', 'promo');--> statement-breakpoint
CREATE TYPE "game"."entitlement_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "game"."event_actor_type" AS ENUM('account', 'faction', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "game"."faction_kind" AS ENUM('player', 'ai');--> statement-breakpoint
CREATE TYPE "game"."faction_state" AS ENUM('pending_spawn', 'active', 'eliminated', 'spectator', 'ai_controlled', 'finished');--> statement-breakpoint
CREATE TYPE "game"."invitation_state" AS ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "game"."leave_reason" AS ENUM('left', 'kicked', 'abandoned', 'dissolved');--> statement-breakpoint
CREATE TYPE "game"."mission_state" AS ENUM('active', 'completed', 'claimed', 'expired');--> statement-breakpoint
CREATE TYPE "game"."movement_mode" AS ENUM('land', 'air', 'strategic');--> statement-breakpoint
CREATE TYPE "game"."operational_state" AS ENUM('paused', 'quarantined', 'archived');--> statement-breakpoint
CREATE TYPE "game"."pass_period_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "game"."pass_reward_state" AS ENUM('locked', 'claimable', 'claimed', 'auto_claimed');--> statement-breakpoint
CREATE TYPE "game"."queue_state" AS ENUM('queued', 'running', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "game"."rebellion_faction_state" AS ENUM('none', 'active', 'grace');--> statement-breakpoint
CREATE TYPE "game"."rebellion_state" AS ENUM('spawned', 'holding', 'defeated');--> statement-breakpoint
CREATE TYPE "game"."report_state" AS ENUM('open', 'reviewed', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "game"."report_target_type" AS ENUM('account', 'faction');--> statement-breakpoint
CREATE TYPE "game"."resource_type" AS ENUM('money', 'gold', 'food', 'water', 'oil');--> statement-breakpoint
CREATE TYPE "game"."revenuecat_status" AS ENUM('received', 'processed', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "game"."shop_item_kind" AS ENUM('pass', 'cosmetic');--> statement-breakpoint
CREATE TYPE "game"."trade_kind" AS ENUM('market_listing', 'direct_offer', 'state_exchange');--> statement-breakpoint
CREATE TYPE "game"."trade_log_state" AS ENUM('settled', 'rejected', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "game"."trade_offer_state" AS ENUM('open', 'pending', 'accepted', 'declined', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "game"."tradeable_resource" AS ENUM('food', 'water', 'oil');--> statement-breakpoint
CREATE TYPE "game"."unit_type" AS ENUM('infantry', 'tank', 'aircraft', 'artillery');--> statement-breakpoint
CREATE TYPE "game"."world_event_type" AS ENUM('join', 'command', 'admin', 'season', 'system', 'account');--> statement-breakpoint
CREATE TYPE "game"."world_status" AS ENUM('creating', 'open', 'running', 'finished');--> statement-breakpoint
CREATE TABLE "game"."schema_meta" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"schema_version" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schema_meta_id_check" CHECK ("game"."schema_meta"."id" = true)
);
--> statement-breakpoint
CREATE TABLE "game"."account_cosmetics" (
	"account_id" uuid NOT NULL,
	"slot" "game"."cosmetic_slot" NOT NULL,
	"catalog_id" text NOT NULL,
	"equipped_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_cosmetics_account_id_slot_pk" PRIMARY KEY("account_id","slot")
);
--> statement-breakpoint
CREATE TABLE "game"."account_entitlements" (
	"entitlement_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"kind" "game"."entitlement_kind" NOT NULL,
	"catalog_id" text NOT NULL,
	"source" "game"."entitlement_source" NOT NULL,
	"source_event_id" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"status" "game"."entitlement_status" DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "account_entitlement_owner_unique" UNIQUE("account_id","entitlement_id"),
	CONSTRAINT "entitlement_time_order" CHECK ("game"."account_entitlements"."expires_at" is null or "game"."account_entitlements"."expires_at" > "game"."account_entitlements"."granted_at"),
	CONSTRAINT "entitlement_pass_expiry" CHECK ("game"."account_entitlements"."kind" <> 'pass' or "game"."account_entitlements"."expires_at" is not null),
	CONSTRAINT "entitlement_revenuecat_event" CHECK ("game"."account_entitlements"."source" <> 'revenuecat' or "game"."account_entitlements"."source_event_id" is not null),
	CONSTRAINT "entitlement_revoked_time" CHECK (("game"."account_entitlements"."status" = 'revoked' and "game"."account_entitlements"."revoked_at" is not null) or ("game"."account_entitlements"."status" <> 'revoked' and "game"."account_entitlements"."revoked_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."accounts" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"display_name_key" text NOT NULL,
	"status" "game"."account_status" DEFAULT 'active' NOT NULL,
	"is_guest" boolean DEFAULT true NOT NULL,
	"merged_into" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"banned_until" timestamp with time zone,
	"ban_reason" text,
	"version" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "accounts_display_name_len" CHECK (char_length("game"."accounts"."display_name") between 1 and 32),
	CONSTRAINT "accounts_merged_self" CHECK ("game"."accounts"."merged_into" is null or "game"."accounts"."merged_into" <> "game"."accounts"."account_id"),
	CONSTRAINT "accounts_merged_status" CHECK (("game"."accounts"."status" = 'merged' and "game"."accounts"."merged_into" is not null) or ("game"."accounts"."status" <> 'merged' and "game"."accounts"."merged_into" is null)),
	CONSTRAINT "accounts_ban_reason" CHECK ("game"."accounts"."status" <> 'banned' or "game"."accounts"."banned_until" is not null),
	CONSTRAINT "accounts_version_nonneg" CHECK ("game"."accounts"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "game"."pass_periods" (
	"pass_period_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"source_entitlement_id" uuid NOT NULL,
	"status" "game"."pass_period_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_period_source_unique" UNIQUE("source_entitlement_id"),
	CONSTRAINT "pass_period_time_order" CHECK ("game"."pass_periods"."ends_at" > "game"."pass_periods"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "game"."pass_progress" (
	"pass_period_id" uuid PRIMARY KEY NOT NULL,
	"xp" bigint DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"premium_unlocked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_progress_xp_nonneg" CHECK ("game"."pass_progress"."xp" >= 0),
	CONSTRAINT "pass_progress_level_nonneg" CHECK ("game"."pass_progress"."level" >= 0)
);
--> statement-breakpoint
CREATE TABLE "game"."pass_reward_claims" (
	"pass_period_id" uuid NOT NULL,
	"reward_id" text NOT NULL,
	"state" "game"."pass_reward_state" DEFAULT 'locked' NOT NULL,
	"claimed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_reward_claims_pass_period_id_reward_id_pk" PRIMARY KEY("pass_period_id","reward_id"),
	CONSTRAINT "pass_reward_claimed_time" CHECK (("game"."pass_reward_claims"."state" in ('claimed', 'auto_claimed') and "game"."pass_reward_claims"."claimed_at" is not null) or ("game"."pass_reward_claims"."state" in ('locked', 'claimable') and "game"."pass_reward_claims"."claimed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."missions" (
	"account_id" uuid NOT NULL,
	"mission_id" text NOT NULL,
	"period_key" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer NOT NULL,
	"state" "game"."mission_state" DEFAULT 'active' NOT NULL,
	"completed_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missions_account_id_mission_id_period_key_pk" PRIMARY KEY("account_id","mission_id","period_key"),
	CONSTRAINT "mission_progress_nonneg" CHECK ("game"."missions"."progress" >= 0),
	CONSTRAINT "mission_target_pos" CHECK ("game"."missions"."target" > 0),
	CONSTRAINT "mission_completed_time" CHECK (("game"."missions"."state" in ('completed', 'claimed') and "game"."missions"."completed_at" is not null) or ("game"."missions"."state" = 'active' and "game"."missions"."completed_at" is null) or "game"."missions"."state" = 'expired'),
	CONSTRAINT "mission_claimed_time" CHECK (("game"."missions"."state" = 'claimed' and "game"."missions"."claimed_at" is not null) or ("game"."missions"."state" <> 'claimed' and "game"."missions"."claimed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."revenuecat_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"account_id" uuid,
	"app_user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"product_id" text,
	"entitlement_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "game"."revenuecat_status" DEFAULT 'received' NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "revenuecat_processed_time" CHECK (("game"."revenuecat_events"."status" in ('processed', 'ignored') and "game"."revenuecat_events"."processed_at" is not null) or ("game"."revenuecat_events"."status" in ('received', 'failed') and "game"."revenuecat_events"."processed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."shop_items" (
	"item_id" text PRIMARY KEY NOT NULL,
	"kind" "game"."shop_item_kind" NOT NULL,
	"slot" "game"."cosmetic_slot",
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_usd_cents" integer NOT NULL,
	"store_product_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_items_price_nonneg" CHECK ("game"."shop_items"."price_usd_cents" >= 0),
	CONSTRAINT "shop_item_slot" CHECK (("game"."shop_items"."kind" = 'cosmetic' and "game"."shop_items"."slot" is not null) or ("game"."shop_items"."kind" = 'pass' and "game"."shop_items"."slot" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."world_leases" (
	"world_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"lease_version" bigint DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"heartbeat_at" timestamp with time zone NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lease_version_nonneg" CHECK ("game"."world_leases"."lease_version" >= 0),
	CONSTRAINT "lease_expiry_order" CHECK ("game"."world_leases"."lease_expires_at" > "game"."world_leases"."acquired_at")
);
--> statement-breakpoint
CREATE TABLE "game"."worlds" (
	"world_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"map_id" text NOT NULL,
	"map_hash" char(64) NOT NULL,
	"config_version" text NOT NULL,
	"config_hash" char(64) NOT NULL,
	"status" "game"."world_status" DEFAULT 'creating' NOT NULL,
	"operational_state" "game"."operational_state",
	"started_at" timestamp with time zone,
	"join_deadline" timestamp with time zone,
	"season_end" timestamp with time zone,
	"max_humans" smallint NOT NULL,
	"ai_count" smallint NOT NULL,
	"province_count" smallint NOT NULL,
	"version" bigint DEFAULT 0 NOT NULL,
	"last_tick" bigint DEFAULT 0 NOT NULL,
	"last_event_seq" bigint DEFAULT 0 NOT NULL,
	"final_snapshot_seq" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "worlds_pin_unique" UNIQUE("world_id","config_version","config_hash","map_id","map_hash"),
	CONSTRAINT "worlds_max_humans_range" CHECK ("game"."worlds"."max_humans" between 20 and 24),
	CONSTRAINT "worlds_ai_count_range" CHECK ("game"."worlds"."ai_count" between 10 and 15),
	CONSTRAINT "worlds_province_count_range" CHECK ("game"."worlds"."province_count" between 80 and 100),
	CONSTRAINT "worlds_version_nonneg" CHECK ("game"."worlds"."version" >= 0),
	CONSTRAINT "worlds_last_tick_nonneg" CHECK ("game"."worlds"."last_tick" >= 0),
	CONSTRAINT "worlds_last_event_seq_nonneg" CHECK ("game"."worlds"."last_event_seq" >= 0),
	CONSTRAINT "worlds_final_snapshot_seq_pos" CHECK ("game"."worlds"."final_snapshot_seq" is null or "game"."worlds"."final_snapshot_seq" > 0),
	CONSTRAINT "world_started" CHECK ("game"."worlds"."status" = 'creating' or "game"."worlds"."started_at" is not null),
	CONSTRAINT "world_join_deadline" CHECK ("game"."worlds"."started_at" is null or "game"."worlds"."join_deadline" is null or "game"."worlds"."join_deadline" >= "game"."worlds"."started_at"),
	CONSTRAINT "world_season_end" CHECK ("game"."worlds"."started_at" is null or "game"."worlds"."season_end" is null or "game"."worlds"."season_end" > "game"."worlds"."started_at"),
	CONSTRAINT "world_finished_time" CHECK ("game"."worlds"."status" <> 'finished' or "game"."worlds"."finished_at" is not null),
	CONSTRAINT "world_finished_snapshot" CHECK ("game"."worlds"."status" <> 'finished' or "game"."worlds"."final_snapshot_seq" is not null),
	CONSTRAINT "world_operational_state" CHECK ("game"."worlds"."operational_state" is null or "game"."worlds"."status" in ('open', 'running', 'finished')),
	CONSTRAINT "worlds_map_hash_sha256" CHECK ("game"."worlds"."map_hash" ~* '^[0-9a-f]{64}$'),
	CONSTRAINT "worlds_config_hash_sha256" CHECK ("game"."worlds"."config_hash" ~* '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "game"."doctrine_log" (
	"world_id" uuid NOT NULL,
	"change_id" bigint NOT NULL,
	"faction_id" bigint NOT NULL,
	"old_weapon" "game"."doctrine_weapon",
	"new_weapon" "game"."doctrine_weapon",
	"old_skill" "game"."doctrine_skill",
	"new_skill" "game"."doctrine_skill",
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctrine_log_world_id_change_id_pk" PRIMARY KEY("world_id","change_id"),
	CONSTRAINT "doctrine_log_change_id_pos" CHECK ("game"."doctrine_log"."change_id" > 0)
);
--> statement-breakpoint
CREATE TABLE "game"."faction_resources" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"resource_type" "game"."resource_type" NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"remainder" numeric(18, 6) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faction_resources_world_id_faction_id_resource_type_pk" PRIMARY KEY("world_id","faction_id","resource_type"),
	CONSTRAINT "faction_resources_amount_nonneg" CHECK ("game"."faction_resources"."amount" >= 0),
	CONSTRAINT "faction_resources_remainder_range" CHECK ("game"."faction_resources"."remainder" >= 0 and "game"."faction_resources"."remainder" < 1)
);
--> statement-breakpoint
CREATE TABLE "game"."faction_techs" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"tech_id" text NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faction_techs_world_id_faction_id_tech_id_pk" PRIMARY KEY("world_id","faction_id","tech_id")
);
--> statement-breakpoint
CREATE TABLE "game"."factions" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"account_id" uuid,
	"kind" "game"."faction_kind" NOT NULL,
	"state" "game"."faction_state" NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"emblem_id" text NOT NULL,
	"color_id" text NOT NULL,
	"capital_province_id" smallint,
	"support" smallint DEFAULT 60 NOT NULL,
	"support_remainder" numeric(18, 6) DEFAULT '0' NOT NULL,
	"rebellion_state" "game"."rebellion_faction_state" DEFAULT 'none' NOT NULL,
	"rebellion_grace_until" timestamp with time zone,
	"protection_until" timestamp with time zone,
	"era" smallint DEFAULT 1 NOT NULL,
	"voluntary_relocation_used" boolean DEFAULT false NOT NULL,
	"build_slots" smallint DEFAULT 1 NOT NULL,
	"training_slots" smallint DEFAULT 1 NOT NULL,
	"doctrine_weapon" "game"."doctrine_weapon",
	"doctrine_skill" "game"."doctrine_skill",
	"ai_archetype" "game"."ai_archetype",
	"ai_state" jsonb,
	"public_score" bigint DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"eliminated_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factions_world_id_faction_id_pk" PRIMARY KEY("world_id","faction_id"),
	CONSTRAINT "faction_id_pos" CHECK ("game"."factions"."faction_id" > 0),
	CONSTRAINT "faction_capital_province_range" CHECK ("game"."factions"."capital_province_id" is null or "game"."factions"."capital_province_id" between 1 and 254),
	CONSTRAINT "faction_support_range" CHECK ("game"."factions"."support" between 0 and 100),
	CONSTRAINT "faction_support_remainder_range" CHECK ("game"."factions"."support_remainder" >= 0 and "game"."factions"."support_remainder" < 1),
	CONSTRAINT "faction_era_range" CHECK ("game"."factions"."era" between 1 and 4),
	CONSTRAINT "faction_build_slots_range" CHECK ("game"."factions"."build_slots" between 1 and 2),
	CONSTRAINT "faction_training_slots_range" CHECK ("game"."factions"."training_slots" between 1 and 2),
	CONSTRAINT "faction_public_score_nonneg" CHECK ("game"."factions"."public_score" >= 0),
	CONSTRAINT "faction_name_len" CHECK (char_length("game"."factions"."name") between 1 and 32),
	CONSTRAINT "faction_ai_account" CHECK (("game"."factions"."kind" = 'ai' and "game"."factions"."account_id" is null and "game"."factions"."ai_archetype" is not null) or ("game"."factions"."kind" = 'player' and "game"."factions"."account_id" is not null and ("game"."factions"."ai_archetype" is null or "game"."factions"."state" = 'ai_controlled'))),
	CONSTRAINT "faction_ai_controlled_archetype" CHECK ("game"."factions"."state" <> 'ai_controlled' or "game"."factions"."ai_archetype" is not null),
	CONSTRAINT "faction_ai_no_capital" CHECK ("game"."factions"."kind" <> 'ai' or "game"."factions"."capital_province_id" is null),
	CONSTRAINT "faction_rebellion_grace" CHECK (("game"."factions"."rebellion_state" = 'grace' and "game"."factions"."rebellion_grace_until" is not null) or ("game"."factions"."rebellion_state" <> 'grace' and "game"."factions"."rebellion_grace_until" is null)),
	CONSTRAINT "faction_ai_state_object" CHECK ("game"."factions"."ai_state" is null or jsonb_typeof("game"."factions"."ai_state") = 'object')
);
--> statement-breakpoint
CREATE TABLE "game"."rebellions" (
	"world_id" uuid NOT NULL,
	"rebellion_id" bigint NOT NULL,
	"origin_faction_id" bigint NOT NULL,
	"province_id" smallint NOT NULL,
	"state" "game"."rebellion_state" NOT NULL,
	"spawned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"defeated_at" timestamp with time zone,
	CONSTRAINT "rebellions_world_id_rebellion_id_pk" PRIMARY KEY("world_id","rebellion_id"),
	CONSTRAINT "rebellions_id_pos" CHECK ("game"."rebellions"."rebellion_id" > 0),
	CONSTRAINT "rebellions_province_id_range" CHECK ("game"."rebellions"."province_id" between 1 and 254),
	CONSTRAINT "rebellion_defeated_time" CHECK (("game"."rebellions"."state" = 'defeated' and "game"."rebellions"."defeated_at" is not null) or ("game"."rebellions"."state" in ('spawned', 'holding') and "game"."rebellions"."defeated_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."neutral_garrisons" (
	"world_id" uuid NOT NULL,
	"province_id" smallint NOT NULL,
	"unit_type" "game"."unit_type" NOT NULL,
	"count" bigint NOT NULL,
	CONSTRAINT "neutral_garrisons_world_id_province_id_unit_type_pk" PRIMARY KEY("world_id","province_id","unit_type"),
	CONSTRAINT "neutral_garrisons_count_pos" CHECK ("game"."neutral_garrisons"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "game"."support_daily" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"province_id" smallint NOT NULL,
	"world_day" smallint NOT NULL,
	"net_delta" numeric(8, 3) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_daily_world_id_faction_id_province_id_world_day_pk" PRIMARY KEY("world_id","faction_id","province_id","world_day"),
	CONSTRAINT "support_daily_world_day_range" CHECK ("game"."support_daily"."world_day" between 1 and 30)
);
--> statement-breakpoint
CREATE TABLE "game"."world_regions" (
	"world_id" uuid NOT NULL,
	"province_id" smallint NOT NULL,
	"owner_faction_id" bigint,
	"controller_type" "game"."controller_type" NOT NULL,
	"rebel_group_id" bigint,
	"last_attacker_faction_id" bigint,
	"level" smallint DEFAULT 1 NOT NULL,
	"terrain_resource" "game"."resource_type" NOT NULL,
	"is_capital" boolean DEFAULT false NOT NULL,
	"is_refugee" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "world_regions_world_id_province_id_pk" PRIMARY KEY("world_id","province_id"),
	CONSTRAINT "regions_province_id_range" CHECK ("game"."world_regions"."province_id" between 1 and 254),
	CONSTRAINT "regions_level_range" CHECK ("game"."world_regions"."level" between 1 and 5),
	CONSTRAINT "region_controller" CHECK (("game"."world_regions"."controller_type" = 'none' and "game"."world_regions"."owner_faction_id" is null and "game"."world_regions"."rebel_group_id" is null) or ("game"."world_regions"."controller_type" in ('player', 'ai') and "game"."world_regions"."owner_faction_id" is not null and "game"."world_regions"."rebel_group_id" is null) or ("game"."world_regions"."controller_type" = 'rebel' and "game"."world_regions"."owner_faction_id" is null and "game"."world_regions"."rebel_group_id" is not null)),
	CONSTRAINT "region_capital_owner" CHECK (not "game"."world_regions"."is_capital" or ("game"."world_regions"."owner_faction_id" is not null and "game"."world_regions"."controller_type" = 'player')),
	CONSTRAINT "region_refugee_state" CHECK (not "game"."world_regions"."is_refugee" or ("game"."world_regions"."owner_faction_id" is null and "game"."world_regions"."rebel_group_id" is null and "game"."world_regions"."level" = 1)),
	CONSTRAINT "region_rebel_last_attacker" CHECK ("game"."world_regions"."controller_type" <> 'rebel' or "game"."world_regions"."last_attacker_faction_id" is null)
);
--> statement-breakpoint
CREATE TABLE "game"."armies" (
	"world_id" uuid NOT NULL,
	"army_id" bigint NOT NULL,
	"owner_faction_id" bigint,
	"rebel_group_id" bigint,
	"state" "game"."army_state" NOT NULL,
	"purpose" "game"."army_purpose",
	"mode" "game"."movement_mode",
	"location_province_id" smallint,
	"origin_province_id" smallint,
	"target_province_id" smallint,
	"depart_at" timestamp with time zone,
	"arrive_at" timestamp with time zone,
	"fatigue_until" timestamp with time zone,
	"recallable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"destroyed_at" timestamp with time zone,
	CONSTRAINT "armies_world_id_army_id_pk" PRIMARY KEY("world_id","army_id"),
	CONSTRAINT "armies_id_pos" CHECK ("game"."armies"."army_id" > 0),
	CONSTRAINT "army_owner_xor" CHECK (("game"."armies"."owner_faction_id" is not null) <> ("game"."armies"."rebel_group_id" is not null)),
	CONSTRAINT "army_state_shape" CHECK (("game"."armies"."state" = 'garrison' and "game"."armies"."location_province_id" is not null and "game"."armies"."origin_province_id" is null and "game"."armies"."target_province_id" is null and "game"."armies"."purpose" is null and "game"."armies"."mode" is null and "game"."armies"."depart_at" is null and "game"."armies"."arrive_at" is null) or ("game"."armies"."state" in ('marching', 'resolving') and "game"."armies"."location_province_id" is null and "game"."armies"."origin_province_id" is not null and "game"."armies"."target_province_id" is not null and "game"."armies"."purpose" is not null and "game"."armies"."mode" is not null and "game"."armies"."depart_at" is not null and "game"."armies"."arrive_at" is not null) or ("game"."armies"."state" = 'destroyed' and "game"."armies"."destroyed_at" is not null)),
	CONSTRAINT "army_time_order" CHECK ("game"."armies"."depart_at" is null or "game"."armies"."arrive_at" is null or "game"."armies"."arrive_at" > "game"."armies"."depart_at"),
	CONSTRAINT "army_origin_target" CHECK ("game"."armies"."origin_province_id" is null or "game"."armies"."target_province_id" is null or "game"."armies"."origin_province_id" <> "game"."armies"."target_province_id"),
	CONSTRAINT "army_garrison_recallable" CHECK ("game"."armies"."state" <> 'garrison' or not "game"."armies"."recallable")
);
--> statement-breakpoint
CREATE TABLE "game"."army_units" (
	"world_id" uuid NOT NULL,
	"army_id" bigint NOT NULL,
	"unit_type" "game"."unit_type" NOT NULL,
	"count" bigint NOT NULL,
	CONSTRAINT "army_units_world_id_army_id_unit_type_pk" PRIMARY KEY("world_id","army_id","unit_type"),
	CONSTRAINT "army_units_count_pos" CHECK ("game"."army_units"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "game"."battle_log" (
	"world_id" uuid NOT NULL,
	"battle_id" bigint NOT NULL,
	"province_id" smallint NOT NULL,
	"attacker_controller_type" "game"."controller_type" NOT NULL,
	"attacker_faction_id" bigint,
	"defender_controller_type" "game"."controller_type" NOT NULL,
	"defender_faction_id" bigint,
	"attacker_army_id" bigint NOT NULL,
	"defender_army_ids" bigint[] DEFAULT '{}'::bigint[] NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone NOT NULL,
	"result" "game"."battle_result" NOT NULL,
	"province_level_before" smallint NOT NULL,
	"province_level_after" smallint NOT NULL,
	"attacker_power" numeric(18, 6) NOT NULL,
	"defender_power" numeric(18, 6) NOT NULL,
	"attacker_units" jsonb NOT NULL,
	"defender_units" jsonb NOT NULL,
	"attacker_losses" jsonb NOT NULL,
	"defender_losses" jsonb NOT NULL,
	"attacker_multipliers" jsonb NOT NULL,
	"defender_multipliers" jsonb NOT NULL,
	"loot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"support_changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"new_owner_faction_id" bigint,
	"public_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "battle_log_world_id_battle_id_pk" PRIMARY KEY("world_id","battle_id"),
	CONSTRAINT "battle_id_pos" CHECK ("game"."battle_log"."battle_id" > 0),
	CONSTRAINT "battle_attacker_controller_valid" CHECK ("game"."battle_log"."attacker_controller_type" in ('player', 'ai', 'rebel')),
	CONSTRAINT "battle_defender_controller_valid" CHECK ("game"."battle_log"."defender_controller_type" in ('none', 'player', 'ai', 'rebel')),
	CONSTRAINT "battle_province_level_before_range" CHECK ("game"."battle_log"."province_level_before" between 1 and 5),
	CONSTRAINT "battle_province_level_after_range" CHECK ("game"."battle_log"."province_level_after" between 1 and 5),
	CONSTRAINT "battle_attacker_power_nonneg" CHECK ("game"."battle_log"."attacker_power" >= 0),
	CONSTRAINT "battle_defender_power_nonneg" CHECK ("game"."battle_log"."defender_power" >= 0),
	CONSTRAINT "battle_time_order" CHECK ("game"."battle_log"."resolved_at" >= "game"."battle_log"."started_at"),
	CONSTRAINT "battle_attacker_shape" CHECK (("game"."battle_log"."attacker_controller_type" in ('player', 'ai') and "game"."battle_log"."attacker_faction_id" is not null) or ("game"."battle_log"."attacker_controller_type" = 'rebel' and "game"."battle_log"."attacker_faction_id" is null)),
	CONSTRAINT "battle_defender_shape" CHECK (("game"."battle_log"."defender_controller_type" in ('player', 'ai') and "game"."battle_log"."defender_faction_id" is not null) or ("game"."battle_log"."defender_controller_type" in ('none', 'rebel') and "game"."battle_log"."defender_faction_id" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."alliance_invitations" (
	"world_id" uuid NOT NULL,
	"invitation_id" bigint NOT NULL,
	"alliance_id" bigint NOT NULL,
	"inviter_faction_id" bigint NOT NULL,
	"invitee_faction_id" bigint NOT NULL,
	"state" "game"."invitation_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "alliance_invitations_world_id_invitation_id_pk" PRIMARY KEY("world_id","invitation_id"),
	CONSTRAINT "invitation_id_pos" CHECK ("game"."alliance_invitations"."invitation_id" > 0),
	CONSTRAINT "invitation_time_order" CHECK ("game"."alliance_invitations"."expires_at" > "game"."alliance_invitations"."created_at"),
	CONSTRAINT "invitation_response_time" CHECK (("game"."alliance_invitations"."state" = 'pending' and "game"."alliance_invitations"."responded_at" is null) or ("game"."alliance_invitations"."state" <> 'pending' and "game"."alliance_invitations"."responded_at" is not null)),
	CONSTRAINT "invitation_not_self" CHECK ("game"."alliance_invitations"."inviter_faction_id" <> "game"."alliance_invitations"."invitee_faction_id")
);
--> statement-breakpoint
CREATE TABLE "game"."alliance_members" (
	"world_id" uuid NOT NULL,
	"membership_id" bigint NOT NULL,
	"alliance_id" bigint NOT NULL,
	"faction_id" bigint NOT NULL,
	"role" "game"."alliance_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"leave_reason" "game"."leave_reason",
	CONSTRAINT "alliance_members_world_id_membership_id_pk" PRIMARY KEY("world_id","membership_id"),
	CONSTRAINT "membership_id_pos" CHECK ("game"."alliance_members"."membership_id" > 0),
	CONSTRAINT "alliance_member_leave_shape" CHECK (("game"."alliance_members"."left_at" is null and "game"."alliance_members"."leave_reason" is null) or ("game"."alliance_members"."left_at" is not null and "game"."alliance_members"."leave_reason" is not null))
);
--> statement-breakpoint
CREATE TABLE "game"."alliances" (
	"world_id" uuid NOT NULL,
	"alliance_id" bigint NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"leader_faction_id" bigint,
	"state" "game"."alliance_state" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dissolved_at" timestamp with time zone,
	CONSTRAINT "alliances_world_id_alliance_id_pk" PRIMARY KEY("world_id","alliance_id"),
	CONSTRAINT "alliance_id_pos" CHECK ("game"."alliances"."alliance_id" > 0),
	CONSTRAINT "alliance_name_len" CHECK (char_length("game"."alliances"."name") between 1 and 32),
	CONSTRAINT "alliance_dissolved_time" CHECK (("game"."alliances"."state" = 'dissolved' and "game"."alliances"."dissolved_at" is not null) or ("game"."alliances"."state" = 'active' and "game"."alliances"."dissolved_at" is null))
);
--> statement-breakpoint
CREATE TABLE "game"."trade_daily" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"world_day" smallint NOT NULL,
	"trades_count" integer DEFAULT 0 NOT NULL,
	"gold_moved" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_daily_world_id_faction_id_world_day_pk" PRIMARY KEY("world_id","faction_id","world_day"),
	CONSTRAINT "trade_daily_world_day_range" CHECK ("game"."trade_daily"."world_day" between 1 and 30),
	CONSTRAINT "trade_daily_trades_count_nonneg" CHECK ("game"."trade_daily"."trades_count" >= 0),
	CONSTRAINT "trade_daily_gold_moved_nonneg" CHECK ("game"."trade_daily"."gold_moved" >= 0)
);
--> statement-breakpoint
CREATE TABLE "game"."trade_log" (
	"world_id" uuid NOT NULL,
	"trade_id" bigint NOT NULL,
	"offer_id" bigint,
	"kind" "game"."trade_kind" NOT NULL,
	"seller_faction_id" bigint NOT NULL,
	"buyer_faction_id" bigint,
	"resource" "game"."tradeable_resource" NOT NULL,
	"amount" bigint NOT NULL,
	"gold" bigint NOT NULL,
	"tax_gold" bigint DEFAULT 0 NOT NULL,
	"state" "game"."trade_log_state" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_log_world_id_trade_id_pk" PRIMARY KEY("world_id","trade_id"),
	CONSTRAINT "trade_log_id_pos" CHECK ("game"."trade_log"."trade_id" > 0),
	CONSTRAINT "trade_log_amount_pos" CHECK ("game"."trade_log"."amount" > 0),
	CONSTRAINT "trade_log_gold_nonneg" CHECK ("game"."trade_log"."gold" >= 0),
	CONSTRAINT "trade_log_tax_gold_nonneg" CHECK ("game"."trade_log"."tax_gold" >= 0),
	CONSTRAINT "trade_log_offer_shape" CHECK (("game"."trade_log"."kind" = 'state_exchange' and "game"."trade_log"."offer_id" is null) or ("game"."trade_log"."kind" <> 'state_exchange' and "game"."trade_log"."offer_id" is not null)),
	CONSTRAINT "trade_log_buyer_null_only_system" CHECK ("game"."trade_log"."buyer_faction_id" is not null or "game"."trade_log"."kind" = 'state_exchange')
);
--> statement-breakpoint
CREATE TABLE "game"."trade_offers" (
	"world_id" uuid NOT NULL,
	"offer_id" bigint NOT NULL,
	"kind" "game"."trade_kind" NOT NULL,
	"seller_faction_id" bigint NOT NULL,
	"buyer_faction_id" bigint,
	"resource" "game"."tradeable_resource" NOT NULL,
	"amount" bigint NOT NULL,
	"price_gold" bigint NOT NULL,
	"state" "game"."trade_offer_state" NOT NULL,
	"escrow_amount" bigint DEFAULT 0 NOT NULL,
	"tax_gold" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"frozen_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "trade_offers_world_id_offer_id_pk" PRIMARY KEY("world_id","offer_id"),
	CONSTRAINT "trade_offers_id_pos" CHECK ("game"."trade_offers"."offer_id" > 0),
	CONSTRAINT "trade_offer_kind_valid" CHECK ("game"."trade_offers"."kind" in ('market_listing', 'direct_offer')),
	CONSTRAINT "trade_offer_amount_pos" CHECK ("game"."trade_offers"."amount" > 0),
	CONSTRAINT "trade_offer_price_gold_pos" CHECK ("game"."trade_offers"."price_gold" > 0),
	CONSTRAINT "trade_offer_escrow_amount_nonneg" CHECK ("game"."trade_offers"."escrow_amount" >= 0),
	CONSTRAINT "trade_offer_tax_gold_nonneg" CHECK ("game"."trade_offers"."tax_gold" >= 0),
	CONSTRAINT "trade_offer_time_order" CHECK ("game"."trade_offers"."expires_at" > "game"."trade_offers"."created_at"),
	CONSTRAINT "trade_offer_buyer_shape" CHECK (("game"."trade_offers"."kind" = 'market_listing' and "game"."trade_offers"."buyer_faction_id" is null) or ("game"."trade_offers"."kind" = 'direct_offer' and "game"."trade_offers"."buyer_faction_id" is not null)),
	CONSTRAINT "trade_offer_not_self" CHECK ("game"."trade_offers"."buyer_faction_id" is null or "game"."trade_offers"."buyer_faction_id" <> "game"."trade_offers"."seller_faction_id"),
	CONSTRAINT "trade_offer_escrow_shape" CHECK ("game"."trade_offers"."state" not in ('open', 'pending') or "game"."trade_offers"."escrow_amount" = "game"."trade_offers"."amount"),
	CONSTRAINT "trade_offer_escrow_zero" CHECK ("game"."trade_offers"."state" in ('open', 'pending') or "game"."trade_offers"."escrow_amount" = 0)
);
--> statement-breakpoint
CREATE TABLE "game"."ability_cooldowns" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"ability" "game"."ability_type" NOT NULL,
	"ready_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ability_cooldowns_world_id_faction_id_ability_pk" PRIMARY KEY("world_id","faction_id","ability"),
	CONSTRAINT "ability_cooldown_order" CHECK ("game"."ability_cooldowns"."ready_at" > "game"."ability_cooldowns"."last_used_at")
);
--> statement-breakpoint
CREATE TABLE "game"."build_queue" (
	"world_id" uuid NOT NULL,
	"order_id" bigint NOT NULL,
	"faction_id" bigint NOT NULL,
	"province_id" smallint NOT NULL,
	"from_level" smallint NOT NULL,
	"to_level" smallint NOT NULL,
	"state" "game"."queue_state" DEFAULT 'queued' NOT NULL,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finishes_at" timestamp with time zone,
	"cost_money" bigint DEFAULT 0 NOT NULL,
	"cost_resource_type" "game"."resource_type",
	"cost_resource_amount" bigint DEFAULT 0 NOT NULL,
	"refund_amount" bigint DEFAULT 0 NOT NULL,
	"cancel_reason" text,
	"completed_at" timestamp with time zone,
	CONSTRAINT "build_queue_world_id_order_id_pk" PRIMARY KEY("world_id","order_id"),
	CONSTRAINT "build_queue_order_id_pos" CHECK ("game"."build_queue"."order_id" > 0),
	CONSTRAINT "build_queue_from_level_range" CHECK ("game"."build_queue"."from_level" between 1 and 4),
	CONSTRAINT "build_queue_to_level_range" CHECK ("game"."build_queue"."to_level" between 2 and 5),
	CONSTRAINT "build_level_order" CHECK ("game"."build_queue"."to_level" = "game"."build_queue"."from_level" + 1),
	CONSTRAINT "build_queue_cost_money_nonneg" CHECK ("game"."build_queue"."cost_money" >= 0),
	CONSTRAINT "build_queue_cost_amount_nonneg" CHECK ("game"."build_queue"."cost_resource_amount" >= 0),
	CONSTRAINT "build_queue_refund_amount_nonneg" CHECK ("game"."build_queue"."refund_amount" >= 0),
	CONSTRAINT "build_cost_resource_shape" CHECK (("game"."build_queue"."cost_resource_type" is null and "game"."build_queue"."cost_resource_amount" = 0) or ("game"."build_queue"."cost_resource_type" is not null and "game"."build_queue"."cost_resource_amount" > 0)),
	CONSTRAINT "build_state_time" CHECK (("game"."build_queue"."state" = 'queued' and "game"."build_queue"."started_at" is null and "game"."build_queue"."finishes_at" is null and "game"."build_queue"."completed_at" is null and "game"."build_queue"."cancel_reason" is null) or ("game"."build_queue"."state" = 'running' and "game"."build_queue"."started_at" is not null and "game"."build_queue"."finishes_at" is not null and "game"."build_queue"."completed_at" is null and "game"."build_queue"."cancel_reason" is null) or ("game"."build_queue"."state" = 'completed' and "game"."build_queue"."started_at" is not null and "game"."build_queue"."finishes_at" is not null and "game"."build_queue"."completed_at" is not null and "game"."build_queue"."cancel_reason" is null) or ("game"."build_queue"."state" = 'cancelled' and "game"."build_queue"."completed_at" is null and "game"."build_queue"."cancel_reason" is not null)),
	CONSTRAINT "build_finish_order" CHECK ("game"."build_queue"."finishes_at" is null or "game"."build_queue"."started_at" is null or "game"."build_queue"."finishes_at" > "game"."build_queue"."started_at")
);
--> statement-breakpoint
CREATE TABLE "game"."ex_ally_cooldowns" (
	"world_id" uuid NOT NULL,
	"faction_a_id" bigint NOT NULL,
	"faction_b_id" bigint NOT NULL,
	"until" timestamp with time zone NOT NULL,
	"reason" "game"."leave_reason" NOT NULL,
	CONSTRAINT "ex_ally_cooldowns_world_id_faction_a_id_faction_b_id_pk" PRIMARY KEY("world_id","faction_a_id","faction_b_id"),
	CONSTRAINT "ex_ally_reason_valid" CHECK ("game"."ex_ally_cooldowns"."reason" in ('left', 'kicked')),
	CONSTRAINT "ex_ally_order" CHECK ("game"."ex_ally_cooldowns"."faction_a_id" < "game"."ex_ally_cooldowns"."faction_b_id")
);
--> statement-breakpoint
CREATE TABLE "game"."training_queue" (
	"world_id" uuid NOT NULL,
	"order_id" bigint NOT NULL,
	"faction_id" bigint NOT NULL,
	"province_id" smallint NOT NULL,
	"unit_type" "game"."unit_type" NOT NULL,
	"count" bigint NOT NULL,
	"state" "game"."queue_state" DEFAULT 'queued' NOT NULL,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finishes_at" timestamp with time zone,
	"cost_money" bigint DEFAULT 0 NOT NULL,
	"cost_resource_type" "game"."resource_type",
	"cost_resource_amount" bigint DEFAULT 0 NOT NULL,
	"refund_amount" bigint DEFAULT 0 NOT NULL,
	"cancel_reason" text,
	"completed_at" timestamp with time zone,
	CONSTRAINT "training_queue_world_id_order_id_pk" PRIMARY KEY("world_id","order_id"),
	CONSTRAINT "training_queue_order_id_pos" CHECK ("game"."training_queue"."order_id" > 0),
	CONSTRAINT "training_queue_unit_type_valid" CHECK ("game"."training_queue"."unit_type" <> 'infantry'),
	CONSTRAINT "training_queue_count_pos" CHECK ("game"."training_queue"."count" > 0),
	CONSTRAINT "training_queue_cost_money_nonneg" CHECK ("game"."training_queue"."cost_money" >= 0),
	CONSTRAINT "training_queue_cost_amount_nonneg" CHECK ("game"."training_queue"."cost_resource_amount" >= 0),
	CONSTRAINT "training_queue_refund_amount_nonneg" CHECK ("game"."training_queue"."refund_amount" >= 0),
	CONSTRAINT "training_cost_resource_shape" CHECK (("game"."training_queue"."cost_resource_type" is null and "game"."training_queue"."cost_resource_amount" = 0) or ("game"."training_queue"."cost_resource_type" is not null and "game"."training_queue"."cost_resource_amount" > 0)),
	CONSTRAINT "training_state_time" CHECK (("game"."training_queue"."state" = 'queued' and "game"."training_queue"."started_at" is null and "game"."training_queue"."finishes_at" is null and "game"."training_queue"."completed_at" is null and "game"."training_queue"."cancel_reason" is null) or ("game"."training_queue"."state" = 'running' and "game"."training_queue"."started_at" is not null and "game"."training_queue"."finishes_at" is not null and "game"."training_queue"."completed_at" is null and "game"."training_queue"."cancel_reason" is null) or ("game"."training_queue"."state" = 'completed' and "game"."training_queue"."started_at" is not null and "game"."training_queue"."finishes_at" is not null and "game"."training_queue"."completed_at" is not null and "game"."training_queue"."cancel_reason" is null) or ("game"."training_queue"."state" = 'cancelled' and "game"."training_queue"."completed_at" is null and "game"."training_queue"."cancel_reason" is not null)),
	CONSTRAINT "training_finish_order" CHECK ("game"."training_queue"."finishes_at" is null or "game"."training_queue"."started_at" is null or "game"."training_queue"."finishes_at" > "game"."training_queue"."started_at")
);
--> statement-breakpoint
CREATE TABLE "game"."command_receipts" (
	"account_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"world_id" uuid NOT NULL,
	"faction_id" bigint,
	"command_type" text NOT NULL,
	"result_code" text NOT NULL,
	"result_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "command_receipts_account_id_command_id_pk" PRIMARY KEY("account_id","command_id"),
	CONSTRAINT "command_receipt_expiry" CHECK ("game"."command_receipts"."expires_at" > "game"."command_receipts"."created_at"),
	CONSTRAINT "command_receipt_payload_object" CHECK (jsonb_typeof("game"."command_receipts"."result_payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "game"."season_results" (
	"world_id" uuid NOT NULL,
	"faction_id" bigint NOT NULL,
	"account_id" uuid,
	"rank" smallint NOT NULL,
	"province_count" smallint NOT NULL,
	"total_troops" bigint DEFAULT 0 NOT NULL,
	"economy_score" bigint DEFAULT 0 NOT NULL,
	"army_score" bigint DEFAULT 0 NOT NULL,
	"support_score" bigint DEFAULT 0 NOT NULL,
	"total_score" bigint DEFAULT 0 NOT NULL,
	"is_player_controlled" boolean NOT NULL,
	"is_linked" boolean NOT NULL,
	"is_conqueror" boolean DEFAULT false NOT NULL,
	"is_best_nation" boolean DEFAULT false NOT NULL,
	"title_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"recap" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"final_snapshot_seq" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_results_world_id_faction_id_pk" PRIMARY KEY("world_id","faction_id"),
	CONSTRAINT "season_results_rank_pos" CHECK ("game"."season_results"."rank" >= 1),
	CONSTRAINT "season_results_province_count_nonneg" CHECK ("game"."season_results"."province_count" >= 0),
	CONSTRAINT "season_results_total_troops_nonneg" CHECK ("game"."season_results"."total_troops" >= 0),
	CONSTRAINT "season_results_economy_score_nonneg" CHECK ("game"."season_results"."economy_score" >= 0),
	CONSTRAINT "season_results_army_score_nonneg" CHECK ("game"."season_results"."army_score" >= 0),
	CONSTRAINT "season_results_support_score_nonneg" CHECK ("game"."season_results"."support_score" >= 0),
	CONSTRAINT "season_results_total_score_nonneg" CHECK ("game"."season_results"."total_score" >= 0),
	CONSTRAINT "season_result_ai_account" CHECK ("game"."season_results"."account_id" is not null or not "game"."season_results"."is_player_controlled"),
	CONSTRAINT "season_result_award_eligibility" CHECK ((not "game"."season_results"."is_conqueror" and not "game"."season_results"."is_best_nation") or ("game"."season_results"."is_player_controlled" and "game"."season_results"."is_linked"))
);
--> statement-breakpoint
CREATE TABLE "game"."world_events" (
	"world_id" uuid NOT NULL,
	"seq" bigint NOT NULL,
	"type" "game"."world_event_type" NOT NULL,
	"command_type" text,
	"actor_type" "game"."event_actor_type" NOT NULL,
	"actor_account_id" uuid,
	"actor_faction_id" bigint,
	"command_id" uuid,
	"effective_at" timestamp with time zone NOT NULL,
	"priority" smallint DEFAULT 80 NOT NULL,
	"payload" jsonb NOT NULL,
	"lease_version" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "world_events_world_id_seq_pk" PRIMARY KEY("world_id","seq"),
	CONSTRAINT "world_events_seq_pos" CHECK ("game"."world_events"."seq" > 0),
	CONSTRAINT "world_events_priority_range" CHECK ("game"."world_events"."priority" between 0 and 80),
	CONSTRAINT "world_events_lease_version_nonneg" CHECK ("game"."world_events"."lease_version" >= 0),
	CONSTRAINT "world_event_actor_shape" CHECK (("game"."world_events"."actor_type" = 'system' and "game"."world_events"."actor_account_id" is null and "game"."world_events"."actor_faction_id" is null) or ("game"."world_events"."actor_type" = 'account' and "game"."world_events"."actor_account_id" is not null and "game"."world_events"."actor_faction_id" is null) or ("game"."world_events"."actor_type" = 'admin' and "game"."world_events"."actor_account_id" is not null and "game"."world_events"."actor_faction_id" is null) or ("game"."world_events"."actor_type" = 'faction' and "game"."world_events"."actor_faction_id" is not null and "game"."world_events"."actor_account_id" is null)),
	CONSTRAINT "world_event_payload_object" CHECK (jsonb_typeof("game"."world_events"."payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "game"."world_snapshots" (
	"world_id" uuid NOT NULL,
	"seq" bigint NOT NULL,
	"tick" bigint NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"state_gzip" "bytea" NOT NULL,
	"state_hash" "bytea" NOT NULL,
	"last_event_seq" bigint NOT NULL,
	"config_version" text NOT NULL,
	"config_hash" char(64) NOT NULL,
	"map_id" text NOT NULL,
	"map_hash" char(64) NOT NULL,
	"lease_version" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "world_snapshots_world_id_seq_pk" PRIMARY KEY("world_id","seq"),
	CONSTRAINT "world_snapshots_seq_pos" CHECK ("game"."world_snapshots"."seq" > 0),
	CONSTRAINT "world_snapshots_tick_nonneg" CHECK ("game"."world_snapshots"."tick" >= 0),
	CONSTRAINT "world_snapshots_last_event_seq_nonneg" CHECK ("game"."world_snapshots"."last_event_seq" >= 0),
	CONSTRAINT "world_snapshots_lease_version_nonneg" CHECK ("game"."world_snapshots"."lease_version" >= 0),
	CONSTRAINT "snapshot_gzip_nonempty" CHECK (octet_length("game"."world_snapshots"."state_gzip") > 0),
	CONSTRAINT "snapshot_hash_sha256" CHECK (octet_length("game"."world_snapshots"."state_hash") = 32),
	CONSTRAINT "world_snapshots_map_hash_sha256" CHECK ("game"."world_snapshots"."map_hash" ~* '^[0-9a-f]{64}$'),
	CONSTRAINT "world_snapshots_config_hash_sha256" CHECK ("game"."world_snapshots"."config_hash" ~* '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "game"."admin_audit" (
	"audit_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game"."admin_audit_audit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_account_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game"."name_reports" (
	"report_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game"."name_reports_report_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"reporter_account_id" uuid NOT NULL,
	"target_type" "game"."report_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"state" "game"."report_state" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution" text,
	CONSTRAINT "report_review_shape" CHECK (("game"."name_reports"."state" = 'open' and "game"."name_reports"."reviewed_by" is null and "game"."name_reports"."reviewed_at" is null) or ("game"."name_reports"."state" <> 'open' and "game"."name_reports"."reviewed_by" is not null and "game"."name_reports"."reviewed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "game"."account_cosmetics" ADD CONSTRAINT "account_cosmetics_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."account_entitlements" ADD CONSTRAINT "account_entitlements_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."accounts" ADD CONSTRAINT "accounts_merged_into_accounts_account_id_fk" FOREIGN KEY ("merged_into") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."pass_periods" ADD CONSTRAINT "pass_periods_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."pass_periods" ADD CONSTRAINT "pass_period_entitlement_owner_fk" FOREIGN KEY ("account_id","source_entitlement_id") REFERENCES "game"."account_entitlements"("account_id","entitlement_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."pass_progress" ADD CONSTRAINT "pass_progress_pass_period_id_pass_periods_pass_period_id_fk" FOREIGN KEY ("pass_period_id") REFERENCES "game"."pass_periods"("pass_period_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."pass_reward_claims" ADD CONSTRAINT "pass_reward_claims_pass_period_id_pass_periods_pass_period_id_fk" FOREIGN KEY ("pass_period_id") REFERENCES "game"."pass_periods"("pass_period_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."missions" ADD CONSTRAINT "missions_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."revenuecat_events" ADD CONSTRAINT "revenuecat_events_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_leases" ADD CONSTRAINT "world_leases_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."doctrine_log" ADD CONSTRAINT "doctrine_log_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."faction_resources" ADD CONSTRAINT "faction_resources_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."faction_techs" ADD CONSTRAINT "faction_techs_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."factions" ADD CONSTRAINT "factions_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."factions" ADD CONSTRAINT "factions_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."rebellions" ADD CONSTRAINT "rebellions_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."rebellions" ADD CONSTRAINT "rebellions_world_id_origin_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","origin_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."neutral_garrisons" ADD CONSTRAINT "neutral_garrisons_world_id_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."support_daily" ADD CONSTRAINT "support_daily_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."support_daily" ADD CONSTRAINT "support_daily_world_id_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_regions" ADD CONSTRAINT "world_regions_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_regions" ADD CONSTRAINT "world_regions_world_id_owner_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","owner_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_regions" ADD CONSTRAINT "world_regions_world_id_rebel_group_id_rebellions_world_id_rebellion_id_fk" FOREIGN KEY ("world_id","rebel_group_id") REFERENCES "game"."rebellions"("world_id","rebellion_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_regions" ADD CONSTRAINT "world_regions_world_id_last_attacker_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","last_attacker_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_owner_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","owner_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_rebel_group_id_rebellions_world_id_rebellion_id_fk" FOREIGN KEY ("world_id","rebel_group_id") REFERENCES "game"."rebellions"("world_id","rebellion_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_location_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","location_province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_origin_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","origin_province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."armies" ADD CONSTRAINT "armies_world_id_target_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","target_province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."army_units" ADD CONSTRAINT "army_units_world_id_army_id_armies_world_id_army_id_fk" FOREIGN KEY ("world_id","army_id") REFERENCES "game"."armies"("world_id","army_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_attacker_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","attacker_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_defender_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","defender_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_attacker_army_id_armies_world_id_army_id_fk" FOREIGN KEY ("world_id","attacker_army_id") REFERENCES "game"."armies"("world_id","army_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."battle_log" ADD CONSTRAINT "battle_log_world_id_new_owner_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","new_owner_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliance_invitations" ADD CONSTRAINT "alliance_invitations_world_id_alliance_id_alliances_world_id_alliance_id_fk" FOREIGN KEY ("world_id","alliance_id") REFERENCES "game"."alliances"("world_id","alliance_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliance_invitations" ADD CONSTRAINT "alliance_invitations_world_id_inviter_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","inviter_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliance_invitations" ADD CONSTRAINT "alliance_invitations_world_id_invitee_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","invitee_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliance_members" ADD CONSTRAINT "alliance_members_world_id_alliance_id_alliances_world_id_alliance_id_fk" FOREIGN KEY ("world_id","alliance_id") REFERENCES "game"."alliances"("world_id","alliance_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliance_members" ADD CONSTRAINT "alliance_members_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliances" ADD CONSTRAINT "alliances_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."alliances" ADD CONSTRAINT "alliances_world_id_leader_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","leader_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_daily" ADD CONSTRAINT "trade_daily_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_log" ADD CONSTRAINT "trade_log_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_log" ADD CONSTRAINT "trade_log_world_id_offer_id_trade_offers_world_id_offer_id_fk" FOREIGN KEY ("world_id","offer_id") REFERENCES "game"."trade_offers"("world_id","offer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_log" ADD CONSTRAINT "trade_log_world_id_seller_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","seller_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_log" ADD CONSTRAINT "trade_log_world_id_buyer_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","buyer_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_offers" ADD CONSTRAINT "trade_offers_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_offers" ADD CONSTRAINT "trade_offers_world_id_seller_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","seller_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."trade_offers" ADD CONSTRAINT "trade_offers_world_id_buyer_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","buyer_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."ability_cooldowns" ADD CONSTRAINT "ability_cooldowns_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."build_queue" ADD CONSTRAINT "build_queue_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."build_queue" ADD CONSTRAINT "build_queue_world_id_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."ex_ally_cooldowns" ADD CONSTRAINT "ex_ally_cooldowns_world_id_faction_a_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_a_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."ex_ally_cooldowns" ADD CONSTRAINT "ex_ally_cooldowns_world_id_faction_b_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_b_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."training_queue" ADD CONSTRAINT "training_queue_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."training_queue" ADD CONSTRAINT "training_queue_world_id_province_id_world_regions_world_id_province_id_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."command_receipts" ADD CONSTRAINT "command_receipts_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."command_receipts" ADD CONSTRAINT "command_receipts_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."command_receipts" ADD CONSTRAINT "command_receipts_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."season_results" ADD CONSTRAINT "season_results_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."season_results" ADD CONSTRAINT "season_results_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."season_results" ADD CONSTRAINT "season_results_world_id_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."season_results" ADD CONSTRAINT "season_results_world_id_final_snapshot_seq_world_snapshots_world_id_seq_fk" FOREIGN KEY ("world_id","final_snapshot_seq") REFERENCES "game"."world_snapshots"("world_id","seq") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_events" ADD CONSTRAINT "world_events_world_id_worlds_world_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("world_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_events" ADD CONSTRAINT "world_events_actor_account_id_accounts_account_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_events" ADD CONSTRAINT "world_events_world_id_actor_faction_id_factions_world_id_faction_id_fk" FOREIGN KEY ("world_id","actor_faction_id") REFERENCES "game"."factions"("world_id","faction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."world_snapshots" ADD CONSTRAINT "world_snapshots_world_pin_fk" FOREIGN KEY ("world_id","config_version","config_hash","map_id","map_hash") REFERENCES "game"."worlds"("world_id","config_version","config_hash","map_id","map_hash") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."admin_audit" ADD CONSTRAINT "admin_audit_actor_account_id_accounts_account_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."name_reports" ADD CONSTRAINT "name_reports_reporter_account_id_accounts_account_id_fk" FOREIGN KEY ("reporter_account_id") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."name_reports" ADD CONSTRAINT "name_reports_reviewed_by_accounts_account_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "game"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_entitlements_source_event_idx" ON "game"."account_entitlements" USING btree ("account_id","source_event_id","catalog_id") WHERE "game"."account_entitlements"."source_event_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "account_entitlements_one_active_cosmetic_idx" ON "game"."account_entitlements" USING btree ("account_id","catalog_id") WHERE "game"."account_entitlements"."kind" = 'cosmetic' and "game"."account_entitlements"."status" = 'active';--> statement-breakpoint
CREATE INDEX "account_entitlements_account_status_idx" ON "game"."account_entitlements" USING btree ("account_id","status","kind");--> statement-breakpoint
CREATE INDEX "account_entitlements_expiry_idx" ON "game"."account_entitlements" USING btree ("expires_at") WHERE "game"."account_entitlements"."status" = 'active' and "game"."account_entitlements"."expires_at" is not null;--> statement-breakpoint
CREATE INDEX "accounts_display_name_key_idx" ON "game"."accounts" USING btree ("display_name_key");--> statement-breakpoint
CREATE INDEX "accounts_last_seen_idx" ON "game"."accounts" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "revenuecat_events_account_idx" ON "game"."revenuecat_events" USING btree ("account_id","event_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_items_store_product_idx" ON "game"."shop_items" USING btree ("store_product_id") WHERE "game"."shop_items"."store_product_id" is not null;--> statement-breakpoint
CREATE INDEX "worlds_status_idx" ON "game"."worlds" USING btree ("status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "factions_account_world_idx" ON "game"."factions" USING btree ("world_id","account_id") WHERE "game"."factions"."account_id" is not null;--> statement-breakpoint
CREATE INDEX "factions_world_state_idx" ON "game"."factions" USING btree ("world_id","state");--> statement-breakpoint
CREATE INDEX "factions_name_key_idx" ON "game"."factions" USING btree ("world_id","name_key");--> statement-breakpoint
CREATE UNIQUE INDEX "rebellions_one_active_per_origin_idx" ON "game"."rebellions" USING btree ("world_id","origin_faction_id") WHERE "game"."rebellions"."state" in ('spawned', 'holding');--> statement-breakpoint
CREATE INDEX "world_regions_owner_idx" ON "game"."world_regions" USING btree ("world_id","owner_faction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "world_regions_one_capital_idx" ON "game"."world_regions" USING btree ("world_id","owner_faction_id") WHERE "game"."world_regions"."is_capital";--> statement-breakpoint
CREATE INDEX "world_regions_rebel_idx" ON "game"."world_regions" USING btree ("world_id","rebel_group_id") WHERE "game"."world_regions"."rebel_group_id" is not null;--> statement-breakpoint
CREATE INDEX "armies_arrival_idx" ON "game"."armies" USING btree ("world_id","state","arrive_at");--> statement-breakpoint
CREATE INDEX "armies_owner_idx" ON "game"."armies" USING btree ("world_id","owner_faction_id");--> statement-breakpoint
CREATE INDEX "armies_rebel_idx" ON "game"."armies" USING btree ("world_id","rebel_group_id") WHERE "game"."armies"."rebel_group_id" is not null;--> statement-breakpoint
CREATE INDEX "battle_log_province_idx" ON "game"."battle_log" USING btree ("world_id","province_id","resolved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "alliance_invitations_one_pending_idx" ON "game"."alliance_invitations" USING btree ("world_id","invitee_faction_id") WHERE "game"."alliance_invitations"."state" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "alliance_members_one_active_idx" ON "game"."alliance_members" USING btree ("world_id","faction_id") WHERE "game"."alliance_members"."left_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "alliance_members_one_leader_idx" ON "game"."alliance_members" USING btree ("world_id","alliance_id") WHERE "game"."alliance_members"."role" = 'leader' and "game"."alliance_members"."left_at" is null;--> statement-breakpoint
CREATE INDEX "alliance_members_alliance_idx" ON "game"."alliance_members" USING btree ("world_id","alliance_id") WHERE "game"."alliance_members"."left_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "alliances_active_name_idx" ON "game"."alliances" USING btree ("world_id","name_key") WHERE "game"."alliances"."state" = 'active';--> statement-breakpoint
CREATE INDEX "trade_offers_open_idx" ON "game"."trade_offers" USING btree ("world_id","state","resource","expires_at");--> statement-breakpoint
CREATE INDEX "trade_offers_seller_idx" ON "game"."trade_offers" USING btree ("world_id","seller_faction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "build_queue_one_running_idx" ON "game"."build_queue" USING btree ("world_id","faction_id") WHERE "game"."build_queue"."state" = 'running';--> statement-breakpoint
CREATE UNIQUE INDEX "build_queue_one_active_per_province_idx" ON "game"."build_queue" USING btree ("world_id","province_id") WHERE "game"."build_queue"."state" in ('queued', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "training_queue_one_running_idx" ON "game"."training_queue" USING btree ("world_id","faction_id") WHERE "game"."training_queue"."state" = 'running';--> statement-breakpoint
CREATE INDEX "command_receipts_world_idx" ON "game"."command_receipts" USING btree ("world_id","created_at");--> statement-breakpoint
CREATE INDEX "command_receipts_expiry_idx" ON "game"."command_receipts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "season_results_one_conqueror_idx" ON "game"."season_results" USING btree ("world_id") WHERE "game"."season_results"."is_conqueror";--> statement-breakpoint
CREATE UNIQUE INDEX "season_results_one_best_nation_idx" ON "game"."season_results" USING btree ("world_id") WHERE "game"."season_results"."is_best_nation";--> statement-breakpoint
CREATE UNIQUE INDEX "season_results_account_idx" ON "game"."season_results" USING btree ("world_id","account_id") WHERE "game"."season_results"."account_id" is not null;--> statement-breakpoint
CREATE INDEX "world_events_order_idx" ON "game"."world_events" USING btree ("world_id","effective_at","priority","seq");--> statement-breakpoint
CREATE INDEX "world_events_command_idx" ON "game"."world_events" USING btree ("world_id","command_id") WHERE "game"."world_events"."command_id" is not null;--> statement-breakpoint
CREATE INDEX "world_snapshots_created_idx" ON "game"."world_snapshots" USING btree ("world_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "game"."admin_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "name_reports_state_idx" ON "game"."name_reports" USING btree ("state","created_at");--> statement-breakpoint
CREATE VIEW "game"."province_garrison" WITH (security_invoker = true) AS (
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
  );
--> statement-breakpoint
ALTER TABLE "game"."factions" ADD CONSTRAINT "factions_capital_region_fk" FOREIGN KEY ("world_id","capital_province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "game"."rebellions" ADD CONSTRAINT "rebellions_province_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "game"."worlds" ADD CONSTRAINT "worlds_final_snapshot_fk" FOREIGN KEY ("world_id","final_snapshot_seq") REFERENCES "game"."world_snapshots"("world_id","seq") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'game'
  LOOP
    EXECUTE format('ALTER TABLE game.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END $$;
--> statement-breakpoint
REVOKE ALL ON SCHEMA "game" FROM PUBLIC;
--> statement-breakpoint
INSERT INTO "game"."schema_meta" ("schema_version")
VALUES ('2026-10-23.1')
ON CONFLICT ("id") DO UPDATE SET
  "schema_version" = EXCLUDED."schema_version",
  "applied_at" = now();
