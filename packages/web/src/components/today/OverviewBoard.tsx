"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Alarm, Prescription, TodaySignal } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { ForgeChart } from "@/components/charts/ForgeChart";
import { Gauge } from "@/components/charts/Gauge";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { RouteStateView } from "@/components/states/RouteStateView";
import type { RouteStateModel } from "@/lib/route-state";
import { TODAY_SIGNAL_CAP } from "@/lib/today-signals";

function demoTrendPoints() {
  const start = Date.parse("2026-06-21T00:00:00+05:30");
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const t = start + i * 86400000;
    const baseline = 9200 + Math.sin(i / 4) * 400;
    const actual = baseline - 180 - (i % 7 === 0 ? 220 : 40) + (i % 5) * 15;
    pts.push({ t, v: Math.round(actual) });
  }
  return pts;
}

export function OverviewBoard({
  signals,
  closurePct,
  alarms,
  prescriptions,
  assets,
  state = { kind: "default" },
  onRetry,
}: {
  signals: TodaySignal[];
  closurePct: number;
  alarms: Alarm[];
  prescriptions: Prescription[];
  assets: DemoAsset[];
  state?: RouteStateModel;
  onRetry?: () => void;
}) {
  const [metric, setMetric] = useState<"kWh" | "Cost" | "CO2">("kWh");
  const capped = signals.slice(0, TODAY_SIGNAL_CAP);
  const points = useMemo(() => demoTrendPoints(), []);
  const openAlarms = alarms.filter((a) => a.state !== "cleared").slice(0, 5);
  const topRx = prescriptions
    .filter((p) => p.lane === "needs_review" || p.lane === "active")
    .slice(0, 4);

  const healthTone = (h: DemoAsset["health"]) =>
    h === "hot" ? "critical" : h === "watch" ? "warning" : "good";

  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div data-today-board data-overview-board data-signal-count={capped.length} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="forge-kpi-strip" role="list" aria-label="Decision signals">
          {capped.map((s, i) => (
            <Link key={s.id} href={s.href} role="listitem" data-signal-id={s.id} style={{ display: "block" }}>
              <Panel
                style={{
                  padding: 16,
                  height: "100%",
                  boxShadow: i === 0 ? "var(--forge-shadow-hero)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <p className="forge-eyebrow">{s.label}</p>
                  <StatusChip tone={s.tone === "good" ? "good" : s.tone} />
                </div>
                <p className="forge-num-display tabular" style={{ marginTop: 10, fontSize: 26 }}>
                  {s.value}
                </p>
                {s.hint ? (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    {s.hint}
                  </p>
                ) : null}
              </Panel>
            </Link>
          ))}
        </div>

        <div className="forge-grid-60-40">
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p className="forge-eyebrow">30-day trend</p>
                <h3 className="forge-card-title">Energy vs Stamped baseline</h3>
              </div>
              <div className="forge-tabs" role="tablist" aria-label="Trend metric">
                {(["kWh", "Cost", "CO2"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    className="forge-tabs__btn"
                    aria-selected={metric === m}
                    onClick={() => setMetric(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <ForgeChart
                title={`${metric} actual`}
                seriesName="Actual"
                points={points}
                unit={metric === "kWh" ? "kWh" : metric === "Cost" ? "₹" : "kg"}
                height={260}
              />
            </div>
          </Panel>

          <Panel>
            <p className="forge-eyebrow">Machine health</p>
            <h3 className="forge-card-title">Plant equipment status</h3>
            <p style={{ margin: "4px 0 12px", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Monitoring {assets.length} assets
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 8,
              }}
            >
              {assets.map((a) => (
                <div key={a.id} className="forge-asset-cell">
                  <p className="forge-asset-cell__name">{a.label}</p>
                  <StatusChip tone={healthTone(a.health)}>{a.loadPct}%</StatusChip>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="forge-grid-40-60">
          <Panel>
            <p className="forge-eyebrow">Action intelligence</p>
            <h3 className="forge-card-title">AI Prescriptions</h3>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 10 }}>
              {topRx.map((rx) => (
                <li key={rx.id}>
                  <Link
                    href={`/prescriptions/${rx.id}`}
                    style={{
                      display: "block",
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid var(--forge-outline-variant)",
                      background: "var(--forge-surface-container-low)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{rx.title}</strong>
                      <span className="tabular" style={{ fontWeight: 800, fontSize: 13 }}>
                        {formatInr(rx.impactInrPerMonth)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/prescriptions" style={{ display: "inline-block", marginTop: 12, fontWeight: 700, color: "var(--forge-primary)" }}>
              Open queue →
            </Link>
          </Panel>

          <Panel style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p className="forge-eyebrow">Attention</p>
              <h3 className="forge-card-title">Open alarms</h3>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8 }}>
                {openAlarms.map((a) => (
                  <li key={a.id} style={{ fontSize: 13 }}>
                    <Link href="/alarms" style={{ fontWeight: 600 }}>
                      {a.assetLabel}
                    </Link>
                    <span style={{ color: "var(--forge-on-surface-variant)" }}> — {a.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Gauge label="Closure rate" value={closurePct} valueText={`${closurePct}%`} />
          </Panel>
        </div>
      </div>
    </RouteStateView>
  );
}
