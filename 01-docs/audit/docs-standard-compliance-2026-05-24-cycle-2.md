---
title: 'gtcx-infrastructure — Documentation Standard Compliance Audit (Cycle 2)'
status: 'superseded'
superseded_by: '01-docs/05-audit/execution-roadmap.md'
superseded_on: '2026-05-31'
superseded_reason: 'Older cycle-2 compliance snapshot; reconciled into execution-roadmap.md.'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags:
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# gtcx-infrastructure — Documentation Standard Compliance Audit (Cycle 2)

**Date:** 2026-05-24 (later same day)
**Predecessor:** Cycle 1 self-attestation on the `01-docs/v2-standard-alignment` branch (PR [#57](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/57))
**Methodology:** Same 8-axis scoring as Cycle 1 + verifier outputs at HEAD of main
**Scope:** Documents the additional improvements that landed on `main` after the Cycle 1 self-attestation was written, including improvements that close deductions Cycle 1 explicitly called out.

---

## Why a Cycle 2 audit

Cycle 1 (on the `01-docs/v2-standard-alignment` branch) scored gtcx-infrastructure at **9.6/10** against Protocol 1 v2.0 + Protocol 13 and documented six follow-up improvements that would push the score toward 10.0.

Between Cycle 1 publication and this Cycle 2 audit, **9 additional commits** landed on `main` (not yet merged with PR #57). Each commit closed at least one Cycle 1 deduction or addressed a Cycle 1 follow-up. This document records what landed and the revised composite score.

---

## Composite (Cycle 2)

| Axis                                             | Cycle 1    | Cycle 2     | Δ         |
| ------------------------------------------------ | ---------- | ----------- | --------- |
| Structural (folder layout vs v2.0)               | 9.0/10     | 10.0/10     | +1.0      |
| Naming (kebab-case, numbered)                    | 10/10      | 10/10       | —         |
| Frontmatter (Protocol 1 §YAML)                   | 9.5/10     | 10.0/10     | +0.5      |
| Linking (relative internal, absolute cross-repo) | 10/10      | 10/10       | —         |
| Architecture diagrams (Protocol 13)              | 9.5/10     | 10.0/10     | +0.5      |
| Mandatory-tier coverage (P0 + P1)                | 10/10      | 10/10       | —         |
| Strongly-recommended coverage (P2)               | 10/10      | 10/10       | —         |
| Discoverability (audience-keyed index)           | 9.0/10     | 9.5/10      | +0.5      |
| **Overall**                                      | **9.6/10** | **9.94/10** | **+0.34** |

---

## What landed between Cycle 1 and Cycle 2

Nine commits on `main`, all atomic and validator-clean:

| Commit    | Closes                               | Description                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0470984` | Axis 5 −0.5 + Axis 4 cross-repo refs | Key-rotation Mermaid sequence diagram + fix 4 pre-existing broken cross-repo links (relative paths → absolute GitHub URLs)                                                                                                                                                                                      |
| `20950da` | Axis 1 −0.5 (governance/)            | `01-docs/governance/README.md` — substantive governance model (3-tier decision model, ADR flow Mermaid, 5-role responsibility table, release-governance matrix, AI model governance for compliance-gateway LLM routing)                                                                                         |
| `1d6abb1` | Axis 1 −0.5 (api/)                   | `01-docs/api/` folder + `openapi.yaml` (OpenAPI 3.1, 7 endpoints, 12 schemas) — first machine-readable spec for the compliance-gateway HTTP surface                                                                                                                                                             |
| `330b2c2` | Axis 1 completion                    | OpenAPI expanded to 11 endpoints, 23 schemas, 806 lines — full v1 surface plus the mobile-contract `/audit/bundles` endpoint with 8 `X-GTCX-*` signed-edge parameters                                                                                                                                           |
| `f001ac3` | Axis 3 −0.5                          | YAML frontmatter retrofitted onto 25 folder-index READMEs (zero markdown files in `01-docs/` now lack YAML frontmatter)                                                                                                                                                                                         |
| `c9638a5` | Discoverability +0.5                 | Runbooks index expanded from 3 → 29 runbooks, organized by 6 categories with on-call priority precedence table                                                                                                                                                                                                  |
| `51323f5` | Axis 5 completion                    | Mermaid sequence diagrams added to `deploy.md` (7-step canary path with auto-rollback callout) and `disaster-recovery.md` (9-step recovery with audit-chain-validation gating)                                                                                                                                  |
| `86a06d1` | Hygiene cleanup                      | Removed 21 template stubs across `01-docs/specs/{frontend,design,product,data,testing}/` and `01-docs/specs/project-specification.md` — all `{Product Name}` placeholders, zero substantive content                                                                                                             |
| `9259317` | Hygiene cleanup                      | Removed 7 template stubs in `01-docs/engineering/` (`system-architecture-spec`, `content-schema`, `api-specification`, `microservices-architecture`, `database-schema`) + 2 superseded protocols (`agentic-guide`, `architecture-docs-protocol` — both superseded by `gtcx-docs` Protocol 1 v2.0 + Protocol 13) |

---

## Cycle 2 axis details

### Axis 1: Structural — 10.0/10 ✅

Cycle 1 deducted -1.0 for missing `governance/` + `api/` folders. Both now exist:

- `01-docs/governance/README.md` — substantive (149 lines, Mermaid ADR-flow diagram, 5-role table)
- `01-docs/api/README.md` + `01-docs/api/openapi.yaml` — 806-line OpenAPI 3.1 spec covering all 11 documented compliance-gateway endpoints

Repo-local additions (12 non-standard folders: `agents/`, `agile/`, `assessments/`, `decisions/`, `devops/`, `ecosystem/`, `ml/`, `principles/`, `release/`, `remediation/`, `research/`, `specs/`, `external/`, `onboarding/`) remain documented in `documentation-governance.md`. Protocol 1 v2.0 doesn't require their removal.

### Axis 3: Frontmatter — 10.0/10 ✅

Cycle 1 deducted -0.5 for older docs using the title-block fallback. Closed by commit `f001ac3`:

- 25 folder-index README files retrofitted to proper Protocol 1 §YAML frontmatter
- `grep -L "^---" 01-docs/**/*.md` returns zero files
- All retrofitted files also got their broken `# u<folder>` H1 fixed to a proper titleized H1

### Axis 5: Architecture diagrams — 10.0/10 ✅

Cycle 1 deducted -0.5 for no key-rotation sequence diagram and general light coverage in other runbooks. Closed by commits `0470984` + `51323f5`:

- `audit-signing-key-rotation.md` — Mermaid sequence diagram showing all 7 steps with undo-possible-until-2.6 invariant highlighted
- `deploy.md` — 7-step canary deployment sequence with auto-rollback callout
- `disaster-recovery.md` — 9-step recovery sequence with audit-chain-validation gating in red

Total Mermaid diagrams across the substrate now **22+** (vs Cycle 1's 17): the three new runbook diagrams plus the governance README's ADR-flow flowchart.

### Axis 8: Discoverability — 9.5/10

Cycle 1 deducted -1.0 for audience-keyed-vs-legacy-listing redundancy in `01-docs/README.md`. The runbooks index expansion (commit `c9638a5`) closes part of the discoverability concern at the per-folder level (operations/runbooks/README.md now categorizes 29 runbooks with on-call priority). The README dedup itself remains as the last 0.5-point opportunity.

---

## What's still open

Two items remain:

1. **Discoverability +0.5** — collapse the audience-keyed start-here tables and the legacy detailed listing in `01-docs/README.md` into one canonical form. This is a "decide one shape" call, not engineering work.
2. **Operate the 7-phase SOP onboarding** on remaining non-standard folders if Protocol 1 strict-path compliance becomes a hard requirement. The current folder-map deviation is documented in `documentation-governance.md`; this is a deliberate retain-for-discoverability call, not a gap.

Neither blocks substrate work; both are tractable in a future sprint.

---

## Verification — Cycle 2

Validators at HEAD of `main` (commit `9259317`):

| Validator                        | Output                                     |
| -------------------------------- | ------------------------------------------ |
| `docs-standard-validator.mjs`    | **0 violations** across 367 markdown files |
| `docs-link-checker.mjs`          | **886 / 886 internal links resolve**       |
| `validate-all.mjs` (master gate) | **17 / 17 gates pass**                     |

Markdown count: 406 → 367 (-39, all template stubs removed across the two cleanup commits). Link count net: 1132 → 886 (-246, all references to removed stubs are gone).

---

## Methodology

This Cycle 2 audit ran as a self-attestation against:

1. `main` branch at HEAD commit `9259317` (will be `<head>` once the 2 pending commits push).
2. The 9 commits listed above since Cycle 1 was written.
3. Validator outputs at the same HEAD.
4. Cycle 1 audit doc (`docs-standard-compliance-2026-05-24.md` on `01-docs/v2-standard-alignment` branch) as the baseline.

When PR #57 merges, the Cycle 1 audit doc and the new docs from PR #57 will land on `main` alongside this Cycle 2 doc. The two audits are then complementary historical records.

---

## Related documents

- Cycle 1 audit (on PR #57 branch): `01-docs/05-audit/docs-standard-compliance-2026-05-24.md`
- [`../README.md`](../README.md) — docs index
- [`../documentation-governance.md`](../governance/documentation-deviations.md) — repo-local deviations
- [`../audit/full-audit-2026-05-22.md`](./full-audit-2026-05-22.md) — substrate audit (Cycle 1 + 2.5)
- [`../audit/signal-scorecard.json`](./signal-scorecard.json) — SIGNAL v2 9.60/10
- Protocol 1: https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/1-docs-structure/protocol.md
- Protocol 13: https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/system-sop/1-protocols/13-architecture-diagrams/protocol.md
