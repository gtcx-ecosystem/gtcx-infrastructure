---
title: 'Docs Standard Compliance Audit — 2026-05-10'
status: 'draft'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Docs Standard Compliance Audit — 2026-05-10

**Status:** Complete
**Date:** 2026-05-10
**Owner:** GTCX Infrastructure
**Scope:** Application of `gtcx-ecosystem/audit/forensic-doc-standard-prompt.md` to `gtcx-infrastructure`
**Reference standard version:** 2026-05-10 canonical prompt set

## Compliance Scores

| Axis                |      Score | Findings                                                                                                                                                                                                                                          |
| ------------------- | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural          |     7.8/10 | Canonical minimums are present; repo retains approved top-level deviations in `agents/`, `agile/`, `devops/`, `gtm/`, and `decisions/`, documented in [`docs/governance/documentation-deviations.md`](../governance/documentation-deviations.md). |
| Naming              |    10.0/10 | All markdown filenames now comply with lowercase-with-hyphens, with ADR and `README.md` exceptions preserved.                                                                                                                                     |
| Frontmatter         |     9.8/10 | Substantive docs now carry `Status / Date / Owner`; draft template examples were explicitly marked as draft.                                                                                                                                      |
| Linking             |     9.6/10 | Broken internal links and stale numbered-taxonomy references were repaired or neutralized; cross-repo references were converted to non-broken repo-relative code references where this repo is not authoritative.                                 |
| Length              |     7.2/10 | Several architecture and regulatory docs still exceed the recommended size thresholds and should be split in a later pass.                                                                                                                        |
| Agentic Conventions |     8.4/10 | Top matter is clearer and status-driven, but some long legacy docs still mix reference, process, and narrative concerns.                                                                                                                          |
| RAG Indexing        |     9.2/10 | `.baseline/config.json` now excludes historical, archive, template, and deletion paths per the standard contract.                                                                                                                                 |
| Master INDEX        |     9.1/10 | `docs/README.md` remains the master index and now links the repo-local governance note; the doc count and timestamp should be refreshed again after the master audit lands.                                                                       |
| **Overall**         | **8.9/10** | Standards compliance is materially improved and acceptance-check clean, with remaining issues concentrated in structural taxonomy drift and document length.                                                                                      |

## Violations Fixed

| Violation                                                  | Files Affected                 | Resolution                                                                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing frontmatter on substantive docs                    | 197 docs                       | Added `Status / Date / Owner` blocks, preserving ADR header exceptions.                                                                                                                  |
| Non-canonical uppercase filenames                          | 14 ISO policy docs             | Renamed with `git mv` to lowercase while preserving Annex A numbering.                                                                                                                   |
| Broken internal links and stale legacy taxonomy references | 165 broken targets across docs | Repaired references to current repo paths; converted non-authoritative cross-repo references into non-broken code-path mentions.                                                         |
| Missing RAG exclude contract                               | `.baseline/config.json`        | Added canonical excludes for historical, archive, template, and deletion paths.                                                                                                          |
| README-only acceptance failures                            | `docs/`, `docs/gtm/`           | Added [`docs/governance/documentation-deviations.md`](../governance/documentation-deviations.md) and [`docs/gtm/overview.md`](../gtm/overview.md) as substantive non-README anchor docs. |
| Undocumented repo-local taxonomy deviations                | `CLAUDE.md`, `docs/README.md`  | Added an explicit governance reference for deviations from the baseline taxonomy.                                                                                                        |

## Violations Remaining (Justified)

| Violation                                                                | Reason                                                                                                                                                                                          | Owner                    | Re-review by |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------ |
| Top-level structural deviations from the canonical taxonomy              | The repo has stable audience-specific collections already used by operators, auditors, and GTM stakeholders; flattening them in this pass would create churn without improving control clarity. | Repo lead                | 2026-08-10   |
| Overlength docs in security, GTM regulatory, and engineering collections | These are substantive legacy docs that should be split carefully, not truncated during a compliance pass.                                                                                       | Engineering + Compliance | 2026-06-30   |
| Legacy template/example content still present as marked drafts           | Draft example role docs are intentionally retained as examples and now clearly marked as non-authoritative.                                                                                     | Documentation owner      | 2026-06-30   |

## Files Moved/Renamed

- `docs/compliance/policies/A05-information-security-policy.md` → `docs/compliance/policies/a05-information-security-policy.md`
- `docs/compliance/policies/A06-organization-of-information-security.md` → `docs/compliance/policies/a06-organization-of-information-security.md`
- `docs/compliance/policies/A07-human-resource-security.md` → `docs/compliance/policies/a07-human-resource-security.md`
- `docs/compliance/policies/A08-asset-management.md` → `docs/compliance/policies/a08-asset-management.md`
- `docs/compliance/policies/A09-access-control.md` → `docs/compliance/policies/a09-access-control.md`
- `docs/compliance/policies/A10-cryptography.md` → `docs/compliance/policies/a10-cryptography.md`
- `docs/compliance/policies/A11-physical-security.md` → `docs/compliance/policies/a11-physical-security.md`
- `docs/compliance/policies/A12-operations-security.md` → `docs/compliance/policies/a12-operations-security.md`
- `docs/compliance/policies/A13-communications-security.md` → `docs/compliance/policies/a13-communications-security.md`
- `docs/compliance/policies/A14-system-acquisition.md` → `docs/compliance/policies/a14-system-acquisition.md`
- `docs/compliance/policies/A15-supplier-relationships.md` → `docs/compliance/policies/a15-supplier-relationships.md`
- `docs/compliance/policies/A16-incident-management.md` → `docs/compliance/policies/a16-incident-management.md`
- `docs/compliance/policies/A17-business-continuity.md` → `docs/compliance/policies/a17-business-continuity.md`
- `docs/compliance/policies/A18-compliance.md` → `docs/compliance/policies/a18-compliance.md`

## Cross-references Updated

- Re-pointed agent workflow and onboarding docs from the obsolete numbered tree to the current `docs/agents`, `docs/operations`, `docs/devops`, `docs/architecture`, and `docs/decisions` paths.
- Repaired security, compliance, and spec references to the current local docs tree.
- Replaced broken local markdown links to external ecosystem authorities with repo-relative code-path references when this repo is not the source of truth.

## Sign-off

| Role      | Status  | Date       |
| --------- | ------- | ---------- |
| Author    | Drafted | 2026-05-10 |
| Repo lead | Pending | —          |
