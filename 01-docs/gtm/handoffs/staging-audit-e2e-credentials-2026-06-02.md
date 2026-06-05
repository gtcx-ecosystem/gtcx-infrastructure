---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# Staging Audit E2E Credentials Handoff

> **Date:** 2026-06-02
> **Updated:** 2026-06-03
> **Blocker:** MOBILE-AUDIT-01 / S4-03
> **Agent:** gtcx-infrastructure

---

## What Was Done

Unblocked mobile staging audit E2E by:

1. **Deployed native protocols image** (`gtcx-protocols:v0.4.6`) with `GTCX_STAGING_TRADEPASS_SEED=1` — replaces static DID resolver bridge.
2. **Seeded DID doc** for `did:gtcx:tp_staging_e2e_001` with Ed25519 `publicKeyJwk` via boot fixtures.
3. **Updated WAF** to allow `/audit` and `/v1/tradepass` endpoints for non-browser user agents (mobile default fetch UA).
4. **Fixed ALB controller IAM policy** (`elasticloadbalancing:RemoveListenerCertificates` was missing), enabling ingress reconciliation.
5. **Cleaned up duplicate ingress** (`gtcx-api`) that was causing ALB listener rule priority conflicts.
6. **Provisioned AUDIT_TOKEN** with `audit:read` permission in `COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON`.
7. **Stored credentials** in AWS Secrets Manager (`gtcx/staging/mobile-audit-e2e-credentials`).
8. **Created protocols API key** (`gtcx-protocols-api-key-staging`) for Bearer auth on admin/operator endpoints.

---

## Credential Reference

### AWS Secrets Manager

| Secret                                      | Key           | Description                                   |
| ------------------------------------------- | ------------- | --------------------------------------------- |
| `gtcx/staging/mobile-audit-e2e-credentials` | `PRIVATE_JWK` | Ed25519 private JWK for signing audit bundles |
| `gtcx/staging/mobile-audit-e2e-credentials` | `AUDIT_TOKEN` | Bearer token for POST /audit/query            |
| `gtcx/staging/mobile-audit-e2e-credentials` | `DID`         | Operator DID                                  |
| `gtcx/staging/mobile-audit-e2e-credentials` | `KEY_ID`      | Key fragment (k-1)                            |

### Public JWK (for DID document)

```json
{
  "crv": "Ed25519",
  "x": "OP743wqD8AUD2Vl05YGJ17fnNWUDIkQ1NRHrWTo4OuI",
  "kty": "OKP"
}
```

### DID Document (live)

```bash
curl https://api.staging.gtcx.trade/v1/tradepass/did%3Agtcx%3Atp_staging_e2e_001
```

---

## Acceptance Verification

```bash
# 1. DID resolution → 200 + verificationMethod
curl -s https://api.staging.gtcx.trade/v1/tradepass/did%3Agtcx%3Atp_staging_e2e_001

# 2. Audit query with token → 200 + events[]
curl -s -X POST https://api.staging.gtcx.trade/audit/query \
  -H "Authorization: Bearer <AUDIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"since":"2024-01-01"}'

# 3. Missing token → 401 JSON (not HTML 403)
curl -s -X POST https://api.staging.gtcx.trade/audit/query \
  -H "Content-Type: application/json" \
  -d '{"since":"2024-01-01"}'
```

---

## Files Modified

- `04-ship/kubernetes/overlays/staging/ingress.yaml` — added `/v1/tradepass` route
- `04-ship/kubernetes/base/kustomization.yaml` — added did-resolver resources
- `04-ship/kubernetes/base/services/did-resolver/*` — new static DID resolver
- `04-ship/terraform/modules/waf/main.tf` — added `AllowAuditAndTradePassEndpoints` rule
- `04-ship/terraform/environments/staging/main.tf` — enabled `allow_audit_paths`
- `04-ship/terraform/modules/alb/main.tf` — added `RemoveListenerCertificates` permission

---

## Next Steps for Mobile

1. Retrieve `PRIVATE_JWK` and `AUDIT_TOKEN` from AWS Secrets Manager.
2. Configure mobile E2E test suite with the DID, key ID, private JWK, and AUDIT_TOKEN.
3. Verify POST `/audit/bundles` signature flow end-to-end.

## Cleanup Notes

- The `did-resolver-staging` static nginx bridge is **no longer in the request path** for `/v1/tradepass`.
- It can be removed from the cluster when confirmed unused by other consumers.
- The seeded DID doc for `did:gtcx:tp_zw_001` is also available for legacy test fixtures.
