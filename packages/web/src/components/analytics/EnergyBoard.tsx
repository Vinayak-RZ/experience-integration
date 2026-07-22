"use client";

import { useMemo } from "react";
import { ForgeChart } from "@/components/charts/ForgeChart";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { energyTrendPoints, topConsumersFixture } from "@/lib/analytics";
import { formatIndianNum } from "@/lib/format";

export function EnergyBoard() {
  const points = useMemo(() => energyTrendPoints(7), []);
  const consumers = topConsumersFixture();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-energy>
      <ForgeChart
        title="Plant demand (7-day minute)"
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
                  style={{ margin: "4px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}
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
