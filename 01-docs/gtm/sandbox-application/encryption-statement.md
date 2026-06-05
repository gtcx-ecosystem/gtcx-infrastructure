---
title: 'Encryption Statement'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'standard'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Encryption Statement

**Classification:** Confidential — Regulator Submission
**Date:** 2026-05-25
**Prepared by:** GTCX Security Lead

---

## Statement

All GTCX platform data is encrypted at rest and in transit. No unencrypted data exists at any point in the system.

---

## Encryption at Rest

| Data Store                   | Encryption Method | Key Management                    | Key Rotation             |
| ---------------------------- | ----------------- | --------------------------------- | ------------------------ |
| Operational Database (RDS)   | AES-256           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| Audit Database (RDS)         | AES-256           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| KYC Documents (S3)           | SSE-KMS           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| WORM Audit Storage (S3)      | SSE-KMS           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| Backup Archives (S3 Glacier) | SSE-KMS           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| Container Images (ECR)       | AES-256           | AWS KMS (customer-managed key)    | Automatic (annual)       |
| Application Secrets          | AES-256           | AWS Secrets Manager               | Managed by AWS           |
| EBS Volumes (EKS nodes)      | AES-256           | AWS KMS (default key)             | Automatic (annual)       |
| Signing Keys                 | ECC_NIST_P256     | AWS KMS (asymmetric, SIGN_VERIFY) | Manual (90-day schedule) |

## Encryption in Transit

| Connection             | Protocol | Minimum Version  | Certificate                              |
| ---------------------- | -------- | ---------------- | ---------------------------------------- |
| Client → API Gateway   | TLS      | 1.2 (prefer 1.3) | AWS Certificate Manager                  |
| API Gateway → Services | TLS      | 1.3              | Linkerd mTLS (service mesh)              |
| Service → Database     | TLS      | 1.2              | RDS server certificate (rds.force_ssl=1) |
| Service → NATS         | TLS      | 1.3              | Internal CA                              |
| Service → S3           | HTTPS    | 1.2              | AWS default                              |
| kubectl → EKS API      | TLS      | 1.2              | EKS cluster certificate                  |

## Cryptographic Operations

| Operation            | Algorithm           | Standard        | Implementation             |
| -------------------- | ------------------- | --------------- | -------------------------- |
| Replay-guard signing | ECDSA P-256 (ES256) | NIST SP 800-186 | AWS KMS                    |
| Envelope hashing     | SHA-256             | FIPS 180-4      | Node.js Web Crypto API     |
| Ed25519 verification | EdDSA (Ed25519)     | RFC 8032        | Node.js Web Crypto API     |
| JWT verification     | ES256               | RFC 7518        | Node.js Web Crypto API     |
| Nonce generation     | CSPRNG              | NIST SP 800-90A | Node.js crypto.randomBytes |

## Enforcement

Encryption is enforced at the infrastructure level through:

1. **Terraform modules** — All database, S3, and EBS resources are configured with encryption enabled by default. Removing encryption causes Terraform plan failure.
2. **AWS Config rules** — 6 rules monitor for non-encrypted resources (EBS, EFS, S3, RDS, SQS, SNS). Non-compliant resources trigger CloudWatch alarms.
3. **S3 bucket policy** — Denies PutObject without server-side encryption header.
4. **RDS parameter group** — `rds.force_ssl = 1` on all database instances.
5. **Kyverno policy** — Pods without data classification labels are rejected.

---

_Prepared for regulatory submission. This document may be shared with central bank examiners._
