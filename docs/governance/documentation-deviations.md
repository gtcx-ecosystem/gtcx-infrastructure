---
title: 'Documentation Governance — Repo-Local Deviations'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['governance', 'docs', 'protocol-1', 'deviations']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Documentation Governance — Repo-Local Deviations

How `gtcx-infrastructure` documentation governs itself and where it deliberately deviates from Protocol 1 v2.0.

## Rules

- [`../README.md`](../README.md) is the master index and single source of navigation truth.
- Repo-local docs may deviate from Protocol 1 v2.0 canonical taxonomy only when the repo has a stable audience-specific collection that would become less legible if forcibly flattened.
- Cross-repo references use absolute GitHub URLs (Protocol 1 §Cross-Repo Reference Rules).
- Historical evidence remains in place under [`../audit/historical-cycles/`](../audit/historical-cycles/); it is not deleted during standards work.

## Current state (2026-05-24, post-hygiene-cleanup)

The repo has **12 of 12 Protocol 1 v2.0 canonical folders** plus **3 documented exceptions**:

### Canonical folders (all present)

| Folder                                 | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| [`../overview/`](../overview/)         | Strategic overview, current metrics, honest gaps      |
| [`../gitbook/`](../gitbook/)           | External-facing product docs (Astro Starlight source) |
| [`../gtm/`](../gtm/)                   | Go-to-market evidence pack (numbered 00–13)           |
| [`../governance/`](./)                 | This folder — trust portal, model cards, governance   |
| [`../security/`](../security/)         | Threat models, key ceremonies, VDP                    |
| [`../compliance/`](../compliance/)     | DPIA, SOC 2 evidence, framework assessments           |
| [`../audit/`](../audit/)               | Master audits, scoring, evidence ledger               |
| [`../architecture/`](../architecture/) | System design, ADRs (under `decisions/`), principles  |
| [`../engineering/`](../engineering/)   | Build, integration, cross-repo coordination           |
| [`../operations/`](../operations/)     | Runbooks, release governance, CI-CD, drills           |
| [`../api/`](../api/)                   | OpenAPI spec for compliance-gateway                   |
| [`../reference/`](../reference/)       | Glossary, changelog, reference content                |

### Documented exceptions (3 folders Protocol 1 v2.0 doesn't name)

| Folder                     | Why it's here                                                                                                                                                                                                                    | Why it's not folded in                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../agents/`](../agents/) | AI-agent orchestration (37 files) — orientation, roles, workflows, governance. Substrate is AI-native; agent workflows are first-class.                                                                                          | No canonical home in v2.0. Folding into `governance/agents/` would split the agent corpus; folding into `engineering/agents/` would dilute it.                               |
| [`../agile/`](../agile/)   | Sprint planning artifacts (20 files). **Canonical execution plan lives at `01-docs/05-audit/execution-roadmap.md`** — the files under `01-docs/05-audit/agile/` are historical sprint snapshots, templates, or backlog metadata. | Could fold into `operations/sprint-plans/`. Kept top-level for now because operators routinely navigate to `01-docs/05-audit/agile/` directly. May fold in a future cleanup. |
| [`../specs/`](../specs/)   | Substrate specifications (9 files) — CI/CD pipeline, data governance, observability/resilience/scalability frameworks, USSD protocol, Vault credentials.                                                                         | Protocol 1 v2.0 §Per-Service Documentation Convention explicitly allows `specs/` for sub-service technical specifications.                                                   |

### Folders that were removed in the 2026-05-24 cleanup

Eleven folders folded into canonical homes:

| Removed                                  | Merged into                                                  | Rationale                                            |
| ---------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `01-docs/decisions/` (24 files)          | `architecture/decisions/`                                    | Protocol 1 v2.0: ADRs go in `architecture/`          |
| `01-docs/ecosystem/` (2 files)           | `architecture/`                                              | Cross-repo references are architectural              |
| `01-docs/principles/` (4 files)          | `architecture/principles/`                                   | Design principles guide architecture                 |
| `01-docs/remediation/` (2 files)         | `audit/remediation/`                                         | Audit follow-up belongs in `audit/`                  |
| `01-docs/research/` (4 files)            | `reference/`                                                 | Reference research material                          |
| `01-docs/release/` (5 files)             | `operations/release/`                                        | Release governance is operational                    |
| `01-docs/ml/model-cards/` (6 files)      | `governance/model-cards/`                                    | Protocol 1 v2.0: model cards in `governance/`        |
| `01-docs/assessments/` (16 files)        | `audit/` + `audit/historical-cycles/` + `audit/remediation/` | Audit assessments are audit content                  |
| `01-docs/devops/` (24 files)             | `operations/` + subfolders                                   | DevOps is operational by definition                  |
| `01-docs/external/` (13 files)           | `gitbook/`                                                   | Protocol 1 v2.0: external product docs in `gitbook/` |
| `01-docs/onboarding/` (2 redirect-stubs) | (deleted)                                                    | Canonical onboarding already at `agents/onboarding/` |

## Cross-repo references

When this repo is not the authority for a referenced concept:

- Use absolute GitHub URLs: `https://github.com/gtcx-ecosystem/<repo>/blob/main/...`
- Repo-relative code paths (`03-platform/tools/...`, `04-deploy/...`) when referring to this repo's own non-doc files
- Never `../../<sibling-repo>/...` (those paths don't resolve in CI or rendered docs)

## How to add a new doc

1. Determine the canonical Protocol 1 v2.0 folder by audience + purpose (see the canonical-folders table above)
2. Add the doc with proper YAML frontmatter per Protocol 1 §YAML
3. Add an entry to the folder's `README.md` index
4. If it's a runbook, update [`../operations/runbooks/README.md`](../operations/runbooks/README.md) priority table
5. If it's a substrate specification, document the canonical-folder deviation rationale here

## Related

- [`./README.md`](./README.md) — governance corpus index
- [`../README.md`](../README.md) — docs index
- [`../audit/docs-standard-compliance-2026-05-24-cycle-2.md`](../audit/docs-standard-compliance-2026-05-24-cycle-2.md) — most recent docs-standard self-attestation
- Protocol 1 v2.0: https://github.com/gtcx-ecosystem/canon-os/blob/main/system-sop/1-protocols/1-docs-structure/protocol.md
- Protocol 13: https://github.com/gtcx-ecosystem/canon-os/blob/main/system-sop/1-protocols/13-architecture-diagrams/protocol.md
