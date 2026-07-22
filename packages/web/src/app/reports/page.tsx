import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { ExportCentre } from "@/components/reports/ExportCentre";
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
      contextSummary={["Export centre", "Approval-gated packs"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Exports" title="Reports & ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ExportCentre ledger={ledgerFixture} prescriptions={prescriptionsFixture} />
        <SavingsLedger rows={ledgerFixture} />
      </div>
    </AppShell>
  );
}
