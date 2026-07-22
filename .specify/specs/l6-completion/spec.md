# Feature Specification: Complete Stamped L6

**Feature:** L6 Experience & Integration
**Created:** 2026-07-22
**Status:** Approved for implementation
**Authority:** `external/technical/layers/L6-experience-and-integration.md`

## Product intent

Stamped L6 is the customer-facing operational control room for industrial
energy teams. It must help each role clear work, understand proof, defend
savings, and share trustworthy energy outcomes without exposing the
complexity of the underlying L2–L5 systems.

## User scenarios

### US1 — Operate one or more authorized plants (Priority P0)

An invited user signs in, lands on the surface for their role, switches among
authorized plants, and never sees data or actions for another organization or
unauthorized plant.

**Independent acceptance**

1. An admin invites a user and assigns organization, plants, and role.
2. The user verifies the account, signs in, and can reset a forgotten password.
3. The plant switcher lists only authorized plants and remembers the choice.
4. A forged organization, plant, or entity reference is rejected.
5. An admin can deactivate the user and revoke sessions.

### US2 — Clear alarms and prescriptions (Priority P0)

Operators and supervisors see severity/value-ranked work and complete the next
decision from desktop or mobile with proof one action away.

**Independent acceptance**

1. Today presents at most seven linked decision signals.
2. An operator can navigate alarms by keyboard and acknowledge an alarm from a
   360px mobile viewport.
3. A supervisor can acknowledge, assign, defer, reject, and mark a prescription
   done; defer and reject require a reason.
4. Repeated writes with the same idempotency key create one upstream effect.
5. A disconnected live stream becomes visibly stale and resumes without a
   missing or duplicated event.
6. Unsupported upstream actions are visibly unavailable, never simulated as
   successful by L6.

### US3 — Inspect evidence and savings (Priority P0)

Plant heads, energy managers, sustainability users, and CFOs inspect the
telemetry, lineage, methodology, and claim status behind operational outcomes.

**Independent acceptance**

1. Alarm and prescription details deep-link to a pre-scoped evidence window.
2. Evidence identifies metric, asset, time range, baseline availability,
   anomaly window, rule/tariff references, and lineage where supplied.
3. Potential, modeled, ops-confirmed, disputed, and future bill-verified states
   are never conflated.
4. A missing baseline, factor, or series is labelled and no value is invented.
5. Ledger and prescription audit data can be downloaded as safe, stable CSV.

### US4 — Investigate energy and equipment (Priority P1)

Energy users analyze trends, equipment condition, demand, tariff periods,
intensity, renewable contribution, power factor, and applicable emissions
without turning Today into a chart gallery.

**Independent acceptance**

1. Advanced modules stay behind role-aware progressive disclosure.
2. Dense telemetry remains interactive on supported desktop and mobile devices.
3. Charts provide text descriptions and a tabular alternative.
4. Missing production, fuel, renewable, or emissions inputs remain explicit.

### US5 — Ask the analyst safely (Priority P1)

Users ask questions about the current screen or use a full cited investigation
workspace, then explicitly confirm any action handoff.

**Independent acceptance**

1. Context chips are visible and removable before a message is sent.
2. A cross-tenant focus entity is rejected.
3. Answers distinguish citations, abstentions, and errors.
4. The contextual panel restores focus when closed.
5. No proposed action reaches workflow truth without a separate confirmation.

### US6 — Produce sustainability evidence (Priority P1)

Sustainability users generate, review, approve, and download repeatable PDF and
XLSX packs suitable for internal review and selected BRSR/PAT workpapers.

**Independent acceptance**

1. Artifacts disclose period, plant, methodology, source lineage, emission
   factors, limitations, and unavailable metrics.
2. The pack covers energy consumption, SEC, applicable Scope 1/2 emissions,
   renewable percentage, demand charges, power factor, savings, and monthly
   KPIs where source data exists.
3. Generation is asynchronous, retryable, and does not block a web request.
4. Failed jobs are visible and can be safely retried.
5. External send requires an explicit approval.

### US7 — Administer and integrate L6 (Priority P2)

Admins manage users, local authentication, Microsoft Entra, API keys,
webhooks, report schedules, and Power BI without exposing secrets.

**Independent acceptance**

1. Local authentication and Entra coexist under the same memberships/RBAC.
2. API keys are scoped, expiring, rotatable, hashed at rest, and shown once.
3. Public list endpoints are paginated and writes are idempotent.
4. Webhook endpoints reject unsafe destinations, verify signatures, show
   delivery history, and support redrive after bounded retries.
5. A Power BI workspace receives a checkpointed, bounded batch sync and can be
   manually retried.
6. Integration secrets are references to a secret manager, not stored values.

## Functional requirements

### Identity and access

- **FR-001:** The product MUST disable public self-registration.
- **FR-002:** Admins MUST be able to invite, deactivate, and assign users to
  organization-scoped plants and roles.
- **FR-003:** The product MUST support verified email, password reset, secure
  sessions, session revocation, and optional TOTP MFA.
- **FR-004:** Every protected read and action MUST enforce organization,
  plant, and permission server-side.
- **FR-005:** Microsoft Entra sign-in MUST map only to existing authorized
  membership and MUST NOT derive plant permissions directly from identity
  claims.

### Operational experience

- **FR-006:** Today MUST show no more than seven role-relevant decision signals.
- **FR-007:** The alarm console MUST support raised, acknowledged, escalated,
  silenced, and cleared display states and only actions published by L5.
- **FR-008:** The prescription queue MUST support Needs review, Active,
  Verifying, and Closed projections with required reasons for defer/reject.
- **FR-009:** Alarm and prescription writes MUST carry an idempotency key.
- **FR-010:** Every primary route MUST provide default, loading, empty, error,
  stale, forbidden, and partial-data states.
- **FR-011:** The product MUST provide role-aware desktop and 360px mobile
  navigation and actions.

### Evidence, claims, analytics, and analyst

- **FR-012:** Evidence MUST be pre-scoped to the source alarm/prescription and
  disclose supplied baseline, anomaly, rule, tariff, and lineage context.
- **FR-013:** Claim status MUST distinguish potential/pending, modeled,
  ops-confirmed, disputed, and future bill-verified.
- **FR-014:** Missing data MUST be labelled and MUST NOT be inferred.
- **FR-015:** Advanced analytics MUST remain progressively disclosed and
  accessible as charts plus tabular alternatives.
- **FR-016:** Analyst context MUST be typed, visible, removable, tenant-checked,
  and free of hidden page content.
- **FR-017:** Analyst actions MUST require explicit confirmation.

### Reports and integrations

- **FR-018:** Ledger and prescription audit CSV exports MUST use stable columns,
  explicit units/timezone, and spreadsheet-formula injection protection.
- **FR-019:** Sustainability PDF/XLSX reports MUST be reproducible,
  asynchronous, reviewable, and approval-gated before external send.
- **FR-020:** Public APIs MUST use versioned contracts, pagination, scoped
  authentication, rate limits, stable problem responses, and idempotency.
- **FR-021:** Outbound webhooks MUST use Standard Webhooks-compatible signing,
  replay protection, bounded retry, DLQ, delivery history, and safe redrive.
- **FR-022:** The Power BI pilot MUST use bounded batches and durable
  checkpoints.

### Reliability, security, and observability

- **FR-023:** Live updates MUST resume from a durable event ID with no event
  gaps or duplicate domain effects.
- **FR-024:** The browser MUST never receive L2/L4/L5 service credentials.
- **FR-025:** Logs and product telemetry MUST exclude secrets and PII.
- **FR-026:** Product telemetry MUST capture time-to-ack, closure, evidence
  opens, exports, and integration adoption using allowlisted properties.
- **FR-027:** The product MUST remain read-only toward OT/SCADA systems.

## Edge cases

- User belongs to no active plant, one plant, or multiple plants.
- Active plant preference points to a removed membership.
- Upstream returns partial data, a timeout, an unknown new status, or a stale
  cursor.
- A mutation succeeds upstream but the client disconnects before receiving the
  response.
- The same event is polled more than once or notification delivery is lost.
- Telemetry contains gaps, bad quality, duplicate timestamps, or a range too
  large for raw resolution.
- A report is requested twice, runs beyond its timeout, or loses its browser
  process.
- A CSV value begins with spreadsheet formula characters.
- A webhook hostname resolves to a private address after registration.
- Entra returns a valid identity without an L6 membership.
- Power BI throttles, partially accepts a batch, or the checkpoint is stale.

## Success criteria

- **SC-001:** Every role completes its primary journey without encountering an
  unauthorized action or unrelated module.
- **SC-002:** Alarm acknowledgement and prescription defer/done complete on a
  360px mobile viewport using touch targets of at least 44px.
- **SC-003:** All cross-tenant test cases are denied and expose no foreign
  resource existence.
- **SC-004:** Reconnecting live sessions show every committed event once in
  order from the user's perspective.
- **SC-005:** At least 75% of measured mobile and desktop visits meet LCP
  ≤2.5s, INP ≤200ms, and CLS ≤0.1.
- **SC-006:** No primary route ships more than 350 kB gzip of JavaScript, with a
  target of 250 kB; chart code is absent from non-chart routes.
- **SC-007:** A sampled 30-day minute-resolution chart remains usable at a
  minimum 30fps interaction floor on the benchmark device.
- **SC-008:** PDF and XLSX outputs from the same approved dataset disclose the
  same totals, factors, period, and unavailable fields.
- **SC-009:** Public API, webhook, and Power BI acceptance flows complete using
  only documented configuration.
- **SC-010:** The complete validation command exits successfully with no
  unresolved critical or high security finding.

## Assumptions and dependencies

- L5 will publish the missing alarm lifecycle writes before production
  operational acceptance.
- L2 will publish customer-safe ledger and baseline reads before production
  ledger/evidence acceptance.
- L4 may remain fixture-backed until its live chat contract is available.
- SES, Entra, Power BI, and AWS registrations are supplied only at cutover.
- PostgreSQL is the sole L6 state, event-coordination, and job dependency
  through P2; Redis remains deferred.
