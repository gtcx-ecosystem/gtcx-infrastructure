---
title: 'Agent Execution Obligation — Protocol 27 Adoption'
status: established
protocol: gtcx-docs/docs/governance/protocols/27-agent-execution-obligation/
date: 2026-06-03
owner: gtcx-infrastructure
---

# Agent Execution Obligation — Protocol 27 Adoption

This repo implements [Protocol 27 — Agent Execution Obligation](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/27-agent-work-selection/protocol.md).

## Principle

Agents **run** verifiable commands themselves. They do not outsource runnable work to the human terminal.

## Verification ladder (V1–V6)

| Step | Command                                            | Required when                                       |
| ---- | -------------------------------------------------- | --------------------------------------------------- |
| V1   | `git status`, `git diff --stat`                    | Always                                              |
| V2   | `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | Documented in `package.json`                        |
| V3   | `pnpm test` (quick) or `pnpm test:full`            | Tests exist for changed behavior                    |
| V4   | `node tools/scripts/validate-all.mjs`              | Story touches deploy, evidence, or cross-repo probe |
| V5   | Hub validators in `gtcx-docs` checkout             | Changes in `gtcx-docs` coordination                 |
| V6   | Sibling-repo command in **owner checkout**         | Cross-repo `XR-*` implementation (Protocol 24)      |

## Quality-gate scripts

```bash
# Quick validation (V2–V3)
pnpm lint
pnpm typecheck
pnpm test

# Full validation (V2–V4)
pnpm test:full
node tools/scripts/validate-all.mjs
```

## Adoption artifacts

| Artifact            | Path                                                       |
| ------------------- | ---------------------------------------------------------- |
| AGENTS.md Phase 5.7 | `AGENTS.md`                                                |
| Cursor rule         | `.cursor/rules/protocol-27-agent-execution-obligation.mdc` |
| Adoption check      | `scripts/check-agent-execution-obligation.mjs`             |
| This manifest       | `docs/operations/agent-execution-obligation.md`            |

## Non-negotiables

1. **No "verify locally" delegation** — agents run `pnpm test`, `pnpm lint`, etc. in-session.
2. **Permission Unblock Report** — when blocked, emit structured report with enablement steps, then re-run.
3. **CI parity** — CI runs the same commands agents must run (no drift).

## Forbidden patterns

- "Verify locally: `cd repo && pnpm test`"
- "You should run the validators before merge"
- "Run this in your terminal and share the output"
