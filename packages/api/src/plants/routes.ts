import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError } from "../authz/index.js";
import type { Db } from "../db/client.js";
import {
  listAuthorizedPlants,
  resolveActivePlant,
  setActivePlant,
  writeAudit,
} from "../tenancy/service.js";

const SwitchBody = z.object({
  orgId: z.string().uuid(),
  plantId: z.string().uuid(),
});

export async function registerPlantRoutes(
  app: FastifyInstance,
  auth: Auth,
  db: Db,
): Promise<void> {
  app.get("/api/plants", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Session required",
        request_id: request.id,
      });
    }
    const orgId =
      typeof request.query === "object" &&
      request.query &&
      "orgId" in request.query
        ? String((request.query as { orgId?: string }).orgId ?? "")
        : "";
    const resolved = await resolveActivePlant(db, {
      userId: session.user.id,
      orgId: orgId || undefined,
    });
    return {
      plants: resolved.authorized,
      activePlant: resolved.activePlant,
      recovered: resolved.recovered,
    };
  });

  app.post("/api/plants/active", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Session required",
        request_id: request.id,
      });
    }
    const parsed = SwitchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: parsed.error.issues.map((i) => i.message).join("; "),
        request_id: request.id,
      });
    }
    try {
      const plant = await setActivePlant(db, {
        userId: session.user.id,
        orgId: parsed.data.orgId,
        plantId: parsed.data.plantId,
      });
      await writeAudit(db, {
        orgId: parsed.data.orgId,
        actorUserId: session.user.id,
        action: "plant.switch",
        resourceType: "plant",
        resourceId: plant.id,
        metadata: { externalPlantId: plant.externalPlantId },
      });
      return { activePlant: plant };
    } catch (err) {
      if (err instanceof AuthzError) {
        return reply.status(403).send({
          type: "https://httpstatuses.com/403",
          title: "Forbidden",
          status: 403,
          detail: err.message,
          request_id: request.id,
        });
      }
      const status =
        typeof err === "object" &&
        err &&
        "statusCode" in err &&
        typeof (err as { statusCode: unknown }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : 500;
      return reply.status(status).send({
        type: `https://httpstatuses.com/${status}`,
        title: "Error",
        status,
        detail: err instanceof Error ? err.message : "Plant switch failed",
        request_id: request.id,
      });
    }
  });

  app.get("/api/plants/authorized", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Session required",
        request_id: request.id,
      });
    }
    return { plants: await listAuthorizedPlants(db, session.user.id) };
  });
}
