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

# Intelligence service — OpenAI API key
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/openai-api-key \
  --secret-string '{"api_key":"sk-proj-..."}'

# Intelligence service — Anthropic sandbox API key
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/anthropic-sandbox-api-key \
  --secret-string '{"api_key":"sk-ant-sandbox-..."}'

# Intelligence service — OpenAI sandbox API key
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/openai-sandbox-api-key \
  --secret-string '{"api_key":"sk-proj-sandbox-..."}'

# Intelligence service — ComplyAdvantage sandbox API key
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/comply-advantage-sandbox-api-key \
  --secret-string '{"api_key":"sandbox-..."}'

# Intelligence service — provider routing mode
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/provider-mode \
  --secret-string 'sandbox'

# Intelligence service — provider failure target
aws secretsmanager put-secret-value \
  --secret-id gtcx/intelligence/provider-failure-target \
  --secret-string 'all'

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

Sandbox provider keys should be rotated independently from production keys.

## External Access Plane (EAP)

Terraform: `eap.tf` — see [01-docs/04-ops/eap-secrets-and-iam.md](../../../01-docs/04-ops/eap-secrets-and-iam.md).

| Secret                   | Path                                 |
| ------------------------ | ------------------------------------ |
| Per-client key           | `gtcx/eap/<env>/clients/<client_id>` |
| Intelligence auth bundle | `gtcx/intelligence/<env>/auth-keys`  |

IAM role `gtcx-<env>-eap-admin` for issuance + bundle sync.

## Security

- Secret values are NEVER stored in Terraform state (lifecycle ignores secret_string changes)
- Secret values are NEVER committed to git
- Use `init-secrets.sh` for interactive provisioning
- Rotation Lambda connects to RDS via VPC private subnet
