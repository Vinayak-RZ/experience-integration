import { buildApp } from "../packages/api/src/app.js";
import { loadEnv } from "../packages/api/src/config.js";
import { createPool, pingDatabase } from "../packages/api/src/db/client.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = createPool(databaseUrl);
  const app = await buildApp({
    env: loadEnv({
      NODE_ENV: "test",
      REQUIRE_DATABASE: "true",
      DATABASE_URL: databaseUrl,
      LOG_LEVEL: "silent",
    }),
    checkReady: () => pingDatabase(pool),
  });
  try {
    const health = await app.inject({ method: "GET", url: "/health" });
    const ready = await app.inject({ method: "GET", url: "/ready" });
    if (health.statusCode !== 200 || ready.statusCode !== 200) {
      throw new Error(
        `smoke failed health=${health.statusCode} ready=${ready.statusCode}`,
      );
    }
    console.log(
      JSON.stringify({
        health: health.statusCode,
        ready: ready.statusCode,
        public_api: false,
      }),
    );
  } finally {
    await app.close();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
