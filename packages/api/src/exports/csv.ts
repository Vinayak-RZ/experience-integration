/**
 * Safe CSV builders — stable columns, IST timezone label, formula-injection defense.
 * Spec FR-018 / edge case: values beginning with = + - @ \t \r.
 */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const needsFormulaGuard = FORMULA_PREFIX.test(raw);
  const guarded = needsFormulaGuard ? `'${raw}` : raw;
  if (/[",\n\r]/.test(guarded) || needsFormulaGuard) {
    return `"${guarded.replaceAll('"', '""')}"`;
  }
  return guarded;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export type LedgerCsvRow = {
  entry_id: string;
  plant_id: string;
  prescription_id: string;
  entry_type: string;
  period_start_ist: string;
  period_end_ist: string;
  potential_inr: number;
  realised_inr: number;
  verification_status: string;
  mv_method: string;
  baseline_id: string;
  emission_factor_ref: string;
  timezone: "Asia/Kolkata";
};

export const LEDGER_CSV_HEADERS = [
  "entry_id",
  "plant_id",
  "prescription_id",
  "entry_type",
  "period_start_ist",
  "period_end_ist",
  "potential_inr",
  "realised_inr",
  "verification_status",
  "mv_method",
  "baseline_id",
  "emission_factor_ref",
  "timezone",
] as const;

export function ledgerRowsToCsv(rows: readonly LedgerCsvRow[]): string {
  return toCsv(
    LEDGER_CSV_HEADERS,
    rows.map((r) => [
      r.entry_id,
      r.plant_id,
      r.prescription_id,
      r.entry_type,
      r.period_start_ist,
      r.period_end_ist,
      r.potential_inr,
      r.realised_inr,
      r.verification_status,
      r.mv_method,
      r.baseline_id,
      r.emission_factor_ref,
      r.timezone,
    ]),
  );
}

export type PrescriptionAuditCsvRow = {
  prescription_id: string;
  plant_id: string;
  title: string;
  lane: string;
  impact_inr_per_month: number;
  confidence: number;
  owner_role: string;
  due_at_ist: string;
  verification_status: string;
  realised_inr: number | "";
  timezone: "Asia/Kolkata";
};

export const PRESCRIPTION_AUDIT_CSV_HEADERS = [
  "prescription_id",
  "plant_id",
  "title",
  "lane",
  "impact_inr_per_month",
  "confidence",
  "owner_role",
  "due_at_ist",
  "verification_status",
  "realised_inr",
  "timezone",
] as const;

export function prescriptionAuditRowsToCsv(
  rows: readonly PrescriptionAuditCsvRow[],
): string {
  return toCsv(
    PRESCRIPTION_AUDIT_CSV_HEADERS,
    rows.map((r) => [
      r.prescription_id,
      r.plant_id,
      r.title,
      r.lane,
      r.impact_inr_per_month,
      r.confidence,
      r.owner_role,
      r.due_at_ist,
      r.verification_status,
      r.realised_inr,
      r.timezone,
    ]),
  );
}

/** Fixture Auto rows for product CSV when L2 ledger is gated. */
export const FIXTURE_LEDGER_CSV: LedgerCsvRow[] = [
  {
    entry_id: "led_1001",
    plant_id: "plant_jaipur_01",
    prescription_id: "rx_9004",
    entry_type: "realised_savings",
    period_start_ist: "2026-07-01T00:00:00+05:30",
    period_end_ist: "2026-07-21T00:00:00+05:30",
    potential_inr: 12000,
    realised_inr: 11200,
    verification_status: "ops_confirmed",
    mv_method: "IPMVP Option B",
    baseline_id: "bl_hvac_admin_7d",
    emission_factor_ref: "cea_grid_india_2024_v1",
    timezone: "Asia/Kolkata",
  },
  {
    entry_id: "led_evil",
    plant_id: "plant_jaipur_01",
    prescription_id: "rx_9001",
    entry_type: "potential_savings",
    period_start_ist: "2026-07-01T00:00:00+05:30",
    period_end_ist: "2026-07-31T00:00:00+05:30",
    potential_inr: 84000,
    realised_inr: 0,
    verification_status: "pending",
    mv_method: "=CMD|' /C calc'!A0",
    baseline_id: "bl_kiln_1_7d",
    emission_factor_ref: "not_measured_by_stamped",
    timezone: "Asia/Kolkata",
  },
];

export const FIXTURE_RX_AUDIT_CSV: PrescriptionAuditCsvRow[] = [
  {
    prescription_id: "rx_9004",
    plant_id: "plant_jaipur_01",
    title: "Shift non-critical HVAC off peak",
    lane: "closed",
    impact_inr_per_month: 12000,
    confidence: 0.7,
    owner_role: "energy_manager",
    due_at_ist: "2026-07-10T18:00:00+05:30",
    verification_status: "ops_confirmed",
    realised_inr: 11200,
    timezone: "Asia/Kolkata",
  },
  {
    prescription_id: "rx_evil",
    plant_id: "plant_jaipur_01",
    title: "+Profit share",
    lane: "needs_review",
    impact_inr_per_month: 1,
    confidence: 0.5,
    owner_role: "supervisor",
    due_at_ist: "2026-07-22T18:00:00+05:30",
    verification_status: "pending",
    realised_inr: "",
    timezone: "Asia/Kolkata",
  },
];
