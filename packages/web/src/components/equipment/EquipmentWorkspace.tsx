"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EquipmentMap } from "@/components/analytics/EquipmentMap";
import { EnergyTwinGraph } from "@/components/equipment/EnergyTwinGraph";
import { Panel } from "@/components/ui/primitives";

export function EquipmentWorkspace() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"health" | "map">(
    params.get("view") === "map" ? "map" : "health",
  );

  useEffect(() => {
    setTab(params.get("view") === "map" ? "map" : "health");
  }, [params]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="forge-tabs" role="tablist" aria-label="Equipment views">
        <button
          type="button"
          role="tab"
          className="forge-tabs__btn"
          aria-selected={tab === "health"}
          onClick={() => setTab("health")}
        >
          Machine Health
        </button>
        <button
          type="button"
          role="tab"
          className="forge-tabs__btn"
          aria-selected={tab === "map"}
          onClick={() => setTab("map")}
        >
          Plant Map
        </button>
      </div>
      {tab === "health" ? <EquipmentMap /> : <EnergyTwinGraph />}
      {tab === "map" ? (
        <Panel style={{ padding: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            2D energy twin (fixture). Section nodes expand on click. Not a 3D digital twin.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
