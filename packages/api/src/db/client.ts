import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { schema } from "./schema.js";

export type Db = ReturnType<typeof createDb>;

export function createPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function createDb(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

export async function pingDatabase(pool: pg.Pool): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("select 1");
    return true;
  } finally {
    client.release();
  }
}
