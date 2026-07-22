import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  investigationsFixture,
} from "@/fixtures/demo";

export default function AnalystPage() {
  return (
    <AppShell
      active="analyst"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Ask Analyst"
      contextSummary={[
        `${investigationsFixture.length} saved investigations`,
        "Mode B · citations required",
      ]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Intelligence" title="Ask Analyst" />
      <AnalystWorkspace />
    </AppShell>
  );
}
