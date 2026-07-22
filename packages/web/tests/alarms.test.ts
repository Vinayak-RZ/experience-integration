import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alarmsFixture } from "../src/fixtures/demo.js";
import {
  actionsForState,
  applyAlarmAction,
  moveSelection,
  sortAlarms,
} from "../src/lib/alarms.js";

describe("EMS alarm helpers", () => {
  it("sorts critical before warning and older first within severity", () => {
    const sorted = sortAlarms(alarmsFixture.filter((a) => a.state !== "cleared"));
    assert.equal(sorted[0]?.severity, "critical");
    assert.equal(sorted[0]?.id, "alm_1001");
    assert.equal(sorted[1]?.severity, "critical");
    assert.equal(sorted[1]?.id, "alm_1005");
    assert.equal(sorted[2]?.severity, "warning");
  });

  it("applies lifecycle actions and keyboard selection moves", () => {
    const raised = alarmsFixture.find((a) => a.id === "alm_1001")!;
    assert.ok(actionsForState(raised.state).includes("ack"));
    assert.equal(applyAlarmAction(raised, "ack").state, "acked");
    assert.equal(applyAlarmAction(raised, "silence").state, "silenced");
    assert.equal(moveSelection(0, 1, 3), 1);
    assert.equal(moveSelection(0, -1, 3), 0);
    assert.equal(moveSelection(2, 1, 3), 2);
  });
});
