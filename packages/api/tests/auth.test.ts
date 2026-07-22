import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { loadEnv } from "../src/config.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { account, user } from "../src/db/auth-schema.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

describe("Better Auth local accounts", () => {
  it("rejects public sign-up and accepts seeded email/password sign-in", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const env = loadEnv({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
      BETTER_AUTH_URL: "http://localhost:3001",
      WEB_ORIGIN: "http://localhost:3000",
    });
    const auth = createAuth(db, env);
    const app = await buildApp({ env, auth });

    const email = `ops_${randomUUID().slice(0, 8)}@stamped.test`;
    const password = "correct-horse-battery-staple";

    const blocked = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: { email, password, name: "Blocked Signup" },
    });
    assert.notEqual(blocked.statusCode, 200);
    assert.ok(blocked.statusCode >= 400);

    const userId = randomUUID();
    const hashed = await hashPassword(password);
    await db.insert(user).values({
      id: userId,
      name: "Seed Operator",
      email,
      emailVerified: true,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    });

    const signedIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email, password },
    });
    assert.equal(signedIn.statusCode, 200, signedIn.body);
    const setCookie = signedIn.headers["set-cookie"];
    assert.ok(setCookie);

    const cookieHeader = Array.isArray(setCookie)
      ? setCookie.map((c) => c.split(";")[0]).join("; ")
      : String(setCookie).split(";")[0];

    const me = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: cookieHeader },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, email);

    const anon = await app.inject({ method: "GET", url: "/api/me" });
    assert.equal(anon.statusCode, 401);

    await app.close();
    await pool.end();
  });
});
