# Phase E completion — Operational control room

**Status:** Complete (product flows); Playwright E2E deferred to Phase N  
**Date:** 2026-07-22

## Completed

- Decision-first Today board (role order, ≤7 signals, loading/partial/stale)
- EMS alarms list/detail (severity/age sort, j/k/a/e, mobile bar, fixture Auto actions via BFF)
- Prescription triage/detail (lanes, assign/done/defer/reject + required reasons, optimistic update)
- Pre-scoped evidence explorer (alarm/Rx query scope, honest partial baseline, rule/tariff lineage, chart + data table)
- Claim-safe savings ledger (buckets, ops≠bill verified, emission-factor disclosure)
- P0 reports hub + ledger/prescription audit CSV (stable columns, Asia/Kolkata, formula-injection defense; BFF + Auto download)

## Validation

- `pnpm --filter @stamped/l6-web test` — 49 passing
- `pnpm --filter @stamped/l6-api test` — 50 passing (with `DATABASE_URL`)
- Web + API `tsc --noEmit` — clean

## Known issues / deferrals

- Playwright not installed in this repo; mobile alarm/Rx and plant-head ledger E2E remain for Phase N (`test(e2e)`).
- L2 ledger/baseline still feature-gated — Auto fixtures power ledger/evidence/CSV until upstream publishes.
- Public `/v1` remains deferred (Phase H / Auto-not-API).

## What you learned

- Claim safety is a sanitize step at the display boundary — never trust upstream `verified` without bill refs.
- CSV formula defense is a one-line prefix + quote rule; golden fixtures must include `= + - @` cases.
- Pre-scoped evidence beats a free-form explorer for ops — alarm/Rx query params carry the proof context.

## Next

Phase F — Energy/equipment/TOD/intensity analytics and dual-mode analyst with confirmed actions.
