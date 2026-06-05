---
title: 'XR-405 Rollout Complete — Sovereign Staging KMS Signing'
status: done
date: 2026-06-04
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: gtcx-platforms
item: XR-405
---

# XR-405 Rollout Complete — Sovereign Staging KMS Signing

## What was done

1. **KMS env vars committed** (`b3ef031`)
   - `SIGNING_KEY_PROVIDER=kms`
   - `AWS_KMS_KEY_ID=alias/gtcx-production-sovereign-gh-bog`
   - `AWS_REGION=af-south-1`
   - File: `04-ship/kubernetes/overlays/staging/patches/sovereign-staging-env.yaml`

2. **Staging IRSA role created** (`gtcx-staging-platforms-irsa`)
   - Trust policy: `gtcx-staging:gtcx-platform-staging` → staging EKS OIDC provider
   - Inline policy: `kms:Sign` (with `ECDSA_SHA_256` condition), `kms:GetPublicKey`, `kms:DescribeKey`
   - Resource: `arn:aws:kms:af-south-1:348389439381:key/d44106a0-cb37-4225-b84d-bb8105eaaca5`

3. **ServiceAccount annotation fixed** (`6646bf9`)
   - `gtcx-platform-staging` SA now points to staging IRSA role
   - File: `04-ship/kubernetes/overlays/staging/patches/platform-sa-irsa.yaml`

4. **Sovereign pod rolled out**
   - Pod: `sovereign-staging-888f9bc4d-7h4rk` — Running, 0 restarts
   - Health: `200 OK` on `/api/health`
   - Logs: `Signing key provider: KmsKeyProvider` (init success)

## Issues encountered

- **IAM trust policy mismatch:** Initial role used production OIDC provider ID. Fixed to staging OIDC (`88225752107BD8162969D30455B2C3D7`).
- **KMS policy condition error:** `kms:SigningAlgorithm` condition applied to `GetPublicKey` caused denial. Split into two statements — `Sign` with condition, `GetPublicKey`/`DescribeKey` without.
- **GitOps reversion:** Live SA patch was reverted by kustomize controller. Fix committed to `platform-sa-irsa.yaml` to prevent regression.

## Verification commands

```bash
# Check pod health
kubectl get pod -n gtcx-staging -l app=sovereign
kubectl exec -n gtcx-staging deployment/sovereign-staging -- wget -qO- http://localhost:3001/api/health

# Check IRSA
ekubectl get pod -n gtcx-staging -l app=sovereign -o jsonpath='{.items[0].spec.containers[0].env[?(@.name=="AWS_ROLE_ARN")].value}'
# Expected: arn:aws:iam::348389439381:role/gtcx-staging-platforms-irsa
```

## Next steps (platforms)

1. Re-run `pnpm smoke:signed-edge-tenant:evidence` against `sovereign-staging.gtcx.trade`
2. Verify signed-edge writes use KMS-backed ECDSA P-256 signatures
3. Mark XR-405 done on sprint board
4. Close XR-405 in coordination index

## Commits

- `b3ef031` — feat(k8s): XR-405 sovereign staging KMS env vars
- `f317c96` — docs(audit): INF-86 tracker — XR-405 env vars committed
- `6646bf9` — fix(k8s): staging platform SA uses staging IRSA role for XR-405
- `7dc5c59` — feat(terraform): irsa-platform supports multiple service account subjects
- `473a595` — docs(audit): INF-86 tracker — XR-405 rollout complete
