# Phase N completion — Hardening

**Status:** Complete for Auto gate (`validate.sh` green); Playwright E2E still open  
**Date:** 2026-07-22

## Completed

- `scripts/validate.sh` orchestrator (docs drift, contracts, typecheck, tests, build)
- Security review ledger (`docs/SECURITY_REVIEW.md`) — no open criticals on Auto path
- Pilot ops runbook (`docs/runbooks/pilot-ops.md`)
- Confirmed web production build for all Auto routes

## Validation

- `./scripts/validate.sh` → **ALL GREEN**
- API 55 / web 58 / worker 1 tests passing in orchestrator run

## Known issues / deferrals

- Playwright not installed — `VALIDATE_E2E=1` will fail until added (tracked as S-06)
- Phase H (public `/v1`, webhooks, Entra, Power BI, CDK) deferred per Auto-not-API
- Cutover remains blocked on credentials + human approval

## What you learned

- One orchestrator beats a checklist nobody runs — `validate.sh` is the gate.
- Security review is useful as a living table of severities, not a one-off essay.
- Skipping Playwright is honest only if cutover stays blocked on that gap.

## Next

Cutover — AWS Mumbai pilot when credentials and upstream contracts are ready.
Human approval required for migrations, `cdk diff`, smoke, and rollback proof.
