"use client";

import { useEffect, useRef } from "react";
import type { ECharts } from "echarts/core";
import { Panel } from "@/components/ui/primitives";
import { OVERVIEW_SECTION_BREAKDOWN, OVERVIEW_TARIFF } from "@/fixtures/overview-demo";
import { formatIndianNum, formatInr } from "@/lib/format";
import { FORGE_ECHARTS_THEME, FORGE_ECHARTS_THEME_NAME } from "@/components/charts/forgeTheme";

const total = OVERVIEW_SECTION_BREAKDOWN.reduce((s, d) => s + d.kwh, 0);

export function SectionDonut() {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      const echarts = await import("echarts/core");
      const { PieChart } = await import("echarts/charts");
      const { TooltipComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([PieChart, TooltipComponent, CanvasRenderer]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

      if (disposed || !hostRef.current) return;
      if (!chartRef.current) {
        chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, { renderer: "canvas" });
        ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(hostRef.current);
      }

      chartRef.current.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: "#051f13",
          borderColor: "transparent",
          textStyle: { color: "#fff", fontSize: 12 },
          formatter: (p: { name: string; value: number; percent: number }) => {
            const d = OVERVIEW_SECTION_BREAKDOWN.find((x) => x.name === p.name);
            if (!d) return p.name;
            return [
              `<strong>${d.name}</strong>`,
              `Energy: ${formatIndianNum(d.kwh)} kWh`,
              `Cost: ${formatInr(d.kwh * OVERVIEW_TARIFF)}`,
              `Share: ${p.percent.toFixed(1)}%`,
            ].join("<br/>");
          },
        },
        series: [
          {
            type: "pie",
            radius: ["48%", "72%"],
            padAngle: 2,
            label: { show: false },
            data: OVERVIEW_SECTION_BREAKDOWN.map((d) => ({
              name: d.name,
              value: d.kwh,
              itemStyle: { color: d.color },
            })),
          },
        ],
      });
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <Panel style={{ padding: 20, display: "flex", flexDirection: "column" }}>
      <p className="forge-eyebrow">Load Distribution</p>
      <h3 className="forge-card-title">Energy by Plant Section</h3>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flex: 1, flexWrap: "wrap" }}>
        <div style={{ width: 150, height: 170, position: "relative" }}>
          <div ref={hostRef} style={{ width: "100%", height: "100%" }} aria-hidden />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span className="tabular" style={{ fontFamily: "var(--forge-font-display)", fontWeight: 800, fontSize: 18 }}>
              {(total / 1000).toFixed(0)}k
            </span>
            <span style={{ fontSize: 9.5, color: "var(--forge-on-surface-variant)" }}>kWh total</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 120, display: "flex", flexDirection: "column", gap: 7 }}>
          {OVERVIEW_SECTION_BREAKDOWN.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{d.name}</span>
              <span className="tabular" style={{ fontWeight: 600, color: "var(--forge-on-surface-variant)" }}>
                {((d.kwh / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
