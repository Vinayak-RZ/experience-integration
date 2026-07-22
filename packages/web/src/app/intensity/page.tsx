import { IntensityBoard } from "@/components/analytics/IntensityBoard";
import { TodMdBoard } from "@/components/analytics/TodMdBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function IntensityPage() {
  return (
    <AppShell
      active="intensity"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Intensity / CO₂"
      contextSummary={["SEC disclosure", "TOD · MD · CMD"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Analytics" title="Intensity, TOD & MD" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <TodMdBoard />
        <IntensityBoard />
      </div>
    </AppShell>
  );
}
