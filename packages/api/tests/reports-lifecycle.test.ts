import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_REPORT_ATTEMPTS,
  canTransition,
  nextAttemptDisposition,
  reportDedupeKey,
  transitionReport,
} from "../src/reports/lifecycle.js";
import {
  FIXTURE_SUSTAINABILITY,
  buildBrsrPatRows,
  renderSustainabilityHtml,
} from "../src/reports/sustainability.js";

describe("report lifecycle", () => {
  it("moves queued → running → ready → pending_approval → approved", () => {
    let s = transitionReport("queued", "start");
    assert.equal(s, "running");
    s = transitionReport(s, "succeed");
    assert.equal(s, "ready");
    s = transitionReport(s, "submit_for_approval");
    assert.equal(s, "pending_approval");
    s = transitionReport(s, "approve");
    assert.equal(s, "approved");
    assert.equal(canTransition("approved", "approve"), false);
  });

  it("dead-letters after max attempts", () => {
    assert.equal(nextAttemptDisposition(MAX_REPORT_ATTEMPTS - 1), "dead_letter");
    assert.equal(nextAttemptDisposition(0), "fail");
  });

  it("builds stable dedupe keys", () => {
    const a = reportDedupeKey({
      orgId: "o",
      plantId: "p",
      kind: "sustainability_monthly",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
    });
    const b = reportDedupeKey({
      orgId: "o",
      plantId: "p",
      kind: "sustainability_monthly",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
    });
    assert.equal(a, b);
  });
});

describe("sustainability template and BRSR", () => {
  it("keeps Scope 1 and SEC explicit when production missing", () => {
    const rows = buildBrsrPatRows(FIXTURE_SUSTAINABILITY);
    const scope1 = rows.find((r) => r.metric.startsWith("Scope 1"))!;
    const sec = rows.find((r) => r.metric === "SEC")!;
    assert.equal(scope1.value, "not_measured_by_stamped");
    assert.equal(sec.value, "not_measured_by_stamped");
    assert.ok(rows.some((r) => r.metric.includes("Ops-confirmed")));
  });

  it("renders print-safe HTML without scripts or hidden blocks", () => {
    const html = renderSustainabilityHtml(FIXTURE_SUSTAINABILITY);
    assert.match(html, /Monthly sustainability pack/);
    assert.match(html, /BRSR \/ PAT/);
    assert.match(html, /not_measured_by_stamped/);
    assert.doesNotMatch(html, /<script/i);
    assert.match(html, /@media print/);
    assert.match(html, /<caption>/);
  });
});
