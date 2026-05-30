---
title: 'POL-08: Asset Management'
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

# POL-08: Asset Management

**Annex A Reference:** A.8 — Asset Management
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Identify, classify, and protect GTCX information assets throughout their lifecycle.

## 2. Scope

All information assets: source code, data stores, cloud resources, cryptographic keys, hardware devices, documentation, and third-party services.

## 3. Policy Statement

1. **Asset inventory.** All information assets are recorded in a centralized inventory with: asset ID, owner, classification, location, and dependencies. The inventory is updated within 48 hours of any asset creation, modification, or decommission. Cloud assets are auto-discovered via infrastructure-as-code and tagging policies.

2. **Classification scheme.** Assets are classified into four tiers per `docs/compliance/data-classification-policy.md`: Public, Internal, Confidential, Restricted. Classification determines encryption requirements, access controls, retention, and disposal methods.

3. **Acceptable use.** Assets are used only for authorized business purposes. Personal use of GTCX systems is prohibited. Credentials, tokens, and keys are never stored in source code or transmitted via unencrypted channels.

4. **Media handling.** Removable media is prohibited in production environments. Data at rest on any storage medium must be encrypted to the standard specified for its classification level. Media disposal follows NIST SP 800-88 guidelines (clear, purge, or destroy based on classification).

5. **Return of assets.** All GTCX assets (physical and logical) are returned or access is revoked upon termination, contract completion, or role change per the offboarding checklist.

## 4. Responsibilities

| Role          | Responsibility                                            |
| ------------- | --------------------------------------------------------- |
| CISO          | Maintain classification scheme, audit inventory           |
| Asset Owners  | Classify assets, ensure controls match classification     |
| DevOps        | Automate cloud asset discovery, enforce tagging           |
| All Personnel | Handle assets per classification, report loss immediately |

## 5. Exceptions

Use of removable media requires written CISO approval with a defined purpose, encryption enforcement, and a 7-day maximum duration.

## 6. Review

Reviewed annually. Asset inventory audited quarterly.
