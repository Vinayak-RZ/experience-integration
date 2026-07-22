import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import http from "node:http";
import { eq } from "drizzle-orm";
import { describe, it } from "node:test";
import type { WorkflowEvent } from "@stamped/l6-contracts";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { l5Events } from "../src/db/schema.js";
import {
  appendEvent,
  getCursor,
  ingestL5Events,
  ingestLockId,
} from "../src/events/ingest.js";
import { L5WorkflowClient } from "../src/upstream/l5/client.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

function event(id: string, plant = "plant_jaipur_01"): WorkflowEvent {
  const digits = id.replace(/\D/g, "");
  const minute = digits.slice(-2).padStart(2, "0");
  return {
    schema_version: "1.0.0",
    event_id: id,
    org_id: "org_demo",
    plant_id: plant,
    prescription_id: "rx_1",
    event_type: "transition",
    from_status: "open",
    to_status: "in_progress",
    actor_type: "system",
    actor_id: null,
    occurred_at: `2026-07-22T10:${minute}:00.000Z`,
    workflow_version: 1,
    dedupe_key: `sha256:${createHash("sha256").update(id).digest("hex")}`,
  };
}

function createMockEvents(events: WorkflowEvent[]) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/v1/events") {
      const since = url.searchParams.get("since") ?? "";
      const items = since
        ? events.filter((e) => e.event_id > since)
        : events;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ items, next_cursor: null }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });
  return {
    async listen(): Promise<string> {
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      return `http://127.0.0.1:${addr.port}`;
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

describe("L5 event cursor ingest", () => {
  it("dedupes appends and recovers cursor under concurrent leaders", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);

    const mock = createMockEvents([event("we_001"), event("we_002")]);
    const baseUrl = await mock.listen();
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const l5 = new L5WorkflowClient({
      baseUrl,
      timeoutMs: 2_000,
      features: { alarmAck: false, alarmEscalate: false, alarmUnsilence: false },
    });

    try {
      const dup = await appendEvent(db, event("we_001"));
      assert.equal(dup, "inserted");
      assert.equal(await appendEvent(db, event("we_001")), "duplicate");

      // Hold advisory lock on a second connection to force follower path.
      const holder = await pool.connect();
      const lockId = ingestLockId("org_demo", "plant_jaipur_01");
      await holder.query("select pg_try_advisory_lock($1)", [lockId]);

      const blocked = await ingestL5Events(pool, l5, {
        orgId: "org_demo",
        plantId: "plant_jaipur_01",
      });
      assert.equal(blocked.acquired, false);

      await holder.query("select pg_advisory_unlock($1)", [lockId]);
      holder.release();

      const [a, b] = await Promise.all([
        ingestL5Events(pool, l5, {
          orgId: "org_demo",
          plantId: "plant_jaipur_01",
        }),
        ingestL5Events(pool, l5, {
          orgId: "org_demo",
          plantId: "plant_jaipur_01",
        }),
      ]);
      assert.equal(a.acquired !== b.acquired || a.inserted + b.inserted >= 1, true);
      const winner = a.acquired ? a : b;
      assert.equal(winner.acquired, true);
      assert.ok(winner.inserted + winner.skipped >= 1);

      const rows = await db
        .select()
        .from(l5Events)
        .where(eq(l5Events.plantExternalId, "plant_jaipur_01"));
      const ids = new Set(rows.map((r) => r.eventId));
      assert.ok(ids.has("we_001"));
      assert.ok(ids.has("we_002"));
      assert.equal(ids.size, rows.length);

      const cursor = await getCursor(db, "org_demo", "plant_jaipur_01");
      assert.equal(cursor, "we_002");

      // Replay ingest inserts nothing new
      const replay = await ingestL5Events(pool, l5, {
        orgId: "org_demo",
        plantId: "plant_jaipur_01",
      });
      assert.equal(replay.inserted, 0);
    } finally {
      await pool.end();
      await mock.close();
    }
  });
});
