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
**Blocked by:** Missing full SDK deployment; orchestrator placeholder still live  
**Unblocks:** XR-202 (intelligence re-smoke); INT-S3-08 evidence

---

## Current state (2026-06-03)

```bash
# Probe results
curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/health
# → 200 (should be 401/403 for unauthenticated)

# /live and /ready DO return 401 without auth
curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/live
# → 401 (correct)
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

**Problem:** There is NO Deployment or Service manifest for `intelligence-orchestrator` in the infrastructure repo.

**Where it should be:**

- Infrastructure base: `infra/kubernetes/base/services/intelligence-deployment.yaml` (does not exist)
- Or gtcx-intelligence repo should provide it

**Current manifests that reference `intelligence-orchestrator`:**

- `base/services/intelligence-ingress.yaml` — routes to `intelligence-orchestrator:8200`
- `base/services/intelligence-shadow.yaml` — routes to `intelligence-orchestrator:8200` (shadow routing)
- `overlays/staging/intelligence/ingress.yaml` — routes to `intelligence-orchestrator:8200`

But the actual Service and Deployment for `intelligence-orchestrator` are **not in this repo**.

**Options to resolve:**

A. **Infrastructure creates the Deployment manifest** (if image is known)
B. **gtcx-intelligence repo provides deployment manifests** (preferred — intelligence owns its runtime)
C. **gtcx-intelligence deploys via their own CI/CD** (if they have a separate pipeline)

### 2. Full SDK image

**Problem:** The orchestrator placeholder image is deployed. Need the full intelligence SDK image.

**Where to get it:**

- gtcx-intelligence repo builds and publishes to ECR
- Image tag must be provided to infrastructure for rollout

### 3. Auth middleware on `/health`

**Problem:** Even if full SDK is deployed, auth middleware must be configured to require credentials on `/health`.

**Acceptance:**

- `GET /health` without auth → 401 or 403
- `GET /health` with valid Bearer → 200
- `GET /live` without auth → 401 (already working)
- `GET /ready` without auth → 401 (already working)

---

## Action checklist

### Step 1: Verify ESO secrets are synced (infra)

```bash
kubectl get secret -n intelligence intelligence-secrets -o jsonpath='{.data}'
# Should contain: ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL, AUTH_API_KEYS, AUTH_KEY_ROLES
```

If missing, check:

- `aws secretsmanager describe-secret --secret-id gtcx/intelligence/staging/auth-keys`
- If auth-keys secret is empty, run gtcx-core EAP sync: `cd packages/eap && EAP_ENVIRONMENT=staging pnpm eap:sync-bundle`

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
# infra/kubernetes/base/services/intelligence-deployment.yaml
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
kubectl apply -k infra/kubernetes/overlays/staging/intelligence/

# Or apply directly
kubectl apply -f infra/kubernetes/base/services/intelligence-deployment.yaml
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
- [`gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`](../../../../gtcx-agentic/docs/operations/coordination/agent-coordination-log.md)

---

## Finding: Missing deployment in infra repo

**Critical discovery:** The `intelligence-orchestrator` Deployment and Service are **not present** in `gtcx-infrastructure/infra/kubernetes/`. This means:

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

- Terraform secrets module: `infra/terraform/modules/secrets/intelligence.tf`
- Staging ingress: `infra/kubernetes/overlays/staging/intelligence/ingress.yaml`
- Intelligence shadow routing: `infra/kubernetes/base/services/intelligence-shadow.yaml`
- EAP sync runbook: `gtcx-core/docs/operations/runbooks/eap-bundle-sync.md`
- Outbound handoff: [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)

---

_Last updated: 2026-06-03_  
_Next update: when deployment manifest is obtained or created._
