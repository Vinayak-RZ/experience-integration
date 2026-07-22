import { RoleSchema } from "@stamped/l6-contracts";
import { z } from "zod";
import { UpstreamError, upstreamFetch } from "../http.js";

export type L4ClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  authToken?: string;
  /** When false, return fixture responses instead of calling live L4. */
  live: boolean;
};

export const AnalystContextEnvelopeSchema = z.object({
  orgId: z.string().min(1),
  plantId: z.string().min(1),
  userId: z.string().min(1),
  role: RoleSchema,
  routeId: z.string().min(1),
  screenTitle: z.string().min(1),
  focusEntity: z
    .object({
      type: z.enum(["alarm", "prescription", "asset", "ledger_entry"]),
      id: z.string().min(1),
    })
    .optional(),
  visibleSummary: z.array(z.string()),
  timeRange: z
    .object({ from: z.string().min(1), to: z.string().min(1) })
    .optional(),
  excludeKeys: z.array(z.string()).optional(),
});
export type AnalystContextEnvelope = z.infer<typeof AnalystContextEnvelopeSchema>;

const CitationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  uri: z.string().optional(),
  snippet: z.string().optional(),
});

const SessionSchema = z.object({
  session_id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  created_at: z.string().min(1),
});

const MessageResponseSchema = z.object({
  message_id: z.string().min(1),
  session_id: z.string().min(1),
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
  citations: z.array(CitationSchema).default([]),
  created_at: z.string().min(1),
});

/** Wire projection of the charter envelope — never silent page scrape. */
export function projectContextEnvelope(envelope: AnalystContextEnvelope) {
  const parsed = AnalystContextEnvelopeSchema.parse(envelope);
  const excluded = new Set(parsed.excludeKeys ?? []);
  const chips = [
    { key: "screen", value: parsed.screenTitle },
    { key: "route", value: parsed.routeId },
    {
      key: "focus",
      value: parsed.focusEntity
        ? `${parsed.focusEntity.type}:${parsed.focusEntity.id}`
        : "",
    },
    ...(parsed.timeRange
      ? [{ key: "range", value: `${parsed.timeRange.from}→${parsed.timeRange.to}` }]
      : []),
    ...parsed.visibleSummary.map((s, i) => ({ key: `summary:${i}`, value: s })),
  ].filter((c) => c.value && !excluded.has(c.key));

  return {
    org_id: parsed.orgId,
    plant_id: parsed.plantId,
    user_id: parsed.userId,
    role: parsed.role,
    route_id: parsed.routeId,
    screen_title: parsed.screenTitle,
    focus_entity: parsed.focusEntity ?? null,
    time_range: parsed.timeRange ?? null,
    visible_chips: chips,
  };
}

export function assertEnvelopeTenant(
  envelope: AnalystContextEnvelope,
  entityPlantId: string | undefined,
): void {
  if (entityPlantId && entityPlantId !== envelope.plantId) {
    throw new UpstreamError(
      "TENANT_MISMATCH",
      "Focus entity plant does not match analyst envelope plant",
      403,
    );
  }
}

export class L4AnalystClient {
  constructor(private readonly opts: L4ClientOptions) {}

  private headers(): Record<string, string> {
    return this.opts.authToken
      ? { authorization: `Bearer ${this.opts.authToken}` }
      : {};
  }

  async createSession(input: {
    orgId: string;
    plantId: string;
    userId: string;
  }) {
    if (!this.opts.live) {
      return SessionSchema.parse({
        session_id: `sess_fixture_${input.plantId}`,
        org_id: input.orgId,
        plant_id: input.plantId,
        created_at: new Date().toISOString(),
      });
    }
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/sessions",
      method: "POST",
      body: {
        org_id: input.orgId,
        plant_id: input.plantId,
        user_id: input.userId,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return SessionSchema.parse(raw);
  }

  async postMessage(input: {
    sessionId: string;
    content: string;
    envelope: AnalystContextEnvelope;
    entityPlantId?: string;
  }) {
    assertEnvelopeTenant(input.envelope, input.entityPlantId);
    const context = projectContextEnvelope(input.envelope);

    if (!this.opts.live) {
      const focus = context.focus_entity
        ? ` Focus ${context.focus_entity.type} ${context.focus_entity.id}.`
        : "";
      return MessageResponseSchema.parse({
        message_id: `msg_fixture_${Date.now()}`,
        session_id: input.sessionId,
        role: "assistant",
        content: `Fixture analyst for ${context.plant_id}.${focus} Chips: ${context.visible_chips
          .map((c) => c.key)
          .join(", ")}.`,
        citations: [
          {
            id: "cite_fixture_1",
            title: "Plant context (fixture)",
            snippet: context.screen_title,
          },
        ],
        created_at: new Date().toISOString(),
      });
    }

    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/sessions/${encodeURIComponent(input.sessionId)}/messages`,
      method: "POST",
      body: {
        content: input.content,
        context,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return MessageResponseSchema.parse(raw);
  }
}
