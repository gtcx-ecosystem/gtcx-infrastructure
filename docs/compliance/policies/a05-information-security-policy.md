---
title: 'POL-05: Information Security Policy'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'frontend', 'network']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-05: Information Security Policy

**Annex A Reference:** A.5 — Organizational Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Establish the overarching information security direction for GTCX, ensuring confidentiality, integrity, and availability of all information assets across the ecosystem.

## 2. Scope

All GTCX information systems, data, personnel, contractors, and third parties with access to GTCX resources. Applies across all 17 repositories, cloud infrastructure, and operational environments.

## 3. Policy Statement

1. **Security governance.** GTCX maintains a documented Information Security Management System (ISMS) aligned with ISO 27001:2022. The CISO reports quarterly to the Board Security Committee on risk posture, incidents, and compliance status.

2. **Risk-based approach.** All security decisions are driven by the risk register. Controls are proportionate to the classification of the asset and the assessed risk. The risk appetite is defined and approved annually by the Board.

3. **Defense in depth.** No single control is relied upon in isolation. Security is layered across network, application, data, and operational domains. All production systems require a minimum of two independent security controls per threat vector.

4. **Continuous improvement.** Security posture is measured through quarterly internal audits, annual external assessments, and automated compliance monitoring via the SOC 2 evidence pipeline.

5. **Accountability.** Every information asset has a designated owner. Security responsibilities are documented in job descriptions and enforced through the separation of duties matrix.

## 4. Responsibilities

| Role                     | Responsibility                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| Board Security Committee | Approve policy, risk appetite, and security budget                 |
| CISO                     | Maintain ISMS, report on compliance, lead incident response        |
| Engineering Leads        | Implement technical controls within their domain                   |
| All Personnel            | Comply with policies, report incidents, complete security training |

## 5. Exceptions

Exceptions require a written risk assessment, compensating controls, an expiry date (maximum 12 months), and CISO approval. All exceptions are logged in the risk register.

## 6. Review

This policy is reviewed annually or upon material change to the threat landscape, regulatory environment, or business operations.
