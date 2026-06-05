#!/usr/bin/env bash
# Hub #17 — populate terminal-os production API keys; align with compliance-os W2 terminal key.
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
PREFIX="gtcx/terminal-os/production/api-keys"
W2_SECRET="gtcx/compliance-os/production/w2"
STAGING_SECRET="gtcx/terminal-os/staging/api-keys"

rand_b64() {
  openssl rand -base64 32 | tr -d '\n'
}

put_json() {
  local name="$1"
  local json="$2"
  if aws secretsmanager describe-secret --secret-id "${name}" --region "${AWS_REGION}" &>/dev/null; then
    aws secretsmanager put-secret-value --secret-id "${name}" --region "${AWS_REGION}" --secret-string "${json}" >/dev/null
    echo "OK put-secret-value ${name}"
  else
    aws secretsmanager create-secret --name "${name}" --region "${AWS_REGION}" --secret-string "${json}" >/dev/null
    echo "OK create-secret ${name}"
  fi
}

TERMINAL_KEY="$(aws secretsmanager get-secret-value --secret-id "${W2_SECRET}" --region "${AWS_REGION}" --query SecretString --output text | jq -r '.COMPLIANCE_OS_TERMINAL_API_KEY')"
STAGING_JSON="$(aws secretsmanager get-secret-value --secret-id "${STAGING_SECRET}" --region "${AWS_REGION}" --query SecretString --output text)"

PROD_JSON="$(echo "${STAGING_JSON}" | jq \
  --arg key "${TERMINAL_KEY}" \
  --arg auth "$(rand_b64)" \
  '.COMPLIANCE_OS_TERMINAL_API_KEY = $key | .AUTH_SECRET = $auth')"

put_json "${PREFIX}" "${PROD_JSON}"
echo "Aligned COMPLIANCE_OS_TERMINAL_API_KEY with compliance-os production W2."
