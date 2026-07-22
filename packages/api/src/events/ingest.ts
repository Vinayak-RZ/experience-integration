import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type pg from "pg";
import type { WorkflowEvent } from "@stamped/l6-contracts";
import { createDb } from "../db/client.js";
import { l5EventCursors, l5Events } from "../db/schema.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { publishEventNotify } from "./sse.js";

export type IngestResult = {
  acquired: boolean;
  inserted: number;
  skipped: number;
  cursor: string;
};

function advisoryKey(orgId: string, plantId: string): number {
  const hex = createHash("sha256")
    .update(`l5-ingest:${orgId}:${plantId}`)
    .digest("hex")
    .slice(0, 8);
  return Number.parseInt(hex, 16) % 2_147_483_647;
}

export async function getCursor(
  db: ReturnType<typeof createDb>,
  orgId: string,
  plantId: string,
): Promise<string> {
  const [row] = await db
    .select()
    .from(l5EventCursors)
    .where(
      and(
        eq(l5EventCursors.orgExternalId, orgId),
        eq(l5EventCursors.plantExternalId, plantId),
      ),
    )
    .limit(1);
  return row?.cursor ?? "";
}

/**
 * Leader-only ingest on one pooled connection so advisory lock/unlock pair.
 * Append-only dedupe; cursor advances only after durable writes.
 */
export async function ingestL5Events(
  pool: pg.Pool,
  l5: L5WorkflowClient,
  input: { orgId: string; plantId: string },
): Promise<IngestResult> {
  const client = await pool.connect();
  const lockId = advisoryKey(input.orgId, input.plantId);
  const db = createDb(client as unknown as pg.Pool);

  try {
    const lockRes = await client.query<{ acquired: boolean }>(
      "select pg_try_advisory_lock($1) as acquired",
      [lockId],
    );
    const acquired = Boolean(lockRes.rows[0]?.acquired);
    if (!acquired) {
      const cursor = await getCursor(db, input.orgId, input.plantId);
      return { acquired: false, inserted: 0, skipped: 0, cursor };
    }

    try {
      let cursor = await getCursor(db, input.orgId, input.plantId);
      let inserted = 0;
      let skipped = 0;
      let pageCursor: string | undefined;

      for (let page = 0; page < 20; page++) {
        const { items, nextCursor } = await l5.listEvents({
          orgId: input.orgId,
          plantId: input.plantId,
          since: cursor || undefined,
          cursor: pageCursor,
        });
        if (items.length === 0) break;

        for (const event of items) {
          const result = await appendEvent(db, event, client);
          if (result === "inserted") inserted += 1;
          else skipped += 1;
          cursor = event.event_id;
        }

        await db
          .insert(l5EventCursors)
          .values({
            orgExternalId: input.orgId,
            plantExternalId: input.plantId,
            cursor,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
              l5EventCursors.orgExternalId,
              l5EventCursors.plantExternalId,
            ],
            set: { cursor, updatedAt: new Date() },
          });

        if (!nextCursor) break;
        pageCursor = nextCursor;
      }

      return { acquired: true, inserted, skipped, cursor };
    } finally {
      await client.query("select pg_advisory_unlock($1)", [lockId]);
    }
  } finally {
    client.release();
  }
}

export async function appendEvent(
  db: ReturnType<typeof createDb>,
  event: WorkflowEvent,
  notifyClient?: pg.PoolClient | pg.Pool,
): Promise<"inserted" | "duplicate"> {
  try {
    const [row] = await db
      .insert(l5Events)
      .values({
        orgExternalId: event.org_id,
        plantExternalId: event.plant_id,
        eventId: event.event_id,
        dedupeKey: event.dedupe_key,
        occurredAt: new Date(event.occurred_at),
        payload: event as unknown as Record<string, unknown>,
      })
      .returning({ id: l5Events.id });
    if (notifyClient && row) {
      await publishEventNotify(notifyClient, {
        orgExternalId: event.org_id,
        plantExternalId: event.plant_id,
        id: row.id,
      });
    }
    return "inserted";
  } catch (err) {
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    const msg = [err instanceof Error ? err.message : String(err), cause?.message, cause?.code]
      .filter(Boolean)
      .join(" ");
    if (/unique|duplicate|23505/i.test(msg)) return "duplicate";
    throw err;
  }
}

/** Test helper — hash used by concurrent lock tests. */
export function ingestLockId(orgId: string, plantId: string): number {
  return advisoryKey(orgId, plantId);
}
