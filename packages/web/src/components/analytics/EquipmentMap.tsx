"use client";

import { LoadDial } from "@/components/charts/LoadDial";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { topConsumersFixture } from "@/lib/analytics";

const LOAD: Record<string, number> = {
  kiln_1: 108,
  cm_1: 86,
  mill_2: 72,
  comp_2: 54,
  pack_1: 41,
};

/** Calm health map — colour + label; not a noisy heatmap. */
export function EquipmentMap() {
  const rows = topConsumersFixture();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-equipment>
      <Panel style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {rows.slice(0, 3).map((r) => (
          <LoadDial key={r.assetId} loadPct={LOAD[r.assetId] ?? 50} label={r.label} />
        ))}
      </Panel>

      <Panel>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--forge-font-display)",
            fontSize: 16,
          }}
        >
          Asset health
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {rows.map((r) => (
            <div
              key={r.assetId}
              style={{
                padding: 14,
                borderRadius: "var(--forge-radius-md)",
                background:
                  r.health === "hot"
                    ? "rgba(186, 26, 26, 0.08)"
                    : r.health === "watch"
                      ? "rgba(201, 122, 0, 0.08)"
                      : "rgba(27, 107, 58, 0.08)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{r.label}</p>
              <p
                className="tabular"
                style={{ margin: "6px 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}
              >
                Load {LOAD[r.assetId] ?? "—"}%
              </p>
              <StatusChip
                tone={r.health === "hot" ? "critical" : r.health === "watch" ? "warning" : "good"}
              >
                {r.health === "calm" ? "Calm" : r.health === "watch" ? "Watch" : "Hot"}
              </StatusChip>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
