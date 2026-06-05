---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# Runbook: Route `sovereign-staging.gtcx.trade` to Sovereign Staging Service

## Status

**Partially complete** — Kubernetes infrastructure is ready. Cloudflare + ACM validation steps remain.

---

## What Is Already Done

### 1. Sovereign Deployment (Kubernetes)

- Base manifest created at `04-ship/kubernetes/base/services/sovereign/deployment.yaml`
- Added to staging kustomization (`04-ship/kubernetes/overlays/staging/kustomization.yaml`)
- Image reference: `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-sovereign:staging`
- PodSecurity-compliant (`restricted:latest`):
  - `runAsNonRoot: true`, `runAsUser: 1000`
  - `allowPrivilegeEscalation: false`
  - `capabilities.drop: ["ALL"]`
  - `seccompProfile.type: RuntimeDefault`
  - `readOnlyRootFilesystem: true` with `emptyDir` for `/tmp`
- Probes configured for `/api/health` on port 3001

### 2. Staging Ingress Updated

- `04-ship/kubernetes/overlays/staging/ingress.yaml` now includes:
  - Host rule: `sovereign-staging.gtcx.trade` → `sovereign-staging:3001`
  - `external-dns.alpha.kubernetes.io/hostname` includes `sovereign-staging.gtcx.trade`

### 3. ALB Target Group Healthy

- Target group `k8s-gtcxstag-sovereig-cbe680c6a7` created for port 3001
- Sovereign pod IP `10.3.107.88` registered and **healthy**

### 4. ALB Controller OIDC Fix

- Created missing IAM OIDC provider for cluster `88225752107BD8162969D30455B2C3D7`
- Controller is now reconciling ingress changes successfully

### 5. ACM Certificate Requested

- ARN: `arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16`
- Domain: `sovereign-staging.gtcx.trade`
- Status: `PENDING_VALIDATION`

---

## What Remains (Manual Cloudflare Steps)

> **Prerequisite:** Cloudflare dashboard access for `gtcx.trade` zone.

### Step 1: Add ACM Validation CNAME

Add this DNS record in Cloudflare for `gtcx.trade`:

| Type  | Name                                                  | Value                                                               | TTL  |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------- | ---- |
| CNAME | `_552ca3cb0ef27690343dbb9fefe1d81e.sovereign-staging` | `_221f2001f4782089df2c5cbf87542277.jkddzztszm.acm-validations.aws.` | Auto |

> **Note:** Do **not** proxy this record (gray cloud, not orange). ACM validation requires direct DNS resolution.

### Step 2: Remove Cloudflare Redirect Rule

`sovereign-staging.gtcx.trade` currently returns **301 → `http://gtcx.trade`** via Cloudflare. This is likely one of:

- **Page Rule** (Rules → Page Rules)
- **Redirect Rule** (Rules → Redirect Rules)
- **Bulk Redirect**

Find and delete/disable any rule matching `sovereign-staging.gtcx.trade`.

### Step 3: Add CNAME to ALB

Add this DNS record in Cloudflare for `gtcx.trade`:

| Type  | Name                | Value                                                                   | Proxy Status           |
| ----- | ------------------- | ----------------------------------------------------------------------- | ---------------------- |
| CNAME | `sovereign-staging` | `k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com` | Proxied (orange cloud) |

> **Note:** Keep this record **proxied** (orange cloud) so Cloudflare provides DDoS protection and SSL edge termination. The ALB handles origin TLS via ACM.

---

## What Remains (Automated Steps After Validation)

### Step 4: Attach Certificate to ALB

Once the certificate status changes to `ISSUED`:

```bash
# Verify certificate is issued
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16 \
  --region af-south-1 \
  --query 'Certificate.Status'

# Add certificate to ALB listener
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:af-south-1:348389439381:loadbalancer/app/k8s-gtcxstagingapi-295a96727a/c71b6e1f69c8e8a2 \
  --region af-south-1 \
  --query 'Listeners[?Protocol==`HTTPS`].ListenerArn' \
  --output text)

aws elbv2 add-listener-certificates \
  --listener-arn "$LISTENER_ARN" \
  --certificates CertificateArn=arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16 \
  --region af-south-1
```

### Step 5: Update Ingress Certificate Annotation

Update `04-ship/kubernetes/overlays/staging/ingress.yaml` to include both certificates:

```yaml
alb.ingress.kubernetes.io/certificate-arn: |
  arn:aws:acm:af-south-1:348389439381:certificate/8929e5a0-a4ec-4acf-86f8-945993e1f0c3,
  arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16
```

Then apply:

```bash
kubectl apply -f 04-ship/kubernetes/overlays/staging/ingress.yaml
```

---

## Verification

After all steps complete:

```bash
# Should return 200, no redirect
curl -sI https://sovereign-staging.gtcx.trade/health

# Expected:
# HTTP/2 200
# server: cloudflare
# (no Location header)
```

---

## Troubleshooting

| Symptom                                | Cause                                 | Fix                                                            |
| -------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `curl` returns 301 to `gtcx.trade`     | Cloudflare redirect rule still active | Remove Page Rule / Redirect Rule in Cloudflare dashboard       |
| `curl` returns 526 / certificate error | ACM cert not attached to ALB          | Run Step 4 (attach certificate)                                |
| `curl` returns 404                     | ALB listener rule not matching host   | Verify ingress has `host: sovereign-staging.gtcx.trade` rule   |
| `curl` returns 504                     | Target group unhealthy                | Check `kubectl get pods -n gtcx-staging` for sovereign-staging |
| ACM stuck in `PENDING_VALIDATION`      | Validation CNAME missing / incorrect  | Verify Step 1 in Cloudflare DNS; wait up to 30 min             |

---

## References

- Ingress: `04-ship/kubernetes/overlays/staging/ingress.yaml`
- Sovereign base manifest: `04-ship/kubernetes/base/services/sovereign/deployment.yaml`
- Staging kustomization: `04-ship/kubernetes/overlays/staging/kustomization.yaml`
- ALB DNS: `k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com`
- ACM Certificate ARN: `arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16`
