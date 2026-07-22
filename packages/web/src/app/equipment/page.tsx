import { EquipmentMap } from "@/components/analytics/EquipmentMap";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  assetsFixture,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function EquipmentPage() {
  const hot = assetsFixture.filter((a) => a.health === "hot").length;
  const watch = assetsFixture.filter((a) => a.health === "watch").length;

  return (
    <AppShell
      active="equipment"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Machine Health"
      contextSummary={[
        `${assetsFixture.length} assets · ${hot} hot · ${watch} watch`,
        "Load dials",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Operations" title="Machine Health" />
      <EquipmentMap />
    </AppShell>
  );
}
