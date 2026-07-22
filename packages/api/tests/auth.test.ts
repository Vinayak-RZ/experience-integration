import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { cookieHeader } from "../src/auth/routes.js";
import { loadEnv } from "../src/config.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { account, user } from "../src/db/auth-schema.js";
import { createMailer } from "../src/mail/mailer.js";
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
    AUTH_TOKEN_TTL_SECONDS: "3600",
  });
}

async function seedUser(
  db: ReturnType<typeof createDb>,
  opts: { email: string; password: string; role?: string; name?: string },
) {
  const userId = randomUUID();
  const hashed = await hashPassword(opts.password);
  await db.insert(user).values({
    id: userId,
    name: opts.name ?? "Seed User",
    email: opts.email,
    emailVerified: true,
    role: opts.role ?? "user",
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashed,
  });
  return userId;
}

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
    const env = testEnv();
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer });

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

    await seedUser(db, { email, password });

    const signedIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email, password },
    });
    assert.equal(signedIn.statusCode, 200, signedIn.body);

    const me = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: cookieHeader(signedIn.headers["set-cookie"]) },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.email, email);

    const anon = await app.inject({ method: "GET", url: "/api/me" });
    assert.equal(anon.statusCode, 401);

    await app.close();
    await pool.end();
  });
});

describe("invitations verification and reset", () => {
  it("admin invites user, reset email captured, password reset works", async (t) => {
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
    const app = await buildApp({ env, auth, mailer });

    const adminEmail = `admin_${randomUUID().slice(0, 8)}@stamped.test`;
    const adminPassword = "admin-password-12+";
    await seedUser(db, {
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      name: "Seed Admin",
    });

    const adminSignIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email: adminEmail, password: adminPassword },
    });
    assert.equal(adminSignIn.statusCode, 200, adminSignIn.body);
    const adminCookie = cookieHeader(adminSignIn.headers["set-cookie"]);

    const inviteEmail = `invitee_${randomUUID().slice(0, 8)}@stamped.test`;
    const invite = await app.inject({
      method: "POST",
      url: "/api/admin/invites",
      headers: {
        "content-type": "application/json",
        cookie: adminCookie,
      },
      payload: { email: inviteEmail, name: "Invitee Operator" },
    });
    assert.equal(invite.statusCode, 201, invite.body);

    const resetMail = mailer
      .outbox()
      .find((m) => m.kind === "password_reset" && m.to === inviteEmail);
    assert.ok(resetMail, "expected password reset mail");
    const inviteMail = mailer
      .outbox()
      .find((m) => m.kind === "invite" && m.to === inviteEmail);
    assert.ok(inviteMail, "expected invite mail");

    const tokenMatch =
      resetMail.text.match(/\/reset-password\/([A-Za-z0-9_-]+)/) ??
      resetMail.text.match(/[?&]token=([A-Za-z0-9_-]+)/);
    assert.ok(tokenMatch?.[1], `token missing in: ${resetMail.text}`);
    const token = tokenMatch[1];

    const newPassword = "invitee-password-12";
    const reset = await app.inject({
      method: "POST",
      url: "/api/auth/reset-password",
      headers: { "content-type": "application/json" },
      payload: { token, newPassword },
    });
    assert.equal(reset.statusCode, 200, reset.body);

    const signedIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email: inviteEmail, password: newPassword },
    });
    assert.equal(signedIn.statusCode, 200, signedIn.body);

    // Non-admin cannot invite
    const denied = await app.inject({
      method: "POST",
      url: "/api/admin/invites",
      headers: {
        "content-type": "application/json",
        cookie: cookieHeader(signedIn.headers["set-cookie"]),
      },
      payload: { email: "x@stamped.test", name: "Nope" },
    });
    assert.equal(denied.statusCode, 403);

    await app.close();
    await pool.end();
  });

  it("request-password-reset captures email for existing users", async (t) => {
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
    const app = await buildApp({ env, auth, mailer });

    const email = `reset_${randomUUID().slice(0, 8)}@stamped.test`;
    await seedUser(db, { email, password: "old-password-12xx" });
    mailer.clear();

    const req = await app.inject({
      method: "POST",
      url: "/api/auth/request-password-reset",
      headers: { "content-type": "application/json" },
      payload: {
        email,
        redirectTo: "http://localhost:3000/reset-password",
      },
    });
    assert.ok(req.statusCode === 200 || req.statusCode === 201, req.body);
    const mail = mailer.outbox().find((m) => m.kind === "password_reset");
    assert.ok(mail);
    assert.equal(mail.to, email);

    await app.close();
    await pool.end();
  });
});
