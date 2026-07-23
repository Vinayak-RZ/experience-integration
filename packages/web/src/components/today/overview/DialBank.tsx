"use client";

import { LoadDial } from "@/components/charts/LoadDial";
import { Panel } from "@/components/ui/primitives";
import { OVERVIEW_DIALS } from "@/fixtures/overview-demo";

export function DialBank() {
  return (
    <Panel style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="forge-eyebrow">Live Instrumentation</p>
          <h3 className="forge-card-title">Critical Asset Load Dials</h3>
        </div>
        <span style={{ fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
          Modbus / OPC-UA · 1s poll
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
          marginTop: 12,
        }}
      >
        {OVERVIEW_DIALS.map((d) => (
          <div
            key={d.name}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
          >
            <LoadDial value={d.load} max={120} size={118} label="Load" />
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--forge-font-display)",
                marginTop: 2,
              }}
            >
              {d.name}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--forge-on-surface-variant)" }}>{d.sub}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
