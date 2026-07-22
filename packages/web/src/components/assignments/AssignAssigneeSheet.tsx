"use client";

import { useMemo, useState } from "react";
import {
  notifyPeopleFixture,
  recommendAssignees,
  type NotifyPerson,
} from "@/fixtures/assignments";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/ui/primitives";

/** Assign sheet: 2–3 recommended people + browse full notify roster. */
export function AssignAssigneeSheet({
  open,
  onClose,
  area,
  assetId,
  title,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  area?: string;
  assetId?: string;
  title: string;
  onAssign: (person: NotifyPerson) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const recommended = useMemo(
    () => recommendAssignees({ area, assetId, limit: 3 }),
    [area, assetId],
  );
  const all = useMemo(
    () => notifyPeopleFixture.filter((p) => p.whatsappEnabled),
    [],
  );

  if (!open) return null;

  const list = showAll ? all : recommended;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assign person"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        background: "rgba(25, 28, 26, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Panel
        style={{
          width: "min(520px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p className="forge-eyebrow">Assign</p>
            <h2 className="forge-card-title" style={{ fontSize: 18 }}>
              {title}
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              {showAll
                ? "Everyone who can be notified"
                : "Recommended from Assignments matrix (2–3)"}
            </p>
          </div>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {list.map((p) => (
            <li key={p.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--forge-outline-variant)",
                  background: "var(--forge-surface-container-lowest)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>{p.name}</strong>
                    <StatusChip tone="info">{p.role.replaceAll("_", " ")}</StatusChip>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    {p.areas.join(" · ")} · {p.phoneMasked}
                  </p>
                </div>
                <PrimaryButton onClick={() => onAssign(p)}>Assign</PrimaryButton>
              </div>
            </li>
          ))}
        </ul>

        <div className="forge-btn-row">
          {!showAll ? (
            <SecondaryButton onClick={() => setShowAll(true)}>
              Browse all people
            </SecondaryButton>
          ) : (
            <GhostButton onClick={() => setShowAll(false)}>Show recommendations</GhostButton>
          )}
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </Panel>
    </div>
  );
}
