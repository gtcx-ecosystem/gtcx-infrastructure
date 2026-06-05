# Encryption at Rest — Configuration Guide

**NIST Control:** SC-28 (Protection at Rest)
**SOC 2:** CC6.1
**ISO 27001:** A.8.24

---

## Overview

All GTCX data stores must encrypt data at rest. This document specifies the encryption requirements and configuration for each storage layer.

---

## PostgreSQL (Operational + Audit)

### AWS RDS

RDS instances are configured with storage encryption enabled by default in the Terraform database module:

```hcl
# 04-ship/terraform/modules/database/main.tf
resource "aws_db_instance" "main" {
  storage_encrypted = true
  kms_key_id        = var.kms_key_arn  # Customer-managed KMS key
}
```

**Verification:**

```bash
aws rds describe-db-instances --db-instance-identifier gtcx-$ENV-operational \
  --query 'DBInstances[0].StorageEncrypted'
# Expected: true
```

### Docker Compose (Development)

Development PostgreSQL uses unencrypted Docker volumes. This is acceptable for development but **must not be used for production or pilot deployments**.

For local development with encryption:

```yaml
# Mount an encrypted volume or use macOS FileVault / Linux LUKS
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /encrypted-volume/postgres
```

---

## S3 (Backup Exports)

All backup S3 buckets use AES-256 server-side encryption:

```hcl
# 04-ship/terraform/modules/backup/main.tf
resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

KMS key with automatic rotation for RDS snapshot exports:

```hcl
resource "aws_kms_key" "backup" {
  enable_key_rotation = true
  deletion_window_in_days = 30
}
```

---

## Redis (Cache)

Redis is used for rate limiting and replay cache — **not for persistent data**. Per the production store integration runbook, Redis data loss is acceptable (fail-open for reads, fail-closed for writes).

For environments requiring encrypted cache:

```yaml
# Enable Redis TLS in Docker Compose
redis:
  command: redis-server --tls-port 6379 --port 0 --tls-cert-file /tls/redis.crt --tls-key-file /tls/redis.key --tls-ca-cert-file /tls/ca.crt
```

For AWS ElastiCache:

- Enable encryption at rest (AES-256)
- Enable encryption in transit (TLS)
- Use auth token for access control

---

## Application-Layer Encryption

The `@gtcx/audit` package provides `EncryptedAuditStore` for application-layer encryption of audit entries using AES-256-GCM:

```typescript
import { createEncryptedAuditStore } from '@gtcx/audit';

const store = createEncryptedAuditStore({
  innerStore: postgresStore,
  encryptionKey: process.env.AUDIT_ENCRYPTION_KEY,
});
```

This provides defense-in-depth: even if storage-layer encryption is compromised, audit entries remain encrypted.

---

## Verification Checklist

| Store                    | Encryption Method                  | Verification Command                                               |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| PostgreSQL (operational) | RDS storage encryption (AES-256)   | `aws rds describe-db-instances --query 'StorageEncrypted'`         |
| PostgreSQL (audit)       | RDS storage encryption (AES-256)   | Same as above for audit instance                                   |
| S3 (backup exports)      | SSE-S3 (AES-256) + KMS for exports | `aws s3api get-bucket-encryption --bucket gtcx-$ENV-audit-backups` |
| Redis                    | TLS in transit, optional at-rest   | `redis-cli --tls INFO`                                             |
| Audit entries            | AES-256-GCM (application layer)    | `EncryptedAuditStore` configured in server startup                 |

---

## Key Rotation Schedule

| Key                        | Rotation                       | Method                                                    |
| -------------------------- | ------------------------------ | --------------------------------------------------------- |
| RDS storage encryption key | Automatic (AWS managed)        | AWS KMS auto-rotation                                     |
| Backup export KMS key      | Annual (auto-rotation enabled) | `enable_key_rotation = true`                              |
| Audit encryption key       | 90 days                        | Rotate `AUDIT_ENCRYPTION_KEY` env var, re-encrypt entries |
| Redis auth token           | 90 days                        | Rotate via secret manager, rolling restart                |

---

**Document Status:** Active
**Review Cycle:** Quarterly
**Owner:** Infrastructure + Security
