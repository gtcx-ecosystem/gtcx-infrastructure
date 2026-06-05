---
title: 'Witness — W2 #17 secrets sealed in compliance-os-staging'
status: sealed
date: 2026-06-05
owner: gtcx-infrastructure
work_id: W2-E2E / #17 / XR-502
---

# Witness: W2 secrets sealed

## What was done

```bash
# 1. Created namespace (did not exist)
kubectl create namespace compliance-os-staging

# 2. Created Secret with generated values
kubectl create secret generic compliance-os-w2-secrets \
  --namespace=compliance-os-staging \
  --from-literal=COMPLIANCE_OS_INTAKE_API_KEY="<generated>" \
  --from-literal=COMPLIANCE_OS_TERMINAL_API_KEY="<generated>" \
  --from-literal=COMPLIANCE_API_INTERNAL_TOKEN="<generated>" \
  --from-literal=COMPLIANCE_OS_INTAKE_ORGANIZATION_ID="org_staging_diligence" \
  --from-literal=COMPLIANCE_OS_TERMINAL_OS_URL="https://terminal-staging.gtcx.trade" \
  --from-literal=COMPLIANCE_API_URL="https://staging-api.complianceos.local"
```

## Secret verification

```bash
$ kubectl get secret compliance-os-w2-secrets -n compliance-os-staging -o json | jq -r '.data | keys[]'
COMPLIANCE_API_INTERNAL_TOKEN
COMPLIANCE_API_URL
COMPLIANCE_OS_INTAKE_API_KEY
COMPLIANCE_OS_INTAKE_ORGANIZATION_ID
COMPLIANCE_OS_TERMINAL_API_KEY
COMPLIANCE_OS_TERMINAL_OS_URL
```

All 6 keys present ✓

## How compliance-os consumes

Add to each Deployment's container spec:

```yaml
envFrom:
  - secretRef:
      name: compliance-os-w2-secrets
      optional: false
```

Or selectively reference individual keys:

```yaml
env:
  - name: COMPLIANCE_OS_INTAKE_API_KEY
    valueFrom:
      secretKeyRef:
        name: compliance-os-w2-secrets
        key: COMPLIANCE_OS_INTAKE_API_KEY
```

## Target deployments (per compliance-os inbound spec)

- `compliance-api-app`
- `caas-app`
- `core12-app`
- `via-api`
- `vxa-api`

**Note:** The compliance-os-staging namespace was empty — no compliance-os deployments exist in the cluster yet. compliance-os must deploy their manifests before these secrets are consumed.

## Next steps (unchanged)

| Step | Owner          | Action                                |
| ---- | -------------- | ------------------------------------- |
| 2    | exploration-os | `npm run w2:prod:retest` → `ok: true` |
| 3    | compliance-os  | `pnpm w2:terminal-patch-proof`        |
| 4    | compliance-os  | Finalize hub inbound → close #17      |

## Production

Production secrets (`compliance-os-production` namespace) need separate values. Generate when Phase B begins:

```bash
kubectl create secret generic compliance-os-w2-secrets \
  --namespace=compliance-os-production \
  --from-literal=COMPLIANCE_OS_INTAKE_API_KEY="$(openssl rand -base64 32)" \
  --from-literal=COMPLIANCE_OS_TERMINAL_API_KEY="$(openssl rand -base64 32)" \
  --from-literal=COMPLIANCE_API_INTERNAL_TOKEN="$(openssl rand -base64 32)" \
  --from-literal=COMPLIANCE_OS_INTAKE_ORGANIZATION_ID="org_prod_diligence" \
  --from-literal=COMPLIANCE_OS_TERMINAL_OS_URL="https://terminal.gtcx.trade" \
  --from-literal=COMPLIANCE_API_URL="https://compliance.gtcx.trade"
```
