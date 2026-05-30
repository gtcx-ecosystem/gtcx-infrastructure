---
title: 'INF-49 — Staging DNS for Authority DID Resolution'
status: 'current'
date: '2026-05-30'
owner: 'platform-lead'
role: 'platform-engineer'
tier: 'critical'
tags: ['operations', 'dns', 'staging', 'inf-49', 'tradepass']
review_cycle: 'on-change'
---

# INF-49 — Staging DNS for Authority DID Resolution

> **Purpose:** Wire `api.staging.gtcx.trade` and `geotag.staging.gtcx.trade` to the staging ALB so the 43 authority DID JSON-LDs become resolvable. Unblocks `gtcx-protocols#60` (verifier trusts regulator DIDs) and the gtcx-mobile go-live path.
> **Cross-repo issues:** `gtcx-infrastructure#49`, `gtcx-protocols#60`, `gtcx-protocols#62`.

---

## What this runbook covers

This runbook walks through bringing public DNS for the staging environment under IaC and explains the chicken-and-egg between the ALB Controller (which creates the ALB at K8s Ingress time) and Route53 (which needs the ALB's DNS name to alias). It assumes the prerequisites below.

## What this runbook does NOT cover

- **Server-side DID resolution.** The route from `https://api.staging.gtcx.trade/v1/dids/auth/<iso>/<slug>` to the 43 JSON-LD files at `country-support-packages/<iso>/v1.0.0/authorities/<slug>.json` lives in `gtcx-protocols`. As of 2026-05-30 there is no HTTP handler serving these. That handler is a separate gtcx-protocols PR — see the "Open follow-ups" section.
- **Key ceremony.** Authority DIDs ship with `key_status: "placeholder"` and `key_ceremony_blocked_by` references. Replacing placeholders with real regulator-attested keys is `gtcx-protocols#61` — out of scope here.

---

## Prerequisites

| Item                                               | How to verify                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS account credentials for `af-south-1`           | `aws sts get-caller-identity` returns account `348389439381`                                                                                        |
| `gtcx.trade` apex hosted zone exists in Route53    | `aws route53 list-hosted-zones --query "HostedZones[?Name=='gtcx.trade.']"` returns one zone                                                        |
| ACM cert for `staging.gtcx.trade` issued and valid | `aws acm describe-certificate --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate/8929e5a0-... --query Certificate.Status` → `ISSUED` |
| Staging EKS cluster healthy                        | `kubectl --context staging get nodes` returns Ready                                                                                                 |
| AWS Load Balancer Controller deployed in cluster   | `kubectl -n kube-system get deploy aws-load-balancer-controller` returns Available                                                                  |
| Terraform 1.7.5 (per `mise.toml`)                  | `terraform version` reports `v1.7.5`                                                                                                                |

---

## Path A — Two-pass Terraform (manual, ships today)

This is the safest path for the initial unblock. No new cluster components.

### Pass 1 — ACM validation records only (no ALB yet)

```bash
cd infra/terraform/environments/staging

# alb_dns_name + alb_hosted_zone_id default to "" → Route53 A records skipped.
# ACM validation CNAMEs are still managed (idempotent).
terraform plan \
  -var-file=terraform.tfvars \
  -out=plan.inf49.pass1

terraform apply --approval-ticket=GTCX-INF-49 plan.inf49.pass1
```

Expected outputs:

```
route53_a_records_created = false
route53_zone_id           = "Z..."
route53_hostnames         = ["api.staging.gtcx.trade", "geotag.staging.gtcx.trade"]
```

### Pass 2 — Apply Ingress, capture ALB DNS, re-apply Terraform

```bash
# Apply the staging Ingress. The ALB controller creates the ALB.
kubectl --context staging apply -k infra/kubernetes/overlays/staging/

# Wait for the ALB to be provisioned (~2-3 min).
kubectl --context staging -n gtcx-staging get ingress gtcx-api \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
# → k8s-gtcxstag-gtcxapi-<hash>.af-south-1.elb.amazonaws.com

# af-south-1 ALB hosted zone ID is a known AWS constant.
ALB_HOSTNAME="$(kubectl --context staging -n gtcx-staging get ingress gtcx-api \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
ALB_ZONE_ID="Z268VQBMOI5EKX"

terraform plan \
  -var-file=terraform.tfvars \
  -var="alb_dns_name=${ALB_HOSTNAME}" \
  -var="alb_hosted_zone_id=${ALB_ZONE_ID}" \
  -out=plan.inf49.pass2

terraform apply --approval-ticket=GTCX-INF-49 plan.inf49.pass2
```

Expected outputs:

```
route53_a_records_created = true
```

### Verify

```bash
dig +short api.staging.gtcx.trade
# → <ALB IPs>

curl -sS -o /dev/null -w "%{http_code}\n" https://api.staging.gtcx.trade/health
# → 200 (assuming gtcx-protocols-staging service is healthy)
```

---

## Path B — external-dns (recommended long-term)

After the manual two-pass works, replace the second pass with cluster-side automation. The staging Ingress already carries `external-dns.alpha.kubernetes.io/hostname` annotations (added 2026-05-30); when external-dns is running, A records are created and updated automatically from those annotations.

### One-time install

```bash
# IRSA role for external-dns (write access to gtcx.trade hosted zone only).
# Scaffold in infra/terraform/modules/external-dns-irsa/ — not yet created.
# Ticket: gtcx-infrastructure#TBD.

helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm upgrade --install external-dns external-dns/external-dns \
  --namespace kube-system \
  --set provider=aws \
  --set aws.region=af-south-1 \
  --set domainFilters[0]=gtcx.trade \
  --set sources[0]=ingress \
  --set policy=upsert-only \
  --set txtOwnerId=gtcx-staging \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=<IRSA role ARN>
```

`policy=upsert-only` is intentional: external-dns will create and update records but NEVER delete. Manual cleanup remains an explicit human action — the deletion blast radius is too large to delegate.

### After install

- Remove the `alb_dns_name` and `alb_hosted_zone_id` variables from `terraform.tfvars`.
- The Terraform route53 module still manages ACM validation records (high-leverage, low-risk to leave in IaC).
- A records become cluster-owned via Ingress annotations.

---

## Open follow-ups (NOT in INF-49 scope)

These are required for end-to-end `gtcx-protocols#60` resolution but live in other repos / tracks.

| Item                                                                               | Where                                                          | Owner              |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| HTTP handler serving `/v1/dids/auth/<iso>/<slug>` from `country-support-packages/` | `gtcx-protocols/server/`                                       | protocol-architect |
| Replace placeholder Ed25519 keys with regulator-attested keys (per ADR-002 §3)     | `gtcx-protocols#61` + per-regulator coordination               | compliance-lead    |
| Production DNS (`gtcx.trade` apex, not staging)                                    | `gtcx-infrastructure/infra/terraform/environments/production/` | platform-lead      |
| `external-dns-irsa` Terraform module                                               | `gtcx-infrastructure/infra/terraform/modules/`                 | platform-lead      |

---

## Rollback

To revert this change set:

```bash
# Remove the route53 module call from staging/main.tf
# (the Terraform state will tear down the A records and validation CNAMEs).
# ACM cert remains; ALB remains; only Route53 records change.

terraform plan -destroy -target=module.route53 -var-file=terraform.tfvars
terraform apply --approval-ticket=GTCX-INF-49-ROLLBACK -destroy -target=module.route53
```

Rollback impact: DID resolution becomes unreachable until DNS is recreated. No data loss. ACM cert validation records will need to be recreated manually OR the cert will fail to renew at next renewal (~12 months out).

---

## Evidence on completion

When INF-49 is complete, the following artifacts are committed:

- `terraform apply` plan + apply logs under `docs/audit/inf-49-staging-dns-evidence-<YYYY-MM-DD>.md`
- `curl -v https://api.staging.gtcx.trade/health` output (200)
- `curl -v https://api.staging.gtcx.trade/v1/dids/auth/gh/bog` output once the gtcx-protocols handler ships
- External-dependencies-register update: EXT-INF-004 moves from `open` → `complete`
