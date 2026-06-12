---
title: 'ADR-009: Deprecate `gtcx-core12` and `gtcx-amis`'
status: 'superseded'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-009: Deprecate `gtcx-core12` and `gtcx-amis`

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Platform Engineering, Architecture
**Stakeholders:** All repo owners in `gtcx-ecosystem/*`

---

## Context

The ecosystem review of 2026-05-12 (`01-docs/05-audit/ecosystem-repo-review-2026-05-12.md`) identified 25 active repos with significant overlap and sprawl. Two repos stood out as unmaintained and functionally superseded:

- **`gtcx-core12`** (Python): Described as "universal compliance knowledge graph." No CI, no tests, no build, no `SECURITY.md`. The TypeScript `gtcx-core` repo already covers shared packages (crypto, types, schemas) and is actively maintained.
- **`gtcx-amis`** (JavaScript): Described as "Autonomous Market Intelligence Service." No CI, no tests, no build, no `LICENSE`, no `SECURITY.md`. AMANI specs have been migrated to `gtcx-infrastructure/03-platform/tools/templates/`.

---

## Decision

**Deprecate both repos.** Archive them in GitHub and redirect all references.

| Repo          | Superseded By                                   | Rationale                                                                                                                                                               |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gtcx-core12` | `compliance-os` → `services/core12/`            | Standalone repo **deleted** 2026-06-01. Python Core12 service lives in the ComplianceOS monorepo.                                                                       |
| `gtcx-amis`   | `gtcx-infrastructure` (templates) + `sensei-ai` | AMANI/MABA templates in `03-platform/tools/templates/projects/`. Repo **deleted** 2026-06-01; persona archive in `canon-os/01-docs/archive/_historical/amis-personas/`. |

---

## Consequences

### Positive

- Reduces repo count from 25 → 23 active repos
- Eliminates confusion about which "core" package to use
- Centralizes template/spec ownership in `gtcx-infrastructure`
- Reduces SOC 2 audit scope (fewer repos to review)

### Negative

- Any historical references to `gtcx-core12` in migration configs must be updated (done: `04-deploy/migrations/config/gtcx.yaml`)
- Any historical references to `gtcx-amis` in template docs must be updated (done: `03-platform/tools/templates/projects/maba/README.md`, `03-platform/tools/templates/projects/amani/README.md`)

### Neutral

- Local git bundles under `gtcx-ecosystem/_local-backups/2026-06-01-retired-repos/` preserve history for audit

---

## Actions Taken

- [x] Updated `04-deploy/migrations/config/gtcx.yaml`: `target_schema: 'gtcx-core12'` → `target_schema: 'gtcx-core'`
- [x] Updated `03-platform/tools/templates/projects/maba/README.md`: removed `gtcx-core12` and `gtcx-amis` references
- [x] Updated `03-platform/tools/templates/projects/amani/README.md`: removed `gtcx-amis` reference
- [x] Updated `03-platform/tools/templates/PRINCIPLES.md`: remapped P21 → `gtcx-core`, P23 → `gtcx-protocols`
- [x] Updated `01-docs/specs/cicd-pipeline.md`: removed `gtcx-amis` from documentation consumers
- [x] Updated `01-docs/05-audit/ecosystem-repo-review-2026-05-12.md`: marked both as deprecated
- [x] Deleted `gtcx-core12` from GitHub (2026-06-01; local backup on drive)
- [x] Deleted empty demo repos `agx-demo1`, `sgx-demo` (2026-06-01)
- [x] Deleted `gtcx-amis` from GitHub (2026-06-01; persona docs in `gtcx-docs` archive; bundle in `_local-backups/`)
- [x] Deleted Sensei GitBook mirror repos `sensei-ai-docs-{developers,operations,enterprise}` (2026-06-01; no live content migrated — see `sensei-ai/01-docs/_historical/migration-review/`)
- [x] Deleted `gtcx-complianceos` from GitHub (2026-06-02; archive in `canon-os/01-docs/archive/_historical/complianceos-legacy/`; bundle in `_local-backups/`)
- [ ] Notify `#engineering` Slack channel

---

## References

- Ecosystem repo review: `01-docs/05-audit/ecosystem-repo-review-2026-05-12.md`
- Platform compliance governance: `01-docs/10-compliance/platform-compliance-governance.md`
- `gtcx-core`: https://github.com/gtcx-ecosystem/gtcx-core
