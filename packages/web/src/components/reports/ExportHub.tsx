"use client";

import type { LedgerEntry, Prescription } from "@/lib/types";
import { downloadTextFile, toCsv } from "@/lib/csv-download";
import { GhostButton, Panel, SecondaryButton } from "@/components/ui/primitives";
import { sanitizeClaimStatus } from "@/lib/ledger";

function ledgerCsv(rows: readonly LedgerEntry[]): string {
  return toCsv(
    [
      "entry_id",
      "plant_id",
      "prescription_id",
      "entry_type",
      "period_start_ist",
      "period_end_ist",
      "potential_inr",
      "realised_inr",
      "verification_status",
      "mv_method",
      "baseline_id",
      "emission_factor_ref",
      "timezone",
    ],
    rows.map((r) => [
      r.entryId,
      r.plantId,
      r.prescriptionId,
      r.entryType,
      r.periodStart,
      r.periodEnd,
      r.potentialInr,
      r.realisedInr,
      sanitizeClaimStatus(r),
      r.mvMethod,
      r.baselineId,
      r.emissionFactorRef ?? "not_measured_by_stamped",
      "Asia/Kolkata",
    ]),
  );
}

function prescriptionAuditCsv(rows: readonly Prescription[]): string {
  return toCsv(
    [
      "prescription_id",
      "plant_id",
      "title",
      "lane",
      "impact_inr_per_month",
      "confidence",
      "owner_role",
      "due_at_ist",
      "verification_status",
      "realised_inr",
      "timezone",
    ],
    rows.map((r) => [
      r.id,
      r.plantId,
      r.title,
      r.lane,
      r.impactInrPerMonth,
      r.confidence,
      r.ownerRole,
      r.dueAt,
      r.verificationStatus ?? "",
      r.realisedInr ?? "",
      "Asia/Kolkata",
    ]),
  );
}

export function ExportHub({
  ledger,
  prescriptions,
}: {
  ledger: LedgerEntry[];
  prescriptions: Prescription[];
}) {
  return (
    <Panel data-export-hub>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--forge-font-display)",
          fontSize: 16,
        }}
      >
        Export centre (P0)
      </h2>
      <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
        Stable columns, IST timestamps, formula-injection defense. CSV values that
        start with = + - @ are prefixed for spreadsheet safety.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <SecondaryButton
          onClick={() =>
            downloadTextFile("ledger_jaipur.csv", ledgerCsv(ledger))
          }
        >
          Download ledger CSV
        </SecondaryButton>
        <GhostButton
          onClick={() =>
            downloadTextFile(
              "prescription_audit_jaipur.csv",
              prescriptionAuditCsv(prescriptions),
            )
          }
        >
          Download prescription audit CSV
        </GhostButton>
      </div>
    </Panel>
  );
}
