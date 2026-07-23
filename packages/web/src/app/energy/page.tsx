import { EnergyBoard } from "@/components/analytics/EnergyBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
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
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Energy Analytics"
      contextSummary={[
        `MTD ${formatIndianNum(energyKpisFixture.mtdGridKwh)} kWh`,
        `Peak MD ${formatIndianNum(energyKpisFixture.peakMdKva)} kVA`,
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Analytics" title="Energy Analytics" />
      <EnergyBoard />
    </AppShell>
  );
}
