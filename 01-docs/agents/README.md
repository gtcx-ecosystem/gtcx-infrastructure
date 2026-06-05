# 01-docs/01-agents/ — gtcx-infrastructure

**Start here** for terminal-specific agent guidance. Universal protocols stay in `gtcx-docs`; repo operations stay in `workspace/` + `01-docs/`.

> **Note:** `gtcx-agentic` reserves repo-root `agents/` for the persona **code package**. Terminal index is always `01-docs/01-agents/` ecosystem-wide.

## Which file for my terminal?

| Terminal           | Read first                                     | Config location                                                            |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| **Any**            | [`universal/README.md`](./universal/README.md) | P22–P29 session card                                                       |
| **Cursor**         | [`cursor/README.md`](./cursor/README.md)       | [`AGENTS.md`](../../AGENTS.md), [`.cursor/`](../../.cursor/)               |
| **Claude Code**    | [`claude/README.md`](./claude/README.md)       | [`CLAUDE.md`](../../CLAUDE.md), [`.claude/`](../../.claude/)               |
| **Gemini**         | [`gemini/README.md`](./gemini/README.md)       | [`GEMINI.md`](../../GEMINI.md)                                             |
| **Kimi CLI**       | [`kimi/README.md`](./kimi/README.md)           | [`KIMI.md`](../../KIMI.md)                                                 |
| **Codex**          | [`codex/README.md`](./codex/README.md)         | [`CODEX.md`](../../CODEX.md)                                               |
| **GitHub Copilot** | [`copilot/README.md`](./copilot/README.md)     | [`.github/copilot/instructions.md`](../../.github/copilot/instructions.md) |

## Layer map

| Layer              | Path                                   | Role                                                    |
| ------------------ | -------------------------------------- | ------------------------------------------------------- |
| **Machine sync**   | [`.agent/`](../../.agent/)             | `pnpm agent:sync` generator SoR                         |
| **Terminal index** | **`01-docs/01-agents/`** (this folder) | Route Cursor / Claude / Gemini / Kimi / Codex / Copilot |
| **Operational**    | [`workspace/`](../../workspace/)       | JSON manifests, gates, backlog                          |
| **Narrative**      | [`01-docs/`](../)                      | Procedures, audit lenses, assurance programs            |

<!-- gtcx-agents-folder-v1 -->
