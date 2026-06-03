---
title: 'Outbound — XR-302 P4-07 smoke blockers resolved'
status: done
date: 2026-06-03
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: gtcx-platforms
priority: P0
work_ids: [XR-302]
---

# Outbound from gtcx-infrastructure — XR-302 smoke blockers resolved

**Reply to:** [`gtcx-platforms/docs/operations/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md`](../../../../gtcx-platforms/docs/operations/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md)

## Summary

All three blockers resolved. Platforms can now run `pnpm smoke:signed-edge-tenant:evidence` and close P4-07.

## Blocker resolutions

### 1. Edge SSL (Cloudflare 526)

**Root cause:** ALB health check path was `/health` (default) but sovereign/AGX expose `/api/health`. Target groups were marking targets as unhealthy, causing CF to return 526.

**Fixes applied:**

- ALB health check path updated to `/api/health`
- Sovereign Service `targetPort` patched from string `"http"` to numeric `3001`
- AGX Service `targetPort` patched to `3001`
- WAF `AllowApiHealthEndpoints` rule added (priority between `/health` exact and BotControl) to allow `/api/health` and `/api/*` paths
- Terraform applied: `module.waf.aws_wafv2_web_acl.main` updated in-place

**Verification:**

```bash
curl https://sovereign-staging.gtcx.trade/api/health  # → 200, 0.28s
curl https://api.staging.gtcx.trade/api/health        # → 200, 0.10s
```

### 2. JWT placeholder secrets

**Root cause:** AWS Secrets Manager `gtcx-secrets-staging-cdkk972mcc` contained `SECRET_KEY_BASE=PLACEHOLDER_OVERRIDE_IN_OVERLAY` and missing `TRADEPASS_JWT_SECRET`.

**Fixes applied:**

- Updated secret with real `SECRET_KEY_BASE` (256-bit random)
- Added `TRADEPASS_JWT_SECRET` (256-bit random)
- Rolling-restarted sovereign and AGX deployments
- Verified env vars populated in pods

### 3. DB schema (shared entities)

**Root cause:** TypeORM `SHARED_ENTITIES` includes `AuditRecordEntity`, `OutboxEvent`, and `IdempotencyKeyEntity`, but the staging RDS `gtcx_staging` database had none of these tables. Pods logged `relation "audit_records" does not exist` (42P01) and `relation "outbox" does not exist`.

**Fixes applied:**

- Created K8s Job `migrate-shared-entities` in `gtcx-staging` namespace
- Job uses `postgres:15-alpine` image with restricted security context (PodSecurity compliant)
- Created all three tables with correct columns, types, constraints, and indexes
- Rolling-restarted sovereign and AGX pods

**Tables created:**

- `audit_records` — with `audit_outcome_check` constraint + 10 indexes
- `outbox` — with `idx_outbox_published_created_at` index
- `idempotency_keys` — composite PK `(key, actor_did, route)` + `expires_at` index

**Verification:** No more `42P01` errors in pod logs. Health endpoint reports `database: up` and `audit-trail: up`.

## Artifacts

- K8s Job manifest: `infra/kubernetes/jobs/staging-migrate-shared-entities.yaml`
- WAF module: `infra/terraform/modules/waf/main.tf` (new `AllowApiHealthEndpoints` rule)

## Agent Context Attestation

- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered
- [x] Phase 4: Persona & frame selected (platform-architect, development)
- [x] Phase 5: Context attested
