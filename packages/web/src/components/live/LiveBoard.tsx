"use client";

import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import type { ConnectionStatus } from "@/lib/types";
import { LiveAnomalyStrip, LiveStatusStrip } from "@/components/live/LiveStatusStrip";
import { DialBank } from "@/components/today/overview/DialBank";
import { PlantHealthMap } from "@/components/today/overview/PlantHealthMap";
import { AlertFeedPanel } from "@/components/today/overview/AlertFeedPanel";
import { DemandProfilePanel } from "@/components/today/overview/DemandProfilePanel";

export function LiveBoard({ connection }: { connection: ConnectionStatus }) {
  const live = useLiveTelemetry(connection.sse === "live");

  return (
    <div data-live-board className="forge-page-stack">
      <LiveStatusStrip
        connection={connection}
        syncAgeSec={live.syncAgeSec}
        plantMw={live.plantMw}
      />

      <LiveAnomalyStrip anomalies={live.anomalies} />

      <DialBank dials={live.dials} />

      <div className="forge-grid-60-40">
        <PlantHealthMap machines={live.machines} />
        <DemandProfilePanel
          profile={live.demandProfile}
          plantMw={live.plantMw}
          peakMw={live.peakMw}
          peakHour={live.peakHour}
        />
      </div>

      <AlertFeedPanel alerts={live.alerts} />
    </div>
  );
}
