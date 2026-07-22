# Stamped L6 — Progress

## Current phase

**Phase A — Workspace and foundation**

Phase 0 authority, specification, design, and upstream prompts are complete.
The next work establishes the pnpm workspace, contracts, BFF, PostgreSQL,
worker, CI, and local runtime.

## Phase status

| Phase | Status | Exit gate |
|-------|--------|-----------|
| 0 — Authority and specification | Complete | Approved artifacts and explicit upstream blockers |
| A — Workspace and foundation | Pending | Frozen install, migrations, contracts, tests, builds |
| B — Authentication and tenancy | Pending | Invite/login/plant-switch/RBAC matrix |
| C — Forge UX system | Pending | Desktop/mobile shell and accessibility baseline |
| D — Upstream and realtime | Pending | Adapter contracts and resumable SSE |
| E — Operational control room | Pending | Mobile alarm/Rx and ledger E2E |
| F — Analytics and analyst | Pending | Dense charts and confirmed analyst handoff |
| G — Reports and sustainability | Pending | Approved PDF/XLSX and job recovery |
| H — Enterprise integration | Pending | API/webhook/Entra/Power BI/CDK gates |
| N — Hardening | Pending | Full validation and no high security findings |
| Cutover — AWS Mumbai pilot | Blocked | Credentials, upstream contracts, and human approval |

## Completed

- Mounted `stamped-external` at `external/`.
- Adapted the typed L6 reference seed into `packages/web`.
- Established L6 identity and read-first authority in `AGENTS.md` and `README.md`.
- Validated the seed: six unit tests, TypeScript, Next build, and platform
  contract check.
- Approved the complete L6 master execution plan.
- Confirmed Redis remains outside P0–P2; PostgreSQL/pg-boss is the selected
  replacement.
- Confirmed local admin-managed auth plus Entra and L6-owned RBAC.
- Established root project authority, decisions, progress, product, and design
  context.
- Scaffolded Spec Kit and validated 27 requirements, 10 success criteria, and
  66 dependency-ordered tasks with no unresolved clarification.
- Published ready-to-paste L5 alarm-action and L2 ledger/baseline agent prompts.

## Active blockers

### L5 alarm lifecycle HTTP

L5 documents alarm list and silence but not all dashboard ack, escalate, and
unsilence actions required by ADR-023. L6 will implement a fixture-backed,
feature-gated adapter, but production alarm acceptance requires an upstream
L5 OpenAPI change.

### L2 ledger and baseline reads

L2's customer query surface does not yet document the ledger and baseline
endpoints required by L6. L6 must not use L2 admin or database access.

### External credentials

SES, Entra, Power BI, and AWS credentials are intentionally absent. Fake
adapters and CDK synthesis can proceed; real cutover requires human approval.

## Immediate next work

1. Migrate the existing web seed to a pnpm workspace.
2. Add CI and the shared L6 contract package.
3. Scaffold Fastify, PostgreSQL/Drizzle, and pg-boss.
4. Add the local compose profile and run the Phase A gate.

## Deferred by scope

WhatsApp magic links, Redis, full portfolio rollups, complete BRSR filing,
SAP/Tally writes, SCIM, Hindi, native mobile, and bill-verification product
claims.
