import { z } from "zod";
import {
  AlarmSeveritySchema,
  AlarmStateSchema,
  RoleSchema,
  VerificationStatusSchema,
  WorkflowEventTypeSchema,
  WorkflowStatusSchema,
} from "./enums.js";

const isoDateTime = z.string().min(1);
const dedupeKey = z.string().regex(/^sha256:[a-f0-9]{64}$/);

/** Subset of platform WorkflowEvent used by L6 consumers. */
export const WorkflowEventSchema = z.object({
  schema_version: z.literal("1.0.0"),
  event_id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  prescription_id: z.string().min(1),
  event_type: WorkflowEventTypeSchema,
  from_status: WorkflowStatusSchema.nullable(),
  to_status: WorkflowStatusSchema,
  actor_type: z.string().min(1),
  actor_id: z.string().nullable().optional(),
  reason_code: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  wamid: z.string().nullable().optional(),
  occurred_at: isoDateTime,
  workflow_version: z.number().int().nonnegative(),
  correlation_id: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  dedupe_key: dedupeKey,
});
export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

/** Subset of platform LedgerEntry used by L6 claim surfaces. */
export const LedgerEntrySchema = z.object({
  schema_version: z.literal("1.0.0"),
  entry_id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  prescription_id: z.string().min(1),
  entry_type: z.enum([
    "realised_savings",
    "potential_savings",
    "opportunity_cost",
  ]),
  period_start: isoDateTime,
  period_end: isoDateTime,
  potential_kwh: z.number().nonnegative(),
  realised_kwh: z.number().nonnegative(),
  potential_inr: z.number().nonnegative(),
  realised_inr: z.number().nonnegative(),
  avoided_tco2e: z.number().nonnegative().optional(),
  mv_method: z.string().min(1),
  baseline_id: z.string().min(1),
  bill_line_refs: z.array(z.string()).optional(),
  intensity_delta: z.number().nullable().optional(),
  verification_status: VerificationStatusSchema,
  modeled_reason: z.string().optional(),
  delay_days: z.number().int().nonnegative().nullable().optional(),
  supersedes_entry_id: z.string().nullable().optional(),
  emission_factor_ref: z.string().nullable().optional(),
  dedupe_key: dedupeKey,
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const AlarmSchema = z.object({
  id: z.string().min(1),
  plantId: z.string().min(1),
  assetId: z.string().min(1),
  assetLabel: z.string().min(1),
  severity: AlarmSeveritySchema,
  state: AlarmStateSchema,
  summary: z.string().min(1),
  raisedAt: isoDateTime,
  ownerRole: RoleSchema.optional(),
  relatedPrescriptionId: z.string().optional(),
  findingId: z.string().optional(),
});
export type Alarm = z.infer<typeof AlarmSchema>;
