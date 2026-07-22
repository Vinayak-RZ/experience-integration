CREATE TABLE "l5_event_cursors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_external_id" text NOT NULL,
	"plant_external_id" text NOT NULL,
	"cursor" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "l5_event_cursors_org_plant_uidx" ON "l5_event_cursors" USING btree ("org_external_id","plant_external_id");
--> statement-breakpoint
CREATE TABLE "l5_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_external_id" text NOT NULL,
	"plant_external_id" text NOT NULL,
	"event_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"seq" bigserial NOT NULL,
	"payload" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "l5_events_dedupe_uidx" ON "l5_events" USING btree ("dedupe_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "l5_events_event_id_uidx" ON "l5_events" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "l5_events_plant_seq_idx" ON "l5_events" USING btree ("org_external_id","plant_external_id","seq");
