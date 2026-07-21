# experience-integration

**Stamped L6 — Experience & Integration.** Ops-first plant control room: Today home, EMS alarms, prescription triage, dual-mode analyst, claim-safe savings display, exports, and (later) public API/webhooks.

Platform technical SoT is the **[stamped-external](https://github.com/Vinayak-RZ/stamped-external)** submodule at [`external/`](external/). Do not fork contracts or architecture docs — bump the submodule.

## What this repo is

| Is | Is not |
|----|--------|
| Dashboard + EMS console + Rx queue UX | L3 detection / L5 workflow system of record |
| Dual-mode analyst UX (Mode A/B) | RAG / LangGraph runtime (L4) |
| Tenant-scoped BFF composing L2/L4/L5 | Direct Timescale / OT writes |
| Claim-safe savings display (`ops_confirmed`) | Implying DISCOM/bill verification from ops |
| Public API + webhooks (P2) | SCADA HMI / ESG filing system |

**Claim rule:** customer-facing “verified” in P0 means **`ops_confirmed`** (telemetry clearance). Bill-reconciled `verified` is deferred ([ADR-020](external/decisions/ADR-020-l5-mv-claim-governance.md)).

## Layout

```text
external/                 # stamped-external submodule (architecture, contracts, ADRs, design)
packages/
  web/                    # Next.js App Router — seeded from external/consumers/stamped-l6
  api/                    # BFF (planned)
  worker/                 # PDF/CSV/webhooks jobs (planned P1+)
docs/architecture/        # Repo-local boundary snapshot
.cursor/                  # Coding skills/rules (cursor-config-coding)
```

## Setup

```bash
git clone --recurse-submodules https://github.com/Vinayak-RZ/experience-integration.git
cd experience-integration
# or after clone:
git submodule update --init --recursive

cd packages/web && npm install && npm test && npm run typecheck
```

Agents / CI must run `git submodule update --init` before build. Contracts: `./external/scripts/contract-check.sh`.

## Read first

1. [external/technical/layers/L6-experience-and-integration.md](external/technical/layers/L6-experience-and-integration.md)
2. [external/handoff/stamped-l6-architecture-handoff.md](external/handoff/stamped-l6-architecture-handoff.md)
3. [external/handoff/stamped-l6-ui-ux-charter.md](external/handoff/stamped-l6-ui-ux-charter.md)
4. [external/handoff/stamped-l6-build-plan.md](external/handoff/stamped-l6-build-plan.md)
5. [AGENTS.md](AGENTS.md)

## Cursor coding config

Also includes the **[cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding)** workflow (ponytail, nawab-plans, Spec Kit, 36 skills). Refresh with:

```bash
./scripts/sync-from-upstream.sh
```

## Upstream layers

| Layer | Repo | L6 uses |
|-------|------|---------|
| L5 | closure-verification | Alarms, workflow, SSE, ack/defer |
| L4 | knowledge-reasoning | Analyst + prescription text |
| L2 | universal-repositary | Ledger / timeseries reads (HTTP only) |
