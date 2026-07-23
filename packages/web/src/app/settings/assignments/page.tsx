import { AppShell } from "@/components/shell/AppShell";
import { AssignmentsBoard } from "@/components/assignments/AssignmentsBoard";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function AssignmentsPage() {
  return (
    <AppShell
      active="assignments"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Assignments"
      contextSummary={[
        "Alarm WhatsApp routing",
        "Prescription assignee recommendations",
        DEMO_PLANT.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Assignments & notification routing" />
      <AssignmentsBoard />
    </AppShell>
  );
}
