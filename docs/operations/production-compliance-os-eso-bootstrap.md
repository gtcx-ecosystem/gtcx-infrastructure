---
title: 'Production — compliance-os ESO bootstrap (Hub #17 Phase B)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
approval_ticket: GTCX-XXX
---

# Production — compliance-os ESO bootstrap

Hub **#17** prod close at `https://compliance.gtcx.trade`. Staging Phase A is **complete**; this runbook delivers Phase B (Class A).

**Raise:** [`hub-17-prod-w2-close-raise-2026-06-08.md`](coordination/outbound/hub-17-prod-w2-close-raise-2026-06-08.md)  
**Spec:** compliance-os [`to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/docs/operations/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md)

## Prerequisites

- `kubectl` context: **production EKS** (`af-south-1`)
- AWS credentials for Terraform + Secrets Manager
- `gh auth` with `read:packages` (GHCR pull token)
- Approval ticket: `--approval-ticket=GTCX-XXX` on terraform apply

## 1. Terraform — IRSA + SM shells

```bash
cd infra/terraform/environments/production
terraform init
terraform plan -var-file=terraform.tfvars \
  -target=module.secrets.aws_iam_role.compliance_os_secrets \
  -target=module.secrets.aws_iam_policy.compliance_os_secrets_reader \
  -target=module.secrets.aws_iam_role_policy_attachment.compliance_os_secrets \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_ghcr_pull \
  -target=module.secrets.aws_secretsmanager_secret.compliance_os_w2 \
  -out=hub17-prod.plan
# Review plan + second-person sign-off, then:
terraform apply hub17-prod.plan
```

## 2. Populate AWS SM (W2 + GHCR)

Align terminal key with terminal-os prod receiver when available:

```bash
# Optional: reuse terminal-os prod admin key
export COMPLIANCE_OS_TERMINAL_API_KEY="<from terminal-os prod SM>"
export TERMINAL_OS_URL="https://terminal.gtcx.trade"
./scripts/production/populate-compliance-os-prod-sm.sh
```

W2 SM path: `gtcx/compliance-os/production/w2` — keys only in SM, never in git.

## 3. Publish prod `compliance-web` image (amd64)

```bash
cd ../compliance-os
gh auth refresh -h github.com -s write:packages
docker buildx build --platform linux/amd64 -f apps/web/Dockerfile \
  -t ghcr.io/gtcx-ecosystem/compliance-web:prod-$(git rev-parse --short HEAD) \
  --push .
```

Pin image in `infra/kubernetes/overlays/production/compliance-os/web-app.yaml` before apply.

## 4. Apply K8s overlay

```bash
./scripts/production/install-compliance-os-eso.sh
```

Overlay path: `infra/kubernetes/overlays/production/compliance-os/`

## 5. DNS

- **ACM:** certs must cover `compliance.gtcx.trade` (wildcard `*.gtcx.trade` on account certs `8929e5a0`, `9f7149a3`).
- **Cloudflare:** CNAME `compliance.gtcx.trade` → production ALB (if not using external-dns).
- **ALB group:** `gtcx-production-api`

## 6. Verify (evidence — no secret values in git)

```bash
kubectl get secretstore,externalsecret,sa,ingress -n compliance-os-production
kubectl get pods -n compliance-os-production -l app=web-app
kubectl exec -n compliance-os-production deploy/web-app -- env | grep -E '^COMPLIANCE_OS_' | cut -d= -f1

# Intake smoke — expect 201
export COMPLIANCE_OS_URL=https://compliance.gtcx.trade
export COMPLIANCE_OS_INTAKE_API_KEY="$(aws secretsmanager get-secret-value \
  --secret-id gtcx/compliance-os/production/w2 --region af-south-1 \
  --query SecretString --output text | jq -r .COMPLIANCE_OS_INTAKE_API_KEY)"
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  "${COMPLIANCE_OS_URL}/api/diligence/licence-intelligence" \
  -H "Authorization: Bearer ${COMPLIANCE_OS_INTAKE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @../compliance-os/apps/web/fixtures/licence-intelligence/ag-invest-kasai-handoff.json
```

Post witness: `docs/operations/coordination/from-gtcx-infrastructure-hub-17-prod-w2-sealed-YYYY-MM-DD.md`

## 7. Downstream (Class R)

| Repo           | Command                                                   |
| -------------- | --------------------------------------------------------- |
| exploration-os | `npm run w2:prod:retest` → `w2-hub-17-retest-latest.json` |
| compliance-os  | `pnpm w2:terminal-patch-proof`                            |
| baseline-os    | Finalize locker #17 inbound when all rows ☑               |
