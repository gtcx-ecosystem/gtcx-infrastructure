# Secrets Management

> How secrets are handled across GTCX infrastructure environments.

---

## Strategy

GTCX uses a layered secrets strategy:

1. **Base manifests** use placeholder values so `kustomize build` succeeds without real credentials.
2. **Production overlays** inject real secrets via one of the supported operators (see below).
3. **Terraform state** uses encrypted S3 backend with DynamoDB locking.

---

## Kubernetes Secrets

### Base Layer (placeholders)

`infra/kubernetes/base/kustomization.yaml` contains a `secretGenerator` with placeholder literals:

```yaml
secretGenerator:
  - name: gtcx-secrets
    type: Opaque
    literals:
      - DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/gtcx
      - SECRET_KEY_BASE=placeholder-override-in-overlay
```

These are intentionally non-functional. They exist only so the base kustomization validates.

### Production Secrets Injection

Production overlays MUST override base secrets using one of:

| Method           | Tool                     | When to Use                                   |
| ---------------- | ------------------------ | --------------------------------------------- |
| Sealed Secrets   | `bitnami/sealed-secrets` | GitOps-native, secrets encrypted in-repo      |
| External Secrets | `external-secrets.io`    | Secrets stored in AWS Secrets Manager / Vault |
| Vault Agent      | `hashicorp/vault`        | Full secrets lifecycle with rotation          |

### Required Secrets

| Secret Key              | Description                                   | Rotation Cadence       |
| ----------------------- | --------------------------------------------- | ---------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (operational DB) | On credential rotation |
| `DATABASE_AUDIT_URL`    | PostgreSQL connection string (audit DB)       | On credential rotation |
| `SECRET_KEY_BASE`       | Application encryption key                    | Quarterly              |
| `NATS_TOKEN`            | NATS JetStream authentication                 | On rotation            |
| `AWS_ACCESS_KEY_ID`     | AWS service credentials (if not using IRSA)   | 90 days                |
| `AWS_SECRET_ACCESS_KEY` | AWS service credentials (if not using IRSA)   | 90 days                |

### Creating Secrets Per Environment

```bash
# Option 1: kubectl (development only)
kubectl create secret generic gtcx-secrets \
  --from-literal=DATABASE_URL="postgres://user:pass@host:5432/gtcx" \
  --from-literal=SECRET_KEY_BASE="$(openssl rand -hex 64)" \
  -n gtcx

# Option 2: Sealed Secrets (production)
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
```

---

## Terraform Secrets

### State Backend

All environments MUST use encrypted remote state:

```hcl
backend "s3" {
  bucket         = "gtcx-terraform-state-{env}"
  key            = "environments/{country}/terraform.tfstate"
  region         = "{region}"
  encrypt        = true
  dynamodb_table = "gtcx-terraform-locks-{env}"
}
```

### Sensitive Outputs

Terraform outputs containing credentials (e.g., `database_endpoints`) are marked `sensitive = true` and excluded from plan output.

---

## Rotation Procedure

1. Generate new credential value
2. Update in secrets operator (Sealed Secrets / AWS Secrets Manager / Vault)
3. Trigger rolling restart: `kubectl rollout restart deployment/{service} -n gtcx`
4. Verify health endpoints return 200
5. Revoke old credential after confirming all pods are healthy
