# Secrets Module

Manages AWS Secrets Manager secrets for GTCX services. Secrets are created by Terraform but values must be set manually after initial `terraform apply`.

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- `terraform apply` completed (creates empty secret resources)
- EKS cluster running with External Secrets Operator deployed

## Setting Initial Secret Values

After `terraform apply` creates the secret resources:

```bash
# Intelligence service — Anthropic API key
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/anthropic-api-key \
  --secret-string '{"api_key":"sk-ant-..."}'

# Intelligence service — ComplyAdvantage API key (for production screening)
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/comply-advantage-api-key \
  --secret-string '{"api_key":"..."}'

# Database URL (operational)
aws secretsmanager put-secret-value \
  --secret-id gtcx/database/operational-url \
  --secret-string '{"url":"postgres://gtcx:PASSWORD@ENDPOINT:5432/gtcx"}'
```

## Verification

```bash
# Verify secrets exist
aws secretsmanager list-secrets --filter Key=name,Values=gtcx/ --query 'SecretList[].Name'

# Verify ESO sync to K8s
kubectl get externalsecret -n intelligence
kubectl get secret intelligence-secrets -n intelligence -o jsonpath='{.data}' | base64 -d
```

## Rotation

Database passwords rotate automatically via Lambda (30-day cycle). API keys must be rotated manually.

## Security

- Secret values are NEVER stored in Terraform state (lifecycle ignores secret_string changes)
- Secret values are NEVER committed to git
- Use `init-secrets.sh` for interactive provisioning
- Rotation Lambda connects to RDS via VPC private subnet
