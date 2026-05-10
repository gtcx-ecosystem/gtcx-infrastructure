# Data Retention Policy

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Document ID**: GTCX-DRP-001
**Version**: 1.0
**Date**: May 2026
**Status**: Active

---

## Purpose

This policy defines retention periods, automated deletion procedures, legal hold mechanisms, and right-to-erasure processes for all data processed by GTCX. It is designed for compliance with GDPR (EU), CCPA (California), POPIA (South Africa), the Zimbabwe Data Protection Act, and the Nigeria Data Protection Act (NDPA).

---

## Retention Schedule

| Data Type                     | Retention Period                                            | Justification                                                      | Deletion Trigger                      |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| KYC documents                 | 5 years after relationship ends (7 years for Zimbabwe FICA) | AML/CFT regulations, Zimbabwe Exchange Control Act, SA FIC Act     | Account closure + retention expiry    |
| Audit trail records           | 7 years                                                     | SOC 2, ISO 27001, statutory audit requirements                     | Automatic after 7-year mark           |
| Transaction records           | 7 years                                                     | Tax, AML, and financial reporting obligations                      | Automatic after 7-year mark           |
| PII (non-KYC)                 | Until purpose fulfilled + 30 days                           | GDPR Art. 5(1)(e), POPIA S14, NDPA principle of storage limitation | Purpose completion or erasure request |
| Application logs              | 90 days                                                     | Operational debugging and incident investigation                   | Automatic rotation                    |
| Access/auth logs              | 2 years                                                     | Security monitoring and forensic capability                        | Automatic rotation                    |
| Session data                  | 24 hours after session end                                  | Operational only                                                   | Automatic TTL                         |
| Backup snapshots              | 90 days                                                     | Disaster recovery                                                  | Automatic lifecycle policy            |
| Marketing consent records     | Duration of consent + 3 years                               | Proof of consent under GDPR Art. 7, POPIA S11                      | Consent withdrawal + 3-year retention |
| Compliance assessment results | 5 years                                                     | Regulatory examination readiness                                   | Automatic after 5-year mark           |

---

## Jurisdiction-Specific Retention

### Zimbabwe

- **Governing law**: Access to Information and Protection of Privacy Act (AIPPA), Exchange Control Act, Money Laundering and Proceeds of Crime Act
- **KYC retention**: 7 years after relationship termination (FICA equivalent obligations)
- **Financial records**: 6 years minimum (Companies and Other Business Entities Act)
- **Data localization**: Transaction records involving Zimbabwean entities stored on infrastructure within the SADC region

### South Africa

- **Governing law**: Protection of Personal Information Act (POPIA)
- **KYC retention**: 5 years after relationship termination (FIC Act S22-S26)
- **Right to erasure**: Supported under POPIA S24 (correction and deletion)
- **Cross-border transfer**: Permitted to adequate jurisdictions or with consent (POPIA S72)

### Nigeria

- **Governing law**: Nigeria Data Protection Act 2023 (NDPA)
- **KYC retention**: 5 years (CBN AML/CFT Regulations)
- **Data controller registration**: Required with Nigeria Data Protection Commission (NDPC) when processing data of 200+ Nigerian data subjects
- **Cross-border transfer**: Adequacy determination or binding corporate rules required

### European Union

- **Governing law**: General Data Protection Regulation (GDPR)
- **KYC retention**: 5 years after relationship termination (AMLD5)
- **Right to erasure**: GDPR Art. 17 (see Right-to-Erasure section below)
- **Data minimization**: Only collect and retain what is strictly necessary for the stated purpose

### United States (California)

- **Governing law**: California Consumer Privacy Act (CCPA) / CPRA
- **Right to deletion**: Supported — 45-day response window
- **Opt-out of sale**: Not applicable (GTCX does not sell personal data)

---

## Automated Deletion Procedure

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ CloudWatch   │────>│ Lambda: Retention │────>│ Data Stores  │
│ EventBridge  │     │ Enforcer         │     │ (RDS, S3)    │
│ (daily cron) │     └────────┬─────────┘     └──────────────┘
└──────────────┘              │
                              v
                    ┌──────────────────┐
                    │ Deletion Cert    │
                    │ (gtcx_audit DB)  │
                    └──────────────────┘
```

### Lambda: Retention Enforcer

Runs daily at 02:00 UTC via EventBridge rule:

1. **Query eligible records** — Scans metadata for records past their retention period
2. **Check legal holds** — Skips any record under active legal hold (see below)
3. **Execute deletion** — Cryptographic erasure for Confidential/Restricted data; standard DELETE for Internal
4. **Issue deletion certificate** — Writes immutable record to `gtcx_audit`
5. **Report** — Publishes metrics to CloudWatch: records deleted, records skipped (legal hold), errors

### Deletion Methods by Classification

| Tier         | Method                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Public       | Standard DELETE                                                                                   |
| Internal     | Standard DELETE with log entry                                                                    |
| Confidential | Cryptographic erasure (destroy encryption key) + DELETE + deletion certificate                    |
| Restricted   | Cryptographic erasure + HSM key destruction + DELETE + deletion certificate + manual verification |

---

## Legal Hold Mechanism

Legal holds override automated deletion. When a legal hold is active, no data subject to the hold may be deleted regardless of retention expiry.

### S3 Object Lock (Governance Mode)

```hcl
resource "aws_s3_bucket_object_lock_configuration" "legal_hold" {
  bucket = aws_s3_bucket.data.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 2555  # 7 years
    }
  }
}
```

Governance mode allows authorized users (with `s3:BypassGovernanceRetention`) to release holds when the legal matter concludes. Compliance mode is used for records that must never be deleted early (audit trails).

### Database Legal Hold

```sql
-- Legal hold flag on operational records
ALTER TABLE kyc_documents ADD COLUMN legal_hold BOOLEAN DEFAULT false;
ALTER TABLE kyc_documents ADD COLUMN legal_hold_reference TEXT;
ALTER TABLE kyc_documents ADD COLUMN legal_hold_applied_at TIMESTAMPTZ;

-- The Retention Enforcer Lambda checks: WHERE legal_hold = false
```

### Hold Lifecycle

1. **Legal team issues hold** — Updates `legal_hold = true` with reference number
2. **Retention Enforcer skips** — Records with `legal_hold = true` are excluded from deletion
3. **Legal team releases hold** — Updates `legal_hold = false` after matter concludes
4. **Normal retention resumes** — Record becomes eligible for deletion on next cycle

---

## Right-to-Erasure API

### DELETE /v1/data-subject/{id}

Initiates a data subject erasure request. Compliant with GDPR Art. 17, POPIA S24, NDPA, and CCPA.

**Request**:

```
DELETE /v1/data-subject/usr_abc123
Authorization: Bearer <compliance-team-token>
X-Request-Ticket: GTCX-DSR-2026-0042
X-Jurisdiction: EU
```

**Response** (202 Accepted):

```json
{
  "request_id": "dsr_789xyz",
  "subject_id": "usr_abc123",
  "status": "processing",
  "estimated_completion": "2026-05-22T00:00:00Z",
  "retention_exceptions": [
    {
      "data_type": "kyc_documents",
      "reason": "AML/CFT statutory retention (5 years remaining)",
      "retained_until": "2031-03-15T00:00:00Z"
    }
  ]
}
```

### Processing Steps

1. **Validate request** — Verify identity, check ticket reference, confirm jurisdiction
2. **Identify all data** — Query all stores for data linked to subject ID
3. **Apply exemptions** — KYC/AML records retained per statutory obligation; inform requestor
4. **Execute erasure** — Detokenize (to confirm scope), then cryptographic erasure + DELETE
5. **Propagate to sub-processors** — Notify all downstream processors (GDPR Art. 17(2))
6. **Issue deletion certificate** — Immutable record in `gtcx_audit`
7. **Respond to requestor** — Within 30 days (GDPR) / 45 days (CCPA)

### Exemptions

Erasure requests do not apply to:

| Exemption                                | Legal Basis                                 |
| ---------------------------------------- | ------------------------------------------- |
| KYC documents within statutory retention | GDPR Art. 17(3)(b) — legal obligation       |
| Active transaction records               | GDPR Art. 17(3)(b) — legal obligation       |
| Audit trail entries                      | GDPR Art. 17(3)(e) — legal claims           |
| Records under legal hold                 | GDPR Art. 17(3)(e) — legal claims           |
| Anonymized/aggregated data               | Not personal data — no obligation to delete |

---

## Deletion Certificate Template

Each deletion produces a certificate stored in `gtcx_audit`:

```sql
CREATE TABLE deletion_certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id          TEXT NOT NULL,
  request_id          TEXT NOT NULL,
  data_type           TEXT NOT NULL,
  data_store          TEXT NOT NULL,
  deletion_method     TEXT NOT NULL CHECK (deletion_method IN (
    'standard_delete', 'cryptographic_erasure', 'cryptographic_erasure_hsm'
  )),
  record_count        INTEGER NOT NULL,
  jurisdiction        TEXT NOT NULL,
  ticket_reference    TEXT NOT NULL,
  exemptions          JSONB DEFAULT '[]',
  deleted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_by          TEXT NOT NULL,
  verification_hash   TEXT NOT NULL  -- SHA-256 of deletion parameters
);

-- Append-only: no UPDATE or DELETE grants
-- Retained for 7 years minimum
```

### Certificate Fields

| Field               | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `subject_id`        | Identifier of the data subject                                                    |
| `request_id`        | DSR tracking identifier                                                           |
| `data_type`         | Category of deleted data (e.g., `pii`, `kyc_documents`)                           |
| `data_store`        | System where deletion occurred (e.g., `rds:gtcx_development`, `s3:gtcx-kyc-docs`) |
| `deletion_method`   | How data was destroyed                                                            |
| `record_count`      | Number of records deleted                                                         |
| `jurisdiction`      | Applicable privacy regime                                                         |
| `exemptions`        | Any records retained with legal basis                                             |
| `verification_hash` | Integrity proof — SHA-256 of all other fields                                     |

---

## Monitoring and Reporting

| Metric                          | Target                              |
| ------------------------------- | ----------------------------------- |
| DSR response time               | < 30 days (GDPR) / < 45 days (CCPA) |
| Automated deletion success rate | > 99.9%                             |
| Legal hold compliance           | 100% (no held records deleted)      |
| Deletion certificate issuance   | 100% of deletions                   |

CloudWatch dashboards track:

- Daily record deletion counts by data type
- Pending DSR requests and SLA countdown
- Legal hold inventory
- Retention policy violations (records past expiry not yet deleted)

---

**Review Cycle**: Quarterly
**Owner**: GTCX Compliance & Legal Team
