---
title: 'XR-201 runbook — intelligence-staging auth gate'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
xr-id: XR-201
---

# XR-201 runbook: intelligence-staging auth gate

**Priority:** P0  
**Sprint:** S-XR-1 (2026-06-03 → 06-07)  
**Owner:** gtcx-infrastructure  
**Status:** **DONE** — full SDK deployed 2026-06-03  
**Unblocks:** XR-202 (intelligence re-smoke); INT-S3-08 evidence

---

## Completion update (2026-06-03)

**Full intelligence SDK `gtcx-intelligence-sdk:12be5342` deployed to staging.**

| Endpoint          | No auth | With key | Note                              |
| ----------------- | ------- | -------- | --------------------------------- |
| `/health`         | 200     | 200      | Exempt by design (ALB/K8s probes) |
| `/live`           | 200     | 200      | Exempt by design (K8s liveness)   |
| `/ready`          | 200     | 200      | Exempt by design (K8s readiness)  |
| `/metrics`        | 200     | 200      | Exempt by design (Prometheus)     |
| `/policy/rules`   | 401     | 200      | Auth enforced ✅                  |
| `/feedback/stats` | 401     | 200      | Auth enforced ✅                  |

**Image:** `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-intelligence-sdk:12be5342151a30ebedd6b7221cd547a008f9e7a1`

**Manifest:** `04-ship/kubernetes/overlays/staging/intelligence/deployment.yaml`

**Caveat:** `/health` returns 200 without auth — this is by design in the SDK (`AUTH_EXEMPT_PATHS` includes `/health`, `/live`, `/ready`, `/metrics`). The ALB health check and K8s probes require this. The acceptance criteria in the original protocols kickoff expected 401 on `/health`, which conflicts with the SDK design.

**Next:** XR-202 — intelligence re-smoke.

---

## Historical state (pre-completion — reference only)

```bash
# Pre-completion probe results (orchestrator placeholder era)
curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/health
# → 200 (placeholder did not enforce auth on /health)

# /live and /ready returned 401 without auth (placeholder behavior)
curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/live
# → 401
```

**Root cause:** The `intelligence-orchestrator` service currently deployed is a **placeholder** that does not enforce auth on `/health`. The full intelligence SDK with auth-gated routes needs to be deployed.

---

## What infrastructure provides (DONE)

| Component        | Location                                       | Status                                                |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Namespace        | `overlays/staging/intelligence/namespace.yaml` | Applied                                               |
| Ingress (ALB)    | `overlays/staging/intelligence/ingress.yaml`   | Applied; routes to `intelligence-orchestrator:8200`   |
| ESO Helm release | `terraform/modules/secrets/intelligence.tf`    | Applied                                               |
| SecretStore      | `terraform/modules/secrets/intelligence.tf`    | Applied; IRSA auth for `intelligence-sa`              |
| ExternalSecret   | `terraform/modules/secrets/intelligence.tf`    | Applied; syncs SM → K8s secret `intelligence-secrets` |
| ServiceAccount   | `terraform/modules/secrets/intelligence.tf`    | Applied; annotated with IRSA role ARN                 |
| IAM (IRSA)       | `terraform/modules/secrets/intelligence.tf`    | Applied; reads all intelligence SM secrets            |
| AWS SM secrets   | `terraform/modules/secrets/intelligence.tf`    | Created; includes `intelligence_auth_keys`            |

**Verify ESO sync:**

```bash
kubectl get secret -n intelligence intelligence-secrets
# Expected: Secret exists, type Opaque

kubectl get externalsecret -n intelligence
# Expected: intelligence-secrets Ready=True

kubectl get secretstore -n intelligence
# Expected: intelligence-aws-secrets Valid=True
```

---

## What is MISSING (infra action required)

### 1. Intelligence Deployment manifest

**Status (2026-06-03):** Manifest **exists** at `04-ship/kubernetes/overlays/staging/intelligence/deployment.yaml` + Service in same file.

**Problem:** Overlay may not be **applied** to the cluster — live URL still returns `orchestrator-placeholder` on `/health`.

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/intelligence/
kubectl rollout status deployment/intelligence-orchestrator -n intelligence
```

**Image:** `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-intelligence-sdk:12be5342151a30ebedd6b7221cd547a008f9e7a1` — bump tag when gtcx-intelligence publishes a newer staging build.

### 2. Full SDK image

**Problem:** The orchestrator placeholder image is deployed. Need the full intelligence SDK image.

**Where to get it:**

- gtcx-intelligence repo builds and publishes to ECR
- Image tag must be provided to infrastructure for rollout

### 3. Auth enforcement (INT-S3-08)

**SDK note:** `/health` is in `AUTH_EXEMPT_PATHS` in gtcx-intelligence — public `/health` is expected for full SDK.

**Acceptance for full-stack evidence** (`deployment-smoke-evidence.mjs`):

- `GET /feedback/stats` without auth → 401/403
- `GET /feedback/stats` with valid `x-api-key` → 200
- `/live` and `/ready` without auth → 401 (orchestrator already partial)
- Prometheus-style `/metrics` on full SDK (not placeholder JSON)

---

## Action checklist

### Step 1: Verify ESO secrets are synced (infra)

```bash
kubectl get secret -n intelligence intelligence-secrets -o jsonpath='{.data}'
# Should contain: ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL, AUTH_API_KEYS, AUTH_KEY_ROLES
```

If missing, check:

- `aws secretsmanager describe-secret --secret-id gtcx/intelligence/staging/auth-keys`
- If auth-keys secret is empty, run gtcx-core EAP sync: `cd 03-platform/packages/eap && EAP_ENVIRONMENT=staging pnpm eap:sync-bundle`

### Step 2: Obtain full SDK image (gtcx-intelligence → infra)

**Required from gtcx-intelligence:**

- ECR image URI for full SDK
- Image digest (SHA256)
- Environment variables required
- Port (likely 8200)
- Resource requests/limits

### Step 3: Create Deployment + Service manifest (infra)

**If intelligence repo does not provide manifests, infrastructure creates:**

```yaml
# 04-ship/kubernetes/base/services/intelligence-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intelligence-orchestrator
  namespace: intelligence
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: intelligence-orchestrator
  template:
    metadata:
      labels:
        app.kubernetes.io/name: intelligence-orchestrator
    spec:
      serviceAccountName: intelligence-sa
      containers:
        - name: orchestrator
          image: <FULL_SDK_IMAGE_URI>@<DIGEST>
          ports:
            - containerPort: 8200
          envFrom:
            - secretRef:
                name: intelligence-secrets
          livenessProbe:
            httpGet:
              path: /live
              port: 8200
          readinessProbe:
            httpGet:
              path: /ready
              port: 8200
---
apiVersion: v1
kind: Service
metadata:
  name: intelligence-orchestrator
  namespace: intelligence
spec:
  selector:
    app.kubernetes.io/name: intelligence-orchestrator
  ports:
    - port: 8200
      targetPort: 8200
```

### Step 4: Apply deployment

```bash
# If manifest added to overlay
kubectl apply -k 04-ship/kubernetes/overlays/staging/intelligence/

# Or apply directly
kubectl apply -f 04-ship/kubernetes/base/services/intelligence-deployment.yaml
```

### Step 5: Verify auth gate

```bash
# Unauthenticated should fail
curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/health
# Expected: 401 or 403

# Authenticated should succeed
curl -H "Authorization: Bearer $VALID_TOKEN" \
  -s -o /dev/null -w "%{http_code}" \
  https://intelligence-staging.gtcx.trade/health
# Expected: 200

# EAP key route
curl -H "X-EAP-Key: $EAP_KEY" \
  -s -o /dev/null -w "%{http_code}" \
  https://intelligence-staging.gtcx.trade/v1/eap/keys
# Expected: 200
```

### Step 6: Ping intelligence

Once auth gate is confirmed, append to agent log and notify gtcx-intelligence:

- [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)
- [gtcx-agentic agent-coordination-log](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/agent-coordination-log.md)

---

## Finding: Missing deployment in infra repo

**Critical discovery:** The `intelligence-orchestrator` Deployment and Service are **not present** in `gtcx-infrastructure/04-ship/kubernetes/`. This means:

1. The orchestrator placeholder was deployed by some other mechanism (manual, other repo CI, or older manifest since deleted)
2. Infrastructure cannot complete XR-201 without either:
   - Obtaining the deployment manifest from gtcx-intelligence
   - Creating the deployment manifest with intelligence-provided image details

**Recommendation:** File inbound ticket to gtcx-intelligence requesting:

1. Full SDK image URI + digest
2. Deployment manifest (if they manage it)
3. Environment variable requirements
4. Confirmation that auth middleware is enabled in the full SDK image

---

## References

- Terraform secrets module: `04-ship/terraform/modules/secrets/intelligence.tf`
- Staging ingress: `04-ship/kubernetes/overlays/staging/intelligence/ingress.yaml`
- Intelligence shadow routing: `04-ship/kubernetes/base/services/intelligence-shadow.yaml`
- EAP sync runbook: `gtcx-core/01-docs/04-ops/runbooks/eap-bundle-sync.md`
- Outbound handoff: [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)

---

_Last updated: 2026-06-03_  
_Next update: when deployment manifest is obtained or created._
