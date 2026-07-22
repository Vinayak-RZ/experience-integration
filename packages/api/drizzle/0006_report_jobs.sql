CREATE TABLE IF NOT EXISTS "report_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "plant_id" uuid NOT NULL REFERENCES "plants"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "state" text NOT NULL DEFAULT 'queued',
  "dedupe_key" text NOT NULL,
  "boss_job_id" text,
  "artifact_html" text,
  "error" text,
  "created_by" text,
  "approved_by" text,
  "approved_at" timestamptz,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "report_jobs_dedupe_uidx" ON "report_jobs" ("dedupe_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_jobs_plant_state_idx" ON "report_jobs" ("plant_id", "state");
