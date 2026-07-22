/**
 * Print-safe sustainability HTML + focused BRSR/PAT adjunct rows.
 * Missing inputs stay explicit — never invent Scope 1 / production SEC.
 */

export type SustainabilityInputs = {
  plantName: string;
  plantId: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
  gridKwh: number | null;
  renewableKwh: number | null;
  demandChargeInr: number | null;
  powerFactor: number | null;
  opsConfirmedSavingsInr: number | null;
  emissionFactorTPerMwh: number | null;
  emissionFactorRef: string | null;
  productionUnits: number | null;
  methodology: string;
};

export type BrsrRow = {
  metric: string;
  value: string;
  unit: string;
  note: string;
};

const MISSING = "not_measured_by_stamped";

function num(n: number | null, digits = 0): string {
  if (n == null) return MISSING;
  return n.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

export function buildBrsrPatRows(input: SustainabilityInputs): BrsrRow[] {
  const total =
    input.gridKwh != null && input.renewableKwh != null
      ? input.gridKwh + input.renewableKwh
      : null;
  const renewablePct =
    total && total > 0 && input.renewableKwh != null
      ? Math.round((input.renewableKwh / total) * 1000) / 10
      : null;
  const sec =
    input.productionUnits && input.productionUnits > 0 && input.gridKwh != null
      ? Math.round((input.gridKwh / input.productionUnits) * 100) / 100
      : null;
  const scope2 =
    input.gridKwh != null && input.emissionFactorTPerMwh != null
      ? Math.round((input.gridKwh / 1000) * input.emissionFactorTPerMwh * 1000) /
        1000
      : null;

  return [
    {
      metric: "Electricity consumption (grid)",
      value: num(input.gridKwh),
      unit: "kWh",
      note: input.gridKwh == null ? MISSING : "L2 measurements",
    },
    {
      metric: "Renewable electricity",
      value: num(input.renewableKwh),
      unit: "kWh",
      note: input.renewableKwh == null ? MISSING : "L2 measurements",
    },
    {
      metric: "Renewable percentage",
      value: renewablePct == null ? MISSING : String(renewablePct),
      unit: "%",
      note: renewablePct == null ? MISSING : "Derived",
    },
    {
      metric: "SEC",
      value: sec == null ? MISSING : String(sec),
      unit: "kWh/unit",
      note: sec == null ? MISSING : "Requires production units",
    },
    {
      metric: "Scope 2 emissions",
      value: scope2 == null ? MISSING : String(scope2),
      unit: "tCO₂e",
      note: input.emissionFactorRef ?? MISSING,
    },
    {
      metric: "Scope 1 emissions",
      value: MISSING,
      unit: "tCO₂e",
      note: MISSING,
    },
    {
      metric: "Demand charges",
      value: num(input.demandChargeInr),
      unit: "INR",
      note: input.demandChargeInr == null ? MISSING : "Billing window",
    },
    {
      metric: "Power factor",
      value: input.powerFactor == null ? MISSING : String(input.powerFactor),
      unit: "ratio",
      note: input.powerFactor == null ? MISSING : "Incomer",
    },
    {
      metric: "Ops-confirmed savings",
      value: num(input.opsConfirmedSavingsInr),
      unit: "INR",
      note: "Not bill-verified",
    },
  ];
}

/** Accessible, print-oriented HTML — no scripts, no hidden content. */
export function renderSustainabilityHtml(input: SustainabilityInputs): string {
  const rows = buildBrsrPatRows(input);
  const tr = rows
    .map(
      (r) =>
        `<tr><th scope="row">${escapeHtml(r.metric)}</th><td>${escapeHtml(
          r.value,
        )}</td><td>${escapeHtml(r.unit)}</td><td>${escapeHtml(r.note)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Sustainability pack — ${escapeHtml(input.plantName)}</title>
<style>
  @media print { .no-print { display: none !important; } body { font-size: 11pt; } }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 24px; max-width: 800px; }
  h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
  th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; vertical-align: top; }
  th[scope="col"] { background: #f0f0f0; }
  .meta { color: #333; font-size: 0.9rem; }
  .limitations { background: #fff8e6; border: 1px solid #c97a00; padding: 12px; }
</style>
</head>
<body>
  <h1>Monthly sustainability pack</h1>
  <p class="meta">${escapeHtml(input.plantName)} (${escapeHtml(input.plantId)})</p>
  <p class="meta">Window ${escapeHtml(input.periodStart)} → ${escapeHtml(
    input.periodEnd,
  )} · Timezone ${escapeHtml(input.timezone)}</p>
  <h2>Methodology</h2>
  <p>${escapeHtml(input.methodology)}</p>
  <h2>BRSR / PAT adjunct (electricity-focused)</h2>
  <table>
    <caption>Focused energy and emissions inputs for filers — not a filing</caption>
    <thead>
      <tr>
        <th scope="col">Metric</th>
        <th scope="col">Value</th>
        <th scope="col">Unit</th>
        <th scope="col">Lineage / note</th>
      </tr>
    </thead>
    <tbody>${tr}</tbody>
  </table>
  <h2>Limitations</h2>
  <div class="limitations">
    <p>Stamped supplies evidence adjuncts for the filer’s process. Values marked
    <code>${MISSING}</code> were not measured or are out of scope. Ops-confirmed
    savings are not bill-verified. Scope 1 is never invented.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const FIXTURE_SUSTAINABILITY: SustainabilityInputs = {
  plantName: "Jaipur Works",
  plantId: "plant_jaipur_01",
  periodStart: "2026-07-01T00:00:00+05:30",
  periodEnd: "2026-07-31T23:59:59+05:30",
  timezone: "Asia/Kolkata",
  gridKwh: 1_200_000,
  renewableKwh: 80_000,
  demandChargeInr: 420_000,
  powerFactor: 0.92,
  opsConfirmedSavingsInr: 11200,
  emissionFactorTPerMwh: 0.71,
  emissionFactorRef: "cea_grid_india_2024_v1",
  productionUnits: null,
  methodology:
    "IPMVP-aligned measurement windows from L2; emission factor CEA grid India 2024.",
};
