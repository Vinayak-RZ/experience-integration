<!--
Sync Impact Report
- Version: template → 1.0.0
- Added principles: platform authority; layer isolation; claim honesty;
  tenant safety; operational UX; testable delivery
- Added sections: Product and technical constraints; Development workflow
- Templates: existing Spec Kit templates remain compatible
- Deferred items: none
-->
# Stamped L6 Constitution

## Core Principles

### I. Platform Authority Is Singular

`external/` MUST remain the source of truth for Stamped contracts, ADRs,
technical architecture, and Forge design. Consumer code MUST reference shared
schemas rather than fork them. A semantic conflict MUST be recorded and
proposed upstream before implementation changes platform meaning.

### II. Layer Boundaries Are Non-Negotiable

The browser MUST call the L6 BFF. L6 MUST communicate with L2, L4, and L5
through documented HTTP contracts only. L6 MUST NOT receive L2 database
credentials, write OT/SCADA systems, implement L4 RAG, or become the source of
L5 workflow/alarm truth.

### III. Claims Must Be Honest

Customer-facing status MUST distinguish `pending`, `modeled`,
`ops_confirmed`, `disputed`, and future bill `verified`. Ops clearance MUST
NOT imply DISCOM or bill verification. Missing data, factors, series, and
methodology MUST be visible rather than inferred or fabricated.

### IV. Tenant Safety Is Fail-Closed

Every protected operation MUST resolve authenticated identity, organization
membership, plant membership, and permission on the server. Cross-tenant
access MUST fail closed and receive automated negative tests. Secrets MUST
remain server-side and PII MUST be excluded from logs and product telemetry.

### V. Operational UX Is the Product

The UI MUST prioritize the next high-value operational decision over dashboard
density. Today MUST contain no more than seven decision signals. Desktop and
360px mobile flows, keyboard use, 44px touch targets, visible focus, WCAG AA,
reduced motion, and complete loading/empty/error/stale/forbidden/partial states
are release requirements, not polish.

### VI. Delivery Must Be Testable and Minimal

Each change MUST be the smallest independently testable implementation of one
approved concern. Boundary validation, security, accessibility, and
data-loss-preventing errors are never optional simplifications. Every phase
MUST pass its automated gate, update progress, produce a completion report,
and create a conventional commit before the next phase.

## Product and Technical Constraints

- English is the only product language through P2.
- Redis, WhatsApp magic links, native mobile, SCIM, direct SAP/Tally writes,
  full BRSR filing, and bill-verification claims are excluded.
- PostgreSQL is the only L6 state and coordination service through P2.
- Analyst-generated actions require explicit human confirmation.
- Public APIs require scoped credentials, pagination, rate limiting, stable
  errors, and idempotency for writes.
- Core Web Vitals MUST meet good p75 thresholds on mobile and desktop:
  LCP ≤2.5s, INP ≤200ms, CLS ≤0.1.

## Development Workflow

1. Read `AGENTS.md`, the approved `IMPLEMENTATION_PLAN.md`, relevant rules,
   and platform authority.
2. Apply Ponytail before every code edit.
3. Work one commit-matrix row at a time.
4. Add the smallest appropriate test in the same commit.
5. Run the narrow gate, then the phase gate.
6. Update `PROGRESS.md`, `DECISIONS.md` when needed, and the phase report.
7. Commit conventionally and push according to repository policy.
8. Run the complete validation orchestrator and independent security review
   before cutover.

## Governance

This constitution governs L6 specifications, plans, tasks, and implementation.
Platform ADRs remain higher authority for Stamped semantics. Amendments require
a documented rationale, semantic version change, consistency review across
Spec Kit artifacts, and user approval when scope, security, or product behavior
changes. Pull requests and phase reports MUST include constitution compliance
in their validation evidence.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
