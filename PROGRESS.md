# Stamped L6 — Progress

## Current phase

**Phase B — Authentication and tenancy** (starting)

Phase A foundation is complete. Auto execution continues into auth/tenancy,
then Forge UX. Public customer `/v1` remains deferred (Phase H).

## Phase status

| Phase | Status | Exit gate |
|-------|--------|-----------|
| 0 — Authority and specification | Complete | Approved artifacts and explicit upstream blockers |
| A — Workspace and foundation | Complete | Frozen install, migrations, contracts, tests, builds |
| B — Authentication and tenancy | Pending | Invite/login/plant-switch/RBAC matrix |
| C — Forge UX system | Pending | Desktop/mobile shell and accessibility baseline |
| D — Upstream and realtime | Pending | Adapter contracts and resumable SSE |
| E — Operational control room | Pending | Mobile alarm/Rx and ledger E2E |
| F — Analytics and analyst | Pending | Dense charts and confirmed analyst handoff |
| G — Reports and sustainability | Pending | Approved PDF/XLSX and job recovery |
| H — Enterprise integration | Deferred (Auto) | Public API last; UX/ops first |
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
  66 dependency-ordered tasks.
- Published ready-to-paste L5 alarm-action and L2 ledger/baseline agent prompts.
- Migrated to pnpm workspace; added CI, contracts, product BFF, Drizzle,
  pg-boss worker, and local compose.

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

1. Enforce service-layer RBAC permission matrix (seven roles).
2. Admin membership UI + plant switcher persistence.
3. Harden auth boundaries, then Phase C Forge UX.

## Deferred by scope

Public `/v1` / OpenAPI customer API (Phase H — after product UX), WhatsApp
magic links, Redis, full portfolio rollups, complete BRSR filing, SAP/Tally
writes, SCIM, Hindi, native mobile, and bill-verification product claims.
