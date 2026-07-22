# Phase C completion — Forge UX system

**Status:** Complete  
**Date:** 2026-07-22

## Completed

- Forge Industrial v2 CSS tokens, fonts, atmospheric surface, motion, contrast checks
- Accessible owned primitives: buttons (48px), status chips with text labels, forms,
  table, sheet, toast, skeleton
- Responsive role-aware shell: desktop sidebar (≥900px), mobile menu sheet + dock,
  skip link, truthful SSE banners
- FR-010 route states: loading / empty / error / stale / forbidden / partial
- Progressive reveal navigation with persisted pins and alarms/Rx ops invariants
- ECharts foundation: Forge theme, canvas renderer, table alternative, min-max + LTTB,
  43,200-point evidence trend island

## Files (high level)

- `packages/web/src/styles/tokens.css`, `lib/contrast.ts`, `lib/navigation.ts`,
  `lib/route-state.ts`, `lib/chart-sample.ts`
- `packages/web/src/components/ui/primitives.tsx`
- `packages/web/src/components/shell/*`, `states/RouteStateView.tsx`
- `packages/web/src/components/charts/{ForgeChart,EvidenceTrend,forgeTheme}.*`
- Web tests: tokens, primitives, shell/nav, route states, chart sampling (32 passing)

## Validation

- `pnpm --filter @stamped/l6-web test` — 32 passing
- `pnpm --filter @stamped/l6-web typecheck` — clean

## Known issues

- Primary coral `#f75440` + white is ~3.33 contrast (SoT-locked); CTAs use ≥16px/700
  (large-text/UI AA). Small text on coral uses `primary-fixed`.
- Visual desktop/360px screenshot review still a human gate (no Playwright in repo).
- Client nav role matrix mirrors API authz — keep in sync when matrix changes.

## What you learned

- Design SoT can force a contrast trade-off; document the floor and the safe path
  (`primary-fixed`) instead of inventing brand colors.
- ECharts must stay a route island (dynamic import) so Today stays light.
- Progressive reveal + pins need fail-closed sanitize against role grants, or
  unauthorized tools leak into the primary rail.

## Next

Phase D — L5/L2/L4 adapters, canonical mappings, durable events, resumable SSE
(Postgres/pg-boss, no Redis).
