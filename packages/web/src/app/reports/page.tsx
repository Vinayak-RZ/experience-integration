import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel } from "@/components/ui/primitives";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { ExportCentre } from "@/components/reports/ExportCentre";
import {
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  demoOpsConfirmedInr,
  ledgerFixture,
  prescriptionsFixture,
  reportJobsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { sumPotentialInr } from "@/lib/ledger";

export default function ReportsPage() {
  const ops = demoOpsConfirmedInr();
  const potential = sumPotentialInr(ledgerFixture);

  return (
    <AppShell
      active="reports"
      plantName={DEMO_PLANT.plantName}
      role="plant_head"
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={[
        `Ops-confirmed MTD ${formatInr(ops)}`,
        "Approval-gated packs",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Value" title="Reports & ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="forge-kpi-strip">
          <Panel style={{ boxShadow: "var(--forge-shadow-hero)" }}>
            <p className="forge-eyebrow">Ops-confirmed MTD</p>
            <p className="forge-num-display tabular">{formatInr(ops)}</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-warning)" }}>
              Not bill-verified
            </p>
          </Panel>
          <Panel>
            <p className="forge-eyebrow">Addressable potential</p>
            <p className="forge-num-display tabular">{formatInr(potential)}</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Open modeled + pending value
            </p>
          </Panel>
        </div>
        <ExportCentre
          ledger={ledgerFixture}
          prescriptions={prescriptionsFixture}
          initialReports={reportJobsFixture}
        />
        <SavingsLedger rows={ledgerFixture} />
      </div>
    </AppShell>
  );
}
