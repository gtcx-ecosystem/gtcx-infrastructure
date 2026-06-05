#!/usr/bin/env bash
# Hub #17 — populate AWS SM values for compliance-os staging ESO (no values in git).
# GHCR token from `gh auth token`; app bundles use staging placeholders (local overlay parity).
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
PREFIX="gtcx/compliance-os/staging"
GH_USER="${GH_USER:-$(gh api user -q .login 2>/dev/null || true)}"

if [[ -z "${GH_USER}" ]]; then
  echo "ERROR: gh CLI login required for GHCR token"
  exit 1
fi

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

echo "==> App secret bundles (staging placeholders)"
put_json "${PREFIX}/compliance-api" "$(jq -nc '{
  POSTGRES_PASSWORD: "staging-change-me",
  DATABASE_URL: "postgresql://gateway:staging-change-me@staging-compliance-api-postgres:5432/gateway",
  REDIS_URL: "redis://staging-compliance-api-redis:6379",
  INTERNAL_SERVICE_TOKEN: "staging-change-me",
  CORE12_SERVICE_TOKEN: "staging-change-me",
  CREDENTIAL_PRIVATE_KEY: "__STAGING_PLACEHOLDER_PRIVATE_KEY__",
  CREDENTIAL_PUBLIC_KEY: "__STAGING_PLACEHOLDER_PUBLIC_KEY__"
}')"

put_json "${PREFIX}/caas" "$(jq -nc '{
  POSTGRES_PASSWORD: "staging-change-me",
  DATABASE_URL: "postgresql://caas:staging-change-me@staging-caas-postgres:5432/caas",
  REDIS_URL: "redis://staging-caas-redis:6379",
  NEXTAUTH_SECRET: "staging-change-me-32chars-minimum",
  S3_ACCESS_KEY: "staging-change-me",
  S3_SECRET_KEY: "staging-change-me",
  COMPLIANCE_API_INTERNAL_TOKEN: "staging-change-me",
  CORE12_SERVICE_TOKEN: "staging-change-me"
}')"

put_json "${PREFIX}/core12" "$(jq -nc '{
  NEO4J_PASSWORD: "staging-change-me",
  POSTGRES_PASSWORD: "staging-change-me",
  POSTGRES_URL: "postgresql+asyncpg://core12:staging-change-me@staging-core12-postgres:5432/core12",
  CORE12_SERVICE_TOKEN: "staging-change-me"
}')"

put_json "${PREFIX}/via" "$(jq -nc '{
  POSTGRES_PASSWORD: "staging-change-me",
  DATABASE_URL: "postgresql://via:staging-change-me@staging-via-postgres:5432/via_dev",
  REDIS_URL: "redis://staging-via-redis:6379",
  JWT_SECRET: "staging-change-me-32-char-minimum",
  S3_ACCESS_KEY: "staging-change-me",
  S3_SECRET_KEY: "staging-change-me"
}')"

put_json "${PREFIX}/vxa" "$(jq -nc '{
  POSTGRES_PASSWORD: "staging-change-me",
  DATABASE_URL: "postgresql://vxa:staging-change-me@staging-vxa-postgres:5432/vxa_dev",
  REDIS_URL: "redis://staging-vxa-redis:6379",
  JWT_SECRET: "staging-change-me-32-char-minimum",
  COUCHDB_PASSWORD: "staging-change-me",
  COUCHDB_URL: "http://admin:staging-change-me@staging-vxa-couchdb:5984",
  COUCHDB_DB_PREFIX: "vxa-sync",
  CORE12_SERVICE_TOKEN: "staging-change-me",
  S3_ACCESS_KEY: "staging-change-me",
  S3_SECRET_KEY: "staging-change-me",
  ED25519_PRIVATE_KEY: "staging-change-me",
  ED25519_PUBLIC_KEY: "staging-change-me"
}')"

put_json "${PREFIX}/minio" "$(jq -nc '{
  MINIO_ROOT_USER: "staging-change-me",
  MINIO_ROOT_PASSWORD: "staging-change-me-32chars-min"
}')"

echo "==> Done. Reconcile ESO: kubectl annotate externalsecret -n compliance-os-staging --all force-sync=$(date +%s)"
