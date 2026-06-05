---
title: 'Testnet-Pilot WORM Audit Bucket — Provision & Verify'
status: 'current'
date: '2026-05-27'
owner: 'infrastructure-lead'
role: 'sre'
tier: 'critical'
tags: ['worm', 'audit', 'testnet-pilot', 'terraform', 's3']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Testnet-Pilot WORM Audit Bucket — Provision & Verify

> **Purpose:** Close the testnet-pilot WORM Object Lock gap by applying the already-defined Terraform module and capturing live AWS evidence.
> **Prerequisite:** AWS credentials with permissions to create S3 buckets, KMS keys, IAM roles, and EKS IRSA resources in the testnet-pilot account.

---

## Pre-Flight Checklist

- [ ] AWS CLI authenticated (`aws sts get-caller-identity` returns the testnet-pilot account).
- [ ] Terraform >= 1.5.0 installed.
- [ ] Access to the testnet-pilot Terraform backend (`gtcx-terraform-state-testnet-pilot` in us-east-1).
- [ ] DynamoDB lock table `gtcx-terraform-locks-testnet-pilot` exists and is reachable.

---

## Provision Steps

### 1. Initialize Terraform

```bash
cd 04-ship/terraform/environments/testnet-pilot
terraform init
```

### 2. Plan (targeted to WORM + IRSA)

```bash
terraform plan -var-file=terraform.tfvars -out=tfplan.worm
```

**Expected changes:**

- `module.worm_audit.aws_s3_bucket.worm_audit` — `gtcx-worm-audit-testnet-pilot-af-south-1`
- `module.worm_audit.aws_s3_bucket_versioning.worm_audit` — Enabled
- `module.worm_audit.aws_s3_bucket_object_lock_configuration.worm_audit` — COMPLIANCE mode, 2557 days
- `module.worm_audit.aws_kms_key.worm_audit` — AES-256-GCM, rotation enabled
- `module.worm_audit.aws_s3_bucket_public_access_block.worm_audit` — All public access blocked
- `module.worm_audit.aws_s3_bucket_policy.worm_audit` — Deny unencrypted uploads + non-SSL
- `module.audit_flush_irsa.aws_iam_role.audit_flush` — IRSA role for audit-flush ServiceAccount

### 3. Apply

```bash
terraform apply tfplan.worm
```

Capture the output:

```bash
terraform output -json worm_audit_bucket_name > worm-audit-bucket-name.json
terraform output -json worm_audit_bucket_arn > worm-audit-bucket-arn.json
terraform output -json audit_flush_role_arn > audit-flush-role-arn.json
```

---

## Verification Commands

### Object Lock Configuration

```bash
BUCKET=$(terraform output -raw worm_audit_bucket_name)
aws s3api get-object-lock-configuration --bucket "$BUCKET" --region af-south-1
```

**Expected:**

```json
{
  "ObjectLockConfiguration": {
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "COMPLIANCE",
        "Days": 2557
      }
    }
  }
}
```

### Versioning

```bash
aws s3api get-bucket-versioning --bucket "$BUCKET" --region af-south-1
```

**Expected:** `Status: Enabled`

### Encryption

```bash
aws s3api get-bucket-encryption --bucket "$BUCKET" --region af-south-1
```

**Expected:** `aws:kms` with the module-created KMS key ARN.

### Public Access Block

```bash
aws s3api get-public-access-block --bucket "$BUCKET" --region af-south-1
```

**Expected:** All four fields `true`.

### Bucket Policy

```bash
aws s3api get-bucket-policy --bucket "$BUCKET" --region af-south-1
```

**Expected:** Statements for `DenyUnencryptedUploads` and `DenyNonSSL`.

### IRSA Role Trust Policy

```bash
ROLE_ARN=$(terraform output -raw audit_flush_role_arn)
aws iam get-role --role-name "${ROLE_ARN##*/}" --query 'Role.AssumeRolePolicyDocument'
```

**Expected:** Trusts the EKS OIDC provider for the `audit-flush` ServiceAccount in the testnet-pilot cluster.

---

## Evidence Capture

After verification succeeds, write the evidence bundle:

```bash
mkdir -p 04-ship/security/reports/testnet-pilot-worm-evidence/$(date -u +%Y%m%d-%H%M%S)
```

Collect:

1. `terraform-output.json` — all outputs from the apply.
2. `object-lock.json` — `get-object-lock-configuration` response.
3. `versioning.json` — `get-bucket-versioning` response.
4. `encryption.json` — `get-bucket-encryption` response.
5. `public-access.json` — `get-public-access-block` response.
6. `bucket-policy.json` — `get-bucket-policy` response.
7. `irsa-trust.json` — `get-role` AssumeRolePolicyDocument.

Commit these to `04-ship/security/reports/testnet-pilot-worm-evidence/<timestamp>/` and link from `01-docs/05-audit/latest.json`.

---

## Post-Provision Checklist

- [ ] Bucket name matches `gtcx-worm-audit-testnet-pilot-af-south-1`.
- [ ] Object Lock is `COMPLIANCE` mode (not `GOVERNANCE`).
- [ ] Retention is 2557 days.
- [ ] Versioning is Enabled.
- [ ] Encryption is `aws:kms`.
- [ ] Public access is fully blocked.
- [ ] IRSA role exists and trusts the correct OIDC provider + ServiceAccount.
- [ ] Evidence files are captured and linked in audit metadata.

---

## Rollback (if needed)

**Do not destroy the bucket** if any objects have been written — Object Lock in COMPLIANCE mode prevents deletion. If the bucket must be removed (e.g., during a re-create):

1. Ensure the bucket is empty.
2. Wait for the retention period to expire, **or**
3. Contact AWS Support with a compliance override request (requires root account + legal justification).

For Terraform state recovery only:

```bash
terraform state rm module.worm_audit.aws_s3_bucket.worm_audit
```

This removes the resource from state without touching AWS. Use only if the bucket was created out-of-band and must be imported instead.
