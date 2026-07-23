"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { Panel } from "@/components/ui/primitives";
import {
  OVERVIEW_CHART_ANNOTATIONS,
  OVERVIEW_TODAY_DAY,
  OVERVIEW_TREND_30D,
  OVERVIEW_TREND_STATS,
} from "@/fixtures/overview-demo";
import { formatInr, formatIndianNum } from "@/lib/format";
import {
  FORGE_ECHARTS_THEME,
  FORGE_ECHARTS_THEME_NAME,
} from "@/components/charts/forgeTheme";

type TabId = "kwh" | "cost" | "co2";

const TABS: { id: TabId; label: string }[] = [
  { id: "kwh", label: "kWh" },
  { id: "cost", label: "₹ Cost" },
  { id: "co2", label: "CO₂" },
];

const CONFIG: Record<
  TabId,
  { actual: keyof (typeof OVERVIEW_TREND_30D)[0]; saved: keyof (typeof OVERVIEW_TREND_30D)[0]; baseline: keyof (typeof OVERVIEW_TREND_30D)[0]; unit: string; fmt: (v: number) => string }
> = {
  kwh: {
    actual: "actual",
    saved: "savedKwh",
    baseline: "baseline",
    unit: "kWh",
    fmt: (v) => `${formatIndianNum(v)} kWh`,
  },
  cost: {
    actual: "costActual",
    saved: "savings",
    baseline: "costBaseline",
    unit: "₹",
    fmt: (v) => formatInr(v),
  },
  co2: {
    actual: "co2Actual",
    saved: "savedKwh",
    baseline: "co2Baseline",
    unit: "tCO₂e",
    fmt: (v) => `${v.toFixed(1)} t`,
  },
};

function toOption(tab: TabId): EChartsCoreOption {
  const cfg = CONFIG[tab];
  const days = OVERVIEW_TREND_30D.map((d) => `Jul ${d.day}`);

  return {
    animation: true,
    grid: { left: 52, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#051f13",
      borderColor: "transparent",
      textStyle: { color: "#fff", fontSize: 12 },
      formatter: (params: unknown) => {
        const rows = Array.isArray(params) ? params : [params];
        const idx = (rows[0] as { dataIndex?: number })?.dataIndex ?? 0;
        const d = OVERVIEW_TREND_30D[idx];
        if (!d) return "";
        const saved = tab === "co2" ? d.co2Baseline - d.co2Actual : Number(d[cfg.saved as keyof typeof d]);
        return [
          `<strong>${d.date}</strong>`,
          `Actual: ${cfg.fmt(Number(d[cfg.actual]))}`,
          `Baseline: ${cfg.fmt(Number(d[cfg.baseline]))}`,
          `<span style="color:#7fe3a3">Saved: ${tab === "cost" ? formatInr(Number(saved)) : cfg.fmt(Number(saved))}</span>`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: days,
      axisLabel: {
        fontSize: 11,
        color: "var(--forge-on-surface-variant)",
        formatter: (_: string, i: number) => (OVERVIEW_TREND_30D[i]?.day ?? 0) % 3 === 1 ? `Jul ${OVERVIEW_TREND_30D[i]?.day}` : "",
      },
      axisLine: { lineStyle: { color: "var(--forge-outline-variant)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
        color: "var(--forge-on-surface-variant)",
        formatter: (v: number) =>
          tab === "cost" ? `₹${Math.round(v / 1000)}k` : tab === "kwh" ? `${Math.round(v / 1000)}k` : v.toFixed(1),
      },
      splitLine: { lineStyle: { color: "var(--forge-outline-variant)", opacity: 0.4 } },
    },
    series: [
      {
        name: "Actual",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#f75440", width: 2.4 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(247,84,64,0.18)" },
              { offset: 1, color: "rgba(247,84,64,0.04)" },
            ],
          },
        },
        data: OVERVIEW_TREND_30D.map((d) => Number(d[cfg.actual])),
      },
      {
        name: "Saved",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 0 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0,102,107,0.16)" },
              { offset: 1, color: "rgba(0,102,107,0.05)" },
            ],
          },
        },
        data: OVERVIEW_TREND_30D.map((d) =>
          tab === "co2" ? d.co2Baseline - d.co2Actual : Number(d[cfg.saved as keyof typeof d]),
        ),
      },
      {
        name: "Baseline",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "var(--forge-outline)", width: 1.6, type: "dashed" },
        data: OVERVIEW_TREND_30D.map((d) => Number(d[cfg.baseline])),
      },
    ],
    markLine: {
      silent: true,
      symbol: "none",
      data: [
        { xAxis: OVERVIEW_TODAY_DAY - 1, lineStyle: { color: "#f75440", width: 2 }, label: { formatter: "NOW", color: "#f75440", fontSize: 10 } },
        ...OVERVIEW_CHART_ANNOTATIONS.map((a) => ({
          xAxis: a.day - 1,
          lineStyle: { color: "#f75440", type: "dashed" as const, opacity: 0.6 },
        })),
      ],
    },
  };
}

export function EnergyTrendPanel() {
  const [tab, setTab] = useState<TabId>("kwh");
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const option = useMemo(() => toOption(tab), [tab]);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;

    async function mount() {
      if (!hostRef.current) return;
      const echarts = await import("echarts/core");
      const { LineChart } = await import("echarts/charts");
      const { GridComponent, TooltipComponent, MarkLineComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);
      echarts.registerTheme(FORGE_ECHARTS_THEME_NAME, FORGE_ECHARTS_THEME);

      if (disposed || !hostRef.current) return;
      if (!chartRef.current) {
        chartRef.current = echarts.init(hostRef.current, FORGE_ECHARTS_THEME_NAME, { renderer: "canvas" });
        ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(hostRef.current);
      }
      chartRef.current.setOption(option, true);
    }

    void mount();
    return () => {
      disposed = true;
      ro?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return (
    <Panel style={{ padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="forge-eyebrow">30-Day Trend</p>
          <h3 className="forge-card-title">Energy Consumption vs Stamped Baseline</h3>
        </div>
        <div className="forge-tabs" role="tablist" aria-label="Trend metric">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="forge-tabs__btn"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 11, color: "var(--forge-on-surface-variant)", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 0, borderTop: "2px dashed var(--forge-outline)" }} /> Without Stamped Baseline
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 3, background: "var(--forge-primary)", borderRadius: 2 }} /> Actual Consumption
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "rgba(0,102,107,0.18)", borderRadius: 2 }} /> Savings Zone
        </span>
      </div>

      <div
        ref={hostRef}
        role="img"
        aria-label="Area chart comparing actual energy consumption against Stamped baseline over 30 days"
        style={{ height: 300, marginTop: 12, width: "100%" }}
      />

      <div style={{ display: "flex", gap: 16, fontSize: 10.5, color: "var(--forge-on-surface-variant)", marginTop: 4, flexWrap: "wrap" }}>
        {OVERVIEW_CHART_ANNOTATIONS.map((a) => (
          <span key={a.day}>
            <span style={{ color: "var(--forge-primary)" }}>Jul {a.day}</span> · {a.label}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--forge-outline-variant)",
          flexWrap: "wrap",
        }}
      >
        {[
          ["Avg daily saving", OVERVIEW_TREND_STATS.avgDailySaving],
          ["Peak excess", OVERVIEW_TREND_STATS.peakExcess],
          ["Best day", OVERVIEW_TREND_STATS.bestDay],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              flex: 1,
              minWidth: 140,
              paddingLeft: i ? 16 : 0,
              borderLeft: i ? "1px solid var(--forge-outline-variant)" : "none",
            }}
          >
            <div style={{ fontSize: 10.5, color: "var(--forge-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {k}
            </div>
            <div style={{ fontFamily: "var(--forge-font-display)", fontWeight: 700, fontSize: 15, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
