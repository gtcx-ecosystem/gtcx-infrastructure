---
title: 'GTCX Data Governance Specification'
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

# GTCX Data Governance Specification

| Field   | Value                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| Scope   | All data across the GTCX ecosystem                                                                                    |
| Status  | Specification                                                                                                         |
| Related | Security framework `gtcx-core/01-docs/specs/security-framework.md`; [Resilience Framework](./resilience-framework.md) |

## Design Principles

1. **Data sovereignty belongs to the entity that generated it** -- Producers own their verification data. Jurisdictions own their regulatory data. No entity can claim ownership of another's data.
2. **Minimum necessary disclosure** -- Sensitive data disclosed only to authorized parties, only the minimum required for the operation at hand.
3. **Verification records are permanent and immutable** -- Proofs, attestations, and custody chains are append-only. Everything else has a defined lifecycle and deletion path.
4. **PII stays under the subject's control** -- Data subjects can view, export, and request deletion of their personal data (except immutable verification records).

## Data Classification

| Level          | Definition                              | Examples                                                                                        | Handling Rules                                                                                     |
| -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Public**     | Openly available, no restrictions       | Protocol specs, open-source code, public GCI criteria, published compliance thresholds          | No restrictions on access or distribution                                                          |
| **Internal**   | Organization-internal, not sensitive    | Aggregate analytics, system metrics, deployment configs, internal dashboards                    | Access-controlled, no external sharing without approval                                            |
| **Restricted** | Sensitive business or personal data     | User profiles, MSISDN, email, transaction details, GCI signal breakdowns, custody chain details | Encrypted at rest (AES-256-GCM), encrypted in transit (TLS 1.3), access logged, need-to-know basis |
| **Sovereign**  | Jurisdiction-controlled government data | Mining permits, regulatory approvals, compliance certificates, government attestations          | Per-jurisdiction residency, government audit rights, no cross-border transfer without legal basis  |

## PII Handling

| Data Type                    | Classification | Storage                                    | Access                                 | Retention                                       | Deletion                                           |
| ---------------------------- | -------------- | ------------------------------------------ | -------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| MSISDN (phone number)        | Restricted     | Encrypted field, hashed index              | Auth service only                      | Account lifetime + 30 days                      | Secure wipe on deletion request                    |
| Email address                | Restricted     | Encrypted field, hashed index              | Auth + notification services           | Account lifetime + 30 days                      | Secure wipe on deletion request                    |
| Biometric templates          | Restricted     | Encrypted, isolated store                  | Biometric auth service only            | Account lifetime                                | Secure wipe on deletion request; no archival       |
| GPS coordinates              | Restricted     | Encrypted, precision-reduced for analytics | GeoTag service, analytics (aggregated) | 2 years at full precision, then aggregated      | Precision reduction after retention window         |
| Legal names                  | Restricted     | Encrypted field                            | Identity service, compliance           | Account lifetime + 30 days                      | Secure wipe on deletion request                    |
| Government IDs               | Sovereign      | Encrypted, jurisdiction-local storage only | Identity verification service          | As required by jurisdiction (typically 7 years) | Per jurisdiction regulation                        |
| Financial data (settlements) | Restricted     | Encrypted field, audit-logged access       | PvP settlement service, compliance     | 7 years                                         | Secure wipe after retention; audit trail permanent |

## Selective Disclosure

ZKP-based selective disclosure enables compliance verification without revealing underlying data.

| Proof Type            | What is Proved                                        | What is Revealed                      | ZKP System          |
| --------------------- | ----------------------------------------------------- | ------------------------------------- | ------------------- |
| GCI threshold         | Score exceeds minimum (e.g., GCI > 700)               | Valid/invalid + public parameters     | Schnorr range proof |
| Identity attribute    | DID holder possesses attribute (e.g., mining license) | Valid/invalid + attribute type        | Groth16             |
| Custody integrity     | Chain of custody is unbroken from origin to present   | Valid/invalid + custody chain length  | Bulletproofs        |
| Geographic compliance | Asset originated in compliant jurisdiction            | Valid/invalid + jurisdiction category | Schnorr             |
| Financial threshold   | Settlement amount within regulatory limit             | Valid/invalid + limit category        | Bulletproofs        |

**Verifier receives:** proof result (valid/invalid) + public parameters. Nothing else. No underlying data, no signal breakdown, no raw values.

## Data Sovereignty Rules

| Rule                         | Enforcement Mechanism                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Data residency               | All Sovereign data stored in jurisdiction's primary region; enforced by storage layer routing rules and deployment topology                   |
| Cross-border transfer        | Requires legal basis (treaty, regulation, or data subject consent) + data anonymization or aggregation before transfer                        |
| Government audit rights      | Sovereign jurisdiction can audit all data in their region via dedicated audit API with government-issued credentials                          |
| Data deletion                | Non-verification data can be deleted on request; verification records are permanent (append correction records instead)                       |
| Foreign access prohibition   | No foreign government or entity can compel access to another jurisdiction's Sovereign data; enforced by network isolation and legal structure |
| Data localization validation | Automated daily check confirms no Sovereign data exists outside designated jurisdiction; alerts on violation                                  |

## Retention Policy

| Data Type                                   | Retention Period           | Archive Strategy                   | Deletion Method                              |
| ------------------------------------------- | -------------------------- | ---------------------------------- | -------------------------------------------- |
| Verification records (proofs, attestations) | Permanent                  | Cold storage after 2 years         | Never (append-only ledger)                   |
| Custody chain (VaultMark)                   | Permanent                  | Cold storage after 2 years         | Never (append-only ledger)                   |
| Session data                                | 90 days                    | N/A                                | Secure wipe (AES key destruction)            |
| Access logs                                 | 1 year active              | Compressed archive (7 years total) | Secure wipe after 7 years                    |
| Audit trail                                 | 7 years active             | Compressed archive                 | Secure wipe after 7 years                    |
| Analytics data                              | 2 years at full resolution | Aggregated archive (indefinite)    | Secure wipe of raw data; aggregates retained |
| User profiles                               | Account lifetime + 30 days | N/A                                | Secure wipe on deletion request              |
| NATS event streams                          | 30 days hot                | Cold archive for 1 year            | Secure wipe after 1 year                     |

## Immutability Rules

| Rule                             | Implementation                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Append-only verification records | No UPDATE, no DELETE operations permitted on verification tables; enforced at database role level            |
| Hash-chained integrity           | Each record includes SHA-256 hash of previous record; chain integrity verifiable by any party                |
| Corrections model                | New attestation references original with `corrects: <originalId>` field; original record remains unchanged   |
| Content-addressed storage        | Records addressed by content hash (`sha256:<hex>`), not mutable identifier; duplicate writes are idempotent  |
| Tamper detection                 | Periodic integrity check validates hash chain; any break triggers immediate alert and forensic investigation |
| Backup immutability              | Cold storage backups are write-once; no modification or deletion for retention period                        |

## Consent Management

| Capability                | Implementation                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Data viewing              | Data subjects can view all their data via `GET /api/v1/data-subject/{did}/view`                 |
| Data export (portability) | Full export in JSON format via `GET /api/v1/data-subject/{did}/export`                          |
| Deletion request          | Non-verification data deleted within 30 days via `POST /api/v1/data-subject/{did}/delete`       |
| Consent tracking          | Consent recorded per data type and purpose; stored with timestamp and version                   |
| Consent withdrawal        | Withdrawal does not affect historical verification records (immutable); future processing stops |
| Consent audit             | Full consent history available to data subject and compliance team                              |

## Encryption Standards

| Context             | Algorithm    | Key Size       | Key Management                                                                            |
| ------------------- | ------------ | -------------- | ----------------------------------------------------------------------------------------- |
| At rest             | AES-256-GCM  | 256-bit        | HSM-managed keys with Shamir backup (3-of-5 threshold)                                    |
| In transit          | TLS 1.3      | Curve25519     | Automatic rotation via ACME (Let's Encrypt or internal CA)                                |
| Digital signatures  | Ed25519      | 256-bit        | Per-identity key pairs; HSM for institutional keys                                        |
| Key derivation      | Argon2id     | 256-bit output | Time=3, memory=64MB, parallelism=4                                                        |
| ZK proofs (general) | Groth16      | BN254 curve    | Circuit-specific trusted setup; ceremony-generated CRS                                    |
| ZK proofs (range)   | Bulletproofs | Ristretto      | No trusted setup required; per-proof randomness                                           |
| Backup encryption   | AES-256-GCM  | 256-bit        | Offline master key with Shamir split (3-of-5); stored in geographically distributed safes |

## Third-Party Data Processing

| Processor Type                      | Required Controls                                                   | Audit Frequency                              |
| ----------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Cloud infrastructure (AWS, GCP)     | SOC 2 Type II, data residency guarantees, encryption at rest        | Annual SOC 2 review + quarterly access audit |
| Analytics providers                 | Data anonymization before transfer, no raw PII access               | Semi-annual                                  |
| Communication services (SMS, email) | Encrypted transport, no data retention beyond delivery, DPA signed  | Annual                                       |
| Payment processors                  | PCI DSS Level 1, tokenized data only, no raw card data              | Annual PCI audit review                      |
| AI/ML model providers               | No training on GTCX data, data deleted after processing, DPA signed | Semi-annual                                  |

All third-party processors require:

- Signed Data Processing Agreement (DPA) before any data access
- No sub-processing without explicit written approval from GTCX data governance lead
- Annual audit of all third-party data processors with findings documented
- 30-day termination clause with data deletion certification upon contract end

## Deep Dives

- Security framework reference: `gtcx-core/01-docs/specs/security-framework.md` -- Cryptographic standards, key management, and threat models
- [Resilience Framework](./resilience-framework.md) -- Key recovery procedures, backup integrity, disaster recovery
- Shared ecosystem architecture guidance informs system topology and data flow across tiers.
