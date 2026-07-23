import { IntensityBoard } from "@/components/analytics/IntensityBoard";
import { TodMdBoard } from "@/components/analytics/TodMdBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  energyKpisFixture,
} from "@/fixtures/demo";
import { mdHeadroomPct } from "@/lib/analytics";

export default function IntensityPage() {
  const headroom = mdHeadroomPct(energyKpisFixture.peakMdKva, energyKpisFixture.cmdKva);

  return (
    <AppShell
      active="intensity"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Sustainability"
      contextSummary={[
        `MD headroom ${headroom}%`,
        "SEC disclosure · TOD · MD · CMD",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Sustainability" title="Intensity, TOD & CO₂" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <TodMdBoard />
        <IntensityBoard />
      </div>
    </AppShell>
  );
}
