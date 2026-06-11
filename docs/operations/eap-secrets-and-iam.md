---
title: 'EAP Secrets and IAM (Protocol 23)'
status: current
date: 2026-06-02
owner: fabric-os
protocol: canon-os/01-docs/governance/protocols/23-external-access-credentials/protocol.md
---

# EAP secrets and IAM

Terraform: `04-deploy/terraform/modules/secrets/eap.tf` (EAP-03)

## Secrets Manager paths

| Purpose                      | Path                                 | Writer                              |
| ---------------------------- | ------------------------------------ | ----------------------------------- |
| Per-client API key (EAP SoR) | `gtcx/eap/<env>/clients/<client_id>` | `@gtcx/eap` admin service           |
| Intelligence runtime bundle  | `gtcx/intelligence/<env>/auth-keys`  | EAP sync job → `AUTH_API_KEYS` JSON |

Legacy manual path (interim): `gtcx-intelligence/staging` — migrate to `gtcx/intelligence/staging/auth-keys`.

### Client secret JSON shape

```json
{
  "api_key": "gtcx_…",
  "fingerprint": "sha256:…",
  "tenant_id": "gtcx-internal-smoke",
  "tier": "E0",
  "issued_at": "2026-06-02T12:00:00Z"
}
```

### Intelligence auth bundle shape

```json
{
  "AUTH_API_KEYS": "key-one-1234567890123456,key-two-1234567890123456",
  "AUTH_KEY_ROLES": "key-one-1234567890123456:intelligence,key-two-1234567890123456:smoke"
}
```

## IAM

| Resource              | Name                                                                |
| --------------------- | ------------------------------------------------------------------- |
| EAP admin policy      | `gtcx-<env>-eap-admin`                                              |
| EAP admin role (IRSA) | `gtcx-<env>-eap-admin` → `system:serviceaccount:platform:eap-admin` |

CI/operators assume this role via OIDC or `aws sts assume-role` for issuance scripts.

## Verification

```bash
aws secretsmanager describe-secret --secret-id gtcx/intelligence/staging/auth-keys
aws iam get-role --role-name gtcx-staging-eap-admin
```

## Force ESO refresh (after sync)

Requires ESO on the cluster — see [staging-intelligence-eso-bootstrap.md](./staging-intelligence-eso-bootstrap.md).

```bash
kubectl annotate externalsecret intelligence-secrets -n intelligence \
  force-sync=$(date +%s) --overwrite
```
