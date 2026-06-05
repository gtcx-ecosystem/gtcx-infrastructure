#!/usr/bin/env bash
# Hub #17 Phase B — compliance-os production ESO + slim web-app + ingress.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OVERLAY="${REPO_ROOT}/infra/kubernetes/overlays/production/compliance-os"
AWS_REGION="${AWS_REGION:-af-south-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
ACCOUNT_ID="${ACCOUNT_ID:-348389439381}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/gtcx-${ENVIRONMENT}-compliance-os-secrets-role"

echo "==> Apply compliance-os production overlay"
kubectl apply -k "${OVERLAY}"

echo "==> Verify ServiceAccount IRSA annotation"
kubectl get sa compliance-os-sa -n compliance-os-production -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}{"\n"}' \
  | grep -q "${ROLE_ARN}" || {
  echo "WARN: SA role-arn mismatch. Expected ${ROLE_ARN}"
  echo "Run: terraform -chdir=infra/terraform/environments/production apply -target=module.secrets"
}

echo "==> Wait for ExternalSecrets (up to 120s)"
for i in $(seq 1 24); do
  if kubectl get externalsecrets -n compliance-os-production -o json 2>/dev/null \
    | jq -e '.items | length > 0 and ([.items[].status.conditions[]? | select(.type=="Ready" and .status=="True")] | length) == (.items | length)' >/dev/null 2>&1; then
    echo "All ExternalSecrets Ready"
    kubectl get externalsecrets -n compliance-os-production
    break
  fi
  kubectl get externalsecrets -n compliance-os-production 2>/dev/null || true
  sleep 5
done

echo "==> Wait for web-app Ready (up to 180s)"
kubectl rollout status deployment/web-app -n compliance-os-production --timeout=180s

echo "==> Ingress"
kubectl get ingress -n compliance-os-production

echo "==> Smoke (from bastion with key from SM):"
echo "  curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://compliance.gtcx.trade/api/diligence/licence-intelligence \\"
echo "    -H 'Authorization: Bearer <COMPLIANCE_OS_INTAKE_API_KEY>' -H 'Content-Type: application/json' -d @handoff.json"
