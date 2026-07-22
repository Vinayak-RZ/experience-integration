/** Allowlisted product telemetry — no PII, no free-form payloads. */

export const TELEMETRY_EVENTS = [
  "alarm_ack",
  "prescription_done",
  "evidence_open",
  "export_download",
  "api_key_used",
  "webhook_delivered",
  "web_vital_lcp",
  "web_vital_inp",
  "web_vital_cls",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

const ALLOWED_PROP_KEYS = new Set([
  "route",
  "plant_id",
  "org_id",
  "role",
  "value",
  "unit",
  "duration_ms",
  "status",
]);

export function sanitizeTelemetry(
  eventName: string,
  properties: Record<string, unknown> = {},
): { ok: true; eventName: TelemetryEventName; properties: Record<string, string | number | boolean> } | { ok: false; reason: string } {
  if (!(TELEMETRY_EVENTS as readonly string[]).includes(eventName)) {
    return { ok: false, reason: `event not allowlisted: ${eventName}` };
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (!ALLOWED_PROP_KEYS.has(k)) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      // strip obvious PII shapes
      if (typeof v === "string" && (v.includes("@") || /\d{10,}/.test(v))) continue;
      clean[k] = v;
    }
  }
  return {
    ok: true,
    eventName: eventName as TelemetryEventName,
    properties: clean,
  };
}
