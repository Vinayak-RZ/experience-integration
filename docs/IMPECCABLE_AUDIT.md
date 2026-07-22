# Impeccable UI/UX audit — Stamped L6 Forge product

**Date:** 2026-07-22  
**Register:** product (ops control room)  
**Sources:** `PRODUCT.md`, `DESIGN.md`, Forge tokens

## Scores (0–4)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Accessibility | 3 | Focus rings, skip link, StatusChip text, touch ≥44/48. Charts have table alt. Residual: more live-region coverage on SSE. |
| Performance | 3 | ECharts route-lazy; sampling on dense series. Web vitals reporter added. Bundle still carries fonts via Google CSS. |
| Theming | 3 | Forge tokens authoritative; removed decorative body gradient (SoT: no gradients). Some inline `#fff` on secondary chrome remain SoT-aligned (`on-secondary`). |
| Responsive | 3 | Shell sheet + dock; 360px journeys covered by Playwright mobile project. |
| Anti-patterns | 3 | No purple/glow/glass. Coral ≤10%. Cards only on interactive units. |

## Fixes applied this pass

1. Removed decorative radial background gradient (DESIGN: no gradients).
2. Added `WebVitalsReporter` (LCP → allowlisted telemetry).
3. Settings integrations/admin routes for enterprise surfaces.
4. Playwright desktop + 360px mobile journeys for ops paths.

## Follow-ups

- Self-host fonts to cut third-party CSS latency.
- Prefer `var(--forge-on-secondary)` everywhere instead of raw `#fff`.
- Expand axe checks in Playwright when `@axe-core/playwright` is approved.
