import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { EvidenceExplorer } from "@/components/evidence/EvidenceExplorer";
import {
  DEMO_PLANT,
  alarmsFixture,
  connectionFixture,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ alarmId?: string; rxId?: string }>;
}) {
  const sp = await searchParams;
  const scope = resolveEvidenceScope({
    plantId: DEMO_PLANT.plantId,
    alarmId: sp.alarmId,
    rxId: sp.rxId,
    alarms: alarmsFixture,
    prescriptions: prescriptionsFixture,
  });
  // ponytail: fixture Auto — baseline stays gated until L2_FEATURE_BASELINES
  const pack = buildEvidencePack(scope, { baselineAvailable: false });

  return (
    <AppShell
      active="evidence"
      plantName={DEMO_PLANT.plantName}
      role="supervisor"
      connection={connectionFixture}
      screenTitle={scope.title}
      contextSummary={[
        scope.assetLabel,
        pack.missing.length ? `Partial: ${pack.missing.join(", ")}` : "Complete",
      ]}
      focusEntity={
        scope.rxId
          ? { type: "prescription", id: scope.rxId }
          : scope.alarmId
            ? { type: "alarm", id: scope.alarmId }
            : undefined
      }
      criticalAlarmCount={2}
    >
      <PageHead eyebrow="Proof" title={scope.title} />
      <EvidenceExplorer pack={pack} />
    </AppShell>
  );
}
