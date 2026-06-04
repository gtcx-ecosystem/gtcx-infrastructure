---
title: 'Agent staging execution — W2 / Hub #17 (P27)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
document_id: OPS-AGENT-STAGING-EXEC
tier: critical
tags: ['agents', 'staging', 'w2', 'protocol-27']
---

# Agent staging execution — W2 / Hub #17

**Agents:** Run these steps **in-session** from **`gtcx-infrastructure`**. Report **command + exit code**. Do not send "Your action needed" paste blocks to the operator.

**Human only (Class A):** first-time GHCR `write:packages` auth refresh, production secret policy, net-new secret names outside Terraform shells.

---

## terminal-os (W2-OPS-001)

| Step     | Agent runs                                                                          | Notes                                       |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| 1 SM     | `./scripts/staging/populate-terminal-os-staging-sm.sh`                              | If `aws` denied → Permission Unblock Report |
| 2 TF     | `cd infra/terraform/environments/staging && terraform apply -target=module.secrets` | Report plan/apply exit                      |
| 3 K8s    | `kubectl apply -k infra/kubernetes/overlays/staging/terminal-os/`                   | Context `gtcx-staging`                      |
| 4 Verify | `kubectl rollout status deployment/terminal-os -n terminal-os-staging`              |                                             |

Paths: `infra/terraform/modules/secrets/terminal-os.tf`, overlay under `infra/kubernetes/overlays/staging/terminal-os/`.

---

## compliance-os (Hub #17)

Follow [staging-compliance-os-eso-bootstrap.md](./staging-compliance-os-eso-bootstrap.md) **by executing**, not forwarding:

```bash
./scripts/staging/populate-compliance-os-staging-sm.sh
./scripts/staging/install-compliance-os-eso.sh
kubectl get externalsecret -n compliance-os-staging
```

Witness in **compliance-os**: `pnpm w2:staging-prereq-check` (run from compliance-os after pods Ready).

---

## Close (P26)

Status Update only — **Next priority** = one story from `pnpm agent:start`. No `Want me to proceed with A or B?` No operator command menus.
