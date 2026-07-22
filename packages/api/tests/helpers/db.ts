import pg from "pg";

/** Full reset for integration tests — clears migration journal and public tables. */
export async function resetDatabase(databaseUrl: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    await pool.query(`
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO CURRENT_USER;
      GRANT ALL ON SCHEMA public TO public;
    `);
  } finally {
    await pool.end();
  }
}
