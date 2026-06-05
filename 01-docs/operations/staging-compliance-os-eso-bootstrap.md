---
title: 'Staging — compliance-os ESO bootstrap (Hub #17)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
---

# Staging — compliance-os ESO bootstrap

Hub **#17** ExternalSecrets previously referenced **`ClusterSecretStore/gtcx-aws-secrets-manager`**, which does not exist on `gtcx-staging`. This overlay uses a namespace **SecretStore** + **IRSA** (same pattern as intelligence).

## Prerequisites

- `kubectl` context: `gtcx-staging` (`af-south-1`)
- AWS credentials for Terraform + Secrets Manager

## 1. Terraform — IRSA role + empty SM shells

```bash
cd 04-ship/terraform/environments/staging
terraform init
terraform apply -var-file=terraform.tfvars \
  -target=module.secrets.aws_iam_role.compliance_os_secrets \
  -target=module.secrets.aws_iam_policy.compliance_os_secrets_reader \
  -target=module.secrets.aws_iam_role_policy_attachment.compliance_os_secrets \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_ghcr_pull \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_compliance_api \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_caas \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_core12 \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_via \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_vxa \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_minio
```

## 2. Populate AWS SM values

```bash
./03-platform/scripts/staging/populate-compliance-os-staging-sm.sh
```

Requires `gh auth` (read) for GHCR token. App bundles use staging placeholders until compliance-os supplies real values.

See also [`to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md`](coordination/to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md).

## 2b. Publish `compliance-web` image (amd64)

Cluster nodes are **amd64**. Local `docker build` on Apple Silicon produces **arm64** — push requires `write:packages`:

```bash
gh auth refresh -h github.com -s write:packages
docker buildx build --platform linux/amd64 -f apps/web/Dockerfile \
  -t ghcr.io/gtcx-ecosystem/compliance-web:staging-$(git rev-parse --short HEAD) \
  --push .
```

Or fix and re-run `CD / Staging` on `compliance-os` `main` (workflow_dispatch).

## 3. Apply K8s overlay

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/compliance-os/
# or
./03-platform/scripts/staging/install-compliance-os-eso.sh
```

## 4. Verify

```bash
kubectl get secretstore,externalsecret,sa -n compliance-os-staging
kubectl get secrets -n compliance-os-staging
```

## 5. compliance-os witness

```bash
cd ../compliance-os
pnpm w2:staging-prereq-check
```
