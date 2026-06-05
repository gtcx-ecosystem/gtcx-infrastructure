---
title: 'Data Classification Policy'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Data Classification Policy

**Document ID**: GTCX-DCP-001
**Version**: 1.0
**Date**: May 2026
**Status**: Active

---

## Purpose

This policy establishes a 4-tier data classification system for all data processed, stored, or transmitted within GTCX infrastructure. Every data element must be classified before it enters a production system.

---

## Classification Tiers

### Tier 1 — Public

Data intended for unrestricted access. Disclosure causes no harm.

**Examples**: marketing materials, open-source code, public API documentation, published compliance frameworks, press releases.

### Tier 2 — Internal

Data for authorized GTCX personnel only. Disclosure causes minor operational inconvenience.

**Examples**: architecture documentation, internal tooling, non-sensitive configuration files, sprint plans, internal wikis, non-production environment variables.

### Tier 3 — Confidential

Data whose disclosure causes material harm to GTCX or its users. Subject to regulatory obligations.

**Examples**: PII (names, addresses, phone numbers, email addresses), financial data, KYC documents, trade records, compliance assessment results, customer contracts, internal audit findings.

### Tier 4 — Restricted

Data whose disclosure causes severe, potentially irreversible harm. Highest protection requirements.

**Examples**: cryptographic private keys, authentication secrets, HSM material, audit trail records, biometric data, national identity numbers, Vault unseal keys, database master credentials, TLS certificates (private), token signing keys.

---

## Per-Tier Controls

| Control                   | Public                    | Internal                                  | Confidential                                           | Restricted                                                         |
| ------------------------- | ------------------------- | ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| **Encryption at rest**    | Not required              | AES-256 (volume-level)                    | AES-256-GCM (field-level)                              | AES-256-GCM + envelope encryption (KMS)                            |
| **Encryption in transit** | TLS 1.2+                  | TLS 1.2+                                  | TLS 1.3 required                                       | TLS 1.3 + mTLS                                                     |
| **Access control**        | None                      | RBAC — role-based                         | RBAC + need-to-know approval                           | RBAC + MFA + break-glass with audit                                |
| **Authentication**        | None                      | SSO                                       | SSO + MFA                                              | SSO + MFA + hardware key                                           |
| **Audit logging**         | Not required              | Access logs retained 90 days              | Full CRUD audit, retained 7 years                      | Immutable append-only audit, retained 7 years                      |
| **Retention**             | Indefinite or until stale | 2 years                                   | Per regulatory schedule (see data-retention-policy.md) | Per regulatory schedule, minimum 7 years                           |
| **Handling**              | No restrictions           | Internal channels only                    | Encrypted channels, no email                           | Encrypted channels, named recipients only                          |
| **Disposal**              | Delete                    | Secure delete                             | Cryptographic erasure + deletion certificate           | Cryptographic erasure + HSM key destruction + deletion certificate |
| **Backup**                | Optional                  | Standard backup                           | Encrypted backup, separate key                         | Encrypted backup, air-gapped key, tested restore                   |
| **Environment access**    | All environments          | Non-production free, production read-only | Production: named individuals only                     | Production: break-glass only                                       |

---

## Labeling Requirements

Every data element must carry its classification label at the infrastructure layer where it resides.

### Kubernetes Pod Annotations

```yaml
metadata:
  annotations:
    gtcx.trade/data-classification: 'confidential' # public | internal | confidential | restricted
    gtcx.trade/data-owner: 'compliance-team'
    gtcx.trade/contains-pii: 'true'
```

### S3 Object Tags

```json
{
  "gtcx:data-classification": "restricted",
  "gtcx:data-owner": "security-team",
  "gtcx:retention-policy": "7-years",
  "gtcx:contains-pii": "false"
}
```

### Database Column Metadata

PostgreSQL column comments carry classification:

```sql
COMMENT ON COLUMN users.national_id IS 'classification:restricted;pii:true;tokenized:true';
COMMENT ON COLUMN users.display_name IS 'classification:confidential;pii:true';
COMMENT ON COLUMN products.description IS 'classification:public;pii:false';
```

### Git Repository Topics

Each repository must include a topic indicating its highest data classification:

- `data-public`
- `data-internal`
- `data-confidential`
- `data-restricted`

### Terraform Resource Tags

```hcl
tags = {
  "gtcx:data-classification" = "confidential"
  "gtcx:data-owner"          = "platform-team"
  "gtcx:contains-pii"        = "true"
}
```

---

## Classification Decision Tree

```
START: New data element identified
  |
  v
Q1: Is this data intended for public consumption?
  |-- YES --> TIER 1: PUBLIC
  |-- NO
      |
      v
Q2: Does this data contain PII, financial records,
    KYC documents, or trade data?
  |-- NO
  |   |
  |   v
  |   Q3: Would disclosure cause material harm
  |       to GTCX or its users?
  |   |-- NO --> TIER 2: INTERNAL
  |   |-- YES --> TIER 3: CONFIDENTIAL
  |
  |-- YES
      |
      v
Q4: Is this data any of the following?
    - Cryptographic keys or secrets
    - Biometric data
    - National identity numbers
    - Authentication credentials
    - Immutable audit records
  |-- YES --> TIER 4: RESTRICTED
  |-- NO  --> TIER 3: CONFIDENTIAL
```

---

## Classification Review Process

1. **Initial classification** — Data owner assigns tier at design time, before first production deployment
2. **Peer review** — A second engineer validates the classification
3. **Quarterly review** — All Confidential and Restricted classifications reviewed by the security team
4. **Reclassification** — Any tier change requires a PR to the relevant infrastructure labels and a security team approval

---

## Enforcement

- CI pipelines validate that all new K8s manifests include `gtcx.trade/data-classification` annotations
- Terraform plans fail if resources handling Confidential or Restricted data lack required encryption tags
- S3 bucket policies deny PutObject for objects missing classification tags in Confidential/Restricted buckets
- Quarterly automated scan of all databases for unclassified columns containing PII patterns

---

**Review Cycle**: Quarterly
**Owner**: GTCX Security & Compliance Team
