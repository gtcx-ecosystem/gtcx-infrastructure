# SOP — gtcx-protocols

Standard operating procedures, documentation, agent team definitions, and process guides for the `gtcx-protocols` monorepo.

## Structure

| Folder                     | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| [1-agents/](1-agents/)     | Agent team roster, roles, safety rules, and task playbooks         |
| [2-docs/](2-docs/)         | Architecture, specs, engineering guides, operations, and reference |
| [3-agile/](3-agile/)       | Roadmap, backlog, sprint records, and UAT plans                    |
| [4-sessions/](4-sessions/) | Session handoff documents and context recovery snapshots           |
| [5-release/](5-release/)   | Versioning policy and changelog conventions                        |
| [6-metrics/](6-metrics/)   | Protocol performance targets and KPI reference                     |
| [7-examples/](7-examples/) | Runnable example integrations for each protocol                    |
| [8-scripts/](8-scripts/)   | Developer utility scripts (link checking, baseline refresh)        |

## Where to Start

| Goal                        | Read                                       |
| --------------------------- | ------------------------------------------ |
| First time in this repo     | `1-agents/orientation.md`                  |
| Understanding the protocols | `2-docs/2-specs/protocol-index.md`         |
| System architecture         | `2-docs/1-architecture/system-overview.md` |
| Dev environment setup       | `2-docs/3-engineering/dev-setup.md`        |
| Cutting a release           | `2-docs/4-operations/runbooks/release.md`  |
| Agent context recovery      | `1-agents/context-recovery.md`             |

## Documentation Map

```
2-docs/
├── 1-architecture/   System overview, trust model, network, offline, ADRs
├── 2-specs/          Protocol index, data models, operator types
├── 3-engineering/    Code standards, dev setup, git workflow, testing, SDK, security, guides
├── 4-operations/     Production runbooks, disaster recovery, compliance
├── 5-reference/      Glossary, docs writing guide, legacy sources
└── 6-gitbook/        Public-facing quickstart, integration guide, governance
```
