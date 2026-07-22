import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { cookieHeader } from "../src/auth/routes.js";
import { loadEnv } from "../src/config.js";
import { account, user } from "../src/db/auth-schema.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { createMailer } from "../src/mail/mailer.js";
import {
  isTrustedOrigin,
  redactSensitive,
} from "../src/security/redact.js";
import { writeAudit } from "../src/tenancy/service.js";
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

describe("security redact helpers", () => {
  it("redacts password token and cookie fields", () => {
    const redacted = redactSensitive({
      password: "secret",
      token: "abc",
      nested: { newPassword: "x", ok: 1 },
      cookie: "session=1",
    }) as Record<string, unknown>;
    assert.equal(redacted.password, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(redacted.cookie, "[REDACTED]");
    assert.equal(
      (redacted.nested as Record<string, unknown>).newPassword,
      "[REDACTED]",
    );
    assert.equal((redacted.nested as Record<string, unknown>).ok, 1);
  });

  it("trusted origin check fails closed", () => {
    assert.equal(
      isTrustedOrigin("http://localhost:3000", ["http://localhost:3000"]),
      true,
    );
    assert.equal(
      isTrustedOrigin("https://evil.example", ["http://localhost:3000"]),
      false,
    );
    assert.equal(isTrustedOrigin(undefined, ["http://localhost:3000"]), false);
  });
});

describe("auth boundary hardening", () => {
  it("uses httpOnly cookies, blocks bad origin, resists reset enumeration", async (t) => {
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

    const email = `sec_${randomUUID().slice(0, 8)}@stamped.test`;
    const password = "secure-password-12";
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "Sec User",
      email,
      emailVerified: true,
      role: "user",
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
    });

    const signedIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      payload: { email, password },
    });
    assert.equal(signedIn.statusCode, 200, signedIn.body);
    const setCookie = String(
      Array.isArray(signedIn.headers["set-cookie"])
        ? signedIn.headers["set-cookie"][0]
        : signedIn.headers["set-cookie"],
    );
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);

    const csrfBlocked = await app.inject({
      method: "POST",
      url: "/api/auth/sign-out",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        cookie: cookieHeader(signedIn.headers["set-cookie"]),
      },
      payload: {},
    });
    assert.ok(
      csrfBlocked.statusCode === 403 || csrfBlocked.statusCode === 401,
      csrfBlocked.body,
    );

    mailer.clear();
    const knownReset = await app.inject({
      method: "POST",
      url: "/api/auth/request-password-reset",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      payload: {
        email,
        redirectTo: "http://localhost:3000/reset-password",
      },
    });
    const unknownReset = await app.inject({
      method: "POST",
      url: "/api/auth/request-password-reset",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      payload: {
        email: `missing_${randomUUID().slice(0, 8)}@stamped.test`,
        redirectTo: "http://localhost:3000/reset-password",
      },
    });
    // Enumeration resistance: same success-class status for known/unknown.
    assert.equal(knownReset.statusCode, unknownReset.statusCode);
    assert.ok(knownReset.statusCode < 400);

    await writeAudit(db, {
      orgId: null,
      actorUserId: userId,
      action: "security.selfcheck",
      resourceType: "session",
      metadata: { password: "should-not-persist", plantId: "p1" },
    });

    await app.close();
    await pool.end();
  });
});
