import type { Prescription, PrescriptionLane } from "@/lib/types";

export type RxAction = "assign" | "ack" | "defer" | "reject" | "done";

export function sortPrescriptions(rows: readonly Prescription[]): Prescription[] {
  return [...rows].sort((a, b) => {
    const score =
      b.impactInrPerMonth * b.confidence - a.impactInrPerMonth * a.confidence;
    if (score !== 0) return score;
    return Date.parse(a.dueAt) - Date.parse(b.dueAt);
  });
}

export function requiresReason(action: RxAction): boolean {
  return action === "defer" || action === "reject";
}

export function applyRxAction(
  rx: Prescription,
  action: RxAction,
): Prescription {
  switch (action) {
    case "assign":
    case "ack":
      return { ...rx, lane: "active" };
    case "defer":
      return { ...rx, lane: "closed" };
    case "reject":
      return { ...rx, lane: "closed" };
    case "done":
      return { ...rx, lane: "verifying", verificationStatus: "pending" };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Optimistic update with rollback snapshot. */
export function optimisticRxUpdate(
  rows: readonly Prescription[],
  id: string,
  action: RxAction,
): { next: Prescription[]; rollback: Prescription[] } {
  const rollback = rows.map((r) => ({ ...r }));
  const next = rows.map((r) => (r.id === id ? applyRxAction(r, action) : r));
  return { next, rollback };
}

export function filterLane(
  rows: readonly Prescription[],
  lane: PrescriptionLane,
): Prescription[] {
  return sortPrescriptions(rows.filter((r) => r.lane === lane));
}
