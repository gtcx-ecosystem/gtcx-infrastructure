---
title: 'Inbound — terminal-os staging live (W2-OPS-001)'
status: live
date: 2026-06-04
from: gtcx-infrastructure
to: terminal-os, compliance-os
priority: P0
hub_blocker: 17
story: W2-OPS-001
owner: platform-architect
role: protocol-architect
tier: standard
tags: ['coordination', 'w2-ops', 'terminal-os', 'staging']
review_cycle: on-change
---

# Inbound — terminal-os staging live

## Objective

`https://terminal-staging.gtcx.trade` is now returning **200** from a healthy EKS origin.

Terminal-os can proceed with **W2-OPS-001** live smoke and compliance-os can PATCH the workflow receiver.

## Verification

```bash
$ curl -sS https://terminal-staging.gtcx.trade/api/health
{"status":"ok","service":"fifty-four","version":"dev","environment":"development","uptime":3624.98,"timestamp":"2026-06-04T17:05:27.653Z"}

$ curl -sS -o /dev/null -w "%{http_code}\n" https://terminal-staging.gtcx.trade/api/health
200
```

**Internal probe:**

```bash
$ kubectl exec -n gtcx-staging compliance-gateway-staging-69ccd6c867-24sjs \
  -- wget -qO- http://terminal-os.terminal-os-staging.svc.cluster.local:3000/api/ready
{"status":"degraded","service":"fifty-four","version":"dev","environment":"development",
 "checks":{"auth":"ok","database":"ok","external_apis":"degraded","griot":"degraded",
 "stripe":"degraded","anthropic":"degraded"}}
```

`database: ok` confirms Postgres connectivity to `gtcx-staging-audit`.
`external_apis: degraded` is expected — staging does not configure Griot, Stripe, or Anthropic.

## What was deployed

| Component | Detail                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------- |
| Namespace | `terminal-os-staging`                                                                           |
| Image     | `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-terminal-os:latest` (linux/amd64)           |
| Node      | `ip-10-3-67-68.af-south-1.compute.internal` (t3.medium)                                         |
| Service   | `terminal-os` (ClusterIP:3000)                                                                  |
| Ingress   | `terminal-os` — ALB group `gtcx-staging-api`, host `terminal-staging.gtcx.trade`                |
| TLS       | ACM cert `arn:aws:acm:af-south-1:348389439381:certificate/137fb6d0-a13e-4113-994d-6401578eca8a` |
| DNS       | Cloudflare CNAME `terminal-staging.gtcx.trade` → ALB hostname (non-proxied)                     |

## Secrets (key names only — no values)

AWS SM: `gtcx/terminal-os/staging/api-keys`

| Key                              | Purpose                                                                     |
| -------------------------------- | --------------------------------------------------------------------------- |
| `COMPLIANCE_OS_TERMINAL_API_KEY` | Service-to-service auth (byte-equal to compliance-os-staging sealed secret) |
| `AUTH_SECRET`                    | NextAuth secret                                                             |
| `DATABASE_URL`                   | `gtcx-staging-audit` Postgres connection                                    |
| `RATE_LIMIT_REDIS_REST_URL`      | Redis REST backend (staging dummy — falls back to in-memory)                |
| `RATE_LIMIT_REDIS_REST_TOKEN`    | Redis REST token (staging dummy)                                            |

Synced via ExternalSecret `terminal-os-secrets` → K8s secret `terminal-os-secrets`.

## Known limitations / next steps

1. **Rate limiting** — Dummy Redis REST values; single-replica in-memory fallback is sufficient for hub #17 smoke. Production / multi-replica requires real Upstash or Redis REST proxy.
2. **Cluster capacity** — EKS staging nodes (t3.medium × 2) are at 90-99% CPU request. terminal-os was scaled to `cpu: 100m, memory: 256Mi` requests to fit. Consider node upgrade or cluster-autoscaler before scaling terminal-os replicas.
3. **CI build** — GitHub Actions `docker-build.yml` OIDC auth is broken; EC2 build instance is current fallback. Fix tracked separately.
4. **Hub #18** — `DATABASE_URL` is live; `licence_intelligence` task store can use Postgres when terminal-os team enables it.

## References

- Terminal-os outbound: `terminal-os/01-docs/06-coordination/to-gtcx-infrastructure-w2-ops-001-terminal-staging-2026-06-05.md`
- Infra manifests: `04-ship/kubernetes/overlays/staging/terminal-os/`
- Secrets module: `04-ship/terraform/modules/secrets/terminal-os.tf`
