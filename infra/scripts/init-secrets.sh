#!/usr/bin/env bash
# =============================================================================
# GTCX Secret Initialization
# =============================================================================
# Interactive script to set initial secret values in AWS Secrets Manager.
# Run after `terraform apply` creates the secret resources.
#
# Usage: ./init-secrets.sh [environment]
# Example: ./init-secrets.sh zimbabwe-pilot
# =============================================================================

set -euo pipefail

ENVIRONMENT="${1:-zimbabwe-pilot}"
PREFIX="gtcx/${ENVIRONMENT}"

echo "=== GTCX Secret Initialization ==="
echo "Environment: ${ENVIRONMENT}"
echo ""

# Check AWS CLI
if ! command -v aws &>/dev/null; then
  echo "ERROR: AWS CLI not found. Install: https://aws.amazon.com/cli/"
  exit 1
fi

# Verify AWS identity
echo "AWS Identity:"
aws sts get-caller-identity --query 'Arn' --output text
echo ""

# Helper to set a secret
set_secret() {
  local secret_id="$1"
  local prompt="$2"
  local key="$3"

  echo "---"
  echo "Secret: ${secret_id}"

  # Check if secret exists in Secrets Manager
  if ! aws secretsmanager describe-secret --secret-id "${secret_id}" &>/dev/null; then
    echo "WARNING: Secret '${secret_id}' not found in Secrets Manager."
    echo "Run 'terraform apply' first to create secret resources."
    return
  fi

  read -rp "${prompt}: " value
  if [ -z "${value}" ]; then
    echo "Skipped (no value provided)"
    return
  fi

  aws secretsmanager put-secret-value \
    --secret-id "${secret_id}" \
    --secret-string "{\"${key}\":\"${value}\"}" \
    --output text --query 'Name'

  echo "Set successfully."
}

# Set secrets
set_secret "gtcx/intelligence/anthropic-api-key" "Anthropic API key (sk-ant-...)" "api_key"
set_secret "gtcx/intelligence/comply-advantage-api-key" "ComplyAdvantage API key (optional, press Enter to skip)" "api_key"

echo ""
echo "---"
echo "Database URL"
echo "Format: postgres://USER:PASSWORD@ENDPOINT:5432/DATABASE"
set_secret "gtcx/database/operational-url" "Database URL" "url"

echo ""
echo "=== Verification ==="
echo "Listing GTCX secrets:"
aws secretsmanager list-secrets \
  --filter Key=name,Values=gtcx/ \
  --query 'SecretList[].{Name:Name,LastChanged:LastChangedDate}' \
  --output table

echo ""
echo "Done. Deploy External Secrets Operator to sync to K8s."
