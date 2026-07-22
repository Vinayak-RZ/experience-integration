import { AppShell } from "@/components/shell/AppShell";
import { TodayBoard } from "@/components/today/TodayBoard";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  demoClosurePct,
  demoCriticalAlarmCount,
  demoNeedsReviewInr,
  todaySignalsFixture,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { selectTodaySignals } from "@/lib/today-signals";

const ROLE = "plant_head" as const;

export default function TodayPage() {
  const signals = selectTodaySignals(ROLE, todaySignalsFixture);
  const critical = demoCriticalAlarmCount();

  return (
    <AppShell
      active="today"
      plantName={DEMO_PLANT.plantName}
      role={ROLE}
      connection={connectionFixture}
      screenTitle="Today at the plant"
      contextSummary={[
        `${critical} critical alarms`,
        `${formatInr(demoNeedsReviewInr())} open prescriptions`,
        DEMO_PLANT.shift,
        "Telemetry fresh",
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead
        eyebrow={`${DEMO_PLANT.orgName} · demo`}
        title="Today at the plant"
      />
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 13,
          color: "var(--forge-on-surface-variant)",
        }}
      >
        {DEMO_PLANT.contractDemandNote} · As of {DEMO_PLANT.demoAsOf} ·{" "}
        {DEMO_PLANT.tariff}
      </p>
      <TodayBoard signals={signals} closurePct={demoClosurePct()} />
    </AppShell>
  );
}
