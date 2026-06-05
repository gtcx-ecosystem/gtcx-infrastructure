---
title: 'POL-15: Supplier Relationships'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'frontend', 'devops']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-15: Supplier Relationships

**Annex A Reference:** A.15 — Supplier Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Ensure the security of GTCX information shared with or accessible by suppliers and service providers.

## 2. Scope

All third-party vendors, suppliers, cloud providers, SaaS tools, and contractors with access to GTCX systems or data.

## 3. Policy Statement

1. **Supplier assessment.** All suppliers are risk-assessed before onboarding using the vendor risk program (`01-docs/10-compliance/vendor-risk-program.md`). Assessment depth is proportionate to the supplier's classification (critical, high, medium, low). No supplier is granted access before completing assessment.

2. **Contractual requirements.** Contracts with suppliers processing GTCX data must include: data processing agreement (DPA), confidentiality obligations, breach notification within 72 hours, right-to-audit clause, data return/destruction upon termination, and compliance with applicable regulations.

3. **Service delivery monitoring.** Critical and high-risk suppliers are monitored for: SLA adherence, security incident disclosures, certification status (SOC 2, ISO 27001), and financial stability. Monitoring frequency: critical suppliers quarterly, high-risk suppliers semi-annually.

4. **Supply chain security.** Software supply chain integrity is maintained through: signed commits, dependency lockfiles, container image signing, and SBOM (Software Bill of Materials) generation for production deployments. Third-party code is not trusted by default.

5. **Supplier offboarding.** When a supplier relationship ends: access is revoked within 24 hours, data return/destruction is confirmed in writing, and the supplier is removed from the approved vendor list.

## 4. Responsibilities

| Role          | Responsibility                                           |
| ------------- | -------------------------------------------------------- |
| CISO          | Maintain vendor risk program, approve critical suppliers |
| Procurement   | Execute supplier contracts, track SLAs                   |
| Legal         | Review DPAs, right-to-audit clauses                      |
| System Owners | Monitor supplier service delivery                        |

## 5. Exceptions

Emergency use of an unassessed supplier (e.g., incident response firm) is permitted for 30 days with CISO approval. Full assessment must be completed within that period.

## 6. Review

Reviewed annually. Critical supplier assessments reviewed quarterly.
