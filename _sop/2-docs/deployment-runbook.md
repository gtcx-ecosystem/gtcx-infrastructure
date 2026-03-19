# Deployment Runbook

> End-to-end guide for deploying GTCX infrastructure to a new or existing environment.

---

## Prerequisites

- AWS credentials with admin-level access to target account
- `kubectl` configured for target cluster
- `terraform` >= 1.5.0
- `kustomize` (bundled with kubectl >= 1.14)
- `pnpm` (for building container images)
- S3 bucket + DynamoDB table for Terraform state (see `_sop/2-docs/secrets-management.md`)

---

## 1. New Environment Setup

### 1.1 Copy Template

```bash
cd infra/terraform/environments
cp -r template {country}-{env}  # e.g., ghana-pilot, kenya-prod
cd {country}-{env}
```

### 1.2 Configure Backend

Edit `main.tf` — replace all `CHANGE-ME` values:

```hcl
backend "s3" {
  bucket         = "gtcx-terraform-state-{country}-{env}"
  key            = "environments/{country}-{env}/terraform.tfstate"
  region         = "af-south-1"  # or appropriate region
  encrypt        = true
  dynamodb_table = "gtcx-terraform-locks-{country}-{env}"
}
```

### 1.3 Configure Variables

Edit `terraform.tfvars`:

```hcl
environment        = "ghana-pilot"
region             = "af-south-1"
availability_zones = ["af-south-1a", "af-south-1b"]
vpc_cidr           = "10.0.0.0/16"
```

### 1.4 Deploy Infrastructure

```bash
terraform init
terraform plan -out=plan.tfplan
# Review plan carefully
terraform apply plan.tfplan
```

---

## 2. Kubernetes Deployment

### 2.1 Build and Apply

```bash
# Development
kustomize build infra/kubernetes/overlays/development | kubectl apply -f -

# Staging
kustomize build infra/kubernetes/overlays/staging | kubectl apply -f -

# Production
kustomize build infra/kubernetes/overlays/production | kubectl apply -f -
```

### 2.2 Verify Namespace

```bash
kubectl get pods -n gtcx
kubectl get svc -n gtcx
```

---

## 3. Intelligence Services

Deploy ANISA and SDK services:

```bash
bash scripts/deploy-intelligence.sh
```

This deploys from `infra/k8s/intelligence/` — the dedicated intelligence manifests.

---

## 4. Database Initialization

Apply init scripts from Docker infrastructure:

```bash
# Connect to operational database
psql $DATABASE_URL < infra/docker/init-scripts/01-init.sql
```

For the full Docker Compose development stack:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

---

## 5. Secrets Injection

See `_sop/2-docs/secrets-management.md` for the full secrets strategy.

Quick reference:

```bash
# Development: direct kubectl
kubectl create secret generic gtcx-secrets \
  --from-literal=DATABASE_URL="postgres://..." \
  --from-literal=SECRET_KEY_BASE="$(openssl rand -hex 64)" \
  -n gtcx

# Production: use Sealed Secrets or External Secrets Operator
```

---

## 6. Network Policy Customization

Production network policies (`infra/kubernetes/overlays/production/network-policies.yaml`) hardcode `cidr: 10.0.0.0/8` as the internal network range. If your VPC uses a different CIDR:

```bash
# Option 1: sed replacement
sed -i 's|10.0.0.0/8|172.16.0.0/12|g' infra/kubernetes/overlays/production/network-policies.yaml

# Option 2: kustomize patch
# Add a strategic merge patch in the production overlay's kustomization.yaml
```

This affects lines 80 and 148 of `network-policies.yaml`.

---

## 7. Verification Checklist

After deployment, verify:

- [ ] All pods in `gtcx` namespace are Running: `kubectl get pods -n gtcx`
- [ ] Services have endpoints: `kubectl get endpoints -n gtcx`
- [ ] API health: `kubectl exec -n gtcx deploy/gtcx-api -- curl -s localhost:3000/health`
- [ ] NATS connectivity: `kubectl logs -n gtcx deploy/nats --tail=20`
- [ ] Database connectivity: check application logs for connection errors
- [ ] Network policies applied: `kubectl get networkpolicy -n gtcx`
- [ ] Secrets mounted: `kubectl get secret -n gtcx`

---

## 8. Rollback Procedure

### Kubernetes Rollback

```bash
# Check rollout history
kubectl rollout history deployment/{service} -n gtcx

# Rollback to previous revision
kubectl rollout undo deployment/{service} -n gtcx

# Rollback to specific revision
kubectl rollout undo deployment/{service} --to-revision=N -n gtcx
```

### Terraform Rollback

```bash
# Review state
terraform show

# Import previous state if needed
terraform state pull > backup.tfstate

# Targeted destroy and recreate
terraform destroy -target=module.{module_name}
terraform apply
```

### Full Environment Teardown (destructive)

```bash
# Kubernetes resources
kustomize build infra/kubernetes/overlays/{env} | kubectl delete -f -

# Terraform (requires confirmation)
cd infra/terraform/environments/{country}-{env}
terraform destroy
```
