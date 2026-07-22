import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIXTURE_LEDGER_CSV,
  FIXTURE_RX_AUDIT_CSV,
  escapeCsvCell,
  ledgerRowsToCsv,
  prescriptionAuditRowsToCsv,
} from "../src/exports/csv.js";

describe("safe CSV exports", () => {
  it("neutralizes spreadsheet formula prefixes", () => {
    assert.equal(escapeCsvCell("=1+1"), `"'=1+1"`);
    assert.equal(escapeCsvCell("+Profit"), `"'+Profit"`);
    assert.equal(escapeCsvCell("-1+2"), `"'-1+2"`);
    assert.equal(escapeCsvCell("@SUM(A1)"), `"'@SUM(A1)"`);
    assert.equal(escapeCsvCell("plain"), "plain");
    assert.equal(escapeCsvCell('say "hi"'), `"say ""hi"""`);
  });

  it("keeps ledger columns stable with timezone and units in headers", () => {
    const csv = ledgerRowsToCsv(FIXTURE_LEDGER_CSV);
    assert.match(csv, /^entry_id,plant_id,prescription_id/);
    assert.match(csv, /potential_inr/);
    assert.match(csv, /timezone/);
    assert.match(csv, /Asia\/Kolkata/);
    assert.match(csv, /"'=CMD\|' \/C calc'!A0"/);
    assert.match(csv, /ops_confirmed/);
    assert.match(csv, /not_measured_by_stamped/);
  });

  it("exports prescription audit with formula-safe titles", () => {
    const csv = prescriptionAuditRowsToCsv(FIXTURE_RX_AUDIT_CSV);
    assert.match(csv, /^prescription_id,plant_id,title/);
    assert.match(csv, /impact_inr_per_month/);
    assert.match(csv, /"'\+Profit share"/);
    assert.match(csv, /Asia\/Kolkata/);
  });
});
