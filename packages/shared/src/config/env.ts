/**
 * @file packages/shared/src/config/env.ts
 * @description Centralized environment variable validation schemas using Zod.
 * Enforces server-side required secrets, fail-fast startup behavior,
 * and client-side public variable constraints with zero secret leakage.
 */

import { z } from "zod";

export const serverEnvSchema = z.object({
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:5173"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for server runtime"),
  DATABASE_URL_MIGRATIONS: z.string().optional(),

  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  REVENUECAT_SECRET_API_KEY: z.string().optional(),
  REVENUECAT_WEBHOOK_AUTH: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  CLOUDFLARE_TUNNEL_TOKEN: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:8080"),
  VITE_WS_URL: z.string().min(1).default("ws://localhost:8080"),
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_SENTRY_DSN: z.string().optional()
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`).join(", ");
    throw new Error(`Server environment configuration failed: ${issues}`);
  }
  return result.data;
}

export function parseClientEnv(env: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`).join(", ");
    throw new Error(`Client environment configuration failed: ${issues}`);
  }
  return result.data;
}
