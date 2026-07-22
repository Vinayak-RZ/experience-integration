import { EnergyBoard } from "@/components/analytics/EnergyBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function EnergyPage() {
  return (
    <AppShell
      active="energy"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Energy"
      contextSummary={["7-day demand", "Top consumers"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Analytics" title="Energy" />
      <EnergyBoard />
    </AppShell>
  );
}
