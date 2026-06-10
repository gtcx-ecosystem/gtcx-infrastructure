---
id: platform-operator
type: primary
---

# Platform operator

| Field                | Value                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **id**               | `platform-operator`                                                                                                                      |
| **name**             | Platform operator (infra custodian)                                                                                                      |
| **type**             | primary                                                                                                                                  |
| **institutionalMap** | [platform-architect](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/institutional/personas/platform-architect.md) |

## Context

Custodian agent or senior SRE operating **gtcx-infrastructure** from Cursor/CI. Works in `af-south-1` staging with `kubectl`, Terraform, and repo scripts — not by forwarding runbooks to a human. Success means sibling repos unblock without infra becoming the long pole.

## Goals

- Ship staging substrate changes with witness evidence (exit codes, JSON probes)
- Keep fleet health green across compliance-os, markets, intelligence, terminal-os paths
- Close DaaS/SECaaS friction items without freezing product engineering (`blocksIR: false`)

## Pain points

| Pain                                                                                      | Tag                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Runbook paste blocks violate P27 — operator asked to run `aws`/`kubectl` instead of agent | `validated` (master-audit 2026-06-10)                  |
| Cross-repo health probes timeout on external hostnames while in-cluster is healthy        | `validated` (compliance-gateway 525 vs in-cluster 200) |
| Staging cluster CPU contention blocks rollouts                                            | `validated` (session 2026-06-10)                       |

## Success signals

- `pnpm daas:fleet:health` → PASS 4/4
- `node platform/tools/scripts/validate-all.mjs` → 55/55
- Coordination seal published per handoff (`docs/operations/coordination/from-gtcx-infrastructure-*`)

## Anti-personas

- **End trader / field inspector** — commodity workflows are sibling-repo EXRs
- **Casual script contributor** — changes without friction-register or witness are rejected at review
