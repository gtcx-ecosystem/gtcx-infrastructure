# 1-agentic Integration

Current state of the connection between `_sop/1-agents/` and the `1-agentic` platform.

---

## What 1-agentic Is

`1-agentic` is GTCX's internal AI development platform. It defines canonical agent archetypes, orchestration patterns, shared tools, and the Baseline governance layer. All repos in the GTCX ecosystem connect their `_sop/1-agents/` folder to `1-agentic`.

`1-agentic` runs on `ai-1-baseline` — the open-source AI governance specification. `_sop/1-agents/` connects to `1-agentic`, not to Baseline directly.

---

## Current State

**Status: Planned — not yet wired**

The `_sop/1-agents/` folder is the per-repo expression of `1-agentic` for `gtcx-protocols`. The role definitions and task playbooks in this folder are written to align with the archetype definitions in `1-agentic`, but the technical integration is not yet established.

What exists today:

- Role files in `_sop/1-agents/roles/` reference their canonical archetype paths in `1-agentic`
- Safety rules in `_sop/1-agents/safety-rules.md` are consistent with `1-agentic` governance model
- Task playbooks in `_sop/1-agents/tasks/` are written in the bounded-autonomy pattern expected by `1-agentic`

What does not exist yet:

- Live connection to `1-agentic` orchestration layer
- Automatic archetype loading at session start
- Cross-repo task delegation from `1-agentic` to this repo
- Shared tooling and memory across the ecosystem

---

## What Needs to Be Established

When `1-agentic` integration work begins, the following must be wired:

### 1. Archetype mapping

Confirm that each role file maps to the correct archetype:

| Role File                             | Archetype in 1-agentic                |
| ------------------------------------- | ------------------------------------- |
| `roles/protocol-architect.md`         | `archetypes/protocol-architect`       |
| `roles/protocol-security-engineer.md` | `archetypes/crypto-security-engineer` |
| `roles/sdk-integration-engineer.md`   | `archetypes/frontier-infra-engineer`  |
| `roles/quality-evidence-lead.md`      | `archetypes/quality-evidence-lead`    |

### 2. Session initialization

Define how an agent entering this repo via `1-agentic` loads:

1. The `1-agentic` archetype definition
2. This repo's CLAUDE.md
3. The role file for the work being performed
4. `_sop/1-agents/orientation.md` and `_sop/1-agents/safety-rules.md`

### 3. Cross-repo task delegation

Protocol changes often require coordination with:

- `gtcx-core` — shared packages (`@gtcx/crypto`, `@gtcx/schemas`)
- `gtcx-platforms` — six platform backends that consume the SDK
- `gtcx-app` — mobile application that integrates TradePass and offline protocols

Define how `1-agentic` hands off work that crosses repo boundaries.

### 4. Shared memory

Define how accumulated knowledge (confirmed patterns, pitfalls, architectural decisions) flows from `1-agentic` ecosystem memory into this repo's `.claude/memory/` files.

---

## In the Meantime

Until integration is live, agents working in this repo operate in standalone mode:

- Follow `_sop/1-agents/safety-rules.md` as the authoritative governance layer
- Use `.claude/memory/` for session persistence
- Treat role files as the primary behavioral contract
- Escalate to the human for anything not covered by the autonomy definitions

---

## Reference

- `_sop/1-agents/README.md`
- `_sop/1-agents/safety-rules.md`
