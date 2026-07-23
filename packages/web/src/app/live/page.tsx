import { LiveBoard } from "@/components/live/LiveBoard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function LivePage() {
  return (
    <AppShell
      active="live"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Live"
      contextSummary={[
        "Modbus / OPC-UA · 1s poll",
        "115 assets instrumented",
        "Real-time load dials & alert feed",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Operations" title="Live" />
      <p className="forge-page-lede">
        Real-time plant instrumentation · load dials, health map, demand profile, and anomaly feed ·{" "}
        {DEMO_PLANT.shift}
      </p>
      <LiveBoard connection={connectionFixture} />
    </AppShell>
  );
}
