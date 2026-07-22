# Stamped L6 — Progress

## Current phase

**Cutover — AWS Mumbai pilot** (blocked on human credentials / `cdk diff`)

Phases 0–H Auto + enterprise definitions are in place. `validate.sh`, Playwright,
and GitHub Actions cover quality / postgres / browser / infra jobs.

## Phase status

| Phase | Status | Exit gate |
|-------|--------|-----------|
| 0 — Authority | Complete | Approved artifacts |
| A — Foundation | Complete | Frozen install, migrations, builds |
| B — Auth / tenancy | Complete | Invite/login/plant-switch/RBAC |
| C — Forge UX | Complete | Shell + a11y baseline |
| D — Upstream / SSE | Complete | Adapters + resumable SSE |
| E — Ops product | Complete | Today/alarms/Rx/evidence/ledger/CSV |
| F — Analytics / analyst | Complete | Charts + confirm handoff |
| G — Reports | Complete | Jobs + HTML/BRSR + Export Centre |
| H — Enterprise | Complete* | Public `/v1`, webhooks, Entra/PBI defs, CDK |
| N — Hardening | Complete | validate + Playwright + security review |
| Cutover | Blocked | Credentials + human approval |

\* Live Entra/Power BI tenants and ECR image are cutover inputs, not code gaps.

## Immediate next work

1. Human: register Entra app + Power BI workspace; approve `cdk diff`.
2. Replace CDK placeholder image with ECR; run smoke on Mumbai.
3. Optional: axe Playwright project + self-hosted fonts.

## Demo fixtures (2026-07-22)

Jaipur Works Auto demo is thorough across all Forge screens via
`packages/web/src/fixtures/demo.ts` (assets, alarms, Rx, ledger, members, API
keys, webhooks, report jobs, investigations, energy KPIs). Today tiles derive
from the same helpers so shell banners stay consistent.
