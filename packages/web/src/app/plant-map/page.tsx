import { AppShell } from "@/components/shell/AppShell";
import { PlantSectionMap } from "@/components/equipment/PlantSectionMap";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function PlantMapPage() {
  return (
    <AppShell
      active="plant_map"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Plant Map"
      contextSummary={["Section drill-down map", DEMO_PLANT.plantName]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow={`${DEMO_PLANT.plantName} · live twin`} title="Plant Map" />
      <PlantSectionMap />
    </AppShell>
  );
}
