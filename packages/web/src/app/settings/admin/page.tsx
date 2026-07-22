import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel } from "@/components/ui/primitives";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function AdminSettingsPage() {
  return (
    <AppShell
      active="admin"
      plantName={DEMO_PLANT.plantName}
      role="admin"
      connection={connectionFixture}
      screenTitle="Admin"
      contextSummary={["Memberships", "Audit"]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Organization admin" />
      <Panel>
        <p style={{ margin: 0, fontSize: 14 }}>
          Invite users, assign plant roles, and review audit events through the BFF admin APIs.
          Authorization is fail-closed — unknown roles receive no grants.
        </p>
      </Panel>
    </AppShell>
  );
}
