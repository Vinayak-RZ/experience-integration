import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { authSchema } from "./auth-schema.js";

export {
  user,
  session,
  account,
  verification,
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

export const schema = {
  ...authSchema,
  organizations,
  plants,
  userPreferences,
  auditEvents,
};
