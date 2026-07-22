# Phase G completion — Reports and sustainability

**Status:** Complete (HTML print artifact + Auto Export Centre); binary PDF/XLSX deferred  
**Date:** 2026-07-22

## Completed

- Report job lifecycle (queued → running → ready → pending_approval → approved / failed / dlq)
- `report_jobs` migration + dedupe keys + attempt/DLQ rules
- API routes: create/list/approve/artifact (Auto inline complete when worker unwired)
- pg-boss `l6.reports.generate` queue worker registration
- Print-safe sustainability HTML (no scripts; print CSS; methodology + limitations)
- Focused BRSR/PAT adjunct rows with `not_measured_by_stamped` honesty
- Export Centre UX — generate → approve → download; ledger/Rx CSV retained

## Validation

- `pnpm --filter @stamped/l6-api test` — 55 passing
- `pnpm --filter @stamped/l6-web test` — 58 passing
- `pnpm --filter @stamped/l6-worker test` — 1 passing
- Typecheck clean for api/web

## Known issues / deferrals

- Tagged PDF (Playwright print) and ExcelJS XLSX streaming not added — avoid new deps this slice; HTML + CSV cover Auto.
- Worker does not yet mutate `report_jobs` rows (API Auto path completes artifacts); wire shared completion next when out-of-process worker is required.
- Phase H public `/v1` remains deferred (Auto-not-API).

## What you learned

- Approval-before-send is a state, not a button label — downloads stay gated on `approved`.
- BRSR honesty is mostly listing what you refuse to invent (Scope 1, SEC without production).
- Inline Auto completion keeps the product usable before the worker owns the write path.

## Next

Phase H deferred. Phase N — hardening: E2E (Playwright), security review, performance, a11y, `validate.sh`, runbooks.
