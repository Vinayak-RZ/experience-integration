import { AlarmConsole } from "@/components/alarms/AlarmConsole";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  alarmsFixture,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function AlarmsPage() {
  const critical = demoCriticalAlarmCount();
  const open = alarmsFixture.filter((a) => a.state !== "cleared").length;

  return (
    <AppShell
      active="alarms"
      plantName={DEMO_PLANT.plantName}
      role="supervisor"
      connection={connectionFixture}
      screenTitle="EMS alarm console"
      contextSummary={[
        `${open} open · ${critical} critical`,
        DEMO_PLANT.shift,
        "Severity-first triage",
      ]}
      focusEntity={{ type: "alarm", id: alarmsFixture[0]!.id }}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="EMS" title="Alarm console" />
      <AlarmConsole initial={alarmsFixture} />
    </AppShell>
  );
}
