#!/usr/bin/env bash
# XR-MKT-011 / S39-01 — sync GTX_MARKETS_AUTHORITY_API_KEY into staging k8s secret.
set -euo pipefail

NAMESPACE="${NAMESPACE:-gtcx-staging}"
SECRET_NAME="${SECRET_NAME:-markets-authority-stub-secrets}"
SM_ID="${SM_ID:-gtx-markets/staging/internal-token}"
REGION="${AWS_REGION:-af-south-1}"

KEY="$(aws secretsmanager get-secret-value \
  --secret-id "$SM_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text)"

if [[ -z "$KEY" || "$KEY" == "None" ]]; then
  echo "error: empty secret from $SM_ID" >&2
  exit 1
fi

kubectl create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  --from-literal="GTX_MARKETS_AUTHORITY_API_KEY=$KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "synced $SECRET_NAME in $NAMESPACE from $SM_ID"
