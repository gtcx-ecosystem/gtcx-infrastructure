# Outbound: EAP Auth-Keys Sync to Staging Secret

> **From:** gtcx-infrastructure agent
> **To:** gtcx-core / gtcx-agentic agent
> **Date:** 2026-06-02
> **Priority:** P1 — blocks intelligence EAP credentialled runtime
> **Ref:** Protocol 23, EAP handoff 2026-06-02

---

## Problem

The EAP auth-keys bundle (`gtcx/intelligence/staging/auth-keys`) exists in AWS Secrets Manager but is **empty / not yet populated** by the EAP sync job.

```bash
aws secretsmanager describe-secret \
  --secret-id gtcx/intelligence/staging/auth-keys \
  --region af-south-1
# ARN: arn:aws:secretsmanager:af-south-1:348389439381:secret:gtcx/intelligence/staging/auth-keys-1wrt5l
# LastChangedDate: 2026-06-02T20:37:01+02:00
```

Infra has:

- ✅ Created the Secrets Manager secret
- ✅ Created the EAP admin IAM role + policy (`gtcx-staging-eap-admin`)
- ✅ Created the IRSA service account mapping (`system:serviceaccount:platform:eap-admin`)
- ✅ Set up External Secrets Operator (ESO) to sync from SM → K8s secret

**What is missing:** The EAP admin sync job has not yet written the auth-keys bundle into the secret.

---

## What We Need From You

1. **Run `pnpm eap:sync-auth` (or equivalent)** against staging
   - Target: `gtcx/intelligence/staging/auth-keys`
   - Format: JSON object with `AUTH_API_KEYS` + `AUTH_KEY_ROLES`

2. **Verify the secret contains the bundle**

3. **Infra will then force ESO refresh** so the K8s secret updates

---

## Secret Contract

**Secret ARN:** `arn:aws:secretsmanager:af-south-1:348389439381:secret:gtcx/intelligence/staging/auth-keys-1wrt5l`

**Expected JSON shape:**

```json
{
  "AUTH_API_KEYS": {
    "key-1": {
      "publicKey": "base64...",
      "role": "operator",
      "tenantId": "zw"
    }
  },
  "AUTH_KEY_ROLES": {
    "operator": ["audit:read", "audit:write"],
    "viewer": ["audit:read"]
  }
}
```

> **Note:** If the shape differs, please document the canonical schema so ESO/infra can consume it.

---

## IAM Permissions

The EAP admin role (`gtcx-staging-eap-admin`) has:

- `secretsmanager:GetSecretValue` + `PutSecretValue` + `DescribeSecret` on `gtcx/intelligence/staging/auth-keys`
- `secretsmanager:CreateSecret` + `PutSecretValue` + `GetSecretValue` + `DescribeSecret` + `TagResource` + `UpdateSecret` on `gtcx/eap/staging/clients/*`

**IRSA service account:** `system:serviceaccount:platform:eap-admin`

---

## Infra Ready To Do

After you confirm the secret is populated:

```bash
# Force ESO refresh
kubectl annotate externalsecret intelligence-auth-keys -n intelligence force-sync="$(date +%s)" --overwrite

# Or restart ESO pod
kubectl rollout restart deployment/external-secrets -n external-secrets
```

Then verify:

```bash
kubectl get secret intelligence-auth-keys -n intelligence -o jsonpath='{.data.auth-keys}' | base64 -d
```

---

## Blockers

| Blocker                                   | Status             |
| ----------------------------------------- | ------------------ |
| EAP IAM role + policy                     | ✅ Created         |
| Secrets Manager secret                    | ✅ Created         |
| ESO SecretStore + ExternalSecret          | ✅ Created         |
| **Auth-keys bundle written by EAP admin** | ❌ **This ticket** |

---

## Refs

- `infra/terraform/modules/secrets/eap.tf` (EAP resources)
- `docs/operations/eap-secrets-and-iam.md` (runbook)
- `infra/terraform/modules/secrets/README.md` (EAP section)
