# Data Residency Proof

**Classification:** Confidential — Regulator Submission
**Date:** \_\_\_\_\_\_\_\_\_\_
**Prepared by:** \_\_\_\_\_\_\_\_\_\_

---

## Statement

All GTCX platform data — including personal data, KYC documents, financial records, audit trails, and operational logs — is stored exclusively within the **AWS Africa (Cape Town) region (af-south-1)**, located in **South Africa**.

No data is transferred outside the African continent during normal operations.

---

## Infrastructure Evidence

| Component            | AWS Region       | Service                    | Encryption           |
| -------------------- | ---------------- | -------------------------- | -------------------- |
| Operational Database | af-south-1       | Amazon RDS (PostgreSQL 16) | AES-256 (KMS CMK)    |
| Audit Database       | af-south-1       | Amazon RDS (PostgreSQL 16) | AES-256 (KMS CMK)    |
| KYC Document Storage | af-south-1       | Amazon S3                  | SSE-KMS              |
| WORM Audit Storage   | af-south-1       | Amazon S3 (Object Lock)    | SSE-KMS              |
| Container Images     | af-south-1       | Amazon ECR                 | AES-256 (KMS CMK)    |
| Application Compute  | af-south-1       | Amazon EKS                 | EBS encrypted (KMS)  |
| Secrets              | af-south-1       | AWS Secrets Manager        | AES-256 (KMS CMK)    |
| Backups              | af-south-1       | Amazon S3 (Glacier)        | SSE-KMS              |
| DNS                  | Global (anycast) | Amazon Route53             | N/A (no data stored) |
| TLS Certificates     | af-south-1       | AWS Certificate Manager    | AWS-managed          |

## Terraform Configuration Reference

The following Terraform configuration enforces data residency:

```hcl
# From: infra/terraform/environments/zimbabwe-pilot/main.tf
provider "aws" {
  region = "af-south-1"  # Cape Town, South Africa
}

# From: infra/terraform/modules/compliance-db/main.tf
# Jurisdiction-specific configuration:
zimbabwe = {
  region               = "af-south-1"
  kyc_retention_days   = 1825  # 5 years — RBZ AML/CFT
  audit_retention_days = 2555  # 7 years — Companies Act
  regulator            = "RBZ"
  data_protection_law  = "Cyber and Data Protection Act (2021)"
}
```

## Cross-Border Data Transfers

| Scenario                       | Data transferred                    | Destination               | Legal basis                              |
| ------------------------------ | ----------------------------------- | ------------------------- | ---------------------------------------- |
| Normal operations              | None                                | N/A                       | N/A                                      |
| Disaster recovery (if enabled) | Encrypted database replica          | eu-west-1 (Ireland)       | Adequate safeguards, POTRAZ notification |
| Third-party services           | DNS queries only (no personal data) | AWS global infrastructure | Standard AWS DPA                         |

## Regulatory Alignment

| Jurisdiction | Law                                  | Requirement                                    | Compliance                                        |
| ------------ | ------------------------------------ | ---------------------------------------------- | ------------------------------------------------- |
| Zimbabwe     | Cyber and Data Protection Act (2021) | POTRAZ notification for cross-border transfers | Compliant — no transfers during normal operations |
| Kenya        | Data Protection Act (2019)           | Adequate safeguards for transfers              | Compliant — data in af-south-1                    |
| Nigeria      | NDPA (2023)                          | NDPC approval for transfers outside Africa     | Compliant — all data on African continent         |
| South Africa | POPIA (2013)                         | Consent or adequate jurisdiction for transfers | Compliant — data stored in South Africa           |

---

## Verification

To independently verify data residency:

```bash
# List all RDS instances and their regions
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,AvailabilityZone]' --output table

# List all S3 buckets and their regions
aws s3api list-buckets --query 'Buckets[*].Name' --output text | xargs -I {} aws s3api get-bucket-location --bucket {}

# List all EKS clusters and their regions
aws eks list-clusters --query 'clusters' --output text | xargs -I {} aws eks describe-cluster --name {} --query 'cluster.arn'
```

---

_Prepared for regulatory submission. This document may be shared with central bank examiners._
