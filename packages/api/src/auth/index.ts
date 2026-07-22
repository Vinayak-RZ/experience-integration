import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../db/client.js";
import { authSchema } from "../db/auth-schema.js";
import type { Env } from "../config.js";

export function createAuth(db: Db, env: Env) {
  return betterAuth({
    appName: "Stamped L6",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN, env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      // Public self-registration is forbidden — invites land in a later commit.
      disableSignUp: true,
      minPasswordLength: 12,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: "lax",
        httpOnly: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
