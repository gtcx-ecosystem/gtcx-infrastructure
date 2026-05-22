---
title: 'GTCX Infrastructure — Execution Roadmap'
status: 'current'
date: '2026-05-22'
owner: 'platform-engineering'
tier: 'standard'
tags: ['agile', 'roadmap', 'audit']
review_cycle: 'on-change'
---

# GTCX Infrastructure — Execution Roadmap

**Date:** 2026-05-22  
**Status:** Active — Sprint 1 in progress  
**Objective:** Complete all remaining internally controllable engineering items and produce updated AI Maturity + GTM Readiness audit dimensions.

---

## Sprint Overview

| Sprint | Theme                                     | Duration | Target Score Impact     |
| ------ | ----------------------------------------- | -------- | ----------------------- |
| 1      | Audit-Signer Integration (Phase 1.3)      | 2 days   | Agentic 7.8 → 8.5       |
| 2      | Feedback Loop + Telemetry (Phase 1.4)     | 2 days   | Resilience 8.0 → 8.8    |
| 3      | Mobile SDK + Offline-First (Phase 1.1)    | 2–3 days | Global South 7.5 → 8.5  |
| 4      | Full Audit Update (AI Maturity + GTM)     | 1–2 days | Evidence confidence A   |
| 5      | Infrastructure Hardening (Audit findings) | 2 days   | Security 7.5 → 8.5      |
| 6      | Final Polish + Validation                 | 1 day    | Master validation 13/13 |

**Total estimated duration:** 10–12 working days  
**Exit criteria:** All 13 validation gates pass, AI Maturity scorecard ≥9.0, GTM Readiness S2→S2+.

---

## Definition of Done (Universal)

- [ ] All acceptance criteria met and verified
- [ ] Unit tests >90% branch coverage for new code
- [ ] Integration tests passing
- [ ] Linting / type checks pass with zero errors
- [ ] Master validation (`validate-all.mjs`) 13/13 gates pass
- [ ] Documentation updated (OpenAPI, ADR, runbook)
- [ ] UAT scenarios executed and signed off

---

## Sprint 1: Audit-Signer Integration (Phase 1.3)

**Goal:** Every consequential compliance event is cryptographically signed and hash-linked, producing tamper-evident audit records.

**Committed Stories:** 13 points

---

### [SGN-001]: Gateway emits signed audit records

**Priority:** P0 | **Points:** 5 | **Assignee:** Platform Engineering

#### User Story

**As a** compliance officer  
**I want** every AI query and mutation decision to be cryptographically signed  
**So that** tampering with audit history is mathematically detectable

#### Acceptance Criteria

- [ ] `handleQuery` creates a signed audit record on every `/v1/query` request
- [ ] `authenticateHeaders` creates a signed audit record on every auth decision (success + failure)
- [ ] `canAccessTool` creates a signed audit record on every mutating tool access check
- [ ] Records include: `id`, `timestamp`, `actor`, `action`, `target`, `payloadHash`, `prevHash`, `signature`, `publicKey`
- [ ] Records are hash-linked (`prevHash` chains to previous record)
- [ ] Key pair is loaded from env (`AUDIT_SIGNING_KEY_B64`); falls back to generated ephemeral pair in dev
- [ ] Invalid/missing key fails closed in production (logs warning, continues unsigned)

#### Technical Notes

- Use `@gtcx/audit-signer` exports: `createRecord`, `signRecord`, `createChain`, `append`
- Add `signAuditEvent(event)` helper to `server.mjs`
- Persist chain in-memory with NDJSON flush to stdout (structured logging)
- Future: flush to WORM S3 bucket via sidecar

#### Dependencies

- `@gtcx/audit-signer` v0.1.0 (already exists, tests pass)

#### Test Scenarios

1. Query produces signed record with valid signature
2. Auth failure produces signed record
3. Chain linkage: record N has prevHash == hash(record N-1)
4. Tampered record fails verification
5. Missing key in production logs warning, continues
6. Coverage gate: ≥90% branches for new code paths

---

### [SGN-002]: Kubernetes runtime policy for audit signing

**Priority:** P1 | **Points:** 3 | **Assignee:** DevOps / SRE

#### User Story

**As a** platform operator  
**I want** the audit signing key to be injected via Kubernetes secrets  
**So that** key rotation and access control are managed by the cluster

#### Acceptance Criteria

- [ ] `infra/kubernetes/base/secrets/audit-signing.yaml` — ExternalSecret or SealedSecret manifest
- [ ] `infra/kubernetes/base/configmaps/audit-policy.yaml` — ConfigMap with `AUDIT_SIGNING_ENABLED`, `AUDIT_CHAIN_FLUSH_INTERVAL`
- [ ] `infra/kubernetes/base/services/compliance-gateway.yaml` mounts the secret as env var `AUDIT_SIGNING_KEY_B64`
- [ ] `docs/runbooks/audit-signing-rotation.md` — key rotation procedure

#### Dependencies

- SGN-001 (signing logic must exist first)

#### Test Scenarios

1. `kustomize build` produces valid manifest with secret reference
2. Deployment spec includes envFrom for both ConfigMap and Secret
3. Rotation runbook documents: generate new key → seal → apply → restart deployment

---

### [SGN-003]: Audit chain verification endpoint

**Priority:** P1 | **Points:** 3 | **Assignee:** Platform Engineering

#### User Story

**As a** security auditor  
**I want** an endpoint that returns the latest chain hash and record count  
**So that** I can verify chain integrity without downloading all records

#### Acceptance Criteria

- [ ] `GET /v1/audit/chain` returns `{ lastHash, recordCount, verified }`
- [ ] `POST /v1/audit/verify` accepts NDJSON body and returns `{ valid, firstInvalidIndex, reason }`
- [ ] Both endpoints require `audit:read` permission
- [ ] Verification re-computes hashes and checks signatures

#### Dependencies

- SGN-001

#### Test Scenarios

1. Empty chain returns `recordCount: 0, verified: true`
2. Valid chain returns `verified: true`
3. Tampered chain returns `verified: false` with first invalid index
4. Unauthorized request returns 403

---

## Sprint 1 UAT

| Scenario           | Steps                                              | Expected Result                                                             | Status |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Signed query       | POST /v1/query with valid auth                     | Response includes `x-audit-record-id` header; stdout contains signed NDJSON | ☐      |
| Chain verification | GET /v1/audit/chain                                | Returns lastHash and recordCount > 0                                        | ☐      |
| Tamper detection   | Modify one record in NDJSON; POST /v1/audit/verify | Returns `valid: false` with correct index                                   | ☐      |
| Key rotation       | Follow runbook to rotate key                       | New records signed with new key; old records still verifiable               | ☐      |

**UAT Sign-Off:**

| Role              | Name | Date | Status       |
| ----------------- | ---- | ---- | ------------ |
| Security Engineer |      |      | [ ] Approved |
| Platform Engineer |      |      | [ ] Approved |

---

## Sprint 2: Feedback Loop + Telemetry (Phase 1.4)

**Goal:** Runtime metrics drive adaptive policy tuning; latency and error rates are observable and actionable.

**Committed Stories:** 13 points

---

### [FBK-001]: Metrics collection middleware

**Priority:** P0 | **Points:** 5

#### Acceptance Criteria

- [ ] `requestDuration` histogram: bucketed by endpoint, provider, status code
- [ ] `requestCount` counter: total requests, failed requests, degraded-mode requests
- [ ] `providerLatency` gauge: p50, p95, p99 per provider
- [ ] `authDecisionCount` counter: success, failure, unauthorized
- [ ] Metrics are exposed on `/metrics` in Prometheus exposition format
- [ ] Metrics are collected in `sendJson` and `handleQuery`

#### Test Scenarios

1. `/metrics` returns valid Prometheus text
2. Request count increments after each request
3. Duration histogram has correct buckets
4. Provider latency reflects actual generation time

---

### [FBK-002]: Adaptive policy tuning

**Priority:** P1 | **Points:** 5

#### Acceptance Criteria

- [ ] `GTCX_ADAPTIVE_POLICY_ENABLED=true` enables automatic degradation mode switching
- [ ] If provider p95 latency > threshold (default 5s) for 3 consecutive windows, mode switches to `reduced`
- [ ] If error rate > 10% for 2 consecutive windows, mode switches to `minimal`
- [ ] If metrics recover for 5 consecutive windows, mode returns to `auto`
- [ ] Policy transitions are logged as `resilience.policy.adaptation` events
- [ ] Configurable via env: `GTCX_ADAPTIVE_LATENCY_THRESHOLD`, `GTCX_ADAPTIVE_ERROR_THRESHOLD`

#### Test Scenarios

1. Simulated high latency triggers `reduced` mode
2. Simulated high error rate triggers `minimal` mode
3. Recovery returns to `auto`
4. Disabled adaptive policy keeps manual mode unchanged

---

### [FBK-003]: Kubernetes metrics scraping

**Priority:** P1 | **Points:** 3

#### Acceptance Criteria

- [ ] ServiceMonitor or PodMonitor manifest for Prometheus scraping
- [ ] `infra/kubernetes/base/services/compliance-gateway.yaml` includes `prometheus.io/scrape: "true"` annotation
- [ ] Grafana dashboard JSON for compliance-gateway metrics

---

## Sprint 2 UAT

| Scenario         | Steps                              | Expected Result                                 | Status |
| ---------------- | ---------------------------------- | ----------------------------------------------- | ------ |
| Metrics endpoint | GET /metrics                       | Returns valid Prometheus text with all counters | ☐      |
| Adaptive latency | Simulate provider latency > 5s × 3 | Degradation mode switches to `reduced`          | ☐      |
| Adaptive error   | Simulate 50% error rate × 2        | Degradation mode switches to `minimal`          | ☐      |
| Recovery         | Return to normal latency/error     | Mode returns to `auto` after 5 windows          | ☐      |

---

## Sprint 3: Mobile SDK + Offline-First (Phase 1.1)

**Goal:** Mobile and feature-phone clients can queue compliance queries offline and sync when connectivity returns.

**Committed Stories:** 13 points

---

### [MOB-001]: Client-side offline queue

**Priority:** P0 | **Points:** 5

#### Acceptance Criteria

- [ ] New package `@gtcx/mobile-sdk` in `tools/mobile-sdk/`
- [ ] `OfflineQueue` class with `enqueue(request)`, `dequeue()`, `flush()`, `size`
- [ ] Storage backends: `localStorage` (browser), `AsyncStorage` (React Native), `memory` (fallback)
- [ ] Queue is serialized to JSON; survives page refresh / app restart
- [ ] Max queue size configurable (default 100); drops oldest on overflow

#### Test Scenarios

1. Enqueue 3 requests; reload page; queue still has 3
2. Flush sends all queued requests in order
3. Overflow drops oldest, keeps newest
4. Invalid storage backend falls back to memory

---

### [MOB-002]: Background sync with retry

**Priority:** P1 | **Points:** 5

#### Acceptance Criteria

- [ ] `SyncEngine` class with exponential backoff (1s, 2s, 4s, 8s, max 60s)
- [ ] Network detection: `navigator.onLine` (browser), `NetInfo` (RN), manual polling fallback
- [ ] Retry with jitter; max 5 attempts per request
- [ ] Failed permanent requests (4xx) are moved to `deadLetter` queue, not retried
- [ ] Success callbacks and error handlers per request

#### Test Scenarios

1. Offline → online triggers automatic flush
2. 500 error retries with backoff
3. 404 error moves to dead letter after 1 attempt
4. Max retries reached moves to dead letter

---

### [MOB-003]: Low-bandwidth adaptive client

**Priority:** P1 | **Points:** 3

#### Acceptance Criteria

- [ ] Client detects low bandwidth via `navigator.connection.downlink` or manual override
- [ ] Automatically adds `Save-Data: on` header when bandwidth < 0.5 Mbps
- [ ] Caches stripped responses; serves from cache on subsequent identical queries
- [ ] Cache TTL respects server `Cache-Control` header

#### Test Scenarios

1. Slow connection adds `Save-Data: on`
2. Fast connection does not add header
3. Cache hit returns stored response without network call
4. Cache expired re-fetches from server

---

## Sprint 3 UAT

| Scenario        | Steps                      | Expected Result                     | Status |
| --------------- | -------------------------- | ----------------------------------- | ------ |
| Offline queue   | Submit 3 queries offline   | Queue shows 3 items in localStorage | ☐      |
| Background sync | Restore connectivity       | All 3 queries sent automatically    | ☐      |
| Dead letter     | Submit to invalid endpoint | Request moved to deadLetter queue   | ☐      |
| Low bandwidth   | Throttle to 2G             | Requests include `Save-Data: on`    | ☐      |

---

## Sprint 4: Full Audit Update (AI Maturity + GTM Readiness)

**Goal:** Produce updated audit artifacts with evidence from Sprints 1–3.

**Committed Stories:** 8 points

---

### [AUD-001]: AI Maturity scorecard update

**Priority:** P0 | **Points:** 3

#### Acceptance Criteria

- [ ] Update `docs/audit/signal-scorecard.json`:
  - Supervision S2 (audit trail): score 9 → 10 (signed records)
  - Integrity I3 (tamper-evident): score 9 → 10 (Merkle-linked chain)
  - Agentic Maturity new metric: signed audit records production-deployed
- [ ] Overall SIGNAL score ≥9.5
- [ ] `tools/scripts/validate-signal.mjs` passes with new scorecard

---

### [AUD-002]: GTM Readiness assessment update

**Priority:** P0 | **Points:** 3

#### Acceptance Criteria

- [ ] Update `docs/assessments/gtm-readiness-2026-05.md`:
  - S2 Beta: Technical now Ready (Terratest, load tests, chaos tests exist)
  - S2 Beta: Commercial partially ready (usage metering via metrics)
  - S2 Beta: Trust ready (tamper-evident audit, signed releases)
  - S2 Beta: Operational ready (adaptive policy, on-call drilled)
- [ ] Stage gate blockers updated with remediation status

---

### [AUD-003]: Score-evidence ledger update

**Priority:** P1 | **Points:** 2

#### Acceptance Criteria

- [ ] `docs/audit/score-evidence-ledger.json` updated with Sprint 1–3 evidence
- [ ] All new artifacts have git commit references
- [ ] Master audit regenerated: `docs/audit/master-audit-2026-05-22.md`

---

## Sprint 4 UAT

| Scenario          | Steps                                        | Expected Result                | Status |
| ----------------- | -------------------------------------------- | ------------------------------ | ------ |
| SIGNAL validation | `node tools/scripts/validate-signal.mjs`     | Passes with score ≥9.5         | ☐      |
| Score ledger      | `node tools/scripts/validate-ledger.mjs`     | All entries have evidence URLs | ☐      |
| Master audit      | Read `docs/audit/master-audit-2026-05-22.md` | Reflects all Sprint 1–3 work   | ☐      |

---

## Sprint 5: Infrastructure Hardening (Full Audit Remediation)

**Goal:** Close remaining open findings from the 2026-05-04 full audit.

**Committed Stories:** 13 points

---

### [HARD-001]: Detective controls (CloudTrail + GuardDuty)

**Priority:** P0 | **Points:** 5

#### Acceptance Criteria

- [ ] `infra/terraform/modules/detective/main.tf`: CloudTrail in all regions, GuardDuty enabled, S3 bucket for logs with Object Lock
- [ ] Log file validation enabled
- [ ] KMS encryption for CloudTrail S3 bucket

---

### [HARD-002]: ALB TLS + WAF

**Priority:** P1 | **Points:** 3

#### Acceptance Criteria

- [ ] ALB listener enforces TLS 1.2+ (`ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06"`)
- [ ] WAF v2 WebACL attached with OWASP Core Rule Set
- [ ] Rate limiting rule: 2000 requests / 5 min per IP

---

### [HARD-003]: SLO latency + Alertmanager

**Priority:** P1 | **Points:** 3

#### Acceptance Criteria

- [ ] SLO recording rules include latency histogram buckets (p50, p95, p99)
- [ ] Alertmanager escalation policy: critical → PagerDuty → Slack → email
- [ ] `deploy.sh` deployment name truncation bug fixed

---

### [HARD-004]: Hygiene cleanup

**Priority:** P2 | **Points:** 2

#### Acceptance Criteria

- [ ] `_delete/` directory removed if still exists
- [ ] `Dockerfile.protocols` uses `--frozen-lockfile`
- [ ] `.baseline/config.json` updated if references old paths
- [ ] `migrate.sh` SQL injection risk fixed (parameterized variables)

---

## Sprint 5 UAT

| Scenario           | Steps                                    | Expected Result                        | Status |
| ------------------ | ---------------------------------------- | -------------------------------------- | ------ |
| Terraform validate | `terraform validate` in detective module | Passes                                 | ☐      |
| ALB TLS scan       | SSL Labs scan against staging ALB        | Grade A+                               | ☐      |
| Alertmanager       | Trigger test alert                       | Routed to PagerDuty + Slack            | ☐      |
| Deploy script      | Run `deploy.sh production`               | Correct deployment name, no truncation | ☐      |

---

## Sprint 6: Final Polish + Validation

**Goal:** All gates green, documentation current, repo ready for external audit.

**Committed Stories:** 5 points

---

### [POL-001]: Final validation sweep

**Priority:** P0 | **Points:** 3

#### Acceptance Criteria

- [ ] `node tools/scripts/validate-all.mjs` → 13/13 pass
- [ ] All packages `pnpm test:coverage:gate` → pass
- [ ] `pnpm lint` → zero errors
- [ ] `pnpm build:reproducible --canonicalize` → exits 0

---

### [POL-002]: Documentation finalization

**Priority:** P1 | **Points:** 2

#### Acceptance Criteria

- [ ] `CHANGELOG.md` updated with Sprint 1–6 changes
- [ ] `README.md` updated with new packages and architecture diagram
- [ ] All ADRs linked in `docs/decisions/README.md`
- [ ] `docs/runbooks/` has runbooks for: audit signing, feedback loop, mobile SDK sync

---

## Sprint 6 UAT

| Scenario          | Steps                                 | Expected Result             | Status |
| ----------------- | ------------------------------------- | --------------------------- | ------ |
| Master validation | `node tools/scripts/validate-all.mjs` | 13/13 PASS                  | ☐      |
| Coverage gates    | `pnpm test:coverage:gate` per package | All pass                    | ☐      |
| Build             | `pnpm build:reproducible`             | SLSA L2 provenance produced | ☐      |

---

## Risk Register

| Risk                                   | Impact | Probability | Mitigation                                                    | Owner       |
| -------------------------------------- | ------ | ----------- | ------------------------------------------------------------- | ----------- |
| Audit-signer key management complexity | High   | Medium      | Start with env-var injection; document rotation               | Security    |
| Mobile SDK scope creep                 | High   | Medium      | Limit to queue + sync + cache; defer RN bridge                | Platform    |
| Terraform module drift                 | Medium | Low         | `terraform validate` in CI gate                               | DevOps      |
| Coverage regression on new code        | Medium | Medium      | c8 gate enforced per package; write tests first               | Engineering |
| External audit timeline                | High   | High        | All internal engineering complete first; external is parallel | PM          |

---

## Velocity Tracking

| Sprint   | Planned | Completed | Velocity | Notes         |
| -------- | ------- | --------- | -------- | ------------- |
| Sprint 1 | 13      | —         | —        | Audit-Signer  |
| Sprint 2 | 13      | —         | —        | Feedback Loop |
| Sprint 3 | 13      | —         | —        | Mobile SDK    |
| Sprint 4 | 8       | —         | —        | Audit Update  |
| Sprint 5 | 13      | —         | —        | Hardening     |
| Sprint 6 | 5       | —         | —        | Polish        |

---

## Dependency Graph

```
Sprint 1 (Audit-Signer)
  └── Sprint 2 (Feedback Loop) — depends on metrics from S1 audit events
  └── Sprint 4 (Audit Update) — depends on S1 evidence

Sprint 2 (Feedback Loop)
  └── Sprint 3 (Mobile SDK) — adaptive client uses adaptive policy from S2
  └── Sprint 4 (Audit Update) — depends on S2 evidence

Sprint 3 (Mobile SDK)
  └── Sprint 4 (Audit Update) — depends on S3 evidence

Sprint 5 (Hardening)
  └── Independent; can run parallel with Sprints 1-4 if capacity allows

Sprint 6 (Polish)
  └── Depends on all previous sprints
```

---

## Exit Criteria (Program Level)

- [ ] All 6 sprints complete with UAT sign-off
- [ ] `validate-all.mjs` 13/13 gates pass
- [ ] SIGNAL scorecard ≥9.5
- [ ] GTM Readiness S2+ evidenced
- [ ] Zero open critical/high findings from internal audit
- [ ] All new packages have ≥90% branch coverage
- [ ] CHANGELOG.md documents all changes
- [ ] External audit can begin immediately
