# experience-integration

Engineering workspace with the **[cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding)** Cursor configuration vendored for cloud agents and local use.

## What's included

| Asset | Count / notes |
|-------|----------------|
| Skills | 36 under `.cursor/skills/` |
| Rules | 21 `.mdc` files under `.cursor/rules/` |
| Orchestration | `AGENTS.md` |
| Manifest | `skills-manifest.json` |
| Docs | `docs/` (Spec Kit, MCP, learning, stack catalog) |
| MCP | Agent Patterns Catalog via `.cursor/mcp.json` |

Source config: [Vinayak-RZ/cursor-config-coding](https://github.com/Vinayak-RZ/cursor-config-coding)

## Workflow (summary)

1. **Ponytail** — read before any code change (minimal, production-grade diffs)
2. **Nawab plans** — mandatory in Plan mode
3. **Spec Kit** — for greenfield / multi-phase features (`docs/SPEC_KIT.md`)
4. Plan → approve → implement → validate → conventional commit

## Spec Kit scaffold (optional)

Skills are already present. To scaffold `.specify/` in this repo (requires PowerShell + `uv`):

```powershell
.\scripts\install-spec-kit.ps1 -Target "$(pwd)"
```

## Updating the config

```bash
./scripts/sync-from-upstream.sh
# Review diff, then commit
```
