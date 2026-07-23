"use client";

import { OVERVIEW_KPIS } from "@/fixtures/overview-demo";
import { useCountUp } from "@/hooks/useCountUp";
import { formatIndianNum, formatInr } from "@/lib/format";
import { Gauge } from "@/components/charts/Gauge";
import { Panel } from "@/components/ui/primitives";
import { CountPill, IconBadge, KPI_ICONS, SeverityStrip } from "@/components/ui/indicators";
import { Sparkles, TrendingDown, TrendingUp } from "@/components/ui/icons";

function HeroCard({
  hero,
  children,
  style,
}: {
  hero?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Panel
      className={hero ? "forge-kpi-hero-card forge-kpi-hero-card--hero" : "forge-kpi-hero-card"}
      style={style}
    >
      {children}
    </Panel>
  );
}

export function KpiHeroStrip() {
  const savings = useCountUp(OVERVIEW_KPIS.savings.value);
  const energy = useCountUp(OVERVIEW_KPIS.energy.value);
  const score = useCountUp(OVERVIEW_KPIS.score.value);
  const anomalies = useCountUp(OVERVIEW_KPIS.anomalies.total);
  const carbon = useCountUp(OVERVIEW_KPIS.carbon.value);

  return (
    <div className="forge-kpi-hero-strip" role="list" aria-label="Plant KPIs">
      <HeroCard hero>
        <IconBadge icon={KPI_ICONS.savings} tone="primary" size={34} iconSize={17} />
        <p className="forge-eyebrow" style={{ color: "var(--forge-primary)", marginTop: 0 }}>
          Stamped Savings This Month
        </p>
        <div
          className="forge-num-display tabular"
          style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.4rem)", marginTop: 6, whiteSpace: "nowrap" }}
        >
          {formatInr(savings)}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, color: "var(--forge-tertiary)", fontWeight: 600, fontSize: 12 }}>
          <TrendingUp size={13} strokeWidth={2.5} />
          {OVERVIEW_KPIS.savings.trendPct}% vs last month
        </div>
      </HeroCard>

      <HeroCard>
        <IconBadge icon={KPI_ICONS.energy} tone="warning" size={34} iconSize={17} />
        <p className="forge-eyebrow">Total Energy Consumed</p>
        <div
          className="forge-num-display tabular"
          style={{ fontSize: "clamp(1.3rem, 1.8vw, 1.85rem)", marginTop: 8, whiteSpace: "nowrap" }}
        >
          {formatIndianNum(energy)}{" "}
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>kWh</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, color: "var(--forge-tertiary)", fontWeight: 600, fontSize: 11 }}>
          <TrendingDown size={12} strokeWidth={2.5} />
          {OVERVIEW_KPIS.energy.reductionPct.toFixed(1)}% reduction
        </div>
      </HeroCard>

      <HeroCard>
        <div className="forge-kpi-hero-card__row">
          <IconBadge icon={KPI_ICONS.score} tone="good" size={34} iconSize={17} />
          <Gauge label="AI score" value={score} valueText={String(Math.round(score))} size={44} />
        </div>
        <p className="forge-eyebrow">Stamped AI Score</p>
        <div className="forge-num-display tabular" style={{ fontSize: "1.85rem", color: "var(--forge-primary)", marginTop: 4 }}>
          {Math.round(score)}
          <span style={{ fontSize: "0.85rem", color: "var(--forge-on-surface-variant)" }}> / 100</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: "var(--forge-on-surface-variant)", fontSize: 10.5 }}>
            Benchmark {OVERVIEW_KPIS.score.benchmark}
          </span>
          <span title={`${OVERVIEW_KPIS.score.grade} Grade`} style={{ display: "inline-flex" }}>
            <IconBadge icon={Sparkles} tone="primary" size={26} iconSize={13} />
          </span>
        </div>
      </HeroCard>

      <HeroCard>
        <IconBadge icon={KPI_ICONS.anomalies} tone="critical" size={34} iconSize={17} />
        <p className="forge-eyebrow">Live Anomalies</p>
        <div className="forge-num-display tabular" style={{ fontSize: "2.4rem", marginTop: 6 }}>
          {Math.round(anomalies)}
        </div>
        <div style={{ marginTop: 8 }}>
          <SeverityStrip
            items={[
              { tone: "critical", count: OVERVIEW_KPIS.anomalies.critical, label: "Critical" },
              { tone: "warning", count: OVERVIEW_KPIS.anomalies.warning, label: "Warning" },
              { tone: "info", count: OVERVIEW_KPIS.anomalies.info, label: "Info" },
            ]}
          />
        </div>
      </HeroCard>

      <HeroCard>
        <IconBadge icon={KPI_ICONS.carbon} tone="good" size={34} iconSize={17} />
        <p className="forge-eyebrow">CO₂ Equivalent</p>
        <div
          className="forge-num-display tabular"
          style={{ fontSize: "clamp(1.3rem, 1.8vw, 1.85rem)", marginTop: 8, whiteSpace: "nowrap" }}
        >
          {Math.round(carbon)}{" "}
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>tCO₂e</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, color: "var(--forge-tertiary)", fontWeight: 600, fontSize: 11 }}>
          <TrendingDown size={12} strokeWidth={2.5} />
          {OVERVIEW_KPIS.carbon.delta} tCO₂e vs last month
        </div>
      </HeroCard>
    </div>
  );
}
