import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  alarmsFixture,
  assetById,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
import { actionsForState } from "@/lib/alarms";
import { formatIndianNum } from "@/lib/format";

const linkBtn: CSSProperties = {
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 18px",
  borderRadius: "var(--forge-radius-md)",
  border: "1px solid var(--forge-outline-variant)",
  fontWeight: 700,
};

export default async function AlarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alarm = alarmsFixture.find((a) => a.id === id);
  if (!alarm) notFound();

  const actions = actionsForState(alarm.state);
  const asset = assetById(alarm.assetId);

  return (
    <AppShell
      active="alarms"
      plantName={DEMO_PLANT.plantName}
      role="supervisor"
      connection={connectionFixture}
      screenTitle={`Alarm ${alarm.assetLabel}`}
      contextSummary={[alarm.summary]}
      focusEntity={{ type: "alarm", id: alarm.id }}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="EMS detail"
        title={alarm.assetLabel}
        actions={
          <Link href="/alarms" style={{ fontWeight: 600 }}>
            Back to console
          </Link>
        }
      />
      <Panel>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <StatusChip
            tone={
              alarm.severity === "critical"
                ? "critical"
                : alarm.severity === "warning"
                  ? "warning"
                  : "info"
            }
          >
            {alarm.severity}
          </StatusChip>
          <StatusChip tone="neutral">{alarm.state}</StatusChip>
          {alarm.findingId ? <StatusChip tone="info">{alarm.findingId}</StatusChip> : null}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 16 }}>{alarm.summary}</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Raised {alarm.raisedAt} · Asset {alarm.assetId}
          {alarm.ownerRole ? ` · Owner ${alarm.ownerRole.replaceAll("_", " ")}` : ""}
        </p>
        {asset ? (
          <p
            className="tabular"
            style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}
          >
            {asset.area} · Load {asset.loadPct}% · {formatIndianNum(asset.kwhMtd)} kWh MTD
            {asset.pf != null ? ` · PF ${formatIndianNum(asset.pf, 2)}` : ""}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {actions.includes("ack") ? <PrimaryButton>Ack</PrimaryButton> : null}
          <Link href={`/evidence?alarmId=${alarm.id}`} style={linkBtn}>
            Open evidence
          </Link>
          {alarm.relatedPrescriptionId ? (
            <Link
              href={`/prescriptions/${alarm.relatedPrescriptionId}`}
              style={linkBtn}
            >
              Open prescription
            </Link>
          ) : null}
        </div>
      </Panel>
    </AppShell>
  );
}
