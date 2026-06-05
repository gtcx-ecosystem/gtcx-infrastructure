---
title: 'POL-18: Compliance'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-18: Compliance

**Annex A Reference:** A.18 — Compliance
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO (co-owned with Legal)
**Approved By:** Board Security Committee

## 1. Purpose

Ensure GTCX operations comply with legal, regulatory, and contractual obligations related to information security.

## 2. Scope

All GTCX systems, processes, and personnel subject to regulatory or contractual security requirements.

## 3. Policy Statement

1. **Regulatory identification.** A register of applicable legal, regulatory, and contractual requirements is maintained. For GTCX this includes: GDPR, local data protection laws in operating jurisdictions (East Africa, Global South markets), financial services regulations, anti-money laundering (AML) requirements, and sanctions compliance. The register is reviewed quarterly by legal and the CISO.

2. **Intellectual property.** GTCX respects intellectual property rights. Only licensed software is used. Open-source usage complies with license terms tracked via SBOM. GTCX proprietary code, protocols, and algorithms are protected through access controls and confidentiality agreements.

3. **Privacy and data protection.** Personal data is processed in accordance with applicable data protection laws. Data processing records are maintained. Privacy impact assessments are conducted for new processing activities involving personal data. Data subject rights (access, rectification, erasure, portability) are supported with a defined response process (30-day SLA).

4. **Independent review.** The ISMS is independently reviewed annually by a qualified external auditor. Internal audits are conducted quarterly against the controls matrix (`01-docs/10-compliance/controls-matrix.md`). Audit findings are tracked in the risk register with remediation deadlines.

5. **Technical compliance.** Automated compliance monitoring validates: encryption standards, access controls, logging configuration, and vulnerability posture. The SOC 2 evidence pipeline (`01-docs/10-compliance/soc2-evidence-pipeline.md`) continuously collects evidence for audit readiness. Deviations trigger automated alerts.

## 4. Responsibilities

| Role          | Responsibility                                                  |
| ------------- | --------------------------------------------------------------- |
| Legal         | Maintain regulatory register, advise on compliance              |
| CISO          | Ensure ISMS compliance, coordinate audits                       |
| DPO           | Manage data protection compliance, handle data subject requests |
| All Personnel | Comply with applicable regulations, complete required training  |

## 5. Exceptions

Regulatory non-compliance is never acceptable. Where conflicting requirements exist, legal counsel determines the controlling obligation and documents the rationale.

## 6. Review

Reviewed annually. Regulatory register reviewed quarterly. Audit findings reviewed monthly until resolved.
