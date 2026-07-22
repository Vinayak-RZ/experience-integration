import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Db } from "../db/client.js";
import { productTelemetry } from "../db/schema.js";
import { sanitizeTelemetry } from "./sanitize.js";

export async function registerTelemetryRoutes(
  app: FastifyInstance,
  deps: { db?: Db },
): Promise<void> {
  app.post("/api/telemetry", async (request, reply) => {
    const body = z
      .object({
        event_name: z.string().min(1),
        org_id: z.string().optional(),
        plant_id: z.string().optional(),
        role: z.string().optional(),
        properties: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(request.body ?? {});

    const sanitized = sanitizeTelemetry(body.event_name, body.properties ?? {});
    if (!sanitized.ok) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: sanitized.reason,
        request_id: request.id,
      });
    }

    if (deps.db) {
      await deps.db.insert(productTelemetry).values({
        orgId: body.org_id ?? null,
        plantId: body.plant_id ?? null,
        role: body.role ?? null,
        eventName: sanitized.eventName,
        properties: sanitized.properties,
      });
    }

    return { accepted: true };
  });
}
