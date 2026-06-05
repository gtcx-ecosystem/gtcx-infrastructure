# Cursor — gtcx-infrastructure

| Resource            | Path                                                        |
| ------------------- | ----------------------------------------------------------- |
| **Canonical entry** | [`AGENTS.md`](../../AGENTS.md)                              |
| Rules               | [`.cursor/rules/`](../../.cursor/rules/)                    |
| CLI config          | [`.cursor/cli.json`](../../.cursor/cli.json) (when present) |

Cursor reads **`AGENTS.md`** at repo root. Synced blocks come from [`.agent/`](../../.agent/) via `pnpm agent:sync`.

**Workspace:** [`workspace/`](../../workspace/) · **Protocols:** [`agents/universal/`](../universal/)
