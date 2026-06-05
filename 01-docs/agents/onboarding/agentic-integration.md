---
title: '1-agentic Integration — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['security', 'architecture', 'infrastructure', 'frontend', 'devops']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# 1-agentic Integration — gtcx-infrastructure

**Status:** Planned. The governance model is in place and operational. Technical wiring between this repo and `1-agentic` has not yet begun.

---

## Connection Model

```
ai-1-baseline    — Baseline Protocol (open-source AI governance spec)
      ↓
1-agentic        — GTCX internal AI development platform (runs on Baseline)
      ↓
01-docs/01-agents/   — Per-repo expression: roles, safety rules, playbooks for gtcx-infrastructure
```

`01-docs/01-agents/` connects to `1-agentic`. It does not connect to Baseline directly. Baseline is `1-agentic`'s concern.

---

## Current State

Governance is defined and operational:

| Component                       | Location                                        | Status      |
| ------------------------------- | ----------------------------------------------- | ----------- |
| Role definitions                | `01-docs/01-agents/2-roles/`                    | In Progress |
| Safety rules                    | `01-docs/01-agents/workflows/safety-rules.md`   | Done        |
| Task playbooks                  | `01-docs/01-agents/workflows/tasks/`            | In Progress |
| Coordination protocol           | `01-docs/01-agents/3-structure/coordination.md` | In Progress |
| Technical wiring to `1-agentic` | —                                               | Not started |

---

## Integration Requirements

When `1-agentic` integration work begins for `gtcx-infrastructure`, the following must be established:

### 1. Archetype library in `1-agentic`

The roles in `01-docs/01-agents/2-roles/` reference archetypes at `1-agentic/archetypes/`. Those canonical definitions must be produced by `1-agentic`:

- `1-agentic/archetypes/infrastructure-architect`
- `1-agentic/archetypes/security-engineer`
- `1-agentic/archetypes/site-reliability-engineer`
- `1-agentic/archetypes/devops-engineer`

The role files here will extend those definitions rather than stand alone.

### 2. Agent provisioning

When `1-agentic` defines the provisioning model, each role file in `01-docs/01-agents/2-roles/` will need a provisioning section: what context is loaded at session start, what tools are permitted, and what approval gates are enforced.

### 3. Coordination runtime

If `1-agentic` provides a runtime for multi-agent coordination (task routing, escalation, handoffs), the coordination model in `01-docs/01-agents/3-structure/coordination.md` will need to map to those runtime primitives.

### 4. Safety rule enforcement

Currently, safety rules are documented constraints enforced by convention and human review. If `1-agentic` provides machine-enforced safety policies, the rules in `01-docs/01-agents/workflows/safety-rules.md` will need to be expressed in the policy format `1-agentic` supports.

### 5. Session protocol automation

`01-docs/01-agents/onboarding/orientation.md` defines a manual session-start reading protocol. `1-agentic` may automate context loading — injecting orientation files, role constraints, and safety rules at session start based on the agent's assigned role.

---

## Inputs Required Before Starting

Before technical integration begins, confirm:

1. What is the canonical archetype format? (file format, fields, extension model)
2. What is the provisioning model for repo-scoped agents?
3. Is there a machine-readable safety policy format, or is documentation-as-policy the current model?
4. What does `1-agentic` currently provide vs. what is still planned?

---

## What Does Not Change

The substance of this repo's governance is stable regardless of how `1-agentic` evolves. Roles, safety rules, escalation triggers, and task playbooks are correct as written. Integration adds enforcement and automation — it does not redesign the governance model.

---

## Reference

- `01-docs/01-agents/README.md` (`./README.md`) — team roster and role overview
- `01-docs/01-agents/3-structure/coordination.md` (`./3-structure/coordination.md`) — multi-role coordination protocol
- [`01-docs/01-agents/workflows/safety-rules.md`](../workflows/agent-safety-rules.md) — safety rules
- `1-agentic` — GTCX internal AI development platform
- `ai-1-baseline` — Baseline Protocol
