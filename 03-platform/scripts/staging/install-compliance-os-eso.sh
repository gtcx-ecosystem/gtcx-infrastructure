#!/usr/bin/env bash
# Hub #17 — compliance-os staging ESO: apply overlay + verify SecretStore sync.
# Prerequisite: terraform module.secrets (compliance-os.tf) applied for IRSA + SM shells.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OVERLAY="${REPO_ROOT}/04-ship/kubernetes/overlays/staging/compliance-os"
AWS_REGION="${AWS_REGION:-af-south-1}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
ACCOUNT_ID="${ACCOUNT_ID:-348389439381}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/gtcx-${ENVIRONMENT}-compliance-os-secrets-role"

echo "==> Apply compliance-os staging overlay (namespace + SecretStore + ExternalSecrets)"
kubectl apply -k "${OVERLAY}"

echo "==> Verify ServiceAccount IRSA annotation"
kubectl get sa compliance-os-sa -n compliance-os-staging -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}{"\n"}' \
  | grep -q "${ROLE_ARN}" || {
  echo "WARN: SA role-arn mismatch. Expected ${ROLE_ARN}"
  echo "Run: terraform -chdir=04-ship/terraform/environments/staging apply -target=module.secrets"
}

echo "==> Wait for ExternalSecrets (up to 90s)"
for i in $(seq 1 18); do
  if kubectl get externalsecrets -n compliance-os-staging -o json 2>/dev/null \
    | jq -e '.items | length > 0 and ([.items[].status.conditions[]? | select(.type=="Ready" and .status=="True")] | length) == (.items | length)' >/dev/null 2>&1; then
    echo "All ExternalSecrets Ready"
    kubectl get externalsecrets -n compliance-os-staging
    exit 0
  fi
  kubectl get externalsecrets -n compliance-os-staging 2>/dev/null || true
  sleep 5
done

echo "ExternalSecrets not all Ready — populate AWS SM values per witness doc:"
echo "  01-docs/04-ops/coordination/to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md"
kubectl get externalsecrets -n compliance-os-staging
exit 1
