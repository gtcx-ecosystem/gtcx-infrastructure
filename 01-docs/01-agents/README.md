# agents/ — gtcx-infrastructure

**Start here** for terminal-specific agent guidance. Universal protocols stay in `gtcx-docs`; repo operations stay in `02-ops/` + `01-docs/`.

## Which file for my terminal?

| Terminal           | Read first                                     | Config location                                                            |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| **Any**            | [`universal/README.md`](./universal/README.md) | P22–P29 session card                                                       |
| **Cursor**         | [`cursor/README.md`](./cursor/README.md)       | [`AGENTS.md`](../../AGENTS.md), [`.cursor/`](../../.cursor/)               |
| **Claude Code**    | [`claude/README.md`](./claude/README.md)       | [`.claude/CLAUDE.md`](../../.claude/CLAUDE.md)                             |
| **Gemini**         | [`gemini/README.md`](./gemini/README.md)       | [`.gemini/GEMINI.md`](../../.gemini/GEMINI.md)                             |
| **Kimi CLI**       | [`kimi/README.md`](./kimi/README.md)           | [`.kimi/`](../../.kimi/)                                                   |
| **Codex**          | [`codex/README.md`](./codex/README.md)         | [`.agent/`](../../.agent/)                                                 |
| **GitHub Copilot** | [`copilot/README.md`](./copilot/README.md)     | [`.github/copilot/instructions.md`](../../.github/copilot/instructions.md) |

## Layer map

| Layer                  | Path                                   | Role                                                             |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| **Machine sync**       | [`.agent/`](../../.agent/)             | `pnpm agent:sync` generator SoR — do not hand-edit synced blocks |
| **Discoverable index** | **`01-docs/01-agents/`** (this folder) | Terminal routing + protocol pointers                             |
| **Operational**        | [`02-ops/`](../../02-ops/)             | JSON manifests, gates, backlog                                   |
| **Narrative**          | [`01-docs/`](../)                      | Procedures, audit lenses, assurance programs                     |

## Session commands

```bash
pnpm workspace:check
pnpm pm:sync
pnpm agent:next-work    # when P22 manifest exists
```

<!-- gtcx-agents-folder-v1 -->
