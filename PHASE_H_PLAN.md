# Phase H execution plan (approved by user: DO)

Goal: Ship enterprise surfaces deferred earlier + remaining hardening (Playwright, GHA, UI audit).

Scope:
- Public `/v1` + API keys + OpenAPI + pagination/problem+json
- Standard Webhooks (sign, SSRF guard, admin, pg-boss delivery)
- Entra OIDC config + coexistence with local auth (fixture/fake IdP tests)
- Power BI bounded batch sync + checkpoint
- Product telemetry (allowlisted events, no PII)
- AWS CDK Mumbai definitions (synth + assertions)
- Playwright E2E + smoke expansion + unit tests
- GitHub Actions browser/e2e job
- Impeccable UI audit + polish

Non-goals:
- Live Microsoft tenant / real Power BI workspace (acceptance scripts + fakes)
- Full Schemathesis in CI (contract tests instead)
- Hindi / native mobile / Redis

Risks: new deps (playwright, aws-cdk); keep Auto product path unbroken.
