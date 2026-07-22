import { AppShell } from "@/components/shell/AppShell";
import { TodayBoard } from "@/components/today/TodayBoard";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  todaySignalsFixture,
} from "@/fixtures/demo";
import { selectTodaySignals } from "@/lib/today-signals";

const ROLE = "plant_head" as const;

export default function TodayPage() {
  const signals = selectTodaySignals(ROLE, todaySignalsFixture);

  return (
    <AppShell
      active="today"
      plantName={DEMO_PLANT.plantName}
      role={ROLE}
      connection={connectionFixture}
      screenTitle="Today at the plant"
      contextSummary={[
        "2 critical alarms",
        "₹2.14L open prescriptions",
        "Telemetry fresh",
      ]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Ops home" title="Today at the plant" />
      <TodayBoard signals={signals} closurePct={64} />
    </AppShell>
  );
}
