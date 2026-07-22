import { AppShell } from "@/components/shell/AppShell";
import { EnergyTwinGraph } from "@/components/equipment/EnergyTwinGraph";
import { PageHead, Panel } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";

export default function PlantMapPage() {
  return (
    <AppShell
      active="plant_map"
      plantName={DEMO_PLANT.plantName}
      role="energy_manager"
      connection={connectionFixture}
      screenTitle="Plant Map"
      contextSummary={["2D energy twin", DEMO_PLANT.plantName]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Operations" title="Plant Map" />
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)", textAlign: "center" }}>
        Expandable power hierarchy · fixture load · Normal production · Day shift
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", maxWidth: 960 }}>
          <EnergyTwinGraph />
          <Panel style={{ padding: 12, marginTop: 12, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Section nodes expand on click. 2D twin only — not a 3D digital twin.
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
