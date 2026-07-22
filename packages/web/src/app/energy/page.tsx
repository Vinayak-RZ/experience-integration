import { EnergyBoard } from "@/components/analytics/EnergyBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  energyKpisFixture,
} from "@/fixtures/demo";
import { formatIndianNum } from "@/lib/format";

export default function EnergyPage() {
  return (
    <AppShell
      active="energy"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Energy"
      contextSummary={[
        `MTD ${formatIndianNum(energyKpisFixture.mtdGridKwh)} kWh`,
        `Peak MD ${formatIndianNum(energyKpisFixture.peakMdKva)} kVA`,
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Analytics" title="Energy" />
      <EnergyBoard />
    </AppShell>
  );
}
