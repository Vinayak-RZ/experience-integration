import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { createDb, createPool, pingDatabase } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import {
  auditEvents,
  organizations,
  plants,
  userPreferences,
} from "../src/db/schema.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

describe("PostgreSQL foundation", () => {
  it("round-trips migrations and base tables", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    assert.equal(await pingDatabase(pool), true);
    const db = createDb(pool);

    const slug = `org_${randomUUID().slice(0, 8)}`;
    const [org] = await db
      .insert(organizations)
      .values({ slug, name: "Round Trip Org" })
      .returning();
    assert.ok(org.id);

    const [plant] = await db
      .insert(plants)
      .values({
        orgId: org.id,
        externalPlantId: "plant_jaipur_01",
        name: "Jaipur Works",
      })
      .returning();

    await db.insert(userPreferences).values({
      userId: "user_demo",
      orgId: org.id,
      activePlantId: plant.id,
      prefs: { navPinned: ["today", "alarms"] },
    });

    await db.insert(auditEvents).values({
      orgId: org.id,
      actorUserId: "user_demo",
      action: "plant.switch",
      resourceType: "plant",
      resourceId: plant.id,
      metadata: { from: null, to: plant.externalPlantId },
    });

    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.orgId, org.id));
    assert.equal(prefs.length, 1);
    assert.equal(prefs[0]?.activePlantId, plant.id);

    await db.delete(organizations).where(eq(organizations.id, org.id));
    await pool.end();
  });
});
