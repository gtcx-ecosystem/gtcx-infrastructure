---
title: 'Outbound — Hub #17 prod W2 close (fabric-os owner)'
status: current
date: 2026-06-08
owner: fabric-os
from: fabric-os
to: compliance-os, exploration-os, terminal-os, baseline-os
priority: P0
hub_blocker: 17
er1: ER-1-10
work_id: W2-E2E / XR-502 / XR-503 / XR-504
authority_class: A
authorization_artifact: compliance-os/01-docs/04-ops/coordination/to-fabric-os-w2-secrets-inbound-2026-06-04.md
protocol: canon-os/01-docs/governance/protocols/24-cross-repo-coordination/protocol.md
document_id: INFRA-OUT-HUB17-PROD-001
tags: ['coordination', 'outbound', 'hub-17', 'w2', 'prod', 'class-a']
---

# Outbound — Hub #17 prod W2 close (infra owner)

**One-line:** Approval and execution for prod W2 secrets + `https://compliance.gtcx.trade` ingress → **fabric-os**; hub close witness → **baseline-os** after prod evidence exists.

**Authority:** Class **A** — compliance-os spec inbound is prior authorization; infra executes seal/inject/ingress and posts evidence. Sibling retests are Class **R** after infra witness.

**Staging:** Phase A **complete** — ESO `3a794fa`, terminal key aligned, exploration retest **201** (port-forward), PATCH **200**, terminal live **PASS**. Do not re-open compliance-os XR-502/503/504.

**Production:** Phase B **open** — probe `https://compliance.gtcx.trade` returns **525** with staging key; prod secrets not sealed; prod ingress/terminal URL alignment pending.

---

## Infra owner scope (Class A)

| #   | Deliverable                                                                                           | Acceptance                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Prod W2 secrets** sealed in AWS SM (`af-south-1`) → ESO → prod namespace                            | 7 keys present on web + compliance-api pods (names only in evidence)                                                          |
| 2   | **Ingress** for `https://compliance.gtcx.trade` → compliance-os **web** deployment (not gateway-only) | `curl` intake smoke → **201** from public origin                                                                              |
| 3   | **Prod terminal URL/key alignment**                                                                   | `COMPLIANCE_OS_TERMINAL_OS_URL` = prod TerminalOS origin; `COMPLIANCE_OS_TERMINAL_API_KEY` matches terminal-os prod admin key |
| 4   | **Exploration retest IAM**                                                                            | SM read path for intake key only (no `EXPO_PUBLIC_*`)                                                                         |

### Canonical env vars (from compliance-os spec — do not rename)

| Env var                                | Secret? | Pod scope                                          |
| -------------------------------------- | ------- | -------------------------------------------------- |
| `COMPLIANCE_OS_INTAKE_API_KEY`         | yes     | web                                                |
| `COMPLIANCE_OS_INTAKE_ORGANIZATION_ID` | config  | web — value `org_prod_diligence`                   |
| `COMPLIANCE_OS_TERMINAL_OS_URL`        | no      | web — e.g. `https://terminal.gtcx.trade`           |
| `COMPLIANCE_OS_TERMINAL_API_KEY`       | yes     | web — **must match** terminal-os prod receiver key |
| `COMPLIANCE_API_URL`                   | no      | web                                                |
| `COMPLIANCE_API_INTERNAL_TOKEN`        | yes     | web + compliance-api                               |
| `COMPLIANCE_OS_SESSION_SECRET`         | yes     | web (prod fail-closed)                             |

**Not in scope:** sovereign pods, compliance-gateway-only injection (no `/api/diligence/*` handlers). Hub **#18** (`DATABASE_URL` persistence proof) is separate.

---

## Inbound specifications (SoR links)

| Artifact                    | Path                                                                                                                                                                                                 | Status      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| W2 prod secrets spec        | [compliance-os `to-fabric-os-w2-secrets-inbound-2026-06-04.md`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/to-fabric-os-w2-secrets-inbound-2026-06-04.md) | **current** |
| Infra received copy         | [`from-compliance-os-w2-secrets-spec-2026-06-04.md`](../from-compliance-os-w2-secrets-spec-2026-06-04.md)                                                                                            | received    |
| Staging blockers (archived) | [`from-compliance-os-w2-hub-17-staging-blockers-2026-06-05.md`](../from-compliance-os-w2-hub-17-staging-blockers-2026-06-05.md)                                                                      | **closed**  |
| Staging witness             | [`to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md`](../to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md)                                                                | delivered   |
| Staging secrets sealed      | [`from-fabric-os-w2-secrets-sealed-2026-06-05.md`](../from-fabric-os-w2-secrets-sealed-2026-06-05.md)                                                                                                | sealed      |

---

## Infra execution checklist

**Scaffold (2026-06-08):** Terraform W2 SM shell, production K8s overlay, operator scripts, and bootstrap runbook are in-repo. Operator apply + evidence post remains.

| Artifact          | Path                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Bootstrap runbook | [`production-compliance-os-eso-bootstrap.md`](../../production-compliance-os-eso-bootstrap.md) |
| K8s overlay       | `04-deploy/kubernetes/overlays/production/compliance-os/`                                      |
| Populate SM       | `03-platform/scripts/production/populate-compliance-os-prod-sm.sh`                             |
| Install ESO       | `03-platform/scripts/production/install-compliance-os-eso.sh`                                  |
| Terraform         | `04-deploy/terraform/environments/production/main.tf` → `module.secrets`                       |

### Terraform / AWS SM (prod shells)

- [x] Extend `compliance-os.tf` — `gtcx/compliance-os/production/w2` SM shell + IRSA
- [x] Wire `module.secrets` in production `main.tf` (`compliance-os-production` namespace)
- [ ] `terraform apply` (requires approval ticket + operator)
- [ ] Populate W2 values per spec §2 (`populate-compliance-os-prod-sm.sh`)

### Kubernetes (prod overlay)

- [x] Overlay: namespace, SecretStore, ExternalSecrets, slim web-app, ingress
- [ ] Pin prod `compliance-web` image tag (amd64 GHCR publish)
- [ ] `kubectl apply -k` + rollout verify

### Ingress / DNS

- [x] ALB ingress manifest `compliance.gtcx.trade` → `web-app:3001` (group `gtcx-production-api`)
- [ ] Cloudflare CNAME / external-dns live
- [ ] Confirm `POST /api/diligence/licence-intelligence` → **201**

### Evidence reply (on completion)

Post to this thread + [`cross-repo-agent-log.md`](../cross-repo-agent-log.md):

```markdown
## Infra evidence — hub #17.2 prod

- [x] SM paths: <list — names only>
- [x] ExternalSecret: <names> namespace <ns>
- [x] Deployment(s) patched: <web + compliance-api>
- [x] Ingress: compliance.gtcx.trade → <service>
- [x] Terminal URL/key aligned with terminal-os prod
- [x] Smoke: POST intake → 201 @ https://compliance.gtcx.trade
- [x] exploration-os retest unblocked: <SM/IAM path>
```

Witness file: `01-docs/04-ops/coordination/from-fabric-os-hub-17-prod-w2-sealed-YYYY-MM-DD.md`

---

## Downstream (Class R — after infra evidence)

| Repo               | Action                                                           | Artifact                                     |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------- |
| **exploration-os** | `npm run w2:prod:retest` against `https://compliance.gtcx.trade` | `w2-hub-17-retest-latest.json` `ok: true`    |
| **compliance-os**  | `pnpm w2:terminal-patch-proof` (prod terminal env)               | `w2-hub-17-cos-patch-latest.json`            |
| **terminal-os**    | Prod receiver smoke if terminal URL changes                      | existing witness `431a2169` unless URL drift |
| **baseline-os**    | Copy hub locker inbound when all four rows ☑                     | close blocker **#17**                        |

**Do not raise prod secrets approval in:** compliance-os (spec + witnesses only), gtcx-docs (hub docs only).

---

## Hub evidence bundle status

| #   | Owner          | Staging             | Prod                                      |
| --- | -------------- | ------------------- | ----------------------------------------- |
| 1   | exploration-os | ☑ retest **201**    | ☐ `compliance.gtcx.trade` (probe **525**) |
| 2   | fabric-os      | ☑ 7 W2 keys + ESO   | ☐ seal + inject + ingress                 |
| 3   | compliance-os  | ☑ PATCH **200**     | ☐ prod terminal PATCH 2xx                 |
| 4   | terminal-os    | ☑ CI + live staging | ☑ receiver contract (unless URL change)   |

---

## References

- Ticket map: [compliance-os `w2-hub-17-ticket-map-2026-06-05.md`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/w2-hub-17-ticket-map-2026-06-05.md)
- Hub locker draft: [compliance-os `hub-inbound-w2-locker-17-draft-2026-06-04.md`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/hub-inbound-w2-locker-17-draft-2026-06-04.md)
- Baseline witness: [`to-baseline-os-hub-17-prod-witness-2026-06-08.md`](./to-baseline-os-hub-17-prod-witness-2026-06-08.md)
- Bootstrap runbook: [`staging-compliance-os-eso-bootstrap.md`](../../staging-compliance-os-eso-bootstrap.md) (staging pattern for prod)
