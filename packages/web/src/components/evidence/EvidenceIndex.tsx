import Link from "next/link";
import { EvidenceMiniChart } from "@/components/evidence/EvidenceMiniChart";
import { Panel, StatusChip } from "@/components/ui/primitives";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import "./evidence.css";

const categoryTone = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "info",
} as const;

const chartAccent = {
  critical: "critical",
  good: "good",
  warning: "warning",
  info: "critical",
} as const;

export function EvidenceIndex({ samples }: { samples: readonly EvidenceSample[] }) {
  return (
    <div className="evidence-detail" data-evidence-index>
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)", lineHeight: 1.5 }}>
        Every action has a bill line and an owner. Open a specific proof pack — scoped from alarms,
        prescriptions, or ledger entries.
      </p>
      <div className="evidence-index-grid">
        {samples.map((sample) => (
          <Link
            key={sample.id}
            href={`/evidence/${sample.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Panel className="evidence-index-card">
              <div className="evidence-card__header">
                <StatusChip tone="neutral">Evidence · Proof pack</StatusChip>
                <StatusChip tone={categoryTone[sample.categoryBadge.tone]}>
                  {sample.categoryBadge.label}
                </StatusChip>
              </div>
              <h3
                style={{
                  margin: "12px 0 0",
                  fontFamily: "var(--forge-font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {sample.assetLabel}
              </h3>
              <p className="evidence-card__asset">{sample.chartTitle}</p>
              <EvidenceMiniChart
                chart={sample.chart}
                accent={chartAccent[sample.categoryBadge.tone]}
                compact
              />
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 11,
                  fontFamily: "var(--forge-font-mono, ui-monospace, monospace)",
                  color: "var(--forge-on-surface-variant)",
                }}
              >
                {sample.id}
                {sample.findingId ? ` · ${sample.findingId}` : ""}
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
