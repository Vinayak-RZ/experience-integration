"use client";

import Link from "next/link";
import type { TodaySignal } from "@/lib/types";
import type { RouteStateModel } from "@/lib/route-state";
import { Gauge } from "@/components/charts/Gauge";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { RouteStateView } from "@/components/states/RouteStateView";
import { TODAY_SIGNAL_CAP } from "@/lib/today-signals";

export function TodayBoard({
  signals,
  closurePct,
  state = { kind: "default" },
  onRetry,
}: {
  signals: TodaySignal[];
  closurePct: number;
  state?: RouteStateModel;
  onRetry?: () => void;
}) {
  const capped = signals.slice(0, TODAY_SIGNAL_CAP);

  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div
        data-today-board
        data-signal-count={capped.length}
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div
          role="list"
          aria-label="Decision signals"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {capped.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              role="listitem"
              style={{ display: "block" }}
              data-signal-id={s.id}
            >
              <Panel style={{ padding: 16, height: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {s.label}
                  </p>
                  <StatusChip tone={s.tone === "good" ? "good" : s.tone} />
                </div>
                <p
                  className="tabular"
                  style={{
                    margin: "10px 0 4px",
                    fontFamily: "var(--forge-font-display)",
                    fontWeight: 800,
                    fontSize: 26,
                  }}
                >
                  {s.value}
                </p>
                {s.hint ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {s.hint}
                  </p>
                ) : null}
              </Panel>
            </Link>
          ))}
        </div>

        <Panel style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <Gauge label="Closure rate" value={closurePct} valueText={`${closurePct}%`} />
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 18 }}>
              Closure health
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "var(--forge-on-surface-variant)",
              }}
            >
              Target ≥60% high-priority Rx acted in a billing cycle. Open Alarms and Prescriptions
              to clear the queue.
            </p>
          </div>
        </Panel>
      </div>
    </RouteStateView>
  );
}
