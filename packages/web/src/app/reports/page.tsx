import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { DEMO_PLANT, connectionFixture, ledgerFixture } from "@/fixtures/demo";

export default function ReportsPage() {
  return (
    <AppShell
      active="reports"
      plantName={DEMO_PLANT.plantName}
      role="plant_head"
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={["Ops-confirmed ledger", "Claim-safe totals"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Exports" title="Savings ledger" />
      <SavingsLedger rows={ledgerFixture} />
    </AppShell>
  );
}
