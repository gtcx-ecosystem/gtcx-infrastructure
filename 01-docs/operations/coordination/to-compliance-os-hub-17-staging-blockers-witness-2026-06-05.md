---
title: 'Witness — Hub #17 staging blockers (infra reply to compliance-os)'
status: ready-for-operator
date: 2026-06-05
eso_fix: 2026-06-05
owner: gtcx-infrastructure
to: compliance-os
from: gtcx-infrastructure
priority: P1
hub_blocker: 17
er1: ER-1-10
work_id: W2-E2E / XR-502 / XR-503
responds_to: compliance-os/01-docs/04-ops/coordination/to-gtcx-infrastructure-w2-hub-17-staging-blockers-2026-06-05.md
---

# Infra witness — compliance-os staging blockers

## ESO fix (2026-06-05)

Operator run found **`ClusterSecretStore/gtcx-aws-secrets-manager` not found**. Overlay now matches **intelligence** pattern:

| Component      | Name                                                            |
| -------------- | --------------------------------------------------------------- |
| ServiceAccount | `compliance-os-sa` (IRSA)                                       |
| SecretStore    | `compliance-os-aws-secrets` (namespace `compliance-os-staging`) |
| IAM role       | `gtcx-staging-compliance-os-secrets-role`                       |
| Terraform      | `04-ship/terraform/modules/secrets/compliance-os.tf`            |
| Bootstrap      | `01-docs/04-ops/staging-compliance-os-eso-bootstrap.md`         |
| Script         | `03-platform/scripts/staging/install-compliance-os-eso.sh`      |

**Order:** Terraform (IRSA + empty SM shells) → populate AWS SM → `kubectl apply -k …/compliance-os/` → verify ExternalSecrets Ready.

## What was delivered

### Ask 1 — GHCR imagePullSecret (P0)

**Manifest:** `04-ship/kubernetes/overlays/staging/compliance-os/external-secrets.yaml`

```yaml
# ExternalSecret: compliance-os-ghcr-pull
# Syncs .dockerconfigjson from AWS SM → K8s Secret (type: kubernetes.io/dockerconfigjson)
```

**Operator action required:**

1. Create a GitHub personal access token (classic) with `read:packages` scope.
2. Encode it as a docker config JSON:

```bash
TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
DOCKER_CONFIG=$(jq -n \
  --arg auth "$(echo -n "USERNAME:${TOKEN}" | base64)" \
  '{"auths":{"ghcr.io":{"auth":$auth}}}')

aws secretsmanager create-secret \
  --name gtcx/compliance-os/staging/ghcr-pull-token \
  --region af-south-1 \
  --secret-string "{\"dockerconfigjson\":${DOCKER_CONFIG}}"
```

3. Apply the manifest:

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/compliance-os/
```

4. Bind to the web-app Deployment (compliance-os manifest patch):

```yaml
spec:
  template:
    spec:
      imagePullSecrets:
        - name: compliance-os-ghcr-pull
```

### Ask 2 — Non-W2 staging secrets (P1)

**Manifests:** `04-ship/kubernetes/overlays/staging/compliance-os/external-secrets.yaml`

| ExternalSecret           | K8s Secret name          | AWS SM path                                 |
| ------------------------ | ------------------------ | ------------------------------------------- |
| `compliance-api-secrets` | `compliance-api-secrets` | `gtcx/compliance-os/staging/compliance-api` |
| `caas-secrets`           | `caas-secrets`           | `gtcx/compliance-os/staging/caas`           |
| `core12-secrets`         | `core12-secrets`         | `gtcx/compliance-os/staging/core12`         |
| `via-secrets`            | `via-secrets`            | `gtcx/compliance-os/staging/via`            |
| `vxa-secrets`            | `vxa-secrets`            | `gtcx/compliance-os/staging/vxa`            |
| `minio-secrets`          | `minio-secrets`          | `gtcx/compliance-os/staging/minio`          |

**Operator action required:**

1. Populate each AWS SM secret with the key-value pairs required by compliance-os apps.
2. Apply the manifest (same command as above).
3. Verify sync:

```bash
kubectl get externalsecrets -n compliance-os-staging
kubectl get secrets -n compliance-os-staging
```

## Files added / modified

| File                                                                                         | Action                        |
| -------------------------------------------------------------------------------------------- | ----------------------------- |
| `04-ship/kubernetes/overlays/staging/compliance-os/namespace.yaml`                           | Added (declarative namespace) |
| `04-ship/kubernetes/overlays/staging/compliance-os/secret-store.yaml`                        | Added (SA + SecretStore)      |
| `04-ship/kubernetes/overlays/staging/compliance-os/external-secrets.yaml`                    | SecretStore ref (not Cluster) |
| `04-ship/kubernetes/overlays/staging/compliance-os/kustomization.yaml`                       | Includes secret-store.yaml    |
| `04-ship/terraform/modules/secrets/compliance-os.tf`                                         | IRSA + SM shells              |
| `03-platform/scripts/staging/install-compliance-os-eso.sh`                                   | Apply + verify                |
| `01-docs/04-ops/staging-compliance-os-eso-bootstrap.md`                                      | Operator runbook              |
| `01-docs/04-ops/coordination/to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md` | This witness                  |

## Acceptance

- [ ] Operator populates AWS SM secrets (GHCR token + 6 app secrets)
- [ ] `kubectl apply -k 04-ship/kubernetes/overlays/staging/compliance-os/` succeeds
- [ ] `kubectl get pods -n compliance-os-staging -l app=web-app` shows **Running**
- [ ] compliance-os runs `pnpm w2:staging-prereq-check` → `ok: true`

## Next steps (unchanged)

| Step | Owner          | Action                                |
| ---- | -------------- | ------------------------------------- |
| 1    | exploration-os | `npm run w2:prod:retest` → `ok: true` |
| 2    | compliance-os  | `pnpm w2:terminal-patch-proof`        |
| 3    | compliance-os  | Finalize hub inbound → close #17      |
