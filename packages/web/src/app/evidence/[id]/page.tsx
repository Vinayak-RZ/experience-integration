import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { EvidenceDetail } from "@/components/evidence/EvidenceDetail";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
import { findEvidenceSample } from "@/fixtures/evidence-samples";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sample = findEvidenceSample(id);
  if (!sample) notFound();

  return (
    <AppShell
      active="evidence"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle={`Evidence · ${sample.assetLabel}`}
      contextSummary={[sample.categoryBadge.label, sample.chartTitle]}
      focusEntity={
        sample.rxId
          ? { type: "prescription", id: sample.rxId }
          : sample.alarmId
            ? { type: "alarm", id: sample.alarmId }
            : undefined
      }
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="Evidence"
        title={`${sample.assetLabel} · ${sample.categoryBadge.label}`}
      />
      <EvidenceDetail sample={sample} showBaselineBand={false} />
    </AppShell>
  );
}
