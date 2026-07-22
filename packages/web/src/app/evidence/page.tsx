import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel } from "@/components/ui/primitives";
import { LoadDial } from "@/components/charts/LoadDial";
import { EvidenceTrend } from "@/components/charts/EvidenceTrend";
import { DEMO_PLANT, connectionFixture } from "@/fixtures/demo";

export default function EvidencePage() {
  return (
    <AppShell
      active="evidence"
      plantName={DEMO_PLANT.plantName}
      role="supervisor"
      connection={connectionFixture}
      screenTitle="Evidence explorer"
      contextSummary={["Pre-scoped charts", "Baseline bands via ECharts"]}
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Proof" title="Evidence explorer" />
      <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <LoadDial loadPct={108} label="Kiln 1" />
        <LoadDial loadPct={72} label="Mill 1" />
        <LoadDial loadPct={54} label="Compressor 2" />
        <p style={{ flex: "1 1 240px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Dense trends use canvas ECharts with min-max + LTTB sampling and a data-table
          alternative. Load dials stay SVG for at-a-glance asset state.
        </p>
      </Panel>
      <EvidenceTrend />
    </AppShell>
  );
}
