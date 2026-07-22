import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { cookieHeader } from "../src/auth/routes.js";
import { loadEnv } from "../src/config.js";
import { account, user } from "../src/db/auth-schema.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { auditEvents } from "../src/db/schema.js";
import { createMailer } from "../src/mail/mailer.js";
import {
  createPlant,
  seedDemoTenant,
} from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

function testEnv() {
  return loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
    BETTER_AUTH_URL: "http://localhost:3001",
    WEB_ORIGIN: "http://localhost:3000",
  });
}

async function seedAuthUser(
  db: ReturnType<typeof createDb>,
  opts: { email: string; password: string; role?: string; name?: string },
) {
  const userId = randomUUID();
  await db.insert(user).values({
    id: userId,
    name: opts.name ?? "User",
    email: opts.email,
    emailVerified: true,
    role: opts.role ?? "user",
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(opts.password),
  });
  return userId;
}

describe("admin membership administration", () => {
  it("lists, assigns, updates memberships with audit", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const env = testEnv();
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer, db });

    const adminPassword = "admin-password-12+";
    const adminEmail = `admin_${randomUUID().slice(0, 8)}@stamped.test`;
    const adminUserId = await seedAuthUser(db, {
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    const seeded = await seedDemoTenant(db, { adminUserId });

    const signIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      payload: { email: adminEmail, password: adminPassword },
    });
    assert.equal(signIn.statusCode, 200, signIn.body);
    const cookie = cookieHeader(signIn.headers["set-cookie"]);

    const list = await app.inject({
      method: "GET",
      url: `/api/admin/orgs/${seeded.org.id}/members`,
      headers: { cookie },
    });
    assert.equal(list.statusCode, 200, list.body);
    assert.equal(list.json().members.length, 1);

    const opEmail = `op_${randomUUID().slice(0, 8)}@stamped.test`;
    const opUserId = await seedAuthUser(db, {
      email: opEmail,
      password: "operator-pass-12",
    });

    const created = await app.inject({
      method: "POST",
      url: `/api/admin/orgs/${seeded.org.id}/members`,
      headers: {
        "content-type": "application/json",
        cookie,
      },
      payload: {
        userId: opUserId,
        role: "operator",
        plantIds: [seeded.plant.id],
      },
    });
    assert.equal(created.statusCode, 201, created.body);
    const membershipId = created.json().membership.id as string;

    const patched = await app.inject({
      method: "PATCH",
      url: `/api/admin/orgs/${seeded.org.id}/members/${membershipId}`,
      headers: {
        "content-type": "application/json",
        cookie,
      },
      payload: { role: "supervisor", status: "inactive" },
    });
    assert.equal(patched.statusCode, 200, patched.body);
    assert.equal(patched.json().membership.role, "supervisor");
    assert.equal(patched.json().membership.status, "inactive");

    const audits = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.orgId, seeded.org.id));
    assert.ok(audits.some((a) => a.action === "membership.create"));
    assert.ok(audits.some((a) => a.action === "membership.update"));

    // Operator cannot list members
    const opSignIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      payload: { email: opEmail, password: "operator-pass-12" },
    });
    // membership inactive — still has auth session; admin route should 403
    // (no active admin membership). Re-activate first via DB not needed —
    // operator never had admin:users.
    const denied = await app.inject({
      method: "GET",
      url: `/api/admin/orgs/${seeded.org.id}/members`,
      headers: { cookie: cookieHeader(opSignIn.headers["set-cookie"]) },
    });
    assert.ok(denied.statusCode === 403 || denied.statusCode === 401, denied.body);

    await app.close();
    await pool.end();
  });
});

describe("authorized plant switching", () => {
  it("lists plants, switches active plant, recovers invalid preference", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const env = testEnv();
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer, db });

    const password = "admin-password-12+";
    const email = `plant_${randomUUID().slice(0, 8)}@stamped.test`;
    const adminUserId = await seedAuthUser(db, {
      email,
      password,
      role: "admin",
    });
    const seeded = await seedDemoTenant(db, { adminUserId });
    const plant2 = await createPlant(db, {
      orgId: seeded.org.id,
      externalPlantId: "plant_pune_02",
      name: "Pune Works",
    });
    // Grant second plant to same admin membership via admin API after sign-in
    const signIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      payload: { email, password },
    });
    assert.equal(signIn.statusCode, 200, signIn.body);
    const cookie = cookieHeader(signIn.headers["set-cookie"]);

    await app.inject({
      method: "PATCH",
      url: `/api/admin/orgs/${seeded.org.id}/members/${seeded.membership.id}`,
      headers: { "content-type": "application/json", cookie },
      payload: { plantIds: [seeded.plant.id, plant2.id] },
    });

    const listed = await app.inject({
      method: "GET",
      url: `/api/plants?orgId=${seeded.org.id}`,
      headers: { cookie },
    });
    assert.equal(listed.statusCode, 200, listed.body);
    assert.equal(listed.json().plants.length, 2);
    assert.equal(listed.json().activePlant.id, seeded.plant.id);

    const switched = await app.inject({
      method: "POST",
      url: "/api/plants/active",
      headers: { "content-type": "application/json", cookie },
      payload: { orgId: seeded.org.id, plantId: plant2.id },
    });
    assert.equal(switched.statusCode, 200, switched.body);
    assert.equal(switched.json().activePlant.id, plant2.id);

    const again = await app.inject({
      method: "GET",
      url: `/api/plants?orgId=${seeded.org.id}`,
      headers: { cookie },
    });
    assert.equal(again.json().activePlant.id, plant2.id);

    // Invalidate preference by removing plant2 from membership
    await app.inject({
      method: "PATCH",
      url: `/api/admin/orgs/${seeded.org.id}/members/${seeded.membership.id}`,
      headers: { "content-type": "application/json", cookie },
      payload: { plantIds: [seeded.plant.id] },
    });
    const recovered = await app.inject({
      method: "GET",
      url: `/api/plants?orgId=${seeded.org.id}`,
      headers: { cookie },
    });
    assert.equal(recovered.statusCode, 200, recovered.body);
    assert.equal(recovered.json().activePlant.id, seeded.plant.id);
    assert.equal(recovered.json().recovered, true);

    await app.close();
    await pool.end();
  });
});
