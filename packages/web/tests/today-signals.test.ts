import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import { TodayBoard } from "../src/components/today/TodayBoard.js";
import { todaySignalsFixture } from "../src/fixtures/demo.js";
import { resolveRouteState } from "../src/lib/route-state.js";
import {
  TODAY_SIGNAL_CAP,
  selectTodaySignals,
} from "../src/lib/today-signals.js";

describe("Today decision signals", () => {
  it("never exceeds seven signals for any role", () => {
    const bloated = [
      ...todaySignalsFixture,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `extra_${i}`,
        label: `Extra ${i}`,
        value: String(i),
        tone: "neutral" as const,
        href: "/alarms",
      })),
    ];
    for (const role of [
      "operator",
      "supervisor",
      "plant_head",
      "energy_manager",
      "sustainability",
      "cfo",
      "admin",
    ] as const) {
      const selected = selectTodaySignals(role, bloated);
      assert.ok(selected.length <= TODAY_SIGNAL_CAP, role);
      assert.ok(selected.length > 0, role);
    }
  });

  it("prioritises ops-confirmed savings for plant_head and hides alarms from cfo", () => {
    const head = selectTodaySignals("plant_head", todaySignalsFixture);
    assert.equal(head[0]?.id, "savings");
    const cfo = selectTodaySignals("cfo", todaySignalsFixture);
    assert.equal(
      cfo.some((s) => s.id === "alarms" || s.href.startsWith("/alarms")),
      false,
    );
    assert.ok(cfo.some((s) => s.id === "savings"));
  });

  it("renders loading and stale route states", () => {
    const loading = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: todaySignalsFixture,
        closurePct: 64,
        state: resolveRouteState({ loading: true }),
      }),
    );
    assert.match(loading, /aria-busy/);
    assert.equal(loading.includes("data-today-board"), false);

    const stale = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: selectTodaySignals("plant_head", todaySignalsFixture),
        closurePct: 64,
        state: resolveRouteState({ stale: true }),
      }),
    );
    assert.match(stale, /last known data/i);
    assert.match(stale, /data-today-board/);
    assert.match(stale, /data-signal-count="7"/);
  });

  it("renders partial missing slices without inventing signals", () => {
    const html = renderToStaticMarkup(
      createElement(TodayBoard, {
        signals: selectTodaySignals("operator", todaySignalsFixture),
        closurePct: 50,
        state: resolveRouteState({ missing: ["ledger"] }),
      }),
    );
    assert.match(html, /ledger/);
    assert.match(html, /data-today-board/);
  });
});
