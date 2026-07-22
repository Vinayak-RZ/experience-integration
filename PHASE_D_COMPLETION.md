# Phase D completion — Upstream adapters and realtime

**Status:** Complete  
**Date:** 2026-07-22

## Completed

- Resilient L5 workflow client (list/silence, timeouts, idempotency; ack/escalate/unsilence feature-gated)
- L2 query client (measurements/assets, granularity caps, tenancy headers; ledger/baseline gated; refuse `L2_DATABASE_URL`)
- L4 analyst client (context envelope projection, fixture/live modes, cross-tenant rejection)
- Canonical workflow/claim/alarm mappings with golden tests
- L5 event cursor ingest (advisory lock leader, append-only dedupe, cursor recovery)
- Resumable browser SSE (`/api/events/stream`) with Last-Event-ID, NOTIFY fan-out, heartbeats

## Validation

- `pnpm --filter @stamped/l6-api test` — 46 passing (with `DATABASE_URL`)
- `pnpm --filter @stamped/l6-api typecheck` — clean

## Known issues

- L5 ack/escalate/unsilence and L2 ledger/baseline remain upstream gaps (feature flags default off).
- SSE plant access uses org membership + plant_memberships; orgExternalId query is informational until org slug mapping is unified.

## What you learned

- Upstream gaps should fail as structured 501s, not invented happy paths.
- Advisory locks must stay on one pooled connection for lock/unlock pairs.
- SSE resume needs a monotonic `seq`, not UUID lexicographic order.

## Next

Phase E — Today, alarms, prescriptions, evidence, ledger, CSV operational flows.
