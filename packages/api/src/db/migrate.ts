import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDb, createPool } from "./client.js";

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

export async function runMigrations(databaseUrl: string): Promise<void> {
  const pool = createPool(databaseUrl);
  try {
    const db = createDb(pool);
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}
