# Upstream OpenAPI snapshots

Pinned OpenAPI 3.1 snapshots for L2 / L4 / L5 HTTP surfaces that L6 consumes.

## Source rule

Snapshots are copied from sibling repos or from `stamped-external` once those
repos publish OpenAPI. Until live OpenAPI is available, **fixture placeholders**
document the expected contract shape and known gaps from
`docs/integration/UPSTREAM_AGENT_PROMPTS.md`.

Do not invent production truth. When a sibling publishes real OpenAPI:

1. Replace the placeholder with the published document.
2. Update `SOURCE.md` with repo, path, and commit SHA.
3. Run `pnpm contracts:upstream`.
4. Bump `external/` if the platform consumer README changed.

## Known gaps (blocked upstream)

| Layer | Gap | L6 mitigation |
|-------|-----|---------------|
| L5 | Missing ack / escalate / unsilence HTTP | Feature-gated adapter + fixtures |
| L2 | Missing customer-safe ledger/baseline reads | Fixture adapter; no `L2_DATABASE_URL` |

## Drift check

`scripts/check-upstream-contracts.mjs` verifies:

- each layer has `openapi.json` + `SOURCE.md`;
- OpenAPI documents parse as JSON with `openapi` major 3;
- checksums recorded in `manifest.json` match files on disk.
