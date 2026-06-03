---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# Manual Cloudflare Steps — sovereign-staging.gtcx.trade

## Step 1: Add ACM Validation CNAME (gray cloud)

1. Open [dash.cloudflare.com](https://dash.cloudflare.com) → select **gtcx.trade** → **DNS** → **Records**
2. Click **Add record**:
   - **Type:** `CNAME`
   - **Name:** `_552ca3cb0ef27690343dbb9fefe1d81e.sovereign-staging`
   - **Target:** `_221f2001f4782089df2c5cbf87542277.jkddzztszm.acm-validations.aws.`
   - **TTL:** `Auto`
   - **Proxy status:** **DNS only** (gray cloud)
3. Click **Save**

> Gray cloud is required — ACM validation needs direct DNS resolution.

Verify:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16 \
  --region af-south-1 --query 'Certificate.Status'
# Wait until it returns "ISSUED"
```

---

## Step 2: Remove the Redirect Rule

The subdomain currently 301-redirects to `http://gtcx.trade`. Check three locations:

### 2a. Page Rules (legacy)

**Rules** → **Page Rules**

- Look for any rule matching `*sovereign-staging.gtcx.trade*` with action **Forwarding URL**
- Delete it

### 2b. Redirect Rules (modern)

**Rules** → **Redirect Rules**

- Check **Custom Rules** and **Bulk Redirects** tabs
- Look for source = `sovereign-staging.gtcx.trade` or wildcard matching it
- Delete or toggle **Off**

### 2c. Bulk Redirect Lists

**Rules** → **Redirect Rules** → **Bulk Redirects** → **Edit**

- Delete any entry with source containing `sovereign-staging`

Verify:

```bash
curl -sI https://sovereign-staging.gtcx.trade/health
# Should NO LONGER show: location: http://gtcx.trade
# May show 526 or 404 (expected until cert + CNAME are fixed)
```

If still 301 after 60s: **Caching** → **Configuration** → **Purge Everything**

---

## Step 3: Add CNAME to ALB (orange cloud)

**DNS** → **Records** → **Add record**:

- **Type:** `CNAME`
- **Name:** `sovereign-staging`
- **Target:** `k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com`
- **TTL:** `Auto`
- **Proxy status:** **Proxied** (orange cloud)

Verify:

```bash
dig +short sovereign-staging.gtcx.trade
# Should return Cloudflare IPs (104.21.x.x / 172.67.x.x)
```

---

## Step 4: Attach ACM Certificate to ALB (after "ISSUED")

Run once the certificate shows `ISSUED`:

```bash
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:af-south-1:348389439381:loadbalancer/app/k8s-gtcxstagingapi-295a96727a/c71b6e1f69c8e8a2 \
  --region af-south-1 \
  --query 'Listeners[?Protocol==`HTTPS`].ListenerArn' --output text)

aws elbv2 add-listener-certificates \
  --listener-arn "$LISTENER_ARN" \
  --certificates CertificateArn=arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16 \
  --region af-south-1
```

Then update the ingress annotation so the controller keeps it:

```yaml
# infra/kubernetes/overlays/staging/ingress.yaml
alb.ingress.kubernetes.io/certificate-arn: |
  arn:aws:acm:af-south-1:348389439381:certificate/8929e5a0-a4ec-4acf-86f8-945993e1f0c3,
  arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16
```

Apply:

```bash
kubectl apply -f infra/kubernetes/overlays/staging/ingress.yaml
```

---

## Step 5: Final Verification

```bash
curl -sI https://sovereign-staging.gtcx.trade/health
```

**Expected:** `HTTP/2 200` from `cloudflare`

| Error | Fix                                                                                 |
| ----- | ----------------------------------------------------------------------------------- |
| 301   | Redirect rule still active (Step 2)                                                 |
| 526   | Certificate not attached to ALB (Step 4)                                            |
| 404   | Ingress rule missing — check `kubectl get ingress -n gtcx-staging gtcx-api`         |
| 504   | Target group unhealthy — check `kubectl get pods -n gtcx-staging \| grep sovereign` |

---

## Rollback

| Problem       | Action                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Broken        | Delete the `sovereign-staging` CNAME in Cloudflare DNS                                                                |
| Cert issue    | `aws elbv2 remove-listener-certificates --listener-arn <arn> --certificates CertificateArn=<arn> --region af-south-1` |
| Redirect back | Re-create the rule deleted in Step 2                                                                                  |
