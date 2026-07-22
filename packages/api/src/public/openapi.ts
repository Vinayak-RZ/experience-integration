/** Minimal OpenAPI 3.1 document for L6 public /v1. */

export const publicOpenApi = {
  openapi: "3.1.0",
  info: {
    title: "Stamped L6 Public API",
    version: "1.0.0",
    description:
      "Customer-facing read API. Authenticate with Bearer API keys (stk_…). Problem+json errors.",
  },
  servers: [{ url: "/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Problem: {
        type: "object",
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
          request_id: { type: "string" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/alarms": {
      get: {
        summary: "List alarms for a plant",
        parameters: [
          { name: "plant_id", in: "query", required: true, schema: { type: "string" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated alarms" },
          "401": { description: "Unauthorized", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
    },
    "/events": {
      get: {
        summary: "Poll durable workflow events",
        parameters: [
          { name: "plant_id", in: "query", required: true, schema: { type: "string" } },
          { name: "after", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100 } },
        ],
        responses: { "200": { description: "Event page" } },
      },
    },
    "/ledger": {
      get: {
        summary: "Claim-safe ledger snapshot",
        parameters: [
          { name: "plant_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Ledger rows" } },
      },
    },
  },
} as const;
