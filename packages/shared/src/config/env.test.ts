/**
 * @file packages/shared/src/config/env.test.ts
 * @description Unit tests for server and client environment schema parsing and fail-fast behavior.
 */

import { describe, it, expect } from "vitest";
import { parseServerEnv, parseClientEnv } from "./env.js";

describe("Environment Schema Validation", () => {
  it("parses valid server environment with defaults", () => {
    const valid = {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/wargame",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-token",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-token"
    };

    const parsed = parseServerEnv(valid);
    expect(parsed.PORT).toBe(8080);
    expect(parsed.HOST).toBe("0.0.0.0");
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("throws fail-fast error when required server variables are missing", () => {
    const invalid = {
      PORT: "8080"
    };

    expect(() => parseServerEnv(invalid)).toThrowError(/Server environment configuration failed/);
  });

  it("throws fail-fast error when SUPABASE_URL is malformed", () => {
    const invalidUrl = {
      DATABASE_URL: "postgresql://localhost:5432/db",
      SUPABASE_URL: "not-a-valid-url",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service"
    };

    expect(() => parseServerEnv(invalidUrl)).toThrowError(/SUPABASE_URL must be a valid URL/);
  });

  it("parses valid client environment variables", () => {
    const client = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-token"
    };

    const parsed = parseClientEnv(client);
    expect(parsed.VITE_API_URL).toBe("http://localhost:8080");
    expect(parsed.VITE_WS_URL).toBe("ws://localhost:8080");
    expect(parsed.VITE_SUPABASE_URL).toBe("https://example.supabase.co");
  });

  it("throws when client VITE_SUPABASE_ANON_KEY is missing", () => {
    const invalidClient = {
      VITE_SUPABASE_URL: "https://example.supabase.co"
    };

    expect(() => parseClientEnv(invalidClient)).toThrowError(/VITE_SUPABASE_ANON_KEY/);
  });
});
