import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type WorkerEnv = z.infer<typeof EnvSchema>;

export function loadWorkerEnv(
  raw: NodeJS.ProcessEnv = process.env,
): WorkerEnv {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid worker environment: ${detail}`);
  }
  return parsed.data;
}
