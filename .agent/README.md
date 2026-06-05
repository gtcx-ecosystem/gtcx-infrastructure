# Agent Instruction Source of Truth

This directory is the **source of truth** for the synced sections of every agent-config file in this repo (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/main.mdc`, `CONVENTIONS.md`).

The generator at `03-platform/scripts/agent-sync/sync.mjs` injects content from the partials below into target files, between `<!-- AGENT-SYNC:START -->` and `<!-- AGENT-SYNC:END -->` markers. Anything outside those markers is human-managed.

## Files

| File                | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `base.md`           | Shared content emitted to every target                              |
| `audit-pointer.md`  | Cross-repo audit instructions (points to `../audit/AGENT-START.md`) |
| `claude.partial.md` | Claude-only addenda (Claude.md only)                                |
| `targets.json`      | Maps target files → which partials to include                       |

## Commands

```bash
pnpm agent:sync      # regenerate target files
pnpm agent:check     # CI gate: exit non-zero on drift
```

## Generator updates

The generator `03-platform/scripts/agent-sync/sync.mjs` is vendored from `gtcx-agentic/agent-sync/sync.mjs`. To pull the latest version across the ecosystem, run from gtcx-agentic:

```bash
node agent-sync/rollout.mjs --update-generator
```
