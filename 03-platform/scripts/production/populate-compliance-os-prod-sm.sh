#!/usr/bin/env bash
# Hub #17 Phase B — populate AWS SM values for compliance-os production ESO.
# Generates W2 secrets per compliance-os inbound spec §2 (no values in git).
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
PREFIX="gtcx/compliance-os/production"
GH_USER="${GH_USER:-$(gh api user -q .login 2>/dev/null || true)}"
TERMINAL_OS_URL="${TERMINAL_OS_URL:-https://terminal.gtcx.trade}"
COMPLIANCE_API_URL="${COMPLIANCE_API_URL:-http://prod-compliance-api-app:3004}"
ORG_ID="${COMPLIANCE_OS_INTAKE_ORGANIZATION_ID:-org_prod_diligence}"

if [[ -z "${GH_USER}" ]]; then
  echo "ERROR: gh CLI login required for GHCR token"
  exit 1
fi

rand_b64() {
  openssl rand -base64 32 | tr -d '\n'
}

put_json() {
  local name="$1"
  local json="$2"
  if aws secretsmanager describe-secret --secret-id "${name}" --region "${AWS_REGION}" &>/dev/null; then
    aws secretsmanager put-secret-value \
      --secret-id "${name}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK put-secret-value ${name}"
  else
    aws secretsmanager create-secret \
      --name "${name}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK create-secret ${name}"
  fi
}

echo "==> GHCR pull token"
TOKEN="$(gh auth token)"
AUTH="$(printf '%s:%s' "${GH_USER}" "${TOKEN}" | base64 | tr -d '\n')"
DOCKER_CFG="$(jq -nc --arg auth "${AUTH}" '{"auths":{"ghcr.io":{"auth":$auth}}}')"
GHCR_JSON="$(jq -nc --argjson cfg "${DOCKER_CFG}" '{dockerconfigjson: $cfg}')"
put_json "${PREFIX}/ghcr-pull-token" "${GHCR_JSON}"

echo "==> W2 bundle (Hub #17 prod)"
INTAKE_KEY="$(rand_b64)"
TERMINAL_KEY="${COMPLIANCE_OS_TERMINAL_API_KEY:-$(rand_b64)}"
INTERNAL_TOKEN="$(rand_b64)"
SESSION_SECRET="$(rand_b64)"

if [[ -n "${COMPLIANCE_OS_TERMINAL_API_KEY:-}" ]]; then
  echo "Using COMPLIANCE_OS_TERMINAL_API_KEY from env (terminal-os prod alignment)"
else
  echo "Generated COMPLIANCE_OS_TERMINAL_API_KEY — align terminal-os prod receiver before PATCH proof"
fi

W2_JSON="$(jq -nc \
  --arg intake "${INTAKE_KEY}" \
  --arg org "${ORG_ID}" \
  --arg terminal_url "${TERMINAL_OS_URL}" \
  --arg terminal_key "${TERMINAL_KEY}" \
  --arg api_url "${COMPLIANCE_API_URL}" \
  --arg internal "${INTERNAL_TOKEN}" \
  --arg session "${SESSION_SECRET}" \
  '{
    COMPLIANCE_OS_INTAKE_API_KEY: $intake,
    COMPLIANCE_OS_INTAKE_ORGANIZATION_ID: $org,
    COMPLIANCE_OS_TERMINAL_OS_URL: $terminal_url,
    COMPLIANCE_OS_TERMINAL_API_KEY: $terminal_key,
    COMPLIANCE_API_URL: $api_url,
    COMPLIANCE_API_INTERNAL_TOKEN: $internal,
    COMPLIANCE_OS_SESSION_SECRET: $session
  }')"
put_json "${PREFIX}/w2" "${W2_JSON}"

echo "==> Done. Keys generated (not printed). Verify with:"
echo "  aws secretsmanager get-secret-value --secret-id ${PREFIX}/w2 --region ${AWS_REGION} --query SecretString --output text | jq 'keys'"
