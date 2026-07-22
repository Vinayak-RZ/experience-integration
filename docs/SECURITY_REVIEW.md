# L6 security review (Phase N)

**Date:** 2026-07-22  
**Scope:** Product BFF + Forge web (public `/v1` deferred)

## Findings

| ID | Severity | Area | Status | Notes |
|----|----------|------|--------|-------|
| S-01 | High (mitigated) | Auth cookies | Closed | httpOnly session cookies; CSRF/origin checks covered in API security tests |
| S-02 | High (mitigated) | Tenancy | Closed | Plant membership fail-closed; L2/L4 tenant headers; cross-tenant analyst rejected |
| S-03 | High (mitigated) | Secrets | Closed | Browser never receives L2/L4/L5 service keys; `L2_DATABASE_URL` hard-refused |
| S-04 | Medium (mitigated) | CSV injection | Closed | Formula prefixes `= + - @` neutralized in export builders |
| S-05 | Medium (mitigated) | Analyst actions | Closed | Preview → explicit confirm; injection-like replies yield no proposal |
| S-06 | Medium (open) | Playwright E2E | Open | Browser matrix not installed — residual risk on mobile/desktop journeys |
| S-07 | Low (accepted) | Report worker | Accepted | Auto inline completion until out-of-process worker mutates artifacts |
| S-08 | Info | Phase H surface | Deferred | Public API/webhooks/Entra not in Auto scope |

## Residual risk

No known **critical** open items in the Auto product path. Highest open item is
missing Playwright E2E (S-06). Do not treat cutover as certified until S-06 is
closed or explicitly accepted by the pilot owner.

## Review checklist (re-run before cutover)

- [ ] `./scripts/validate.sh` green
- [ ] No secrets in logs (`redact` paths)
- [ ] Authz matrix unchanged for ledger/report export roles
- [ ] Feature flags for L5 ack/escalate and L2 ledger/baseline still default off unless contracts published
