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
**Delivery Bucket:** `gtcx-config-records-af-south-1`
**Delivery Frequency:** 24 hours

**Recorded resources:**

- All supported resources
- Global resources (IAM roles, policies)

**Compliance rules to add:**

- [ ] `cloudtrail-enabled` — CloudTrail must be active
- [ ] `ec2-volume-inuse-check` — No unattached EBS volumes
- [ ] `s3-bucket-public-read-prohibited` — No public S3 buckets
- [ ] `rds-storage-encrypted` — RDS must be encrypted
- [ ] `restricted-ssh` — No SSH (port 22) open to 0.0.0.0/0

```bash
# Add compliance rule
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "s3-bucket-public-read-prohibited",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
    }
  }' \
  --region af-south-1
```

---

## Monthly Cost Estimate

| Service      | Estimated Monthly Cost |
| ------------ | ---------------------- |
| GuardDuty    | ~$10–$20               |
| Security Hub | ~$5–$10                |
| AWS Config   | ~$5–$15                |
| **Total**    | **~$20–$45**           |

---

_Document version: 1.0_
_Next review: After first GuardDuty finding or 2026-06-13_
