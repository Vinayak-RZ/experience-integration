import { createAuth } from "./auth/index.js";
import { startServer } from "./app.js";
import { loadEnv } from "./config.js";
import { createDb, createPool, pingDatabase } from "./db/client.js";
import { createMailer } from "./mail/mailer.js";

const env = loadEnv();

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to start the product BFF with auth");
}

const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const mailer = createMailer({
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  from: env.SMTP_FROM,
});
const auth = createAuth(db, env, mailer);

const app = await startServer({
  env,
  auth,
  mailer,
  checkReady: () => pingDatabase(pool),
});

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
