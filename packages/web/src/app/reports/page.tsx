import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
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

export default function ReportsPage() {
  return (
    <AppShell
      active="reports"
      plantName={DEMO_PLANT.plantName}
      role="plant_head"
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={[
        `Ops-confirmed MTD ${formatInr(demoOpsConfirmedInr())}`,
        "Approval-gated packs",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Exports" title="Reports & ledger" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
