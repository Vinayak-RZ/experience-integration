#!/usr/bin/env bash
# Sync Cursor coding config from upstream into this repo (Linux/macOS).
# Usage: ./scripts/sync-from-upstream.sh [repo-url]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${1:-https://github.com/Vinayak-RZ/cursor-config-coding.git}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Cloning $URL ..."
git clone --depth 1 "$URL" "$TMP/config"

echo "Syncing .cursor/, docs/, scripts/, AGENTS.md, skills-manifest.json ..."
rsync -a --delete \
  --exclude 'skills-catalog/.cache/' \
  "$TMP/config/.cursor/" "$ROOT/.cursor/"
rsync -a "$TMP/config/docs/" "$ROOT/docs/"
rsync -a --exclude 'sync-from-upstream.sh' "$TMP/config/scripts/" "$ROOT/scripts/"
cp "$TMP/config/skills-manifest.json" "$ROOT/skills-manifest.json"

{
  printf '%s\n' \
    '> **Project:** `experience-integration`' \
    '> Config vendored from [cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding). Project-specific overrides belong in this file.' \
    ''
  cat "$TMP/config/AGENTS.md"
} > "$ROOT/AGENTS.md"

echo "Done. Review diff, then commit."
