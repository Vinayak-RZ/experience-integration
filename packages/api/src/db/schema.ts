import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
  index,
  bigserial,
} from "drizzle-orm/pg-core";
import { authSchema } from "./auth-schema.js";

export {
  user,
  session,
  account,
  verification,
  twoFactor,
  authSchema,
} from "./auth-schema.js";

/** Organization (tenant root). */
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => [uniqueIndex("organizations_slug_uidx").on(t.slug)]);

export const plants = pgTable(
  "plants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    externalPlantId: text("external_plant_id").notNull(),
    name: text("name").notNull(),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("plants_org_external_uidx").on(t.orgId, t.externalPlantId),
  ],
);

/** User preference bag — active plant, nav pins, etc. */
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    activePlantId: uuid("active_plant_id").references(() => plants.id, {
      onDelete: "set null",
    }),
    prefs: jsonb("prefs").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("user_preferences_user_org_uidx").on(t.userId, t.orgId)],
);

/** Append-only audit trail (no PII payloads). */
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * L6 product membership — plant-scoped RBAC role (ADR-023).
 * Distinct from Better Auth plugin `user.role` (admin|user).
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("memberships_user_org_uidx").on(t.userId, t.orgId),
  ],
);

export const plantMemberships = pgTable(
  "plant_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("plant_memberships_member_plant_uidx").on(
      t.membershipId,
      t.plantId,
    ),
  ],
);

/** Per-plant L5 poll cursor — advanced only after durable append. */
export const l5EventCursors = pgTable(
  "l5_event_cursors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgExternalId: text("org_external_id").notNull(),
    plantExternalId: text("plant_external_id").notNull(),
    cursor: text("cursor").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("l5_event_cursors_org_plant_uidx").on(
      t.orgExternalId,
      t.plantExternalId,
    ),
  ],
);

/** Append-only L5 event mirror — dedupe_key unique. SSE resumes via id/seq. */
export const l5Events = pgTable(
  "l5_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgExternalId: text("org_external_id").notNull(),
    plantExternalId: text("plant_external_id").notNull(),
    eventId: text("event_id").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    /** Monotonic order for Last-Event-ID resume. */
    seq: bigserial("seq", { mode: "number" }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("l5_events_dedupe_uidx").on(t.dedupeKey),
    uniqueIndex("l5_events_event_id_uidx").on(t.eventId),
    index("l5_events_plant_seq_idx").on(
      t.orgExternalId,
      t.plantExternalId,
      t.seq,
    ),
  ],
);

export const schema = {
  ...authSchema,
  organizations,
  plants,
  userPreferences,
  auditEvents,
  memberships,
  plantMemberships,
  l5EventCursors,
  l5Events,
};
