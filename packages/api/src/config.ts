import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1).optional(),
  /** Ready check requires DB when true. */
  REQUIRE_DATABASE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-stamped-l6-auth-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_FROM: z.string().email().default("noreply@stamped.local"),
  /** Password reset / invite token lifetime (seconds). */
  AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  /** L5 Closure & Verification base URL (server-side only). */
  L5_BASE_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().default("http://127.0.0.1:8105"),
  ),
  L5_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  L5_AUTH_TOKEN: z.string().optional(),
  /** Upstream gaps — default off until OpenAPI publishes the routes. */
  L5_FEATURE_ALARM_ACK: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  L5_FEATURE_ALARM_ESCALATE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  L5_FEATURE_ALARM_UNSILENCE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(
  raw: NodeJS.ProcessEnv = process.env,
): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  return parsed.data;
}
