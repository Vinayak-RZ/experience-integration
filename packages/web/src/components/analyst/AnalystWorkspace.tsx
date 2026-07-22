"use client";

import { useMemo, useState } from "react";
import type { AnalystContextEnvelope } from "@/lib/types";
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

const INVESTIGATIONS = [
  { id: "inv_1", title: "Kiln 1 MD coincidence", focus: "alarm:alm_1001" },
  { id: "inv_2", title: "Mill 1 PF slab", focus: "prescription:rx_9002" },
];

const BASE_ENVELOPE: AnalystContextEnvelope = {
  orgId: "org_demo",
  plantId: "plant_jaipur_01",
  userId: "user_demo",
  role: "energy_manager",
  routeId: "analyst",
  screenTitle: "Investigation workspace",
  visibleSummary: ["Mode B workspace", "Citations required"],
  focusEntity: { type: "alarm", id: "alm_1001" },
};

/** Mode B full analyst workspace — fixture L4; confirm before any L5 write. */
export function AnalystWorkspace() {
  const [activeInv, setActiveInv] = useState(INVESTIGATIONS[0]!.id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const envelope = useMemo(() => {
    const inv = INVESTIGATIONS.find((i) => i.id === activeInv)!;
    const [type, id] = inv.focus.split(":") as ["alarm" | "prescription", string];
    return {
      ...BASE_ENVELOPE,
      focusEntity: { type, id },
      screenTitle: inv.title,
    } satisfies AnalystContextEnvelope;
  }, [activeInv]);

  const citations = messages.flatMap((m) => m.citations ?? []);

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
        gridTemplateColumns: "220px 1.4fr 1fr",
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
          {INVESTIGATIONS.map((inv) => (
            <li key={inv.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveInv(inv.id);
                  setMessages([]);
                  setProposal(null);
                  setStatus(null);
                }}
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
                {inv.title}
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
