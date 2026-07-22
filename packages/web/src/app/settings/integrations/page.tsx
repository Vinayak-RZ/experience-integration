import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  apiKeysFixture,
  connectionFixture,
  webhooksFixture,
} from "@/fixtures/demo";

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
          <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Scoped Bearer keys (<code>stk_…</code>). Secrets shown once; only hashes stored.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {apiKeysFixture.map((k) => (
              <li
                key={k.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{k.name}</p>
                  <p
                    className="tabular"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {k.prefix}… · created {k.createdAt}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {k.scopes.map((s) => (
                      <StatusChip key={s} tone="info">
                        {s}
                      </StatusChip>
                    ))}
                  </p>
                </div>
                <StatusChip tone={k.lastUsedAt ? "good" : "neutral"}>
                  {k.lastUsedAt ? `Last used ${k.lastUsedAt}` : "Never used"}
                </StatusChip>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Webhooks
          </h2>
          <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Standard Webhooks signing, SSRF hostname checks, capped retries, DLQ redrive.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {webhooksFixture.map((w) => (
              <li
                key={w.id}
                style={{
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, wordBreak: "break-all" }}>{w.url}</p>
                  <StatusChip tone={w.enabled ? "good" : "neutral"}>
                    {w.enabled ? "Enabled" : "Disabled"}
                  </StatusChip>
                  <StatusChip
                    tone={
                      w.lastStatus === "delivered"
                        ? "good"
                        : w.lastStatus === "dlq"
                          ? "critical"
                          : "warning"
                    }
                  >
                    {w.lastStatus}
                  </StatusChip>
                </div>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  Filters: {w.eventFilters.join(", ")} · Last delivery {w.lastDelivery}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Microsoft Entra
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Demo org: identity optional. Entra is identity only — L6 membership remains authorization
            truth. Local auth continues to coexist.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusChip tone="neutral">ENTRA_ENABLED=false (demo)</StatusChip>
            <StatusChip tone="info">Tenant: demo-not-connected</StatusChip>
          </div>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Power BI pilot
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Bounded batch push (≤10,000 rows/request) with durable checkpoints. Ops-confirmed values
            stay labeled — never presented as bill-verified.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusChip tone="good">Last sync: ledger Jul MTD</StatusChip>
            <StatusChip tone="warning">Claims: ops-confirmed only</StatusChip>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
