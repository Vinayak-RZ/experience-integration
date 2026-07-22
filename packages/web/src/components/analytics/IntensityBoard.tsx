"use client";

import { Panel, StatusChip } from "@/components/ui/primitives";
import { RouteStateView } from "@/components/states/RouteStateView";
import { intensitySnapshot, missingLabel } from "@/lib/analytics";
import { resolveRouteState } from "@/lib/route-state";
import { formatIndianNum } from "@/lib/format";

export function IntensityBoard() {
  // Fixture: production units unknown → honest partial SEC
  const snap = intensitySnapshot({
    productionUnits: null,
    gridKwh: 1_200_000,
    renewableKwh: 80_000,
    emissionFactorTPerMwh: 0.71,
    emissionFactorRef: "cea_grid_india_2024_v1",
    cmdKva: 5000,
    peakMdKva: 4680,
  });
  const state = resolveRouteState({ missing: snap.missing });

  return (
    <RouteStateView state={state}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-intensity>
        <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Metric
            label="SEC"
            value={
              snap.secKwhPerUnit != null
                ? `${formatIndianNum(snap.secKwhPerUnit, 2)} kWh/unit`
                : "—"
            }
            hint="Needs production units"
          />
          <Metric
            label="Renewable share"
            value={
              snap.renewablePct != null ? `${formatIndianNum(snap.renewablePct, 1)}%` : "—"
            }
          />
          <Metric
            label="Scope 2"
            value={
              snap.scope2Tco2e != null
                ? `${formatIndianNum(snap.scope2Tco2e, 1)} tCO₂e`
                : "—"
            }
            hint={snap.emissionFactorRef ?? undefined}
          />
          <Metric label="Scope 1" value="—" hint="not_measured_by_stamped" />
        </Panel>

        <Panel>
          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--forge-font-display)",
              fontSize: 16,
            }}
          >
            Disclosure
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {snap.missing.map((m) => (
              <li key={m}>{missingLabel(m)}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <StatusChip tone="warning">Never invent missing activity data</StatusChip>
          </div>
        </Panel>
      </div>
    </RouteStateView>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div style={{ minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>{label}</p>
      <p
        className="tabular"
        style={{
          margin: "4px 0 0",
          fontFamily: "var(--forge-font-display)",
          fontWeight: 800,
          fontSize: 24,
        }}
      >
        {value}
      </p>
      {hint ? (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
