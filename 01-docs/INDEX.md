---
title: 'GTCX Infrastructure — docs INDEX (layout v3)'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
tier: standard
tags: ['docs', 'ia', 'layout-v3']
---

# Docs INDEX — layout v3 IA map

Machine alias for [`README.md`](./README.md). Agents: start at **README** for narrative; use this table for **path contract** lookups (`01-docs/INDEX.md`).

**Canonical path contract:** [`config/sor-map.json`](../config/sor-map.json) · [`config/paths.mjs`](../config/paths.mjs)

## Layout v3 IA map (hubs)

| Hub        | Path             | Role                                    |
| ---------- | ---------------- | --------------------------------------- |
| Archive    | `00-archive/`    | Retired artifacts                       |
| Docs       | `01-docs/`       | Internal documentation (this tree)      |
| Ops        | `02-ops/`        | PM, coordination, attestation domains   |
| Platform   | `03-platform/`   | Workspace packages + agent scripts      |
| Deploy     | `04-deploy/`     | Terraform, Kubernetes, operator scripts |
| Audit      | `05-audit/`      | Audit entry + evidence hub              |
| Workstream | `06-workstream/` | Active workstream coordination          |

## sor-map paths (selected)

| Key                   | Path                                         |
| --------------------- | -------------------------------------------- |
| `auditEntry`          | `05-audit/AGENT-START.md`                    |
| `auditEvidence`       | `05-audit/evidence/`                         |
| `auditNarrativeIndex` | `01-docs/audit/`                             |
| `agentsCanonical`     | `01-docs/agents/`                            |
| `executionRoadmap`    | `01-docs/audit/execution-roadmap.md`         |
| `autoDevState`        | `01-docs/audit/auto-dev-state.md`            |
| `agentWorkSelection`  | `01-docs/operations/agent-work-selection.md` |
| `platformTools`       | `03-platform/tools/`                         |
| `platformScripts`     | `03-platform/scripts/`                       |
| `deployRoot`          | `04-deploy/`                                 |
| `deployScripts`       | `04-deploy/03-platform/scripts/`             |
| `deployTerraform`     | `04-deploy/terraform/`                       |
| `deployKubernetes`    | `04-deploy/kubernetes/`                      |
| `opsDomains`          | `02-ops/`                                    |
| `workstream`          | `06-workstream/`                             |
| `governanceTierB`     | `01-docs/operations/repo/`                   |
| `docsIamap`           | `01-docs/README.md`                          |
| `docsIndex`           | `01-docs/INDEX.md`                           |
| `toolchainSoR`        | `config/toolchain/`                          |
| `sorMap`              | `config/sor-map.json`                        |
| `pathsModule`         | `config/paths.mjs`                           |
| `repoKind`            | `config/repo-kind.json`                      |
| `governanceSpine`     | `config/governance-spine.json`               |
| `opsManifest`         | `config/ops.manifest.json`                   |

Full narrative index: [`01-docs/README.md`](./README.md)
