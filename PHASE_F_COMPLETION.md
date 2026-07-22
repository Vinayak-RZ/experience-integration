# Phase F completion — Analytics and analyst

**Status:** Complete (Auto fixture surfaces)  
**Date:** 2026-07-22

## Completed

- Energy module — 7-day demand chart + top consumers
- Equipment module — calm health map + load dials
- TOD / MD — tariff bands, CMD line, headroom
- Intensity / CO₂ — SEC/renewable/Scope 2 with explicit `not_measured_by_stamped` gaps; Scope 1 never invented
- Analyst Mode A — removable chips, suggestions, fixture replies, focus restore, preview→confirm handoff
- Analyst Mode B — investigations, Path H/W citations, confirm-before-L5 gate (injection blocked)

## Validation

- `pnpm --filter @stamped/l6-web test` — 58 passing
- Web `tsc --noEmit` — clean

## Known issues / deferrals

- Live L4 HTTP remains behind fixture Auto (`L4` live flag elsewhere); no silent page scrape.
- Playwright journeys still deferred to Phase N.
- Public `/v1` still deferred (Phase H).

## What you learned

- Intensity honesty is mostly about what you refuse to compute when inputs are missing.
- Analyst actions need a two-step preview/confirm — one click must never hit L5.
- Mode A focus restore is an a11y detail that prevents “dialog closed into the void”.

## Next

Phase G — pg-boss report lifecycle, print-safe sustainability template, PDF/XLSX, BRSR/PAT adjunct, Export Centre approval UX.
