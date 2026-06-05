---
title: '03-platform/scripts/ — Cross-Repo Automation'
status: 'current'
date: '2026-05-24'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['scripts', 'cross-repo', 'agent-sync', 'top-level']
review_cycle: 'on-change'
---

# 03-platform/scripts/ — Cross-Repo Automation

**Charter:** Top-level convenience scripts that don't fit cleanly inside `04-ship/03-platform/scripts/` (runtime ops) or `03-platform/tools/03-platform/scripts/` (CI validators). Typically cross-repo coordination or one-shot intelligence-deploy convenience. Keep this directory small — when a script grows beyond one-purpose, move it to the right home.

## What belongs here

- Cross-repo coordination utilities (e.g. agent-orchestration file sync)
- One-shot top-level convenience scripts that operators run from repo root
- Anything that genuinely spans both `04-ship/` and `03-platform/tools/` boundaries

## What does NOT belong here

- Runtime operations (deploy, migrate, bootstrap) → use [`04-ship/03-platform/scripts/`](../04-ship/03-platform/scripts/README.md)
- CI validators / lint / hygiene → use [`03-platform/tools/03-platform/scripts/`](../03-platform/tools/03-platform/scripts/README.md)
- Per-workspace-package scripts → use that package's `package.json`

## Contents

| Path                                                 | Purpose                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`agent-sync/`](./agent-sync/)                       | Cross-LLM agent instruction synchronization (`claude`, `gemini`, `codex`, etc.)                      |
| [`deploy-intelligence.sh`](./deploy-intelligence.sh) | One-shot intelligence-engine deployment helper (top-level for ergonomics; wraps lower-level scripts) |

## Three-locations charter (quick reference)

| Directory                                                                                      | Charter                                       | Language             | Touches production? |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------- | ------------------- |
| [`04-ship/03-platform/scripts/`](../04-ship/03-platform/scripts/README.md)                     | Runtime ops (deploy, migrate, bootstrap)      | bash                 | Yes                 |
| [`03-platform/tools/03-platform/scripts/`](../03-platform/tools/03-platform/scripts/README.md) | CI validators + dev tooling                   | `.mjs`, `.sh`, `.py` | No                  |
| `03-platform/scripts/` (this dir)                                                              | Cross-repo automation + top-level convenience | mixed                | Rare                |

When in doubt: if a script invokes `aws`/`kubectl`/`terraform` against a real environment, it's `04-ship/03-platform/scripts/`. If it validates/lints/snapshots, it's `03-platform/tools/03-platform/scripts/`. Else it's here.
