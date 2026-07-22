import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import {
  FIXTURE_LEDGER_CSV,
  FIXTURE_RX_AUDIT_CSV,
  ledgerRowsToCsv,
  prescriptionAuditRowsToCsv,
} from "./csv.js";

export type ExportRouteDeps = {
  auth: Auth;
  db: Db;
};

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 401 ? "Unauthorized" : "Forbidden",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerExportRoutes(
  app: FastifyInstance,
  deps: ExportRouteDeps,
): Promise<void> {
  app.get("/api/exports/ledger.csv", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
    });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    try {
      requirePermission(plant.role, "report:export");
      requirePermission(plant.role, "ledger:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    // ponytail: fixture Auto until L2_FEATURE_LEDGER
    const rows = FIXTURE_LEDGER_CSV.filter(
      (r) => r.plant_id === plant.externalPlantId,
    );
    const body = ledgerRowsToCsv(rows.length ? rows : FIXTURE_LEDGER_CSV);
    return reply
      .status(200)
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        `attachment; filename="ledger_${plant.externalPlantId}.csv"`,
      )
      .send(body);
  });

  app.get("/api/exports/prescriptions.csv", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
    });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const rows = FIXTURE_RX_AUDIT_CSV.filter(
      (r) => r.plant_id === plant.externalPlantId,
    );
    const body = prescriptionAuditRowsToCsv(
      rows.length ? rows : FIXTURE_RX_AUDIT_CSV,
    );
    return reply
      .status(200)
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        `attachment; filename="prescription_audit_${plant.externalPlantId}.csv"`,
      )
      .send(body);
  });
}
