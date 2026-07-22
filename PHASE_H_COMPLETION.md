# Phase H completion — Enterprise integrations

**Status:** Complete (definitions + fakes; live Entra/Power BI tenants remain human setup)  
**Date:** 2026-07-22

## Completed

- Public `/v1` OpenAPI + Bearer API keys (hash-only storage, scopes, pagination, problem+json)
- Standard Webhooks signing, SSRF guards, admin create/test/redrive, delivery + DLQ model
- Entra config contract + membership-only mapping (local auth coexists)
- Power BI bounded batch helpers + checkpoint math (10k row cap)
- Product telemetry allowlist + web vitals reporter
- AWS CDK Mumbai stack (RDS/ECS/ALB/S3/Secrets) with synth assertions
- Integrations + admin settings routes in Forge UI
- Migration `0007_enterprise`

## Validation

- API tests: 62 passing
- Web unit: 60 passing
- Infra CDK: 1 passing
- Playwright: 10/10 (desktop + 360px mobile)
- Smoke BFF: health/ready/openapi/v1 401 green

## Known limits

- Live Microsoft Entra / Power BI workspace registration is human-owned
- Worker webhook queue created; delivery still callable from API (Auto path)
- CDK placeholder container image — replace with ECR at cutover

## What you learned

- Public API keys must never store plaintext — prefix + hash is enough to look up and verify.
- SSRF is a DNS problem, not just a string check on `localhost`.
- Playwright selectors must prefer main landmarks over nav chrome on mobile.

## Next

Cutover blocked on credentials + `cdk diff` approval. Keep Phase H flags off until contracts/tenants exist.
