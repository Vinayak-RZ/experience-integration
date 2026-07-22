# Stamped L6 — Implementation Decisions

Platform semantics remain authoritative in `external/`. These decisions define
how this consumer implements them. Any conflict with a platform ADR requires an
upstream proposal rather than silent divergence.

## DEC-001 — Separate L6 modular monolith packages

**Status:** Accepted · **Date:** 2026-07-22

### Context

ADR-022 requires a browser-safe composition layer and separates web, BFF, and
long-running work.

### Decision

Use a pnpm workspace with `packages/web`, `packages/api`,
`packages/contracts`, and `packages/worker`. The web never receives upstream
service credentials. The public API reuses BFF services rather than creating a
second domain.

### Alternatives

- Next.js Route Handlers only: fewer deployables but mixes UI and public API
  runtime boundaries.
- Microservices per feature: rejected as premature operational complexity.

### Consequences

The API and worker are independently deployable, while the codebase remains a
single modular monolith.

## DEC-002 — PostgreSQL replaces Redis through P2

**Status:** Accepted · **Date:** 2026-07-22

### Context

The platform handoff recommends Redis for SSE fan-out and BullMQ. Product
direction explicitly excludes Redis through P2.

### Decision

Use L6-owned PostgreSQL for:

- durable L5 event cursors and replay;
- advisory-lock event-poller leadership;
- `LISTEN/NOTIFY` wakeups for API instances; and
- pg-boss report, webhook, and integration jobs.

Notifications are never truth. Consumers resume from durable event IDs.
Queued handlers remain idempotent because retries can repeat processing.

### Alternatives

- Redis + BullMQ: capable but explicitly excluded.
- Per-browser L5 polling: minimal but wasteful and unsuitable for multiple
  clients.
- In-process queues: lose work on deploy and cannot satisfy report/webhook
  recovery.

### Consequences

One infrastructure dependency serves persistence and coordination. Separate
connection pools, bounded retention, indexes, and load metrics are required.
Measured saturation is the trigger to introduce a dedicated queue/fan-out
service later.

## DEC-003 — Better Auth with L6-owned RBAC

**Status:** Accepted · **Date:** 2026-07-22

### Context

P0 requires secure local accounts and easy administration. P2 adds Microsoft
Entra without allowing identity-provider claims to bypass plant authorization.

### Decision

Use Better Auth on Fastify for email/password sessions, verified-email
invitations, password reset, optional TOTP MFA, and session revocation. Public
self-registration is disabled. L6 owns organizations, plants, memberships,
roles, and permissions. Entra OIDC links an authenticated identity to an
existing membership.

### Alternatives

- Fully custom auth: rejected because owning password/session cryptography is
  unnecessary risk.
- Entra-only: rejected because local accounts and break-glass administration
  are required.
- Identity-provider roles as authority: rejected because plant-scoped RBAC is
  L6 domain policy.

### Consequences

Authentication and authorization remain separate. A dependency/license review
precedes adoption; official MSAL Node is the fallback Entra adapter if the
selected Better Auth integration is unsuitable.

## DEC-004 — PostgreSQL-backed resumable SSE

**Status:** Accepted · **Date:** 2026-07-22

### Context

L5 exposes a durable cursor event poll. Browsers require truthful, resumable,
one-way updates without direct L5 credentials.

### Decision

One advisory-lock leader polls L5, validates/deduplicates events, and appends
them to an L6 event log. PostgreSQL notification wakes API instances. Browser
SSE uses durable IDs, heartbeats, and `Last-Event-ID` replay.

### Alternatives

- WebSocket: rejected because traffic is server-to-client and managed plant
  networks can block upgrades.
- Shared Redis pub/sub: excluded through P2 and not durable.
- Standard Webhooks only: useful input later but not sufficient for browser
  resume semantics.

### Consequences

Reconnect correctness is testable without sticky sessions. Notification loss
does not lose events because API instances reread durable rows.

## DEC-005 — Forge Industrial responsive product system

**Status:** Accepted · **Date:** 2026-07-22

### Context

The reference seed proves information architecture but lacks complete route
states, mobile navigation, BFF wiring, and a reusable accessible component
system.

### Decision

Adapt Forge Industrial tokens into owned Tailwind/shadcn-based primitives.
Use a restrained light industrial scene, ≤7 Today signals, dark structural
chrome, color only for abnormal/action state, and no nested card grids.
Desktop and 360px mobile are equal release targets.

### Alternatives

- Keep inline seed styles: rejected because they duplicate values and make
  complete state/responsive coverage fragile.
- Adopt an unthemed component suite: rejected because it would override the
  platform visual authority.

### Consequences

Every primary route needs default, loading, empty, error, stale, forbidden,
and partial states. WCAG AA, visible focus, keyboard operation, 44px targets,
reduced motion, and chart text/table alternatives are gates.

## DEC-006 — Performance is measured in field and lab

**Status:** Accepted · **Date:** 2026-07-22

### Decision

Measure Core Web Vitals at p75 by device class: LCP ≤2.5s, INP ≤200ms, and
CLS ≤0.1. Primary route JavaScript has a 350 kB gzip ceiling and 250 kB
target. ECharts loads only on chart routes and uses sampling/progressive
rendering for dense data.

### Consequences

Web-vitals instrumentation contains no PII. Bundle, Lighthouse, and
43,200-point chart benchmarks run before cutover.

## DEC-007 — Reports use Playwright and pg-boss

**Status:** Accepted · **Date:** 2026-07-22

### Decision

Generate sustainability PDFs from authenticated internal React report routes
using Playwright print CSS. Produce XLSX separately with a streaming writer.
pg-boss runs generation, schedules, retries, DLQ, and approval-before-send.
Artifacts live in S3 behind expiring URLs.

### Consequences

Chromium never runs in the request process. Worker concurrency and memory are
bounded. Reports disclose data windows, methodology, lineage, factors, and
unavailable metrics.

## DEC-008 — Power BI is the P2 acceptance integration

**Status:** Accepted · **Date:** 2026-07-22

### Decision

Use a Microsoft service principal to synchronize bounded batches to one
approved Power BI workspace/semantic model, with durable checkpoints and
manual retry. Respect published push limits and the incompatibility between
push semantic models and service-principal profiles.

### Alternatives

- SAP/Tally writes: explicitly prohibited before P3.
- A generic CSV-only acceptance: insufficient to prove automated enterprise
  interoperability.

### Consequences

The fallback remains activity-data CSV/XLSX plus public API/Power Query.
Power BI credentials are secret-manager references, never database values.

## DEC-009 — Fixture-first CI, staged live cutover

**Status:** Accepted · **Date:** 2026-07-22

### Decision

Every upstream boundary has deterministic HTTP fixtures and pinned contract
snapshots in CI. Separate staging checks call live L2/L4/L5. Production enables
adapters independently and can degrade to read-only/fixture behavior without
inventing truth.

### Consequences

Missing sibling routes do not block local construction, but production
acceptance cannot be claimed until the required upstream contracts land.

## DEC-010 — Auto product/UX priority over public API

**Status:** Accepted · **Date:** 2026-07-22

### Context

The master plan includes a public `/v1` surface in Phase H. Mid-delivery
direction is to keep Auto execution focused on the Forge control room and
operational product path.

### Decision

- Ship `packages/api` as the **product BFF** for the web UI only.
- Defer customer public `/v1`, API keys, and Schemathesis gates until after
  auth (B), Forge UX (C), and operational surfaces (E) are in place.
- Do not lead implementation with public-API-first work.

### Consequences

Enterprise integration (Phase H) remains in scope but is sequenced after the
ops-first product. README and `/api/meta` advertise `public_api: false`.

## DEC-011 — Single Jaipur Works demo fixture source

**Status:** Accepted · **Date:** 2026-07-22

### Context

Dashboard demos need coherent plant data across Today, EMS, Rx, evidence,
analytics, analyst, reports, and admin settings — without inventing live
upstream reads.

### Decision

`packages/web/src/fixtures/demo.ts` is the sole Auto demo plant story. Screens
import shared fixtures/helpers (`demoCriticalAlarmCount`, ledger/Rx sums,
`assetsFixture`, etc.) rather than hard-coding divergent counts.

### Alternatives

- Per-page mock blobs: faster locally, breaks narrative consistency.
- Seed Postgres for UI: heavier, still needs BFF Autopath.

### Consequences

Unit tests assert against derived fixture totals. Intensity demo ships
production units so SEC calculates; Scope 1 stays `not_measured_by_stamped`.
