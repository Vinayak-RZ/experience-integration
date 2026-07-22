import {
  AlarmSeveritySchema,
  AlarmStateSchema,
  type AlarmSeverity,
  type AlarmState,
} from "@stamped/l6-contracts";
import { UpstreamError, upstreamFetch } from "../http.js";
import { z } from "zod";

export type L5FeatureFlags = {
  /** When false, ack/escalate/unsilence return structured unavailable (upstream gap). */
  alarmAck: boolean;
  alarmEscalate: boolean;
  alarmUnsilence: boolean;
};

export type L5ClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  features: L5FeatureFlags;
  /** Optional bearer / service token — never browser-exposed. */
  authToken?: string;
};

const L5AlarmSchema = z.object({
  id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  asset_id: z.string().min(1),
  asset_label: z.string().optional(),
  severity: AlarmSeveritySchema,
  state: AlarmStateSchema,
  summary: z.string(),
  raised_at: z.string().min(1),
  related_prescription_id: z.string().optional(),
  finding_id: z.string().optional(),
});

export type L5Alarm = z.infer<typeof L5AlarmSchema>;

const ListAlarmsResponseSchema = z.object({
  items: z.array(L5AlarmSchema),
  next_cursor: z.string().nullable().optional(),
});

export type AlarmActionBody = {
  orgId: string;
  plantId: string;
  actorId?: string | null;
  reason?: string | null;
};

export class L5WorkflowClient {
  constructor(private readonly opts: L5ClientOptions) {}

  private headers(): Record<string, string> {
    return this.opts.authToken
      ? { authorization: `Bearer ${this.opts.authToken}` }
      : {};
  }

  async listAlarms(input: {
    orgId: string;
    plantId: string;
    cursor?: string;
  }): Promise<{ items: L5Alarm[]; nextCursor: string | null }> {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/alarms",
      query: {
        org_id: input.orgId,
        plant_id: input.plantId,
        cursor: input.cursor,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    const parsed = ListAlarmsResponseSchema.parse(raw);
    return { items: parsed.items, nextCursor: parsed.next_cursor ?? null };
  }

  async getAlarm(alarmId: string): Promise<L5Alarm> {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/alarms/${encodeURIComponent(alarmId)}`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return L5AlarmSchema.parse(raw);
  }

  async silenceAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate("silence", alarmId, body, idempotencyKey, true);
  }

  async ackAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate("ack", alarmId, body, idempotencyKey, this.opts.features.alarmAck);
  }

  async escalateAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate(
      "escalate",
      alarmId,
      body,
      idempotencyKey,
      this.opts.features.alarmEscalate,
    );
  }

  async unsilenceAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate(
      "unsilence",
      alarmId,
      body,
      idempotencyKey,
      this.opts.features.alarmUnsilence,
    );
  }

  private async mutate(
    action: "silence" | "ack" | "escalate" | "unsilence",
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
    enabled: boolean,
  ): Promise<L5Alarm> {
    if (!enabled) {
      throw new UpstreamError(
        "UPSTREAM_FEATURE_UNAVAILABLE",
        `L5 ${action} is not published yet — feature-gated in L6`,
        501,
        { action, x_stamped_status: "upstream_missing" },
      );
    }
    if (!idempotencyKey.trim()) {
      throw new UpstreamError(
        "IDEMPOTENCY_KEY_REQUIRED",
        "Idempotency-Key is required for alarm lifecycle mutations",
        400,
      );
    }
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/alarms/${encodeURIComponent(alarmId)}/${action}`,
      method: "POST",
      body: {
        org_id: body.orgId,
        plant_id: body.plantId,
        actor_id: body.actorId ?? null,
        reason: body.reason ?? null,
      },
      idempotencyKey,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return L5AlarmSchema.parse(raw);
  }
}

/** Map L5 wire alarm → product shape used by web fixtures. */
export function toProductAlarm(a: L5Alarm): {
  id: string;
  plantId: string;
  assetId: string;
  assetLabel: string;
  severity: AlarmSeverity;
  state: AlarmState;
  summary: string;
  raisedAt: string;
  relatedPrescriptionId?: string;
  findingId?: string;
} {
  return {
    id: a.id,
    plantId: a.plant_id,
    assetId: a.asset_id,
    assetLabel: a.asset_label ?? a.asset_id,
    severity: a.severity,
    state: a.state,
    summary: a.summary,
    raisedAt: a.raised_at,
    relatedPrescriptionId: a.related_prescription_id,
    findingId: a.finding_id,
  };
}

export function defaultL5FeaturesFromEnv(env: NodeJS.ProcessEnv): L5FeatureFlags {
  const on = (k: string) => env[k] === "true";
  return {
    alarmAck: on("L5_FEATURE_ALARM_ACK"),
    alarmEscalate: on("L5_FEATURE_ALARM_ESCALATE"),
    alarmUnsilence: on("L5_FEATURE_ALARM_UNSILENCE"),
  };
}
