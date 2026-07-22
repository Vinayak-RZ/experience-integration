# Phase 0 Completion — Authority and Specification

## Completed work

- Established lived project authority in `PROJECT_OVERVIEW.md`,
  `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, and `PROGRESS.md`.
- Scaffolded Spec Kit 0.12.11 with Linux/bash scripts.
- Ratified the L6 constitution at version 1.0.0.
- Defined seven independently testable user scenarios, 27 functional
  requirements, 10 measurable success criteria, and 66 ordered tasks.
- Defined Forge-aligned `PRODUCT.md` and `DESIGN.md` context for the product
  register.
- Audited the reference UI route/state/accessibility gap.
- Audited the current L2/L4/L5 contract surface.
- Published exact L5 and L2 agent prompts for the blocking upstream routes.

## Files modified

- Root project, plan, progress, decisions, product, and design documents.
- `.specify/` workflow, constitution, templates, scripts, spec, plan,
  checklist, and tasks.
- Spec Kit skill script references updated from PowerShell to bash by the
  Linux scaffold.
- `docs/integration/UPSTREAM_AGENT_PROMPTS.md`.

## Architectural changes

Documentation now records the approved PostgreSQL-only coordination model:
durable events + `LISTEN/NOTIFY` for SSE and pg-boss for background work.
Better Auth plus L6-owned plant RBAC is the identity boundary.

No runtime code changed in this phase.

## Validation performed

- Constitution contains no unresolved template token.
- Specification contains no clarification marker.
- 27 `FR-*` requirements and 10 `SC-*` criteria detected.
- All 66 task rows use the required checkbox, task ID, and path format.
- Product/design context loaded successfully with the Impeccable context loader.
- Upstream prompts contain the required L5 ack/escalate and L2
  ledger/baseline routes.
- `git diff --check` passed for every commit.

## Known issues

- L5 must publish alarm acknowledge/escalate/unsilence routes before live
  operational acceptance.
- L2 must publish tenant-safe ledger and baseline reads before live
  ledger/evidence acceptance.
- SES, Entra, Power BI, and AWS credentials remain cutover checkpoints.

## Next phase

Phase A establishes the pnpm workspace, CI, shared contracts, Fastify BFF,
PostgreSQL/Drizzle, pg-boss worker, and local compose profile.

## What we learned

- The reference seed has the correct product vocabulary but only happy-path
  fixture behavior; route states, mobile actions, and data boundaries are the
  largest product gaps.
- The live L5/L2 gaps are transport contracts, not permission to duplicate
  workflow or ledger truth in L6.
- PostgreSQL can provide durable replay and work coordination without treating
  transient notifications as truth.
