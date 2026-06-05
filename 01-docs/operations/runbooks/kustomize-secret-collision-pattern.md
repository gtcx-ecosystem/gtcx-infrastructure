---
title: 'Kustomize Secret Collision Pattern'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
severity: medium
---

# Kustomize Secret Collision Pattern

## The Problem

Kustomize `secretGenerator` creates secrets with **hash-suffixed names**.

```yaml
# base/kustomization.yaml
secretGenerator:
  - name: compliance-gateway-audit-key
    literals:
      - AUDIT_SIGNING_KEY_B64=placeholder
```

After `kustomize build`, the secret becomes:

```yaml
name: compliance-gateway-audit-key-4c79fk655h
```

If an overlay patches a Deployment to reference `compliance-gateway-audit-key` (without the hash suffix), kustomize **silently replaces** the reference with the hash-suffixed placeholder secret. The overlay's manual secret is ignored.

## Impact

- The pod receives the **placeholder value** instead of the real secret
- The service crashes or operates with invalid credentials
- **Silent failure** — no error during `kustomize build`

## Example: ER-2-04 Incident

Staging overlay tried to patch:

```yaml
secretKeyRef:
  name: compliance-gateway-audit-key-staging # manual secret
  key: AUDIT_SIGNING_KEY_B64
```

But base `secretGenerator` also created `compliance-gateway-audit-key` → kustomize generated `compliance-gateway-audit-key-staging-4c79fk655h` and **replaced** the overlay reference with the placeholder.

**Fix applied:** Renamed manual secret to `gtcx-compliance-gateway-audit-key-staging` (with `gtcx-` prefix) so it no longer collided with the base secret name.

## Prevention Pattern

### Rule 1: Prefix manual secrets with `gtcx-`

Always use `gtcx-<original-name>-<environment>` for manually-managed secrets:

```yaml
# ✅ CORRECT — overlay patch
secretKeyRef:
  name: gtcx-compliance-gateway-audit-key-staging
  key: AUDIT_SIGNING_KEY_B64
```

```yaml
# ❌ WRONG — collides with base secretGenerator
secretKeyRef:
  name: compliance-gateway-audit-key-staging
  key: AUDIT_SIGNING_KEY_B64
```

### Rule 2: Remove stub secrets from base when overlays provide real ones

If every overlay must provide its own secret, remove the stub from base `secretGenerator`:

```yaml
# base/kustomization.yaml
# REMOVED: compliance-gateway-audit-key stub
# Overlays MUST provide: gtcx-compliance-gateway-audit-key-<env>
```

### Rule 3: Document the requirement in base service manifests

```yaml
# base/services/compliance-gateway.yaml
# Overlays MUST provide their own audit-key secret.
# Use gtcx-compliance-gateway-audit-key-<environment> to avoid collision.
```

## Checklist for New Secrets

When adding a secret to an overlay:

- [ ] Does a base `secretGenerator` create a secret with a similar name?
- [ ] If yes, use `gtcx-` prefix for the manual secret name
- [ ] If the base stub is unused by any overlay, remove it from `secretGenerator`
- [ ] Verify with `kustomize build overlays/<env> | grep <secret-name>`

## Verification Command

```bash
# Build and inspect secret names
kustomize build 04-ship/kubernetes/overlays/staging | grep -E "name:.*audit-key"

# Expected output should show the gtcx- prefixed name, NOT a hash-suffixed name
# ❌ name: compliance-gateway-audit-key-staging-4c79fk655h
# ✅ name: gtcx-compliance-gateway-audit-key-staging
```

## Affected Overlays (as of 2026-06-05)

| Overlay    | Secret                                         | Status             |
| ---------- | ---------------------------------------------- | ------------------ |
| staging    | `gtcx-compliance-gateway-audit-key-staging`    | ✅ Fixed (ER-2-04) |
| pen-test   | `gtcx-compliance-gateway-audit-key-pen-test`   | ✅ Fixed (S1-07)   |
| production | `gtcx-compliance-gateway-audit-key-production` | 🔄 TBD             |

## References

- ER-2-04 incident: `01-docs/04-ops/coordination/from-gtcx-infrastructure-compliance-gateway-staging-healthy-2026-06-04.md`
- Base kustomization: `04-ship/kubernetes/base/kustomization.yaml`
- Staging patch: `04-ship/kubernetes/overlays/staging/patches/compliance-gateway-audit-key-secret-ref.yaml`
