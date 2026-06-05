---
title: 'AWS Security Monitoring — Production'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'api', 'database']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# AWS Security Monitoring — Production

**Date:** 2026-05-13
**Region:** af-south-1
**Account:** 348389439381

---

## Enabled Services

| Service          | Status     | Purpose                                                     | Cost                       |
| ---------------- | ---------- | ----------------------------------------------------------- | -------------------------- |
| **GuardDuty**    | ✅ ENABLED | Threat detection (malware, crypto-mining, credential theft) | ~$0.10/GB + $4/vpc/mo      |
| **Security Hub** | ✅ ENABLED | Centralized security findings + compliance standards        | ~$0.10/security check      |
| **AWS Config**   | ✅ ENABLED | Resource inventory, compliance rules, change tracking       | ~$0.003/configuration item |
| **CloudTrail**   | ✅ ENABLED | API audit trail (existing)                                  | ~$2/100,000 events         |

---

## GuardDuty

**Detector ID:** `e2cf0fe37f7aaef96d5407be32efa3b6`

**Findings monitored:**

- Unauthorized API calls
- IAM policy changes
- VPC flow log anomalies
- S3 bucket policy changes
- Kubernetes (EKS) control plane threats

**Alert integration:**

```bash
# List findings
aws guardduty list-findings --detector-id e2cf0fe37f7aaef96d5407be32efa3b6 --region af-south-1

# Get finding details
aws guardduty get-findings --detector-id e2cf0fe37f7aaef96d5407be32efa3b6 --finding-ids <id> --region af-south-1
```

---

## Security Hub

**Enabled Standards:**

- AWS Foundational Security Best Practices v1.0.0
- CIS AWS Foundations Benchmark v1.2.0

**Controls monitored:**

- IAM password policy
- MFA enabled on root
- Unused credentials
- Public S3 buckets
- Unencrypted volumes
- Security group open access

**Findings dashboard:**

```bash
# Get high-severity findings
aws securityhub get-findings \
  --filters '{"SeverityLabel": [{"Comparison": "EQUALS", "Value": "HIGH"}]}' \
  --region af-south-1
```

---

## AWS Config

**Recorder:** `gtcx-config-recorder`
**Role:** `AWSServiceRoleForConfig` (service-linked role, Security Hub best practice)
**Delivery Bucket:** `gtcx-config-records-af-south-1`
**Delivery Frequency:** 24 hours

**Service-linked role creation:**

```bash
aws iam create-service-linked-role --aws-service-name config.amazonaws.com
```

**Recorded resources:**

- All supported resources
- Global resources (IAM roles, policies)

**Compliance rules applied:**

| Rule                                 | Source      | Scope       | Status       |
| ------------------------------------ | ----------- | ----------- | ------------ |
| `cloudtrail-enabled`                 | AWS Managed | Account     | ✅ COMPLIANT |
| `ec2-volume-inuse-check`             | AWS Managed | All regions | ✅ COMPLIANT |
| `s3-bucket-public-read-prohibited`   | AWS Managed | All regions | ✅ COMPLIANT |
| `rds-storage-encrypted`              | AWS Managed | All regions | ✅ COMPLIANT |
| `restricted-ssh`                     | AWS Managed | All regions | ✅ COMPLIANT |
| `s3-bucket-ssl-requests-only`        | AWS Managed | All regions | ✅ COMPLIANT |
| `mfa-enabled-for-iam-console-access` | AWS Managed | Account     | ✅ COMPLIANT |
| `rds-instance-public-access-check`   | AWS Managed | All regions | ✅ COMPLIANT |

**Terraform:** `04-ship/terraform/modules/config-rules/main.tf`

```bash
# List all rules
aws configservice describe-config-rules --region af-south-1

# Check compliance for a specific rule
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name gtcx-production-rds-storage-encrypted \
  --region af-south-1
```

---

## Monthly Cost Estimate

| Service      | Estimated Monthly Cost |
| ------------ | ---------------------- |
| GuardDuty    | ~$10–$20               |
| Security Hub | ~$5–$10                |
| AWS Config   | ~$5–$15                |
| Config Rules | ~$2–$5 (8 rules)       |
| **Total**    | **~$22–$50**           |

---

_Document version: 1.1_
_Next review: After first GuardDuty finding or 2026-06-13_
