#!/usr/bin/env bash
# =============================================================================
# Bootstrap Production Terraform Backend
# =============================================================================
# One-time setup for the production Terraform state backend.
# Must be run by an AWS administrator before first terraform init.
#
# Usage:
#   aws-vault exec gtcx-admin -- bash bootstrap.sh
# =============================================================================

set -euo pipefail

REGION="us-east-1"
STATE_BUCKET="gtcx-terraform-state-production"
LOCKS_TABLE="gtcx-terraform-locks-production"

echo "Creating S3 bucket for Terraform state: ${STATE_BUCKET}"
aws s3api create-bucket \
  --bucket "${STATE_BUCKET}" \
  --region "${REGION}" \
  || echo "Bucket may already exist"

aws s3api put-bucket-versioning \
  --bucket "${STATE_BUCKET}" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "${STATE_BUCKET}" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms"
      },
      "BucketKeyEnabled": true
    }]
  }'

aws s3api put-public-access-block \
  --bucket "${STATE_BUCKET}" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Creating DynamoDB table for state locking: ${LOCKS_TABLE}"
aws dynamodb create-table \
  --table-name "${LOCKS_TABLE}" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "${REGION}" \
  || echo "Table may already exist"

echo "Bootstrap complete. Run: terraform init"
