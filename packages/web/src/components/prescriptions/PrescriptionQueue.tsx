"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Prescription, PrescriptionLane } from "@/lib/types";
import { claimBadgeLabel, formatInr } from "@/lib/format";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";
import {
  filterLane,
  optimisticRxUpdate,
  requiresReason,
  type RxAction,
} from "@/lib/prescriptions";

const LANES: PrescriptionLane[] = ["needs_review", "active", "verifying", "closed"];

const laneLabel: Record<PrescriptionLane, string> = {
  needs_review: "Needs review",
  active: "Active",
  verifying: "Verifying",
  closed: "Closed",
};

export function PrescriptionQueue({ initial }: { initial: Prescription[] }) {
  const [rows, setRows] = useState(initial);
  const [lane, setLane] = useState<PrescriptionLane>("needs_review");
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: RxAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const sorted = useMemo(() => filterLane(rows, lane), [rows, lane]);

  const openInr = rows
    .filter((r) => r.lane === "needs_review" || r.lane === "active")
    .reduce((s, r) => s + r.impactInrPerMonth, 0);

  function run(id: string, action: RxAction) {
    if (requiresReason(action)) {
      setPendingAction({ id, action });
      setReason("");
      return;
    }
    const { next } = optimisticRxUpdate(rows, id, action);
    setRows(next);
    setToast(`${action} applied`);
  }

  function confirmReasoned() {
    if (!pendingAction || !reason.trim()) return;
    const { next, rollback } = optimisticRxUpdate(
      rows,
      pendingAction.id,
      pendingAction.action,
    );
    setRows(next);
    setPendingAction(null);
    setReason("");
    setToast(`${pendingAction.action} confirmed`);
    // ponytail: no live L5 yet — rollback helper kept for failed upstream wiring
    void rollback;
  }

  function rollbackLast(snapshot: Prescription[]) {
    setRows(snapshot);
    setToast("Action rolled back");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-rx-queue>
      <Panel style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Addressable open queue
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {formatInr(openInr)}/mo
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="tablist" aria-label="Rx lanes">
          {LANES.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              onClick={() => setLane(l)}
              aria-selected={lane === l}
              style={{
                minHeight: 40,
                padding: "0 12px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                background: lane === l ? "var(--forge-secondary)" : "var(--forge-surface-container)",
                color: lane === l ? "#fff" : "var(--forge-on-surface)",
              }}
            >
              {laneLabel[l]}
            </button>
          ))}
        </div>
      </Panel>

      {sorted.length === 0 ? (
        <Panel>
          <p style={{ margin: 0 }}>Nothing in {laneLabel[lane]}.</p>
        </Panel>
      ) : (
        sorted.map((rx) => {
          const badge = claimBadgeLabel(rx.verificationStatus);
          return (
            <Panel key={rx.id} as="article" data-rx-id={rx.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 17 }}>
                    <Link href={`/prescriptions/${rx.id}`}>{rx.title}</Link>
                  </h3>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
                    {rx.why}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    Due {rx.dueAt} · Owner {rx.ownerRole.replaceAll("_", " ")}
                  </p>
                </div>
                <p
                  className="tabular"
                  style={{
                    margin: 0,
                    fontFamily: "var(--forge-font-display)",
                    fontWeight: 800,
                    fontSize: 20,
                  }}
                >
                  {formatInr(rx.impactInrPerMonth)}/mo
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                <StatusChip tone="info">{Math.round(rx.confidence * 100)}% confidence</StatusChip>
                {rx.verificationStatus ? (
                  <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
                ) : null}
              </div>

              {rx.opportunityCost ? (
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-warning)" }}>
                  Delay cost {formatInr(rx.opportunityCost.modeledInr)} over{" "}
                  {rx.opportunityCost.delayDays} days. Modeled — not bill-verified.
                </p>
              ) : null}

              {lane === "needs_review" || lane === "active" ? (
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {lane === "needs_review" ? (
                    <SecondaryButton onClick={() => run(rx.id, "assign")}>Assign me</SecondaryButton>
                  ) : null}
                  <PrimaryButton onClick={() => run(rx.id, "done")}>Mark done</PrimaryButton>
                  <GhostButton onClick={() => run(rx.id, "defer")}>Defer…</GhostButton>
                  <GhostButton onClick={() => run(rx.id, "reject")}>Reject…</GhostButton>
                  <Link
                    href={`/evidence?rxId=${rx.id}`}
                    style={{
                      minHeight: 48,
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0 14px",
                      border: "1px solid var(--forge-outline-variant)",
                      borderRadius: "var(--forge-radius-md)",
                      fontWeight: 700,
                    }}
                  >
                    Show proof
                  </Link>
                </div>
              ) : null}

              {pendingAction?.id === rx.id ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor={`reason-${rx.id}`} style={{ fontSize: 12, fontWeight: 600 }}>
                    {pendingAction.action} reason (required)
                  </label>
                  <textarea
                    id={`reason-${rx.id}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      border: "1px solid var(--forge-outline-variant)",
                      padding: 10,
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <PrimaryButton onClick={confirmReasoned} disabled={!reason.trim()}>
                      Confirm {pendingAction.action}
                    </PrimaryButton>
                    <GhostButton
                      onClick={() => {
                        setPendingAction(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </GhostButton>
                  </div>
                </div>
              ) : null}
            </Panel>
          );
        })
      )}

      <ToastRegion message={toast} tone="good" />
      {/* expose rollback for tests / future upstream failure path */}
      <button
        type="button"
        className="sr-only"
        data-rx-rollback
        onClick={() => rollbackLast(initial)}
      >
        Rollback
      </button>
    </div>
  );
}
