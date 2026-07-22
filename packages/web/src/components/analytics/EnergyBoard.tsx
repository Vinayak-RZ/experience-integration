"use client";

import { useMemo } from "react";
import { ForgeChart } from "@/components/charts/ForgeChart";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { DEMO_PLANT, energyKpisFixture } from "@/fixtures/demo";
import { energyTrendPoints, topConsumersFixture } from "@/lib/analytics";
import { formatIndianNum, formatInr } from "@/lib/format";

export function EnergyBoard() {
  const points = useMemo(() => energyTrendPoints(7), []);
  const consumers = topConsumersFixture();
  const k = energyKpisFixture;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-energy>
      <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Kpi label="MTD grid" value={`${formatIndianNum(k.mtdGridKwh)} kWh`} />
        <Kpi label="MTD renewable" value={`${formatIndianNum(k.mtdRenewableKwh)} kWh`} />
        <Kpi label="MTD cost" value={formatInr(k.mtdCostInr)} hint="Tariff blended" />
        <Kpi
          label="Vs baseline (7d)"
          value={`+${k.vsBaselinePct}%`}
          hint="Telemetry-only until L2 baselines"
        />
        <Kpi label="Avg PF" value={formatIndianNum(k.avgPf, 2)} />
        <Kpi label="Peak TOD share" value={`${k.todPeakSharePct}%`} />
      </Panel>

      <ForgeChart
        title={`${DEMO_PLANT.plantName} demand (7-day minute)`}
        seriesName="Demand"
        points={points}
        unit="kW"
        sampleBudget={480}
        height={260}
      />

      <Panel>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--forge-font-display)",
            fontSize: 16,
          }}
        >
          Top consumers (MTD)
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {consumers.map((c) => (
            <li
              key={c.assetId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                paddingBottom: 10,
                borderBottom: "1px solid var(--forge-outline-variant)",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{c.label}</p>
                <p
                  className="tabular"
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  {formatIndianNum(c.kwh)} kWh · {c.sharePct}%
                </p>
              </div>
              <StatusChip
                tone={c.health === "hot" ? "critical" : c.health === "watch" ? "warning" : "good"}
              >
                {c.health}
              </StatusChip>
            </li>
          ))}
        </ul>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          Baseline band omitted until L2 baseline reads are published — trend is telemetry-only.
        </p>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ minWidth: 120 }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>{label}</p>
      <p
        className="tabular"
        style={{
          margin: "4px 0 0",
          fontFamily: "var(--forge-font-display)",
          fontWeight: 800,
          fontSize: 22,
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
