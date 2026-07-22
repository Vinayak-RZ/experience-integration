import { EquipmentMap } from "@/components/analytics/EquipmentMap";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function EquipmentPage() {
  return (
    <AppShell
      active="equipment"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Equipment"
      contextSummary={["Calm health map", "Load dials"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Analytics" title="Equipment" />
      <EquipmentMap />
    </AppShell>
  );
}
