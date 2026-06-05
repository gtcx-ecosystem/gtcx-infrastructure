#!/usr/bin/env bash
# W2-OPS-001 — populate AWS SM values for terminal-os staging ESO (no values in git).
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
SECRET_ID="gtcx/terminal-os/staging/api-keys"

COMPLIANCE_KEY="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -base64 32)"

JSON="$(jq -nc \
  --arg compliance "${COMPLIANCE_KEY}" \
  --arg auth "${AUTH_SECRET}" \
  '{
    COMPLIANCE_OS_TERMINAL_API_KEY: $compliance,
    AUTH_SECRET: $auth
  }')"

if aws secretsmanager describe-secret --secret-id "${SECRET_ID}" --region "${AWS_REGION}" &>/dev/null; then
  aws secretsmanager put-secret-value \
    --secret-id "${SECRET_ID}" \
    --region "${AWS_REGION}" \
    --secret-string "${JSON}" >/dev/null
  echo "OK put-secret-value ${SECRET_ID}"
else
  aws secretsmanager create-secret \
    --name "${SECRET_ID}" \
    --region "${AWS_REGION}" \
    --secret-string "${JSON}" >/dev/null
  echo "OK create-secret ${SECRET_ID}"
fi

echo "==> Done. Reconcile ESO: kubectl annotate externalsecret terminal-os-secrets -n terminal-os-staging force-sync=$(date +%s)"
