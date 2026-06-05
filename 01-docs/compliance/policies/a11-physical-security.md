---
title: 'POL-11: Physical and Environmental Security'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-11: Physical and Environmental Security

**Annex A Reference:** A.11 — Physical Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** Head of Operations (co-owned with CISO)
**Approved By:** Board Security Committee

## 1. Purpose

Prevent unauthorized physical access, damage, and interference to GTCX information and processing facilities.

## 2. Scope

All GTCX office locations, co-working spaces used by GTCX personnel, and cloud provider data centers hosting GTCX infrastructure.

## 3. Policy Statement

1. **Secure areas.** Office areas containing sensitive information or infrastructure equipment are designated secure areas with access restricted to authorized personnel. Visitor access requires escort and a sign-in log. Secure areas are not disclosed publicly.

2. **Cloud provider requirements.** AWS (primary cloud provider) must maintain SOC 2 Type II and ISO 27001 certifications for all regions hosting GTCX workloads. Data center physical security controls are validated through the vendor risk program annually.

3. **Equipment security.** All GTCX-issued devices use full-disk encryption (FileVault/BitLocker), screen lock after 5 minutes of inactivity, and are enrolled in MDM. Lost or stolen devices are reported within 1 hour and remotely wiped within 4 hours.

4. **Clean desk and clear screen.** Sensitive information is not left visible on screens or desks when unattended. Printed confidential documents are stored in locked cabinets and shredded when no longer needed.

5. **Secure disposal.** Hardware containing GTCX data is disposed of per NIST SP 800-88. Certificates of destruction are retained for 5 years. Cloud resources are decommissioned following the asset management offboarding procedure.

## 4. Responsibilities

| Role               | Responsibility                                             |
| ------------------ | ---------------------------------------------------------- |
| Head of Operations | Maintain physical access controls at office locations      |
| CISO               | Define security requirements, audit compliance             |
| IT                 | Manage MDM, enforce device encryption, execute remote wipe |
| All Personnel      | Lock devices, secure documents, report lost equipment      |

## 5. Exceptions

Temporary access to secure areas for maintenance personnel requires CISO or Operations approval and continuous escort.

## 6. Review

Reviewed annually. Cloud provider certifications validated annually through the vendor risk program.
