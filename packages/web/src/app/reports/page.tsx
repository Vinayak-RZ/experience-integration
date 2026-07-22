import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { ExportHub } from "@/components/reports/ExportHub";
import {
  DEMO_PLANT,
  connectionFixture,
  ledgerFixture,
  prescriptionsFixture,
} from "@/fixtures/demo";

export default function ReportsPage() {
  return (
    <AppShell
      active="reports"
      plantName={DEMO_PLANT.plantName}
      role="plant_head"
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={["Ops-confirmed ledger", "CSV export centre"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Exports" title="Savings ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ExportHub ledger={ledgerFixture} prescriptions={prescriptionsFixture} />
        <SavingsLedger rows={ledgerFixture} />
      </div>
    </AppShell>
  );
}
