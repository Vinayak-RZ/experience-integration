#!/usr/bin/env bash
# Compose-parity smoke without requiring Docker: migrate + health/ready inject.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
: "${DATABASE_URL:=postgres://stamped:stamped@127.0.0.1:5432/stamped_l6}"
export DATABASE_URL
pnpm --filter @stamped/l6-api db:migrate
pnpm --filter @stamped/l6-api exec tsx "$ROOT/scripts/smoke-bff.ts"
echo "compose-smoke: OK"
