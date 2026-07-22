import type { AnalystContextEnvelope } from "./types";

export interface ContextChip {
  key: string;
  value: string;
}

export type AnalystCitation = {
  id: string;
  title: string;
  snippet?: string;
  path?: "H" | "W";
};

export type AnalystMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: AnalystCitation[];
};

export type ProposedAction = {
  id: string;
  kind: "ack_alarm" | "assign_rx" | "open_evidence";
  label: string;
  targetId: string;
  summary: string;
};

/**
 * Build the user-visible context chips for Mode A analyst.
 * Strips excluded keys; never includes secrets.
 */
export function visibleContextChips(
  envelope: AnalystContextEnvelope,
): ContextChip[] {
  const excluded = new Set(envelope.excludeKeys ?? []);
  const candidates: ContextChip[] = [
    { key: "screen", value: envelope.screenTitle },
    { key: "route", value: envelope.routeId },
    {
      key: "focus",
      value: envelope.focusEntity
        ? `${envelope.focusEntity.type}:${envelope.focusEntity.id}`
        : "",
    },
    ...(envelope.timeRange
      ? [
          {
            key: "range",
            value: `${envelope.timeRange.from} → ${envelope.timeRange.to}`,
          },
        ]
      : []),
    ...envelope.visibleSummary.map((s, i) => ({
      key: `summary:${i}`,
      value: s,
    })),
  ];

  return candidates.filter((c) => c.value && !excluded.has(c.key));
}

/** Reject cross-tenant focus entities at the BFF boundary. */
export function assertTenantMatch(
  envelope: AnalystContextEnvelope,
  entityPlantId: string | undefined,
): boolean {
  if (!entityPlantId) return true;
  return entityPlantId === envelope.plantId;
}

export function suggestionPrompts(envelope: AnalystContextEnvelope): string[] {
  const focus = envelope.focusEntity;
  if (focus?.type === "alarm") {
    return [
      "Why is this alarm critical right now?",
      "What evidence supports MD coincidence?",
      "Propose an ack with rationale",
    ];
  }
  if (focus?.type === "prescription") {
    return [
      "Summarise impact and confidence",
      "What proof should I open first?",
      "Draft an assign-to-me action",
    ];
  }
  return [
    "What needs attention on this screen?",
    "Compare vs baseline for the plant",
    "List claim-safe savings this month",
  ];
}

/** Fixture Auto L4 reply — mirrors API client shape without network. */
export function fixtureAnalystReply(
  envelope: AnalystContextEnvelope,
  question: string,
): AnalystMessage {
  const chips = visibleContextChips(envelope);
  const focus = envelope.focusEntity
    ? ` Focus ${envelope.focusEntity.type} ${envelope.focusEntity.id}.`
    : "";
  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    content: `Fixture analyst for ${envelope.plantId}.${focus} You asked: “${question.trim()}”. Context chips: ${chips
      .map((c) => c.key)
      .join(", ") || "none"}.`,
    citations: [
      {
        id: "cite_fixture_1",
        title: "Plant context (fixture)",
        snippet: envelope.screenTitle,
        path: "H",
      },
      {
        id: "cite_fixture_2",
        title: "L2 measurements window",
        snippet: envelope.visibleSummary[0] ?? "telemetry",
        path: "W",
      },
    ],
  };
}

/**
 * Build a proposed L5 handoff — never auto-writes; UI must confirm.
 * Rejects injection-like payloads that try to smuggle commands.
 */
export function proposeActionFromReply(
  envelope: AnalystContextEnvelope,
  reply: AnalystMessage,
): ProposedAction | null {
  const text = `${reply.content}`;
  if (/ignore (all|previous)|system:|<\/?script/i.test(text)) {
    return null;
  }
  const focus = envelope.focusEntity;
  if (focus?.type === "alarm") {
    return {
      id: `act_${focus.id}_ack`,
      kind: "ack_alarm",
      label: "Acknowledge alarm",
      targetId: focus.id,
      summary: `Ack ${focus.id} after analyst review — requires explicit confirm.`,
    };
  }
  if (focus?.type === "prescription") {
    return {
      id: `act_${focus.id}_assign`,
      kind: "assign_rx",
      label: "Assign prescription to me",
      targetId: focus.id,
      summary: `Assign ${focus.id} — requires explicit confirm before L5 write.`,
    };
  }
  return null;
}

export function confirmActionGate(input: {
  proposed: ProposedAction | null;
  confirmed: boolean;
}): { allowed: boolean; reason: string } {
  if (!input.proposed) {
    return { allowed: false, reason: "No action proposed" };
  }
  if (!input.confirmed) {
    return { allowed: false, reason: "Human confirmation required" };
  }
  return { allowed: true, reason: "Confirmed" };
}
