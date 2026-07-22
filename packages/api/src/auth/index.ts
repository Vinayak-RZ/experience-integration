import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import type { Db } from "../db/client.js";
import { authSchema } from "../db/auth-schema.js";
import type { Env } from "../config.js";
import type { Mailer } from "../mail/mailer.js";

export function createAuth(db: Db, env: Env, mailer: Mailer) {
  return betterAuth({
    appName: "Stamped L6",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN, env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    emailVerification: {
      sendOnSignUp: false,
      sendVerificationEmail: async ({ user, url }) => {
        await mailer.send({
          to: user.email,
          subject: "Verify your Stamped account",
          text: `Verify your email: ${url}`,
          kind: "verification",
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      resetPasswordTokenExpiresIn: env.AUTH_TOKEN_TTL_SECONDS,
      sendResetPassword: async ({ user, url }) => {
        await mailer.send({
          to: user.email,
          subject: "Reset your Stamped password",
          text: `Reset your password: ${url}`,
          kind: "password_reset",
        });
      },
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
    ],
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
