import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/client.js";
import { webhookDeliveries, webhookEndpoints } from "../db/schema.js";
import { assertSafeWebhookUrl } from "./ssrf.js";
import { webhookHeaders } from "./sign.js";

export const MAX_WEBHOOK_ATTEMPTS = 5;

export async function createWebhookEndpoint(
  db: Db,
  input: {
    orgId: string;
    url: string;
    secret: string;
    eventFilters?: string[];
    createdBy: string;
  },
) {
  await assertSafeWebhookUrl(input.url);
  const [row] = await db
    .insert(webhookEndpoints)
    .values({
      orgId: input.orgId,
      url: input.url,
      secret: input.secret,
      eventFilters: input.eventFilters ?? ["*"],
      createdBy: input.createdBy,
    })
    .returning();
  return row!;
}

export async function enqueueWebhookDelivery(
  db: Db,
  input: {
    endpointId: string;
    eventType: string;
    payload: Record<string, unknown>;
    eventId?: string;
  },
) {
  const eventId = input.eventId ?? randomUUID();
  try {
    const [row] = await db
      .insert(webhookDeliveries)
      .values({
        endpointId: input.endpointId,
        eventId,
        eventType: input.eventType,
        payload: input.payload,
        status: "pending",
      })
      .returning();
    return row!;
  } catch {
    // unique (endpoint, event) — idempotent
    const existing = await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.endpointId, input.endpointId),
          eq(webhookDeliveries.eventId, eventId),
        ),
      )
      .then((rows) => rows[0]);
    return existing!;
  }
}

export async function deliverWebhookOnce(
  db: Db,
  deliveryId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const delivery = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .then((rows) => rows[0]);
  if (!delivery) return { ok: false, error: "missing delivery" };
  if (delivery.status === "delivered") return { ok: true, status: delivery.responseStatus ?? 200 };

  const endpoint = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, delivery.endpointId))
    .then((rows) => rows[0]);
  if (!endpoint || !endpoint.enabled) {
    await db
      .update(webhookDeliveries)
      .set({ status: "disabled", lastError: "endpoint disabled" })
      .where(eq(webhookDeliveries.id, deliveryId));
    return { ok: false, error: "disabled" };
  }

  try {
    await assertSafeWebhookUrl(endpoint.url);
  } catch (err) {
    await db
      .update(webhookDeliveries)
      .set({
        status: "dlq",
        lastError: err instanceof Error ? err.message : "ssrf",
        attemptCount: delivery.attemptCount + 1,
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return { ok: false, error: "ssrf" };
  }

  const body = JSON.stringify({
    type: delivery.eventType,
    id: delivery.eventId,
    data: delivery.payload,
  });
  const headers = webhookHeaders({
    secret: endpoint.secret,
    msgId: delivery.eventId,
    body,
  });

  try {
    const res = await fetchImpl(endpoint.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const attempt = delivery.attemptCount + 1;
    if (res.ok) {
      await db
        .update(webhookDeliveries)
        .set({
          status: "delivered",
          responseStatus: res.status,
          attemptCount: attempt,
          deliveredAt: new Date(),
          lastError: null,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      return { ok: true, status: res.status };
    }
    const dead = attempt >= MAX_WEBHOOK_ATTEMPTS;
    await db
      .update(webhookDeliveries)
      .set({
        status: dead ? "dlq" : "pending",
        responseStatus: res.status,
        attemptCount: attempt,
        lastError: `HTTP ${res.status}`,
        nextAttemptAt: dead
          ? null
          : new Date(Date.now() + Math.min(60_000, 2 ** attempt * 1000)),
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err) {
    const attempt = delivery.attemptCount + 1;
    const dead = attempt >= MAX_WEBHOOK_ATTEMPTS;
    await db
      .update(webhookDeliveries)
      .set({
        status: dead ? "dlq" : "pending",
        attemptCount: attempt,
        lastError: err instanceof Error ? err.message : "deliver failed",
        nextAttemptAt: dead
          ? null
          : new Date(Date.now() + Math.min(60_000, 2 ** attempt * 1000)),
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return { ok: false, error: err instanceof Error ? err.message : "fail" };
  }
}
