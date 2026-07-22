import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  STATUS_LABELS,
  TOUCH_MIN_PX,
  DataTable,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  TextField,
  type StatusTone,
} from "../src/components/ui/primitives.js";

describe("accessible primitives", () => {
  it("exports touch target floor of 48px", () => {
    assert.equal(TOUCH_MIN_PX, 48);
  });

  it("maps every status tone to a visible text label", () => {
    const tones = Object.keys(STATUS_LABELS) as StatusTone[];
    assert.deepEqual(tones.sort(), ["critical", "good", "info", "neutral", "warning"].sort());
    for (const tone of tones) {
      const html = renderToStaticMarkup(createElement(StatusChip, { tone }));
      assert.match(html, new RegExp(STATUS_LABELS[tone]));
      assert.match(html, /role="status"/);
    }
  });

  it("renders primary/secondary/ghost buttons with 48px min height", () => {
    for (const Comp of [PrimaryButton, SecondaryButton, GhostButton]) {
      const html = renderToStaticMarkup(createElement(Comp, null, "Go"));
      assert.match(html, /min-height:\s*48px/);
      assert.match(html, /font-size:\s*16px/);
      assert.match(html, /font-weight:\s*700/);
    }
  });

  it("wires TextField label, describedby, and alert on error", () => {
    const html = renderToStaticMarkup(
      createElement(TextField, {
        label: "Email",
        hint: "Work inbox",
        error: "Required",
        name: "email",
      }),
    );
    assert.match(html, /Email/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /role="alert"/);
    assert.match(html, /Required/);
  });

  it("gives DataTable a caption and column headers", () => {
    const html = renderToStaticMarkup(
      createElement(DataTable, {
        caption: "Ledger rows",
        columns: [
          { key: "name", header: "Name" },
          { key: "inr", header: "₹", align: "right" as const },
        ],
        rows: [{ id: "1", name: "Chiller", inr: "₹12,000" }],
      }),
    );
    assert.match(html, /<caption/);
    assert.match(html, /Ledger rows/);
    assert.match(html, /scope="col"/);
    assert.match(html, /Chiller/);
  });
});
