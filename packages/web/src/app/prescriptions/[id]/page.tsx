import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { claimBadgeLabel, formatInr } from "@/lib/format";

const linkBtn: CSSProperties = {
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 18px",
  borderRadius: "var(--forge-radius-md)",
  border: "1px solid var(--forge-outline-variant)",
  fontWeight: 700,
};

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rx = prescriptionsFixture.find((r) => r.id === id);
  if (!rx) notFound();
  const badge = claimBadgeLabel(rx.verificationStatus);

  return (
    <AppShell
      active="prescriptions"
      plantName={DEMO_PLANT.plantName}
      role="supervisor"
      connection={connectionFixture}
      screenTitle={rx.title}
      contextSummary={[rx.why, formatInr(rx.impactInrPerMonth) + "/mo"]}
      focusEntity={{ type: "prescription", id: rx.id }}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="Prescription"
        title={rx.title}
        actions={
          <Link href="/prescriptions" style={{ fontWeight: 600 }}>
            Back to queue
          </Link>
        }
      />
      <Panel>
        <p style={{ margin: 0, fontSize: 15 }}>{rx.why}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <StatusChip tone="info">{Math.round(rx.confidence * 100)}% confidence</StatusChip>
          <StatusChip tone="neutral">{rx.lane.replaceAll("_", " ")}</StatusChip>
          {rx.verificationStatus ? (
            <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
          ) : null}
        </div>
        <p
          className="tabular"
          style={{
            margin: "16px 0 0",
            fontFamily: "var(--forge-font-display)",
            fontWeight: 800,
            fontSize: 28,
          }}
        >
          {formatInr(rx.impactInrPerMonth)}/mo impact
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Owner {rx.ownerRole.replaceAll("_", " ")} · Due {rx.dueAt}
        </p>
        {rx.opportunityCost ? (
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--forge-warning)" }}>
            Opportunity cost {formatInr(rx.opportunityCost.modeledInr)} (
            {rx.opportunityCost.delayDays} days) — modeled, not bill-verified.
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Link href={`/evidence?rxId=${rx.id}`} style={linkBtn}>
            Open evidence
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
