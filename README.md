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
  web/                    # Next.js App Router — Forge control room UI
  api/                    # Product BFF (Fastify) — not public /v1
  contracts/              # Shared Zod schemas + claim/workflow mappings
  worker/                 # pg-boss jobs (PostgreSQL; no Redis)
contracts/upstream/       # Pinned L2/L4/L5 OpenAPI snapshots (fixtures until live)
infra/                    # Local docker compose + Mailpit
docs/architecture/        # Repo-local boundary snapshot
.cursor/                  # Coding skills/rules (cursor-config-coding)
```

## Setup

```bash
git clone --recurse-submodules https://github.com/Vinayak-RZ/experience-integration.git
cd experience-integration
# or after clone:
git submodule update --init --recursive
corepack enable
pnpm install
cp .env.example .env
pnpm validate
# with local Postgres:
# DATABASE_URL=postgres://stamped:stamped@127.0.0.1:5432/stamped_l6 pnpm compose:smoke
```

Agents / CI must run `git submodule update --init` before build. Contracts:
`./external/scripts/contract-check.sh` and `pnpm contracts:upstream`.

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

## UI demo (fixture plant)

Local demo data lives in `packages/web` fixtures — start web with `pnpm --filter @stamped/l6-web exec next dev --hostname 0.0.0.0 --port 3000` (or `next start` after `pnpm build`). Regenerate captures from `packages/web` with `node scripts/capture-ui-demo.mjs` while the app is on `:3000`.

### Fast walkthrough

<video src="docs/demo/l6-ui-demo-fast.mp4" controls width="100%"></video>

[Full-speed MP4](docs/demo/l6-ui-demo.mp4) · [WebM](docs/demo/l6-ui-demo.webm)

### Screens (every route)

| Screen | Preview |
|--------|---------|
| Today | ![Today](docs/demo/01-today.png) |
| Alarms console | ![Alarms](docs/demo/02-alarms.png) |
| Alarm detail | ![Alarm detail](docs/demo/03-alarm-detail.png) |
| Prescriptions | ![Prescriptions](docs/demo/04-prescriptions.png) |
| Prescription detail | ![Prescription detail](docs/demo/05-prescription-detail.png) |
| Evidence | ![Evidence](docs/demo/06-evidence.png) |
| Analyst (Mode B) | ![Analyst](docs/demo/07-analyst.png) |
| Reports & ledger | ![Reports](docs/demo/08-reports.png) |
| Energy | ![Energy](docs/demo/09-energy.png) |
| Equipment | ![Equipment](docs/demo/10-equipment.png) |
| Intensity / CO₂ | ![Intensity](docs/demo/11-intensity.png) |
| Integrations | ![Integrations](docs/demo/12-integrations.png) |
| Admin | ![Admin](docs/demo/13-admin.png) |
| Analyst Mode A overlay | ![Mode A](docs/demo/14-analyst-mode-a.png) |
| Alarm ack (action) | ![Ack](docs/demo/15-alarm-acked.png) |
| Rx defer (action) | ![Defer](docs/demo/16-rx-deferred.png) |
| Export approve (action) | ![Approve](docs/demo/17-export-approved.png) |
