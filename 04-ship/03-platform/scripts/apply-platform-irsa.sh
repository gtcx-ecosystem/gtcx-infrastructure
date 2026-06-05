#!/usr/bin/env bash
# =============================================================================
# apply-platform-irsa.sh
# =============================================================================
# Annotates the gtcx-platform Kubernetes service account with the IRSA role
# ARN produced by the kyc-documents Terraform module.
#
# Run this once after `terraform apply` for a new environment. Idempotent —
# safe to re-run; kubectl annotate --overwrite is used.
#
# Prerequisites:
#   - terraform apply completed in the target environment directory
#   - kubectl context set to the target cluster
#   - AWS CLI configured (to confirm role exists before annotating)
#
# Usage:
#   ENVIRONMENT=zimbabwe-pilot ./04-ship/03-platform/scripts/apply-platform-irsa.sh
#   ENVIRONMENT=ghana-pilot    ./04-ship/03-platform/scripts/apply-platform-irsa.sh
# =============================================================================
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-zimbabwe-pilot}"
TF_DIR="$(dirname "$0")/../terraform/environments/${ENVIRONMENT}"
NAMESPACE="${NAMESPACE:-gtcx}"
SERVICE_ACCOUNT="gtcx-platform"

if [[ ! -d "$TF_DIR" ]]; then
  echo "ERROR: Terraform environment directory not found: ${TF_DIR}"
  exit 1
fi

echo "Fetching IRSA role ARN from Terraform state (${ENVIRONMENT})..."
IRSA_ROLE_ARN=$(terraform -chdir="$TF_DIR" output -raw kyc_documents_irsa_role_arn 2>/dev/null)

if [[ -z "$IRSA_ROLE_ARN" ]]; then
  echo "ERROR: kyc_documents_irsa_role_arn not found in Terraform output."
  echo "  Run: terraform apply in ${TF_DIR}"
  exit 1
fi

echo "IRSA role ARN: ${IRSA_ROLE_ARN}"

# Confirm the role exists in AWS before touching K8s
if ! aws iam get-role --role-name "$(basename "$IRSA_ROLE_ARN")" > /dev/null 2>&1; then
  echo "ERROR: IAM role not found in AWS: ${IRSA_ROLE_ARN}"
  exit 1
fi

echo "Annotating service account ${NAMESPACE}/${SERVICE_ACCOUNT}..."
kubectl annotate serviceaccount \
  --namespace "${NAMESPACE}" \
  "${SERVICE_ACCOUNT}" \
  "eks.amazonaws.com/role-arn=${IRSA_ROLE_ARN}" \
  --overwrite

echo ""
echo "Done. Verify with:"
echo "  kubectl get serviceaccount ${SERVICE_ACCOUNT} -n ${NAMESPACE} -o jsonpath='{.metadata.annotations}'"
echo ""
echo "Restart platform pods to pick up the new token projection:"
echo "  kubectl rollout restart deployment -l app.kubernetes.io/component=platform -n ${NAMESPACE}"
