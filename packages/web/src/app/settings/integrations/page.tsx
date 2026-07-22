import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function IntegrationsSettingsPage() {
  return (
    <AppShell
      active="integrations"
      plantName={DEMO_PLANT.plantName}
      role="admin"
      connection={connectionFixture}
      screenTitle="Integrations"
      contextSummary={["API keys", "Webhooks", "Entra", "Power BI"]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Integrations" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Public API keys
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Create scoped Bearer keys (<code>stk_…</code>) via{" "}
            <code>POST /api/integrations/api-keys</code>. Secrets are shown once; only hashes are
            stored.
          </p>
          <div style={{ marginTop: 12 }}>
            <StatusChip tone="info">Scopes: alarms · events · ledger · reports</StatusChip>
          </div>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Webhooks
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Standard Webhooks signing, SSRF hostname checks, capped retries, and DLQ redrive. Manage
            endpoints under <code>/api/integrations/webhooks</code>.
          </p>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Microsoft Entra
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Optional organization sign-in. Entra is identity only — L6 membership remains
            authorization truth. Local auth continues to coexist.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12 }}>
            Set <code>ENTRA_ENABLED</code>, <code>ENTRA_TENANT_ID</code>, <code>ENTRA_CLIENT_ID</code>.
          </p>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Power BI pilot
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Bounded batch push (≤10,000 rows/request) with durable checkpoints. Ops-confirmed values
            stay labeled — never presented as bill-verified.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
