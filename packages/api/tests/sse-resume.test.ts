import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import type { WorkflowEvent } from "@stamped/l6-contracts";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { appendEvent } from "../src/events/ingest.js";
import {
  formatSseFrame,
  listEventsAfter,
  resumeEventStream,
} from "../src/events/sse.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

function event(id: string): WorkflowEvent {
  return {
    schema_version: "1.0.0",
    event_id: id,
    org_id: "org_demo",
    plant_id: "plant_jaipur_01",
    prescription_id: "rx_1",
    event_type: "alarm_acked",
    from_status: "open",
    to_status: "in_progress",
    actor_type: "user",
    actor_id: "u1",
    occurred_at: "2026-07-22T11:00:00.000Z",
    workflow_version: 1,
    dedupe_key: `sha256:${createHash("sha256").update(id).digest("hex")}`,
  };
}

describe("resumable SSE", () => {
  it("formats frames with ids", () => {
    const frame = formatSseFrame({
      id: "abc",
      event: "l5_event",
      data: { ok: true },
    });
    assert.match(frame, /^id: abc\n/);
    assert.match(frame, /event: l5_event\n/);
    assert.match(frame, /data: \{"ok":true\}\n\n$/);
  });

  it("replays gap after Last-Event-ID and receives live notify without gaps", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    try {
      await appendEvent(db, event("sse_1"), pool);
      await appendEvent(db, event("sse_2"), pool);
      const all = await listEventsAfter(db, {
        orgExternalId: "org_demo",
        plantExternalId: "plant_jaipur_01",
      });
      assert.equal(all.length, 2);
      const afterFirst = await listEventsAfter(db, {
        orgExternalId: "org_demo",
        plantExternalId: "plant_jaipur_01",
        afterId: all[0]!.id,
      });
      assert.equal(afterFirst.length, 1);
      assert.equal(afterFirst[0]!.eventId, "sse_2");

      const frames: string[] = [];
      const ac = new AbortController();
      const stream = resumeEventStream({
        db,
        pool,
        orgExternalId: "org_demo",
        plantExternalId: "plant_jaipur_01",
        lastEventId: all[0]!.id,
        heartbeatMs: 50,
        signal: ac.signal,
        onFrame: (f) => frames.push(f),
      });

      // Allow LISTEN to arm
      await new Promise((r) => setTimeout(r, 50));
      await appendEvent(db, event("sse_3"), pool);
      await new Promise((r) => setTimeout(r, 100));
      ac.abort();
      await stream;

      const eventFrames = frames.filter((f) => f.includes("event: l5_event"));
      assert.ok(eventFrames.some((f) => f.includes("sse_2")));
      assert.ok(eventFrames.some((f) => f.includes("sse_3")));
      assert.ok(frames.some((f) => f.startsWith(": heartbeat")));
      // no-gap: sse_2 then sse_3 in order among event frames
      const ids = eventFrames.map((f) => {
        const m = f.match(/"event_id":"([^"]+)"/);
        return m?.[1];
      });
      assert.deepEqual(
        ids.filter((x) => x === "sse_2" || x === "sse_3"),
        ["sse_2", "sse_3"],
      );
    } finally {
      await pool.end();
    }
  });
});
