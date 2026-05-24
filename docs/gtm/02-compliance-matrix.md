---
title: 'Compliance Matrix — GTCX Compliance Substrate'
status: 'current'
date: '2026-05-24'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['gtm', 'compliance', 'soc2', 'gdpr', 'pci', 'fips', 'iso27001']
review_cycle: 'monthly'
---

# Compliance Matrix — GTCX Compliance Substrate

> **Audience:** Compliance officers, security auditors, regulator-facing teams.
> **Companion docs:** [`01-security-posture.md`](./01-security-posture.md), [`../compliance/`](../compliance/), [`../audit/`](../audit/).

## Headline coverage

| Framework             | Status                                                  | Last evidence                                                                                          | Next milestone            |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| **SOC 2 Type 1**      | Engagement RFP sent (4 firms)                           | [`../audit/soc2-engagement-2026.md`](../audit/soc2-engagement-2026.md)                                 | Auditor selection 2026-Q3 |
| **SOC 2 Type 2**      | Evidence pipeline 70% complete                          | [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) | Post-Type-1               |
| **GDPR**              | DPIA published                                          | [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md)                                       | Annual review             |
| **PCI-DSS**           | Scoping draft                                           | [`gtm/regulatory/pci-dss-scoping.md`](./regulatory/pci-dss-scoping.md)                                 | Scope ratification        |
| **FIPS 140-3**        | Posture documented; validation pending Node.js LTS path | [`../security/fips-assessment.md`](../security/fips-assessment.md)                                     | Track Node.js FIPS path   |
| **ISO 27001 Annex A** | Policies drafted A05-A18                                | [`../compliance/policies/`](../compliance/policies/)                                                   | Internal audit 2026-Q4    |
| **NIST SP 800-53**    | Mapping drafted                                         | [`../security/nist-800-53-mapping.md`](../security/nist-800-53-mapping.md)                             | Federal-track pilot only  |

## SOC 2 control coverage (Type 1 + Type 2)

| Trust Service Criterion               | Substrate evidence                                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CC1 — Control Environment**         | [`../compliance/board-security-committee-charter.md`](../compliance/board-security-committee-charter.md), [`../compliance/separation-of-duties-matrix.md`](../compliance/separation-of-duties-matrix.md)           |
| **CC2 — Communication & Information** | [`../security/security-policy.md`](../security/security-policy.md), [`../security/security-training-program.md`](../security/security-training-program.md)                                                         |
| **CC3 — Risk Assessment**             | [`../compliance/risk-register.md`](../compliance/risk-register.md), [`../security/threat-model-2026-05.md`](../security/threat-model-2026-05.md)                                                                   |
| **CC4 — Monitoring**                  | [`../operations/runbooks/monitoring.md`](../operations/runbooks/monitoring.md), `/metrics` endpoint, audit-trust Grafana dashboard                                                                                 |
| **CC5 — Control Activities**          | [`../compliance/controls-matrix.md`](../compliance/controls-matrix.md), CI master-validation 17/17 gates                                                                                                           |
| **CC6.1 — Logical Access**            | [`../security/secrets-management.md`](../security/secrets-management.md), [`../security/credential-rotation-log.md`](../security/credential-rotation-log.md)                                                       |
| **CC6.6 — External User Access**      | Per-tenant boundary (ADR-015), bearer + signed-edge auth (ADR-019)                                                                                                                                                 |
| **CC6.7 — Restricted Information**    | KMS CMK + AES-256-GCM at rest; deletion_protection=true on audit DB                                                                                                                                                |
| **CC7.1 — Detection of Anomalies**    | `tools/anomaly-detector/`, audit-trust dashboard, alert rules                                                                                                                                                      |
| **CC7.2 — Incident Response**         | [`../operations/runbooks/incident-response.md`](../operations/runbooks/incident-response.md), [`../operations/runbooks/audit-chain-incident-response.md`](../operations/runbooks/audit-chain-incident-response.md) |
| **CC7.3 — Recovery**                  | [`../operations/runbooks/disaster-recovery.md`](../operations/runbooks/disaster-recovery.md), [`../operations/runbooks/database-failover.md`](../operations/runbooks/database-failover.md)                         |
| **CC8.1 — Change Management**         | Conventional commits enforced, master-validation gate on every PR, ADRs for architectural change                                                                                                                   |
| **A1.1-3 — Availability**             | [`../operations/slo-definitions.md`](../operations/slo-definitions.md), HPA scaling, multi-AZ RDS                                                                                                                  |
| **C1.1-2 — Confidentiality**          | Tenant isolation, KMS-backed encryption, [`../compliance/data-classification-policy.md`](../compliance/data-classification-policy.md)                                                                              |
| **PI1.1-5 — Processing Integrity**    | Ed25519 chain on every consequential decision; verifyChain offline; fail-closed in prod (ADR-016)                                                                                                                  |
| **P1-P8 — Privacy**                   | [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md), [`../compliance/data-retention-policy.md`](../compliance/data-retention-policy.md)                                                               |

## GDPR mapping

| GDPR Article                        | Substrate evidence                                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Art. 5 — Principles                 | Data classification + retention policies                                                                                                                                                                 |
| Art. 25 — Data protection by design | DPIA + threat model + fail-closed audit                                                                                                                                                                  |
| Art. 30 — Records of processing     | The substrate is itself a record-of-processing primitive (hash-linked + signed)                                                                                                                          |
| Art. 32 — Security of processing    | KMS encryption + per-tenant isolation + WORM retention                                                                                                                                                   |
| Art. 33 — Breach notification       | [`../operations/runbooks/incident-response.md`](../operations/runbooks/incident-response.md), [`gtm/regulatory/regulatory-notification-templates.md`](./regulatory/regulatory-notification-templates.md) |
| Art. 35 — DPIA                      | [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md)                                                                                                                                         |

## FIPS 140-3 posture

The substrate uses Node.js `crypto.subtle` Web Crypto API exclusively — no userspace cryptographic primitives. FIPS validation status follows the underlying Node.js + OpenSSL builds used by the runtime container image. The substrate codebase itself is **FIPS-ready** in the sense that it never imports non-FIPS crypto; FIPS-validated certification of a specific deployment is gated on the operator choosing a FIPS-validated Node.js LTS build.

Full assessment: [`../security/fips-assessment.md`](../security/fips-assessment.md).

## ISO 27001 Annex A coverage

Policies drafted for A05-A18. The substrate is not yet ISO 27001 certified — internal audit scheduled 2026-Q4, external audit 2027 contingent on certification budget. Policies live at [`../compliance/policies/`](../compliance/policies/).

## PCI-DSS scope

The substrate does **not** store, process, or transmit cardholder data in its current production deployment. Scope is therefore minimal. If a pilot deployment adds PCI-relevant data flows, scope expands per [`gtm/regulatory/pci-dss-scoping.md`](./regulatory/pci-dss-scoping.md).

## Audit evidence catalog

Master audits, score-evidence ledger, and CI master-validation runs are all published evidence:

- Latest master audit: [`../audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md) (core 8.48 → 9.0 → SIGNAL v2 9.60)
- Score-evidence ledger: [`../audit/score-evidence-ledger.json`](../audit/score-evidence-ledger.json)
- SIGNAL scorecard: [`../audit/signal-scorecard.json`](../audit/signal-scorecard.json)
- Master-validation gate definitions: [`../../tools/scripts/validate-all.mjs`](../../tools/scripts/validate-all.mjs)
- Distribution snapshots (npm + GitHub): generator at [`../../tools/scripts/distribution-snapshot.mjs`](../../tools/scripts/distribution-snapshot.mjs), committed daily under `docs/audit/distribution-snapshots/` by the [`distribution-snapshot.yml`](../../.github/workflows/distribution-snapshot.yml) workflow

## Related documents

- [`00-executive-brief.md`](./00-executive-brief.md) — one-pager
- [`01-security-posture.md`](./01-security-posture.md) — security assessment
- [`../compliance/`](../compliance/) — full compliance corpus (DPIA, SOC 2 evidence, ISO 27001 policies)
- [`../audit/`](../audit/) — master audits + scoring
