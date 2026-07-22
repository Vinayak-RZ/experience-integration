import type { Point } from "@/lib/chart-sample";
import { buildMinuteSeries } from "@/lib/chart-sample";

export type ConsumerRow = {
  assetId: string;
  label: string;
  kwh: number;
  sharePct: number;
  health: "calm" | "watch" | "hot";
};

export type TodBand = {
  id: string;
  label: string;
  fromHour: number;
  toHour: number;
  rateInrPerKwh: number;
};

export type IntensitySnapshot = {
  secKwhPerUnit: number | null;
  renewablePct: number | null;
  scope2Tco2e: number | null;
  scope1Tco2e: null;
  missing: string[];
  emissionFactorRef: string | null;
  cmdKva: number;
  peakMdKva: number;
};

export const TOD_BANDS_RJ: TodBand[] = [
  { id: "off", label: "Off-peak", fromHour: 22, toHour: 6, rateInrPerKwh: 5.2 },
  { id: "normal", label: "Normal", fromHour: 6, toHour: 10, rateInrPerKwh: 6.8 },
  { id: "peak", label: "Peak", fromHour: 10, toHour: 14, rateInrPerKwh: 8.9 },
  { id: "normal2", label: "Normal", fromHour: 14, toHour: 18, rateInrPerKwh: 6.8 },
  { id: "peak2", label: "Peak", fromHour: 18, toHour: 22, rateInrPerKwh: 8.9 },
];

export function topConsumersFixture(): ConsumerRow[] {
  const raw = [
    { assetId: "kiln_1", label: "Kiln 1", kwh: 412_000, health: "hot" as const },
    { assetId: "cm_1", label: "Cement Mill 1", kwh: 268_000, health: "watch" as const },
    { assetId: "mill_2", label: "Mill 2", kwh: 191_000, health: "calm" as const },
    { assetId: "comp_2", label: "Compressor 2", kwh: 84_000, health: "calm" as const },
    { assetId: "pack_1", label: "Packing", kwh: 61_000, health: "calm" as const },
  ];
  const total = raw.reduce((s, r) => s + r.kwh, 0);
  return raw.map((r) => ({
    ...r,
    sharePct: Math.round((r.kwh / total) * 1000) / 10,
  }));
}

/** Downsampled series for analytics route islands (not full 43k on every module). */
export function energyTrendPoints(seed = 7): Point[] {
  return buildMinuteSeries(10_080, seed); // 7-day minute
}

export function bandForHour(hour: number, bands: readonly TodBand[] = TOD_BANDS_RJ): TodBand {
  for (const b of bands) {
    if (b.fromHour < b.toHour) {
      if (hour >= b.fromHour && hour < b.toHour) return b;
    } else {
      // wraps midnight
      if (hour >= b.fromHour || hour < b.toHour) return b;
    }
  }
  return bands[0]!;
}

export function mdHeadroomPct(peakMdKva: number, cmdKva: number): number {
  if (cmdKva <= 0) return 0;
  return Math.round(((cmdKva - peakMdKva) / cmdKva) * 1000) / 10;
}

/**
 * Intensity / emissions snapshot — never invent Scope 1 or missing factors.
 */
export function intensitySnapshot(input: {
  productionUnits?: number | null;
  gridKwh?: number | null;
  renewableKwh?: number | null;
  emissionFactorTPerMwh?: number | null;
  emissionFactorRef?: string | null;
  cmdKva: number;
  peakMdKva: number;
}): IntensitySnapshot {
  const missing: string[] = [];
  if (input.productionUnits == null || input.productionUnits <= 0) {
    missing.push("production_units");
  }
  if (input.gridKwh == null) missing.push("grid_kwh");
  if (input.renewableKwh == null) missing.push("renewable_kwh");
  if (input.emissionFactorTPerMwh == null) missing.push("emission_factor");

  const grid = input.gridKwh ?? 0;
  const ren = input.renewableKwh ?? 0;
  const total = grid + ren;

  const sec =
    input.productionUnits && input.productionUnits > 0 && input.gridKwh != null
      ? Math.round((input.gridKwh / input.productionUnits) * 100) / 100
      : null;

  const renewablePct =
    input.gridKwh != null && input.renewableKwh != null && total > 0
      ? Math.round((ren / total) * 1000) / 10
      : null;

  const scope2 =
    input.gridKwh != null && input.emissionFactorTPerMwh != null
      ? Math.round((input.gridKwh / 1000) * input.emissionFactorTPerMwh * 1000) / 1000
      : null;

  return {
    secKwhPerUnit: sec,
    renewablePct,
    scope2Tco2e: scope2,
    scope1Tco2e: null,
    missing: [
      ...missing,
      "scope1_activity_data", // always explicit — Stamped does not invent Scope 1
    ].filter((v, i, a) => a.indexOf(v) === i),
    emissionFactorRef: input.emissionFactorRef ?? null,
    cmdKva: input.cmdKva,
    peakMdKva: input.peakMdKva,
  };
}

export function missingLabel(field: string): string {
  return `${field}: not_measured_by_stamped`;
}
