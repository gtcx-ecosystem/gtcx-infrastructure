---
title: 'Runbook: Terraform State Migration (Local → S3)'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['crypto', 'infrastructure', 'api', 'frontend', 'backend']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Runbook: Terraform State Migration (Local → S3)

---

## Purpose

Migrate Terraform state from local filesystem to S3 + DynamoDB backend for production-grade state management with locking and versioning.

---

## Prerequisites

- AWS CLI configured with admin-level access to the target account
- Terraform >= 1.5.0 installed
- Existing local state file (`terraform.tfstate`) in the environment directory

---

## Step 1: Create S3 Bucket and DynamoDB Table

```bash
# Variables
REGION="af-south-1"
BUCKET="gtcx-terraform-state-${ENVIRONMENT}"
TABLE="gtcx-terraform-locks"

# Create versioned S3 bucket
aws s3api create-bucket \
  --bucket ${BUCKET} \
  --region ${REGION} \
  --create-bucket-configuration LocationConstraint=${REGION}

aws s3api put-bucket-versioning \
  --bucket ${BUCKET} \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket ${BUCKET} \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]
  }'

aws s3api put-public-access-block \
  --bucket ${BUCKET} \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name ${TABLE} \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ${REGION}
```

## Step 2: Update Backend Configuration

In the environment's `main.tf`, uncomment or add:

```hcl
terraform {
  backend "s3" {
    bucket         = "gtcx-terraform-state-zimbabwe-pilot"
    key            = "infrastructure/terraform.tfstate"
    region         = "af-south-1"
    dynamodb_table = "gtcx-terraform-locks"
    encrypt        = true
  }
}
```

## Step 3: Migrate State

```bash
cd 04-ship/terraform/environments/zimbabwe-pilot

# Initialize with new backend — Terraform will detect the change
# and offer to copy existing state
terraform init -migrate-state

# Verify state was migrated
terraform plan  # Should show no changes
```

## Step 4: Verify

```bash
# Confirm remote state exists
aws s3 ls s3://${BUCKET}/infrastructure/

# Confirm lock table is accessible
aws dynamodb describe-table --table-name ${TABLE} --region ${REGION}

# Remove local state file (now in S3)
rm terraform.tfstate terraform.tfstate.backup
```

## Rollback

If migration fails:

```bash
# State is still in local terraform.tfstate.backup
# Revert the backend block in main.tf
terraform init -migrate-state  # Will copy back to local
```

---

## Environments

| Environment    | Bucket                                | State Region | Compute Region | Status                |
| -------------- | ------------------------------------- | ------------ | -------------- | --------------------- |
| zimbabwe-pilot | `gtcx-terraform-state-zimbabwe-pilot` | us-east-1    | af-south-1     | MIGRATED (2026-03-18) |
| ghana-pilot    | TBD                                   | us-east-1    | af-south-1     | NOT DEPLOYED          |
| rwanda-pilot   | TBD                                   | us-east-1    | af-south-1     | NOT DEPLOYED          |
