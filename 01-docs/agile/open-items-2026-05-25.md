---
title: 'Open Items — Post-Session 2026-05-25'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'critical'
tags: ['mob-w1', 'staging', 'production', 'blockers', 'gtcx-protocols']
review_cycle: 'daily'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Open Items — Post-Session 2026-05-25

## 🔴 External Blockers (Need Action Outside This Repo)

### 1. Cloudflare NS Delegation for `staging.gtcx.trade`

- **What:** Route53 hosted zone `Z05271482E70HDE783JEL` created in account `348389439381`.
- **Why:** ACM certificate `arn:aws:acm:af-south-1:348389439381:certificate/76306469-cb18-463b-be90-624599e1368b` is `PENDING_VALIDATION`.
- **Action required:** Add these 4 NS records to Cloudflare for `staging.gtcx.trade`:
  ```
  ns-388.awsdns-48.com
  ns-1387.awsdns-45.org
  ns-551.awsdns-04.net
  ns-1771.awsdns-29.co.uk
  ```
- **Impact:** Unblocks HTTPS on staging ALB. Without this, staging remains HTTP-only.
- **ETA:** 5–15 min after NS records are added.

### 2. gtcx-protocols#60 — DID Service Production Wiring

- **What:** Real TradePass DID resolver deployment.
- **Why:** `/audit/bundles` verifier has mock resolver landed (PR #56). Production returns 503 (safe fail-closed) until real resolver is wired.
- **Action required:** gtcx-protocols team closes #60 and provides stable URL.
- **Our follow-up:** Uncomment `TRADEPASS_BASE_URL` and `AUDIT_BUNDLES_AUDIENCE` in `04-ship/kubernetes/overlays/production/patches/compliance-gateway-env.yaml`. This is a config-only change — no redeploy needed.
- **Risk:** **Mitigated** — mock resolver is in place; switch to real is one-line config.

---

## 🟡 Verification Pending (Can Be Done From Cluster-Accessible Host or GitHub Actions)

### 3. Staging Deploy Smoke Test

- **What:** Trigger the new `Deploy to Staging` workflow.
- **How:** Go to Actions → "Deploy to Staging" → "Run workflow", or push any change to `04-ship/kubernetes/**` on `main`.
- **What to verify:**
  - `compliance-gateway-staging` pod starts and `/health` returns 200
  - `redis-staging` pod starts and accepts connections
  - `REDIS_URL` env var is present in compliance-gateway container
  - `AUDIT_BUNDLES_ENABLED=1` and `AUDIT_QUERY_ENABLED=1` are active
- **Current state:** Workflow is live on `main` but has not executed yet.

### 4. Redis Cross-Replica Nonce Store Validation

- **What:** Confirm the Redis-backed `NonceGate` works across multiple compliance-gateway replicas.
- **How:** Scale `compliance-gateway-staging` to 2 replicas and run the replay-protection integration test.
- **Command sketch:**
  ```bash
  kubectl scale deployment/compliance-gateway-staging --replicas=2 -n gtcx-staging
  # Run nonce replay test against staging endpoint
  ```
- **Fallback:** If Redis is unreachable, the code falls back to in-memory with a WARN log.

### 5. End-to-End Audit-Flush → WORM S3

- **What:** Confirm signed audit bundles flow from compliance-gateway → NATS → audit-flush → WORM S3.
- **Status:** EXT-003 is complete. Image `gtcx-audit-flush:v0.1.1` is in ECR. Terraform IRSA + S3 WORM applied in staging and production.
- **Action:** Deploy audit-flush to staging and verify objects land in WORM bucket with Object Lock COMPLIANCE mode.

---

## 🟢 Code-Complete, Waiting on External Trigger

### 6. `/audit/bundles` Verifier (PR #56)

- **Status:** Merged to `main`. Feature-flagged via `AUDIT_BUNDLES_ENABLED=1`.
- **Staging:** Will deploy automatically once workflow triggers.
- **Production:** Will deploy with next production deploy. Real DID wiring blocked on gtcx-protocols#60.

### 7. `/audit/query` (PR #58)

- **Status:** Merged to `main`. Feature-flagged via `AUDIT_QUERY_ENABLED=1`.
- **Staging:** Will deploy automatically once workflow triggers.
- **Production:** Will deploy with next production deploy.

---

## 📝 Technical Debt / Non-Critical

### 8. Astro 5→6 Migration (docs-site)

- **What:** `03-platform/tools/docs-site` fails build on Astro 6 due to legacy content collections (`03-platform/src/content/config.ts`).
- **Impact:** Docs-site build broken. Does not affect MOB-W1 critical path.
- **Action:** Update content collections API or pin Astro to v5 until ready.

### 9. Staging Image Tag Automation

- **What:** `build-push-ecr.yml` updates production image tags to commit SHAs on every merge. Staging overlay still uses hardcoded `v0.1.0-staging`.
- **Impact:** Staging does not auto-receive new image builds unless tags are manually updated.
- **Action:** Add image tag update step to the staging deploy workflow (similar to production).

### 10. GitHub Environment `staging`

- **What:** The deploy workflow references `environment: staging`.
- **Action:** Create the "staging" environment in GitHub repo settings if you want manual approval gates before deploy.
- **Impact:** Workflow will run without approval if the environment doesn't exist. Low risk for staging.

### 11. Final Old AWS Account Sweep

- **What:** References to old account `293488310036` were cleaned up in `.github/workflows/build-push-ecr.yml`, Kyverno policy, and `ingress.yaml`.
- **Action:** Run `grep -r "293488310036" . --include="*.yaml" --include="*.yml" --include="*.tf" --include="*.md"` to confirm zero remaining refs.

---

## ✅ Resolved Today

| Item                                     | Resolution                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Kustomize patch targeting                | Fixed — patch now targets base resource identity                                          |
| Missing compliance-gateway base resource | Added to base `kustomization.yaml`                                                        |
| Feature flags missing                    | `AUDIT_BUNDLES_ENABLED=1` and `AUDIT_QUERY_ENABLED=1` injected in staging + production    |
| Dual ingress conflict                    | Removed `ingress-nginx.yaml` and `letsencrypt-issuer.yaml` from active staging build      |
| Production compliance-gateway env vars   | Added `REDIS_URL` + feature flags; prepared DID resolver wiring as commented placeholders |
| Staging deploy workflow                  | Created `.github/workflows/deploy-staging.yml` with rollout verification + smoke tests    |
| ACM certificate                          | Requested in active account; DNS validation record created in Route53                     |
| HPA `scaleTargetRef` naming              | Verified correct in both staging (`-staging`) and production (`-prod`)                    |
