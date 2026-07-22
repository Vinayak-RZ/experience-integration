import { and, asc, eq, gt } from "drizzle-orm";
import type pg from "pg";
import type { Db } from "../db/client.js";
import { l5Events } from "../db/schema.js";

export const L6_EVENTS_CHANNEL = "l6_l5_events";

export type StoredEvent = {
  id: string;
  orgExternalId: string;
  plantExternalId: string;
  eventId: string;
  seq: number;
  payload: Record<string, unknown>;
  ingestedAt: Date;
};

/** Replay events after Last-Event-ID (row uuid), ordered by seq for no-gap resume. */
export async function listEventsAfter(
  db: Db,
  input: {
    orgExternalId: string;
    plantExternalId: string;
    afterId?: string | null;
    limit?: number;
  },
): Promise<StoredEvent[]> {
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 500);
  const filters = [
    eq(l5Events.orgExternalId, input.orgExternalId),
    eq(l5Events.plantExternalId, input.plantExternalId),
  ];

  if (input.afterId) {
    const [anchor] = await db
      .select({ seq: l5Events.seq })
      .from(l5Events)
      .where(eq(l5Events.id, input.afterId))
      .limit(1);
    if (!anchor) {
      // Unknown id — fail closed to full recent window for the plant.
      const rows = await db
        .select()
        .from(l5Events)
        .where(and(...filters))
        .orderBy(asc(l5Events.seq))
        .limit(limit);
      return rows.map(mapRow);
    }
    const rows = await db
      .select()
      .from(l5Events)
      .where(and(...filters, gt(l5Events.seq, anchor.seq)))
      .orderBy(asc(l5Events.seq))
      .limit(limit);
    return rows.map(mapRow);
  }

  const rows = await db
    .select()
    .from(l5Events)
    .where(and(...filters))
    .orderBy(asc(l5Events.seq))
    .limit(limit);
  return rows.map(mapRow);
}

function mapRow(row: typeof l5Events.$inferSelect): StoredEvent {
  return {
    id: row.id,
    orgExternalId: row.orgExternalId,
    plantExternalId: row.plantExternalId,
    eventId: row.eventId,
    seq: row.seq,
    payload: row.payload,
    ingestedAt: row.ingestedAt,
  };
}

export function formatSseFrame(input: {
  id: string;
  event?: string;
  data: unknown;
}): string {
  const lines = [
    `id: ${input.id}`,
    input.event ? `event: ${input.event}` : null,
    `data: ${JSON.stringify(input.data)}`,
    "",
    "",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function formatSseComment(comment: string): string {
  return `: ${comment}\n\n`;
}

export async function publishEventNotify(
  client: pg.PoolClient | pg.Pool,
  input: { orgExternalId: string; plantExternalId: string; id: string },
): Promise<void> {
  const payload = JSON.stringify(input);
  await client.query(`select pg_notify($1, $2)`, [L6_EVENTS_CHANNEL, payload]);
}

/** Catch-up then live LISTEN — used by route and integration harness. */
export async function resumeEventStream(input: {
  db: Db;
  pool: pg.Pool;
  orgExternalId: string;
  plantExternalId: string;
  lastEventId?: string | null;
  onFrame: (frame: string) => void;
  signal: AbortSignal;
  heartbeatMs?: number;
}): Promise<void> {
  const backlog = await listEventsAfter(input.db, {
    orgExternalId: input.orgExternalId,
    plantExternalId: input.plantExternalId,
    afterId: input.lastEventId,
  });
  for (const ev of backlog) {
    input.onFrame(
      formatSseFrame({
        id: ev.id,
        event: "l5_event",
        data: { event_id: ev.eventId, payload: ev.payload },
      }),
    );
  }

  const listenClient = await input.pool.connect();
  const heartbeatMs = input.heartbeatMs ?? 15_000;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  try {
    await listenClient.query(`listen ${L6_EVENTS_CHANNEL}`);
    heartbeat = setInterval(() => {
      if (!input.signal.aborted) {
        input.onFrame(formatSseComment("heartbeat"));
      }
    }, heartbeatMs);

    await new Promise<void>((resolve, reject) => {
      const onNotify = async (msg: pg.Notification) => {
        if (msg.channel !== L6_EVENTS_CHANNEL || !msg.payload) return;
        try {
          const parsed = JSON.parse(msg.payload) as {
            orgExternalId?: string;
            plantExternalId?: string;
            id?: string;
          };
          if (
            parsed.orgExternalId !== input.orgExternalId ||
            parsed.plantExternalId !== input.plantExternalId ||
            !parsed.id
          ) {
            return;
          }
          const [row] = await input.db
            .select()
            .from(l5Events)
            .where(eq(l5Events.id, parsed.id))
            .limit(1);
          if (!row) return;
          input.onFrame(
            formatSseFrame({
              id: row.id,
              event: "l5_event",
              data: { event_id: row.eventId, payload: row.payload },
            }),
          );
        } catch (err) {
          reject(err);
        }
      };
      const onAbort = () => {
        listenClient.removeListener("notification", onNotify);
        resolve();
      };
      listenClient.on("notification", onNotify);
      if (input.signal.aborted) onAbort();
      else input.signal.addEventListener("abort", onAbort, { once: true });
    });
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    try {
      await listenClient.query(`unlisten ${L6_EVENTS_CHANNEL}`);
    } catch {
      /* ignore */
    }
    listenClient.release();
  }
}
