/** Report job state machine — approval required before external send. */

export const REPORT_STATES = [
  "queued",
  "running",
  "ready",
  "pending_approval",
  "approved",
  "failed",
  "dlq",
] as const;

export type ReportState = (typeof REPORT_STATES)[number];

export type ReportEvent =
  | "start"
  | "succeed"
  | "fail"
  | "submit_for_approval"
  | "approve"
  | "retry"
  | "dead_letter";

const TRANSITIONS: Record<ReportState, Partial<Record<ReportEvent, ReportState>>> = {
  queued: { start: "running", fail: "failed" },
  running: {
    succeed: "ready",
    fail: "failed",
    dead_letter: "dlq",
  },
  ready: { submit_for_approval: "pending_approval" },
  pending_approval: { approve: "approved", fail: "failed" },
  approved: {},
  failed: { retry: "queued" },
  dlq: { retry: "queued" },
};

export function canTransition(from: ReportState, event: ReportEvent): boolean {
  return Boolean(TRANSITIONS[from]?.[event]);
}

export function transitionReport(
  from: ReportState,
  event: ReportEvent,
): ReportState {
  const next = TRANSITIONS[from]?.[event];
  if (!next) {
    throw new Error(`Invalid report transition ${from} + ${event}`);
  }
  return next;
}

/** Stable dedupe — same org/plant/kind/period collapses retries. */
export function reportDedupeKey(input: {
  orgId: string;
  plantId: string;
  kind: string;
  periodStart: string;
  periodEnd: string;
}): string {
  return [
    input.orgId,
    input.plantId,
    input.kind,
    input.periodStart,
    input.periodEnd,
  ].join("|");
}

export const MAX_REPORT_ATTEMPTS = 3;

export function nextAttemptDisposition(attemptCount: number): "fail" | "dead_letter" {
  return attemptCount + 1 >= MAX_REPORT_ATTEMPTS ? "dead_letter" : "fail";
}
