import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alarmsFixture,
  DEMO_PLANT,
  prescriptionsFixture,
} from "../src/fixtures/demo.js";
import {
  buildEvidencePack,
  evidenceRouteState,
  resolveEvidenceScope,
} from "../src/lib/evidence.js";

describe("evidence scope and honesty", () => {
  it("pre-scopes from alarm and related prescription", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarmId: "alm_1001",
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    assert.equal(scope.assetId, "kiln_1");
    assert.equal(scope.alarmId, "alm_1001");
    assert.equal(scope.rxId, "rx_9001");
  });

  it("pre-scopes from prescription id alone", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      rxId: "rx_9002",
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    assert.equal(scope.rxId, "rx_9002");
    assert.match(scope.title, /APFC/);
  });

  it("keeps baseline missing when gated — never invents band", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    const pack = buildEvidencePack(scope, { baselineAvailable: false });
    assert.deepEqual(pack.missing, ["baseline"]);
    assert.equal(evidenceRouteState(pack).kind, "partial");
    assert.ok(pack.lineage.ruleId);
    assert.ok(pack.lineage.tariffId);
    assert.ok(!pack.lineage.sources.includes("L2 baseline"));
  });

  it("includes baseline source only when available", () => {
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    const pack = buildEvidencePack(scope, { baselineAvailable: true });
    assert.deepEqual(pack.missing, []);
    assert.equal(evidenceRouteState(pack).kind, "default");
    assert.ok(pack.lineage.sources.includes("L2 baseline"));
  });
});
