"use client";

import { useMemo } from "react";
import { ForgeChart } from "@/components/charts/ForgeChart";
import { buildMinuteSeries } from "@/lib/chart-sample";
import { Panel } from "@/components/ui/primitives";

/** Evidence route chart island — ECharts loads only here, not on Today. */
export function EvidenceTrend() {
  const points = useMemo(() => buildMinuteSeries(43_200), []);
  return (
    <Panel>
      <ForgeChart
        title="Kiln 1 demand (30-day minute)"
        seriesName="Demand"
        points={points}
        unit="kW"
        sampleBudget={720}
      />
    </Panel>
  );
}
