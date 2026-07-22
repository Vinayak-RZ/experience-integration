"use client";

import { useMemo, useState } from "react";
import type { AnalystContextEnvelope } from "@/lib/types";
import {
  DEMO_PLANT,
  investigationsFixture,
  type DemoInvestigation,
} from "@/fixtures/demo";
import {
  confirmActionGate,
  fixtureAnalystReply,
  proposeActionFromReply,
  type AnalystMessage,
  type ProposedAction,
} from "@/lib/analyst-context";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/ui/primitives";

function seedMessages(inv: DemoInvestigation): AnalystMessage[] {
  return inv.seedMessages.map((m, i) => ({
    id: `${inv.id}_seed_${i}`,
    role: m.role,
    content: m.content,
    citations:
      m.role === "assistant"
        ? [
            {
              id: `cite_${inv.id}`,
              title: inv.focus,
              path: "H" as const,
              snippet: inv.summary,
            },
          ]
        : undefined,
  }));
}

const BASE_ENVELOPE: AnalystContextEnvelope = {
  orgId: DEMO_PLANT.orgId,
  plantId: DEMO_PLANT.plantId,
  userId: "user_demo",
  role: "energy_manager",
  routeId: "analyst",
  screenTitle: "Investigation workspace",
  visibleSummary: ["Mode B workspace", "Citations required"],
  focusEntity: { type: "alarm", id: "alm_1001" },
};

/** Mode B full analyst workspace — fixture L4; confirm before any L5 write. */
export function AnalystWorkspace() {
  const [activeInv, setActiveInv] = useState(investigationsFixture[0]!.id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AnalystMessage[]>(() =>
    seedMessages(investigationsFixture[0]!),
  );
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const envelope = useMemo(() => {
    const inv = investigationsFixture.find((i) => i.id === activeInv)!;
    const [type, id] = inv.focus.split(":") as ["alarm" | "prescription", string];
    return {
      ...BASE_ENVELOPE,
      focusEntity: { type, id },
      screenTitle: inv.title,
      visibleSummary: [inv.summary, DEMO_PLANT.plantName],
    } satisfies AnalystContextEnvelope;
  }, [activeInv]);

  const citations = messages.flatMap((m) => m.citations ?? []);

  function selectInv(id: string) {
    const inv = investigationsFixture.find((i) => i.id === id)!;
    setActiveInv(id);
    setMessages(seedMessages(inv));
    setProposal(null);
    setStatus(null);
    setConfirming(false);
  }

  function send() {
    const q = draft.trim();
    if (!q) return;
    const userMsg: AnalystMessage = { id: `u_${Date.now()}`, role: "user", content: q };
    const reply = fixtureAnalystReply(envelope, q);
    setMessages((prev) => [...prev, userMsg, reply]);
    setProposal(proposeActionFromReply(envelope, reply));
    setConfirming(false);
    setDraft("");
  }

  function confirmHandoff() {
    const gate = confirmActionGate({ proposed: proposal, confirmed: true });
    if (!gate.allowed || !proposal) {
      setStatus(gate.reason);
      return;
    }
    // ponytail: fixture handoff — never auto-write to L5
    setStatus(`Handoff confirmed: ${proposal.label} → ${proposal.targetId} (not sent upstream)`);
    setProposal(null);
    setConfirming(false);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1.4fr 1fr",
        gap: 12,
        minHeight: 480,
      }}
      className="analyst-grid"
      data-analyst-mode="B"
    >
      <Panel>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, fontFamily: "var(--forge-font-display)" }}>
          Investigations
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
          {investigationsFixture.map((inv) => (
            <li key={inv.id}>
              <button
                type="button"
                onClick={() => selectInv(inv.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  minHeight: 44,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  background:
                    activeInv === inv.id
                      ? "var(--forge-secondary)"
                      : "var(--forge-surface-container)",
                  color: activeInv === inv.id ? "#fff" : "var(--forge-on-surface)",
                }}
              >
                <span style={{ display: "block" }}>{inv.title}</span>
                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontWeight: 500,
                    fontSize: 11,
                    opacity: 0.85,
                  }}
                >
                  {inv.summary}
                </span>
              </button>
            </li>
          ))}
          <li style={{ fontSize: 13, color: "var(--forge-on-surface-variant)", padding: 8 }}>
            New investigation… (saved list is fixture)
          </li>
        </ul>
      </Panel>

      <Panel style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--forge-font-display)" }}>
          Conversation
        </h2>
        <div
          style={{
            flex: 1,
            background: "var(--forge-surface-low)",
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            overflow: "auto",
            minHeight: 200,
          }}
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p style={{ margin: 0, color: "var(--forge-on-surface-variant)" }}>
              Full analyst uses L4 ReAct with citations. Fixture Auto replies until live HTTP is
              enabled.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 12 }}>
                <strong>{m.role === "user" ? "You" : "Analyst"}</strong>
                <p style={{ margin: "4px 0 0" }}>{m.content}</p>
              </div>
            ))
          )}
        </div>
        <input
          aria-label="Ask full analyst"
          placeholder="Investigate across the plant…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          style={{
            border: "1px solid var(--forge-outline-variant)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
          }}
        />
        <PrimaryButton onClick={send}>Send</PrimaryButton>
      </Panel>

      <Panel>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, fontFamily: "var(--forge-font-display)" }}>
          Sources & evidence
        </h2>
        {citations.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Citations appear here (Path H / Path W). Handoff-to-action always confirms before L5
            writes.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {citations.map((c) => (
              <li key={c.id}>
                <StatusChip tone="info">Path {c.path ?? "H"}</StatusChip> {c.title}
                {c.snippet ? ` — ${c.snippet}` : ""}
              </li>
            ))}
          </ul>
        )}

        {proposal ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>Action handoff</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>{proposal.summary}</p>
            {!confirming ? (
              <div style={{ marginTop: 10 }}>
                <SecondaryButton onClick={() => setConfirming(true)}>
                  Preview {proposal.label}
                </SecondaryButton>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <PrimaryButton onClick={confirmHandoff}>Confirm send to L5</PrimaryButton>
                <GhostButton onClick={() => setConfirming(false)}>Cancel</GhostButton>
              </div>
            )}
          </div>
        ) : null}

        {status ? (
          <p role="status" style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-good)" }}>
            {status}
          </p>
        ) : null}
      </Panel>

      <style>{`
        @media (max-width: 1100px) {
          .analyst-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
