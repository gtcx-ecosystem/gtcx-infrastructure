---
title: 'Audit-Flush Sidecar — Deployment Runbook'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
review_cycle: 'on-change'
tags: ['operations', 'audit', 'compliance-gateway']
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
---

# Audit-Flush Sidecar Deployment

The audit-flush sidecar subscribes to the gateway's signed-audit JetStream subject and ships records to the WORM S3 bucket. This runbook covers the two manifest placeholders that exist by design: the container image, and the IRSA role ARN.

## 1. Container image

There is no `gtcx/audit-flush` image in the registry by default — the sidecar is intentionally an "add it when you ship to prod" artifact. Reasonable shape:

- Small Alpine + Node 20 image.
- Single entry: a Node script that uses `@gtcx/audit-signer` for chain verification + the `nats` package to consume `gtcx.audit.>` and `aws-sdk/client-s3` to put objects under `tenant=<tid>/yyyy/MM/dd/HH/<chainHash>.ndjson` with `--object-lock-mode COMPLIANCE`.
- Healthcheck: HTTP `/health` returns 200 when connected to NATS in the last 2 minutes.
- Readiness: HTTP `/ready` returns 200 only when both NATS and S3 PutObject have succeeded at least once.

The contract lives in `04-ship/kubernetes/base/services/audit-flush.yaml`; pin the digest in the kustomize image overlay per environment.

```bash
# Build + push (replace REGISTRY)
docker build -t $REGISTRY/audit-flush:$(git rev-parse --short HEAD) 03-platform/tools/audit-flush
docker push $REGISTRY/audit-flush:$(git rev-parse --short HEAD)

# Patch the overlay (testnet shown)
yq -i \
  ".images[0].newName = \"$REGISTRY/audit-flush\" | .images[0].newTag = \"$(git rev-parse --short HEAD)\"" \
  04-ship/kubernetes/overlays/testnet/kustomization.yaml
```

The image is intentionally outside this repo's CI today because the WORM bucket policy must be agreed with security before any image gets write access. Build it from a one-line index.mjs that uses the published `@gtcx/audit-signer` chain verifier + the `nats` + `@aws-sdk/client-s3` packages.

## 2. IRSA role ARN

The `audit-flush` ServiceAccount needs an IAM role with PutObject on the WORM bucket. Use the `audit-flush-irsa` Terraform module:

```hcl
module "audit_flush_irsa" {
  source            = "../../modules/audit-flush-irsa"
  environment       = "testnet"
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url
  worm_bucket_arn   = module.worm_audit.bucket_arn
  worm_kms_key_arn  = module.worm_audit.kms_key_arn
}
```

`terraform apply` then patches the overlay:

```bash
ROLE_ARN=$(terraform output -raw audit_flush_role_arn)
yq -i \
  ".patches[0].patch |= sub(\"PLACEHOLDER_OVERRIDE_IN_OVERLAY\"; \"$ROLE_ARN\")" \
  04-ship/kubernetes/overlays/testnet/kustomization.yaml
```

Or maintain the ARN as a per-environment Kustomize patch file referenced from the overlay.

## 3. Verification after deploy

```bash
# 1. Pod is ready
kubectl -n gtcx wait deployment/audit-flush --for=condition=Available --timeout=2m

# 2. Recent records reaching S3
aws s3 ls "s3://gtcx-worm-audit-${ENV}-${REGION}/" --recursive | tail -20

# 3. Object Lock retention is still in COMPLIANCE mode
aws s3api get-object-lock-configuration --bucket "gtcx-worm-audit-${ENV}-${REGION}" \
  | jq '.ObjectLockConfiguration.Rule.DefaultRetention.Mode'
# expected: "COMPLIANCE"

# 4. End-to-end chain: pull one NDJSON object and verify with @gtcx/audit-signer
aws s3 cp s3://gtcx-worm-audit-${ENV}-${REGION}/<key> /tmp/chain.ndjson
node -e "import('@gtcx/audit-signer').then(m => { \
  const c = m.fromNdjson(require('fs').readFileSync('/tmp/chain.ndjson','utf-8')); \
  console.log(m.verifyChain(c)); \
})"
```

The fourth step is the most important: a regulator's auditor will run exactly that command. The contract is "the bucket content is independently verifiable with the published @gtcx/audit-signer library and the records' embedded public keys, with no GTCX-side trust required."

## 4. Failure modes

| Symptom                                   | Most likely cause                                   | Fix                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Readiness probe failing >2m               | NATS connectivity / DNS                             | Check `kubectl -n gtcx get svc nats`, port-forward and `nats sub` from a debugger pod.                                 |
| 403 from S3 PutObject                     | IRSA role not yet applied OR bucket policy mismatch | Re-run terraform apply for `audit-flush-irsa`; confirm `kubectl describe sa audit-flush` shows the annotation.         |
| Records signed but bucket empty           | Sidecar deployment scaled to 0                      | `kubectl -n gtcx scale deploy/audit-flush --replicas=2`.                                                               |
| Verification fails on a downloaded NDJSON | Tampering OR mid-flight write                       | Pull again from a different time window; if reproducible, escalate per `01-docs/09-security/break-glass-procedure.md`. |

## 5. Why this is a runbook, not a workflow

Production deployment of the audit-flush sidecar inherently involves cloud-side state (S3 bucket policy, KMS grants, IRSA role attachment) that doesn't survive a `terraform apply` from CI without human review. The IAM scope on the role is deliberately narrow — write-only, KMS-encrypt only — but the act of granting any role write to a WORM bucket is the kind of decision a second human should sign off on.
