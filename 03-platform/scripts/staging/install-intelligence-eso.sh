#!/usr/bin/env bash
# Install External Secrets Operator + intelligence SecretStore/ExternalSecret on gtcx-staging.
# Use when Terraform module.secrets is not applied yet. Requires: helm, kubectl, AWS SM populated.
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
ACCOUNT_ID="${ACCOUNT_ID:-348389439381}"
OIDC_ID="${OIDC_ID:-88225752107BD8162969D30455B2C3D7}"

echo "==> ESO helm install"
helm repo add external-secrets https://charts.external-secrets.io 2>/dev/null || true
helm repo update external-secrets
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --version 0.9.20 \
  --set installCRDs=true \
  --wait --timeout 5m

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/gtcx-${ENVIRONMENT}-intelligence-secrets-role"

echo "==> intelligence namespace + IRSA service account"
kubectl create namespace intelligence --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: intelligence-sa
  namespace: intelligence
  annotations:
    eks.amazonaws.com/role-arn: ${ROLE_ARN}
EOF

echo "==> SecretStore + ExternalSecret"
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: intelligence-aws-secrets
  namespace: intelligence
spec:
  provider:
    aws:
      service: SecretsManager
      region: ${AWS_REGION}
      auth:
        jwt:
          serviceAccountRef:
            name: intelligence-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: intelligence-secrets
  namespace: intelligence
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: intelligence-aws-secrets
    kind: SecretStore
  target:
    name: intelligence-secrets
    creationPolicy: Owner
  data:
    - secretKey: AUTH_API_KEYS
      remoteRef:
        key: gtcx/intelligence/${ENVIRONMENT}/auth-keys
        property: AUTH_API_KEYS
    - secretKey: AUTH_KEY_ROLES
      remoteRef:
        key: gtcx/intelligence/${ENVIRONMENT}/auth-keys
        property: AUTH_KEY_ROLES
EOF

echo "==> wait for sync"
sleep 5
kubectl get externalsecret,secret -n intelligence
echo "Done. Force refresh: kubectl annotate externalsecret intelligence-secrets -n intelligence force-sync=\$(date +%s) --overwrite"
