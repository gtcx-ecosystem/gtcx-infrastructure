# 1-agentic Integration — {repo-name}

**Status:** {Planned / In Progress / Done}. The governance model is in place. Technical wiring between this repo and `1-agentic` has {not yet begun / begun / been completed}.

---

## Connection Model

```
ai-1-baseline    — Baseline Protocol (open-source AI governance spec)
      ↓
1-agentic        — GTCX internal AI development platform (runs on Baseline)
      ↓
_sop/1-agents/   — Per-repo expression: roles, safety rules, playbooks for {repo-name}
```

`_sop/1-agents/` connects to `1-agentic`. It does not connect to Baseline directly. Baseline is `1-agentic`'s concern.

---

## Current State

Governance is defined and operational:

| Component                       | Location                                    | Status                      |
| ------------------------------- | ------------------------------------------- | --------------------------- |
| Role definitions                | `_sop/1-agents/2-roles/`                    | {Done / In Progress}        |
| Safety rules                    | `_sop/1-agents/4-workflows/safety-rules.md` | {Done / In Progress}        |
| Task playbooks                  | `_sop/1-agents/4-workflows/tasks/`          | {Done / In Progress}        |
| Coordination protocol           | `_sop/1-agents/3-structure/coordination.md` | {Done / In Progress}        |
| Technical wiring to `1-agentic` | —                                           | {Not started / In progress} |

---

## Integration Requirements

When `1-agentic` integration work begins for `{repo-name}`, the following must be established:

### 1. Archetype library in `1-agentic`

The roles in `_sop/1-agents/2-roles/` reference archetypes at `1-agentic/archetypes/`. Those canonical definitions must be produced by `1-agentic`:

{List archetypes required for this repo, e.g.:}

- `1-agentic/archetypes/{role-1}`
- `1-agentic/archetypes/{role-2}`

The role files here will extend those definitions rather than stand alone.

### 2. Agent provisioning

When `1-agentic` defines the provisioning model, each role file in `_sop/1-agents/2-roles/` will need a provisioning section: what context is loaded at session start, what tools are permitted, and what approval gates are enforced.

### 3. Coordination runtime

If `1-agentic` provides a runtime for multi-agent coordination (task routing, escalation, handoffs), the coordination model in `_sop/1-agents/3-structure/coordination.md` will need to map to those runtime primitives.

### 4. Safety rule enforcement

Currently, safety rules are documented constraints enforced by convention and human review. If `1-agentic` provides machine-enforced safety policies, the rules in `_sop/1-agents/4-workflows/safety-rules.md` will need to be expressed in the policy format `1-agentic` supports.

### 5. Session protocol automation

`_sop/1-agents/1-onboarding/orientation.md` defines a manual session-start reading protocol. `1-agentic` may automate context loading — injecting orientation files, role constraints, and safety rules at session start based on the agent's assigned role.

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

- [`_sop/1-agents/README.md`](../README.md) — team roster and role overview
- [`_sop/1-agents/3-structure/coordination.md`](../3-structure/coordination.md) — multi-role coordination protocol
- [`_sop/1-agents/4-workflows/safety-rules.md`](../4-workflows/safety-rules.md) — safety rules
- `1-agentic` — GTCX internal AI development platform
- `ai-1-baseline` — Baseline Protocol
