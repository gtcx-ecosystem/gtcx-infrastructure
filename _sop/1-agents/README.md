# Agent Team — gtcx-infrastructure

The agentic team responsible for building and maintaining `gtcx-infrastructure`. Human and AI agents operating through `1-agentic` — GTCX's internal AI development platform.

## Governing Standard

This folder is the per-repo expression of `1-agentic` for `gtcx-infrastructure`. It defines the roles, safety rules, and task playbooks specific to this codebase. Canonical archetype definitions live in `1-agentic`. `1-agentic` runs on Baseline (`ai-1-baseline`), but this folder connects to `1-agentic` — not to Baseline directly.

## Team Roster

| Role                                                                      | Archetype                                       | Owns                                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| [Infrastructure Engineer](./roles/protocol-architect.md)                  | `1-agentic/archetypes/frontier-infra-engineer`  | K8s manifests, Terraform modules, Docker images, env topology |
| [Infrastructure Security Engineer](./roles/protocol-security-engineer.md) | `1-agentic/archetypes/crypto-security-engineer` | Security policies, network policies, secrets, Trivy scanning  |
| [Database & Migration Lead](./roles/sdk-integration-engineer.md)          | `1-agentic/archetypes/frontier-infra-engineer`  | Migrations, schema, operational + audit PostgreSQL instances  |
| [Release & CD Engineer](./roles/quality-evidence-lead.md)                 | `1-agentic/archetypes/quality-evidence-lead`    | CI gates, deploy pipeline, release signoffs, rollback process |

## Orientation

Any agent or team member entering this repo must read, in this order:

1. `_sop/1-agents/orientation.md` — repo map, environment topology, key commands
2. `_sop/1-agents/safety-rules.md` — three-tier authority structure
3. The role file for the work being performed
4. `_sop/1-agents/context-recovery.md` — how to recover context after a session break

## 1-agentic Integration

`_sop/1-agents/` connects to `1-agentic`. The technical wiring is planned but not yet built. See [`1-agentic-integration.md`](./1-agentic-integration.md) for current state.

## Common Tasks

| Task                          | Playbook                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| Write or update an ADR        | [tasks/write-adr.md](./tasks/write-adr.md)                           |
| Investigate a CI gate failure | [tasks/investigate-ci-failure.md](./tasks/investigate-ci-failure.md) |
| Cut a release                 | [tasks/cut-release.md](./tasks/cut-release.md)                       |
