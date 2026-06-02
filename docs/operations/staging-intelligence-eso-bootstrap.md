---
title: 'Staging — Intelligence ESO bootstrap'
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# Staging — Intelligence ESO bootstrap

`gtcx-staging` did not include the Terraform `secrets` module until 2026-06-02. Without it:

- External Secrets Operator (ESO) is not installed
- `externalsecret` / `secretstore` CRDs are missing
- `intelligence-secrets` K8s secret does not exist

Operator evidence (vault + HTTPS smoke) does **not** require ESO. Full intelligence SDK pods do.

## Prerequisites

- AWS credentials with Terraform access to `gtcx-terraform-state-staging`
- `kubectl` context: `arn:aws:eks:af-south-1:348389439381:cluster/gtcx-staging`
- EAP auth bundle already in SM (from `pnpm eap:sync-auth`): `gtcx/intelligence/staging/auth-keys`

## 1. Import existing auth-keys secret (if EAP sync created it first)

```bash
cd infra/terraform/environments/staging
terraform init
terraform import \
  'module.secrets.aws_secretsmanager_secret.intelligence_auth_keys' \
  'gtcx/intelligence/staging/auth-keys'
```

Skip if the secret does not exist yet — Terraform will create it.

## 2. Apply secrets module (ESO + manifests + IAM)

Creates `gtcx-staging-intelligence-secrets-role` and `intelligence-sa` IRSA. Required before the helm-only fallback script.

```bash
terraform plan -var-file=terraform.tfvars -target=module.secrets
terraform apply -var-file=terraform.tfvars -target=module.secrets
```

This installs:

- Helm chart `external-secrets` in namespace `external-secrets`
- `SecretStore` `intelligence-aws-secrets` in namespace `intelligence`
- `ExternalSecret` `intelligence-secrets` (includes `AUTH_API_KEYS` / `AUTH_KEY_ROLES` from EAP bundle)
- `ServiceAccount` `intelligence-sa` with IRSA annotation

## 3. Verify

```bash
kubectl api-resources | grep -i externalsecret
kubectl get externalsecret,secretstore -n intelligence
kubectl get secret intelligence-secrets -n intelligence
kubectl get sa intelligence-sa -n intelligence -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}{"\n"}'
```

## 4. Force sync after EAP key rotation

```bash
kubectl annotate externalsecret intelligence-secrets -n intelligence \
  force-sync=$(date +%s) --overwrite
```

## Alternative: Helm-only (if Terraform apply is blocked)

Requires IAM role `gtcx-staging-intelligence-secrets-role` to already exist (step 2 must have run at least once).

```bash
cd gtcx-infrastructure
chmod +x scripts/staging/install-intelligence-eso.sh
./scripts/staging/install-intelligence-eso.sh
```

## 5. Wire orchestrator / SDK (follow-up)

Current staging deployment is `intelligence-orchestrator` only. Mount `intelligence-secrets` and set `serviceAccountName: intelligence-sa` when promoting the full SDK.

## Related

- `docs/operations/eap-secrets-and-iam.md`
- `infra/terraform/modules/secrets/intelligence.tf`
- `gtcx-agentic/docs/operators/intelligence-smoke-evidence.md`
