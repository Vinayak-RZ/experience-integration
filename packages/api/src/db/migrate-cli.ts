import { loadEnv } from "./config.js";
import { runMigrations } from "./db/migrate.js";

const env = loadEnv();
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is required to migrate");
  process.exit(1);
}
await runMigrations(env.DATABASE_URL);
console.log("migrations: OK");
