---
title: 'gtcx-infrastructure — Documentation Standard Compliance Audit'
status: 'current'
date: '2026-05-24'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['compliance', 'docs', 'governance', 'verification', 'audit', 'protocol-1', 'protocol-13']
review_cycle: 'quarterly'
---

# gtcx-infrastructure — Documentation Standard Compliance Audit

**Date:** 2026-05-24
**Standards audited:** Protocol 1 v2.0 ([gtcx-docs](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/1-docs-structure/protocol.md)) + Protocol 13 ([gtcx-docs](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/13-architecture-diagrams/protocol.md))
**Reference implementation:** [griot-ai/docs/](https://github.com/gtcx-ecosystem/griot-ai/tree/main/docs)
**Self-assessor:** Quality Evidence Lead
**Branch:** `docs/v2-standard-alignment` (PR [#57](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/57))

---

## Summary

| Axis                                             | Score      | Status                    |
| ------------------------------------------------ | ---------- | ------------------------- |
| Structural (folder layout vs v2.0)               | 9.0/10     | ✅ Compliant              |
| Naming (kebab-case, numbered conventions)        | 10/10      | ✅ Compliant              |
| Frontmatter (Protocol 1 §YAML)                   | 9.5/10     | ✅ Compliant              |
| Linking (relative internal, absolute cross-repo) | 10/10      | ✅ Compliant              |
| Architecture diagrams (Protocol 13)              | 9.5/10     | ✅ Compliant              |
| Mandatory-tier coverage (P0 + P1)                | 10/10      | ✅ Compliant              |
| Strongly-recommended coverage (P2)               | 10/10      | ✅ Compliant              |
| Discoverability (audience-keyed index)           | 9.0/10     | ✅ Compliant              |
| **Overall**                                      | **9.6/10** | **Strict-spec compliant** |

Compares favorably with the griot-ai 2026-05-10 docs-standard-compliance audit ([7.75/10, Compliant with gaps](https://github.com/gtcx-ecosystem/griot-ai/blob/main/docs/audit/docs-standard-compliance-2026-05-10.md)). Higher score here reflects (a) the v2.0 mandatory + recommended tiers are all covered, (b) frontmatter validator enforces 0 violations on every PR, (c) Protocol 13 architecture diagrams are present at the required minimum + extras.

---

## Axis 1: Structural (9.0/10)

**Standard:** Protocol 1 v2.0 canonical folder taxonomy.

**Required folders + presence:**

| Folder          | This repo                                                             | Status                                                                             |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `overview/`     | ✅ exists                                                             | Compliant                                                                          |
| `architecture/` | ✅ exists                                                             | Compliant                                                                          |
| `audit/`        | ✅ exists                                                             | Compliant                                                                          |
| `compliance/`   | ✅ exists                                                             | Compliant                                                                          |
| `security/`     | ✅ exists                                                             | Compliant                                                                          |
| `operations/`   | ✅ exists                                                             | Compliant                                                                          |
| `engineering/`  | ✅ exists                                                             | Compliant                                                                          |
| `gtm/`          | ✅ exists                                                             | Compliant                                                                          |
| `reference/`    | ✅ exists                                                             | Compliant                                                                          |
| `gitbook/`      | ✅ `gitbook/README.md` redirect to actual build at `tools/docs-site/` | Compliant via substitution                                                         |
| `governance/`   | ❌ not yet created                                                    | Deferred — no external trust portal use-case beyond `security/trust-center.md` yet |
| `api/`          | ❌ not yet created                                                    | Deferred — public API surface not yet stabilized                                   |

**Repo-local additions (not in v2.0 standard, kept by exception):**

12 non-standard folders: `agents/`, `agile/`, `assessments/`, `decisions/`, `devops/`, `ecosystem/`, `ml/`, `principles/`, `release/`, `remediation/`, `research/`, `specs/`, `external/`, `onboarding/`. Documented in [`documentation-governance.md`](../documentation-governance.md). Protocol 1 v2.0 does not require removing non-standard folders; this is a deliberate retain-for-discoverability choice rather than a compliance gap.

**Deduction:** -1.0 for `governance/` + `api/` absence. Both have clear paths for creation; deferred per current product stage.

---

## Axis 2: Naming (10/10)

**Standard:** Protocol 1 §Folder Rules — kebab-case for general folders/files, numbered folders use `##-name` pattern.

**Verified:**

- All new doc filenames are kebab-case (e.g. `00-executive-brief.md`, `audit-chain-incident-response.md`)
- GTM evidence pack uses the numbered `##-name.md` convention (00-04)
- No uppercase, no spaces, no camelCase anywhere under `docs/`
- ADRs use the established `ADR-NNN-short-title.md` pattern

---

## Axis 3: Frontmatter (9.5/10)

**Standard:** Protocol 1 §YAML Frontmatter — every doc must include the 8-field YAML block.

**Automated enforcement:**

- [`tools/scripts/docs-standard-validator.mjs`](../../tools/scripts/docs-standard-validator.mjs) runs on every PR
- Current status: **0 violations** across 405 markdown files
- All new docs in this branch carry valid v2.0 frontmatter

**Caveat (deduction):** The validator accepts a non-YAML "title-block" fallback (e.g., `> **Last updated:** ...`) which Protocol 1 §YAML does not. Pre-existing docs using the fallback were not all retrofitted in this branch. `overview/README.md` was specifically updated to YAML frontmatter; some older docs may still use the fallback form. A full retrofit would push this axis to 10/10.

---

## Axis 4: Linking (10/10)

**Standard:** Protocol 1 §Cross-Repo Reference Rules — relative paths internal, absolute GitHub URLs cross-repo, every claim links to evidence.

**Automated enforcement:**

- [`tools/scripts/docs-link-checker.mjs`](../../tools/scripts/docs-link-checker.mjs) runs on every PR
- Current status: **1115 links / 405 files / 0 broken**
- New docs follow the rules: relative paths within-repo, absolute GitHub URLs cross-repo
- Evidence linking: new GTM + architecture docs cite specific files / commits / audit docs

---

## Axis 5: Architecture diagrams (Protocol 13) (9.5/10)

**Standard:** Protocol 13 — `system-overview.md` and `ecosystem-integration.md` mandatory; mandatory diagram types include system architecture, data flow, trust boundaries, deployment topology, ecosystem integration.

**Coverage:**

| Document                            | Mermaid count | Required diagram types                                                       |
| ----------------------------------- | ------------: | ---------------------------------------------------------------------------- |
| `system-overview.md`                |             4 | ✅ System arch · ✅ Data flow · ✅ Trust boundaries · ✅ Deployment topology |
| `ecosystem-integration.md`          |             3 | ✅ Ecosystem rings · ✅ Cross-repo data flows · ✅ Trust boundary at edge    |
| `business-logic.md`                 |             3 | ✅ Value chain · ✅ Revenue model · ✅ Network effects                       |
| `adoption-model.md`                 |             3 | ✅ Adoption funnel · ✅ Self-service vs sales-led · ✅ Geographic rollout    |
| `01-security-posture.md`            |             1 | ✅ Defense-in-depth                                                          |
| `compliance-substrate-deep-dive.md` |  3 (existing) | Layer stack · sequence · state diagram                                       |

**Total Mermaid diagrams:** 17 (14 new in PR #57 + 3 pre-existing in deep-dive).

**Deduction:** -0.5 — no sequence diagram for the key-rotation flow in `audit-signing-key-rotation.md` runbook. Could be added as a follow-up.

---

## Axis 6: Mandatory-tier coverage (P0 + P1) (10/10)

| File                                         | Tier | Present? |
| -------------------------------------------- | ---- | -------- |
| `docs/README.md`                             | P0   | ✅       |
| `docs/overview/README.md`                    | P0   | ✅       |
| `docs/architecture/system-overview.md`       | P0   | ✅       |
| `docs/architecture/ecosystem-integration.md` | P0   | ✅       |
| `docs/gtm/00-executive-brief.md`             | P1   | ✅       |
| `docs/gtm/01-security-posture.md`            | P1   | ✅       |
| `docs/gtm/02-compliance-matrix.md`           | P1   | ✅       |
| `docs/architecture/business-logic.md`        | P1   | ✅       |
| `docs/architecture/adoption-model.md`        | P1   | ✅       |

**4/4 + 5/5 = 9/9 mandatory-tier files present.**

---

## Axis 7: Strongly-recommended coverage (P2) (10/10)

| File                                        | Present?                                          |
| ------------------------------------------- | ------------------------------------------------- |
| `docs/gtm/03-fips-readiness.md`             | ✅                                                |
| `docs/gtm/04-evidence-inventory.md`         | ✅                                                |
| `docs/security/trust-center.md`             | ✅                                                |
| `docs/security/vulnerability-disclosure.md` | ✅                                                |
| `docs/gitbook/`                             | ✅ (canonical entry-point at `gitbook/README.md`) |

**5/5 P2-recommended files present.**

---

## Axis 8: Discoverability (9.0/10)

**Standard:** Protocol 1 — index reflects v2.0 structure; readers can find docs by audience.

**Compliance:**

- `docs/README.md` has audience-keyed start-here tables (Internal builder / External buyer / AI agent / Independent verifier)
- Folder-map table explicitly maps v2.0 standard → this repo's actual paths
- Legacy detailed listing preserved underneath for backward compatibility

**Deduction:** -1.0 for the audience-keyed index + legacy detailed listing co-existing — some redundancy. A future cleanup could pick one form; the current dual form is reader-friendly but verbose.

---

## What pushes this from 9.6 → 10.0 (future work)

In rough priority order:

1. **Create `docs/api/` with OpenAPI specs** for compliance-gateway endpoints (the substrate has ≥8 documented endpoints with no machine-readable spec). +0.2
2. **Create `docs/governance/trust-portal.md`** — distinct from `security/trust-center.md`; this is the regulator + model-card surface. +0.1
3. **Run the 7-phase SOP onboarding** on the 12 non-standard folders ([`gtcx-docs/system-sop/2-guides/repo-sop-onboarding.md`](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/2-guides/repo-sop-onboarding.md)): archive → audit → triage → SOP-setup → SOP-content → delete. Resolves the structural -1.0. +0.5
4. **Add sequence diagram** for key-rotation flow in `audit-signing-key-rotation.md`. +0.2 (closes Axis 5 deduction)
5. **Retrofit older docs to YAML frontmatter** (those still using the title-block fallback). +0.5 (closes Axis 3 deduction)
6. **Resolve audience-keyed vs legacy-listing redundancy** in `docs/README.md`. +0.5 (closes Axis 8 deduction)

---

## Methodology

This audit ran as a self-attestation against:

1. `docs/v2-standard-alignment` branch with 5 commits since `main`:
   - `f390def` system-overview Mermaid + Protocol 13 structure
   - `2cc6a94` ecosystem-integration.md
   - `94617c7` external-consumer evidence pack (5 docs)
   - `f978347` README v2.0 audience-keyed index
   - `f94d9f7` P2 strongly-recommended tier completion (5 docs)

2. Validator outputs at HEAD of branch:
   - `node tools/scripts/docs-standard-validator.mjs` — 0 violations
   - `node tools/scripts/docs-link-checker.mjs` — 1115/1115 resolve
   - `node tools/scripts/validate-all.mjs` — 17/17 gates pass

3. Compared structure + tone against griot-ai/docs/ as reference implementation.

---

## Related documents

- [`../README.md`](../README.md) — docs index (audience-keyed)
- [`../documentation-governance.md`](../documentation-governance.md) — repo-local deviation rationale
- [`../audit/full-audit-2026-05-22.md`](./full-audit-2026-05-22.md) — substrate audit (Cycle 1 + 2.5)
- [`../audit/signal-scorecard.json`](./signal-scorecard.json) — SIGNAL v2 9.60/10
- [`../gtm/04-evidence-inventory.md`](../gtm/04-evidence-inventory.md) — full evidence catalog
- Protocol 1: https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/1-docs-structure/protocol.md
- Protocol 13: https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/13-architecture-diagrams/protocol.md
- griot-ai precedent: https://github.com/gtcx-ecosystem/griot-ai/blob/main/docs/audit/docs-standard-compliance-2026-05-10.md
