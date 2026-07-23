import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLiveTelemetryBaseline, tickLiveTelemetry } from "../src/lib/live-telemetry.js";

describe("live telemetry demo tick", () => {
  it("jitters loads and sync age on each poll", () => {
    const base = createLiveTelemetryBaseline();
    const next = tickLiveTelemetry(base);
    assert.equal(next.tick, 1);
    assert.equal(next.syncAgeSec, 1);
    assert.notDeepEqual(next.dials, base.dials);
    assert.ok(next.dials.some((d, i) => d.load !== base.dials[i]?.load));
  });

  it("resets sync age after 15 seconds like stamped topbar", () => {
    let snap = createLiveTelemetryBaseline();
    for (let i = 0; i < 16; i += 1) snap = tickLiveTelemetry(snap);
    assert.equal(snap.syncAgeSec, 0);
  });
});
