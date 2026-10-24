-- WARGAME Database Roles and Privileges
--
-- Creates the server-only runtime, migration, and backup roles. No passwords
-- are stored here; deployment provisions credentials out-of-band. The runtime
-- role is the only application connection and has BYPASSRLS because the server
-- is the sole database client; RLS remains enabled as defense in depth. The
-- browser roles (anon/authenticated/service_role) receive no access to game.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wargame_runtime') THEN
    CREATE ROLE wargame_runtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wargame_migrator') THEN
    CREATE ROLE wargame_migrator;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wargame_backup') THEN
    CREATE ROLE wargame_backup;
  END IF;
END $$;

ALTER ROLE wargame_runtime LOGIN NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;
ALTER ROLE wargame_migrator LOGIN NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE wargame_backup LOGIN NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT wargame_migrator TO postgres;
  END IF;
END $$;

DO $$
BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO wargame_runtime, wargame_migrator, wargame_backup',
    current_database()
  );
END $$;

GRANT USAGE ON SCHEMA game TO wargame_runtime, wargame_backup;
GRANT USAGE, CREATE ON SCHEMA game TO wargame_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA game TO wargame_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA game TO wargame_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA game TO wargame_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA game TO wargame_backup;

CREATE SCHEMA IF NOT EXISTS drizzle;
GRANT USAGE, CREATE ON SCHEMA drizzle TO wargame_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA drizzle TO wargame_migrator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA drizzle TO wargame_migrator;

ALTER DEFAULT PRIVILEGES FOR ROLE wargame_migrator IN SCHEMA game
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wargame_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE wargame_migrator IN SCHEMA game
  GRANT USAGE, SELECT ON SEQUENCES TO wargame_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE wargame_migrator IN SCHEMA game
  GRANT SELECT ON TABLES TO wargame_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE wargame_migrator IN SCHEMA game
  GRANT SELECT ON SEQUENCES TO wargame_backup;

DO $$
DECLARE obj record;
BEGIN
  FOR obj IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'game' AND c.relkind IN ('r', 'v', 'S')
  LOOP
    IF obj.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE game.%I OWNER TO wargame_migrator', obj.relname);
    ELSIF obj.relkind = 'v' THEN
      EXECUTE format('ALTER VIEW game.%I OWNER TO wargame_migrator', obj.relname);
    ELSE
      EXECUTE format('ALTER TABLE game.%I OWNER TO wargame_migrator', obj.relname);
    END IF;
  END LOOP;

  FOR obj IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'game' AND t.typtype = 'e'
  LOOP
    EXECUTE format('ALTER TYPE game.%I OWNER TO wargame_migrator', obj.typname);
  END LOOP;
END $$;

ALTER SCHEMA game OWNER TO wargame_migrator;

DO $$
BEGIN
  IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL THEN
    ALTER TABLE drizzle.__drizzle_migrations OWNER TO wargame_migrator;
  END IF;
  IF to_regclass('drizzle.__drizzle_migrations_id_seq') IS NOT NULL THEN
    ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO wargame_migrator;
  END IF;
END $$;

ALTER SCHEMA drizzle OWNER TO wargame_migrator;

REVOKE ALL ON SCHEMA game FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA game FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA game FROM PUBLIC;
REVOKE ALL ON SCHEMA drizzle FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA drizzle FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA drizzle FROM PUBLIC;

DO $$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA game FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA game FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA game FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON SCHEMA drizzle FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA drizzle FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA drizzle FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
