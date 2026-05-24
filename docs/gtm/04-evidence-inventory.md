---
title: 'Evidence Inventory — GTCX Compliance Substrate'
status: 'current'
date: '2026-05-24'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['gtm', 'evidence', 'audit', 'compliance', 'soc2', 'inventory']
review_cycle: 'monthly'
---

# Evidence Inventory — GTCX Compliance Substrate

> **Audience:** Auditors, compliance officers, security review teams needing a single catalog of every evidence artifact this repo produces.
> **Companion doc:** [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) — SOC 2-specific evidence with control-by-control mapping.

## Headline

Every claim in our GTM and security documentation links to a concrete artifact in this repo. This document is the catalog — what evidence exists, where it lives, who owns it, and how often it refreshes.

## Audit + scoring evidence

| Artifact                | Path                                                                         | Refresh                                                                                    | Purpose                                  |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Master audit            | [`../audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md)     | Per major cycle                                                                            | Full substrate audit with score          |
| Score-evidence ledger   | [`../audit/score-evidence-ledger.json`](../audit/score-evidence-ledger.json) | Per scoring event                                                                          | Append-only ledger of every score change |
| SIGNAL scorecard        | [`../audit/signal-scorecard.json`](../audit/signal-scorecard.json)           | On dimension change                                                                        | AI-maturity dimensional scoring          |
| Repo overlay            | [`../audit/repo-overlay.md`](../audit/repo-overlay.md)                       | On scope change                                                                            | What audit dimensions apply to this repo |
| Coverage gate rationale | [`../audit/coverage-gate-rationale.md`](../audit/coverage-gate-rationale.md) | On gate change                                                                             | Per-package coverage threshold reasoning |
| Distribution snapshots  | `../audit/distribution-snapshots/` (CI-populated)                            | Daily via [`distribution-snapshot.yml`](../../.github/workflows/distribution-snapshot.yml) | npm + GitHub adoption telemetry          |

## Compliance framework evidence

| Framework            | Document                                                                                               | Status             |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ |
| SOC 2 TSC mapping    | [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) | TSC-by-TSC         |
| GDPR DPIA            | [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md)                                       | Published          |
| ISO 27001 Annex A    | [`../compliance/policies/`](../compliance/policies/)                                                   | A05-A18 drafted    |
| Controls matrix      | [`../compliance/controls-matrix.md`](../compliance/controls-matrix.md)                                 | Cross-framework    |
| Risk register        | [`../compliance/risk-register.md`](../compliance/risk-register.md)                                     | Per-quarter review |
| Data classification  | [`../compliance/data-classification-policy.md`](../compliance/data-classification-policy.md)           | Standing           |
| Data retention       | [`../compliance/data-retention-policy.md`](../compliance/data-retention-policy.md)                     | Standing           |
| Separation of duties | [`../compliance/separation-of-duties-matrix.md`](../compliance/separation-of-duties-matrix.md)         | Standing           |
| Vendor risk          | [`../compliance/vendor-risk-program.md`](../compliance/vendor-risk-program.md)                         | Standing           |

## Security evidence

| Artifact                        | Path                                                                                               | Refresh               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------- |
| Threat model (STRIDE)           | [`../security/threat-model-2026-05.md`](../security/threat-model-2026-05.md)                       | Per major arch change |
| Security architecture           | [`../security/security-architecture.md`](../security/security-architecture.md)                     | Standing              |
| Defense-readiness               | [`../security/defense-readiness.md`](../security/defense-readiness.md)                             | Standing              |
| NIST 800-53 mapping             | [`../security/nist-800-53-mapping.md`](../security/nist-800-53-mapping.md)                         | Standing              |
| FIPS assessment                 | [`../security/fips-assessment.md`](../security/fips-assessment.md)                                 | Standing              |
| STIG compliance                 | [`../security/stig-compliance.md`](../security/stig-compliance.md)                                 | Standing              |
| Zero-trust assessment           | [`../security/zero-trust-assessment.md`](../security/zero-trust-assessment.md)                     | Standing              |
| Secrets management              | [`../security/secrets-management.md`](../security/secrets-management.md)                           | Standing              |
| Credential rotation log         | [`../security/credential-rotation-log.md`](../security/credential-rotation-log.md)                 | Append-only           |
| Audit-integrity verification    | [`../security/audit-integrity-verification.md`](../security/audit-integrity-verification.md)       | Standing              |
| Bug bounty policy / VDP         | [`../security/bug-bounty-policy.md`](../security/bug-bounty-policy.md)                             | Standing              |
| Vulnerability disclosure        | [`../security/vulnerability-disclosure.md`](../security/vulnerability-disclosure.md)               | Standing              |
| Trust center                    | [`../security/trust-center.md`](../security/trust-center.md)                                       | Standing              |
| Bug-bounty activation checklist | [`../security/bug-bounty-activation-checklist.md`](../security/bug-bounty-activation-checklist.md) | On change             |
| CVE acceptance log              | [`../security/cve-acceptance-log.md`](../security/cve-acceptance-log.md)                           | Append-only           |
| Forensic readiness              | [`../security/forensic-readiness.md`](../security/forensic-readiness.md)                           | Standing              |
| Red-team playbook               | [`../security/red-team-playbook.md`](../security/red-team-playbook.md)                             | Standing              |
| Signed-commits policy           | [`../security/signed-commits-policy.md`](../security/signed-commits-policy.md)                     | Standing              |
| Cosign CI integration           | [`../security/cosign-ci-integration.md`](../security/cosign-ci-integration.md)                     | Standing              |
| Key ceremony runbook            | [`../security/key-ceremony-runbook.md`](../security/key-ceremony-runbook.md)                       | Per ceremony          |

## Operational evidence

| Artifact                      | Path                                                                                                                 | Purpose                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Deploy runbook                | [`../operations/runbooks/deploy.md`](../operations/runbooks/deploy.md)                                               | Production deployment procedure  |
| Disaster recovery             | [`../operations/runbooks/disaster-recovery.md`](../operations/runbooks/disaster-recovery.md)                         | DR failover + restore            |
| Incident response             | [`../operations/runbooks/incident-response.md`](../operations/runbooks/incident-response.md)                         | General incident playbook        |
| Audit-chain incident response | [`../operations/runbooks/audit-chain-incident-response.md`](../operations/runbooks/audit-chain-incident-response.md) | P0 for chain integrity failures  |
| Audit signing-key rotation    | [`../operations/runbooks/audit-signing-key-rotation.md`](../operations/runbooks/audit-signing-key-rotation.md)       | Scheduled + compromise-triggered |
| SLI / SLO catalog             | [`../operations/slo-definitions.md`](../operations/slo-definitions.md)                                               | Service-level objectives         |
| Database failover             | [`../operations/runbooks/database-failover.md`](../operations/runbooks/database-failover.md)                         | Standing                         |
| Automated rollback            | [`../operations/runbooks/automated-rollback.md`](../operations/runbooks/automated-rollback.md)                       | Standing                         |
| Release evidence              | [`../operations/runbooks/release-evidence.md`](../operations/runbooks/release-evidence.md)                           | Per release                      |
| Rollback evidence             | [`../operations/runbooks/rollback-evidence.md`](../operations/runbooks/rollback-evidence.md)                         | Per rollback                     |

## Architecture decision records

21 ADRs at [`../decisions/README.md`](../decisions/README.md) covering monorepo structure, AI-native architecture, audit transport, fail-closed signing, adaptive policy, pen-test overlay, workspace boundary, coverage thresholds, npm publish discipline, and others.

## CI-enforced gates (live evidence)

Every PR produces evidence by running these gates ([`tools/scripts/validate-all.mjs`](../../tools/scripts/validate-all.mjs)):

| Gate                                           | Refresh  |
| ---------------------------------------------- | -------- |
| Coverage gates (per-package, 9 packages)       | Every PR |
| SIGNAL scorecard validation                    | Every PR |
| Score-evidence ledger validation               | Every PR |
| Docs-standard validation                       | Every PR |
| Kyverno policy validation                      | Every PR |
| Mesh-injection security tests (prod + staging) | Every PR |
| Reproducible build (dry run)                   | Every PR |

## Independently verifiable artifacts

The substrate publishes artifacts that any third party can verify without GTCX-side trust:

| Artifact                    | Verifier                                           | What you can verify                    |
| --------------------------- | -------------------------------------------------- | -------------------------------------- |
| `@gtcx/audit-signer` on npm | `npx -y @gtcx/audit-signer verify --file <ndjson>` | Hash-linked chain integrity offline    |
| WORM S3 NDJSON objects      | Same as above                                      | Per-tenant audit record provenance     |
| Distribution snapshot JSON  | direct read                                        | Daily npm + GitHub adoption numbers    |
| Master audit reports        | direct read                                        | Score evidence, dimension-by-dimension |

## How to add evidence to this inventory

When you create a new evidence artifact (audit, control, runbook, etc.):

1. Place it in the appropriate folder (`audit/`, `compliance/`, `security/`, `operations/`)
2. Add a row to the relevant table in this document
3. Cross-reference it from related GTM docs and the master audit
4. The master-validation gate enforces frontmatter + link integrity on every PR

## Related documents

- [`00-executive-brief.md`](./00-executive-brief.md) — credibility-with-evidence table summarizes top-level claims
- [`01-security-posture.md`](./01-security-posture.md) — security posture with evidence pointers
- [`02-compliance-matrix.md`](./02-compliance-matrix.md) — framework-by-framework evidence mapping
- [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) — SOC 2-specific
