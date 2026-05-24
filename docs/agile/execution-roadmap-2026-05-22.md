---
title: 'GTCX Infrastructure — Execution Roadmap'
status: 'current'
date: '2026-05-22'
last_updated: '2026-05-22'
owner: 'platform-engineering'
tier: 'critical'
tags: ['agile', 'roadmap', 'sprint-plan', 'audit']
review_cycle: 'on-change'
---

# GTCX Infrastructure — Execution Roadmap

**Cycle:** May 2026
**Status:** Cycle 1 closed (Sprints 1–6 + R2–R5 hygiene). Cycle 2 in flight (Sprints 7–12).
**Predecessor docs:**
[`docs/audit/master-audit-2026-05-17.md`](../audit/master-audit-2026-05-17.md) ·
[`docs/audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md) ·
[`docs/audit/repo-overlay.md`](../audit/repo-overlay.md)

## Executive Summary

The substrate is structurally complete. Six sprints + four hygiene rounds delivered the durable tamper-evident audit chain, multi-tenant boundary, per-principal budget controls, adaptive policy tuning, and the `@gtcx/audit-signer` npm package. All 17 master-validation gates pass; SIGNAL scores 9.60; 696 tests green across 10 active workspace packages.

The remaining critical path is **external clocks** (pen-test report, SOC 2 Type 1 attestation, audit-flush container image build) and **distribution work** (publish-strategy execution, second-tenant onboarding, public docs site). Sprints 7–12 below cover that work plus the structural improvements that become high-leverage once external clocks finish ticking.

## Roadmap Status

| Cycle | Sprint | Theme                                     | Status                              | Delivered                                                                                            |
| ----- | ------ | ----------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1     | S1     | Audit-Signer Integration (Phase 1.3)      | ✅ Closed 2026-05-22                | Signed audit chain, fail-closed in production, durable sink, /v1/audit/chain + /v1/audit/verify      |
| 1     | S2     | Feedback Loop + Telemetry (Phase 1.4)     | ✅ Closed 2026-05-22                | /metrics endpoint, adaptive policy tuner, per-principal budget + QPS, cost telemetry                 |
| 1     | S3     | Mobile SDK + Offline-First (Phase 1.1)    | 🔄 Deferred to Cycle 3              | Existing `tools/low-bandwidth` covers the server-side adaptive path; client SDK is its own track     |
| 1     | S4     | Full Audit Update (AI Maturity + GTM)     | ✅ Closed 2026-05-22                | SIGNAL scorecard v2 at 9.60, full-audit-2026-05-22.md persisted, score-evidence ledger refreshed     |
| 1     | S5     | Infrastructure Hardening (Audit findings) | ✅ Closed 2026-05-22                | Per-tenant boundary, HPA, audit-flush IRSA + sidecar + container source, IRSA wired in 3 envs        |
| 1     | S6     | Final Polish + Validation                 | ✅ Closed 2026-05-22                | 17/17 master validation, conventional commits enforced, atomic micro-commits throughout              |
| 1     | R2     | Residual hygiene cleanup                  | ✅ Closed 2026-05-22                | HPA inflight gauge, audit target sanitization, dev-cred fail-fast, deep import → package import      |
| 1     | R3     | Audit-flush + IRSA + adaptive policy      | ✅ Closed 2026-05-22                | Container source, Dockerfile, IRSA module, runbook, SIGNAL v2, integration tests                     |
| 1     | R4     | Hygiene sweep                             | ✅ Closed 2026-05-22                | cwd-independent validators, /adr/ deleted, doc-standard 0 violations, coverage gate documented       |
| 1     | R5     | Audit canonicalization                    | ✅ Closed 2026-05-22                | gtcx-agentic/audit standards applied: repo-overlay.md, full-audit-2026-05-22.md, schema frontmatter  |
| 2     | S7     | External Engagement Activation            | ⏳ Planned 2026-05-26               | Pen-test send, SOC 2 send, audit-flush image build + push, prometheus-adapter wiring                 |
| 2     | MOB-W1 | Mobile-Prod Cross-Repo Week 1             | ⏳ Planned 2026-05-26 (parallel S7) | #49 staging URL + TLS, #50 /audit/bundles verifier, #51 nonce replay, #52 /audit/query (Bearer)      |
| 2     | S8     | Tenant Validation                         | ⏳ Planned 2026-06-02               | Synthetic second tenant onboarded end-to-end via runbook; empirical SLA captured                     |
| 2     | S9     | Distribution Edge                         | ⏳ Planned 2026-06-09 (2 weeks)     | Docs site, HN post for @gtcx/audit-signer, Terraform Registry listing, outreach                      |
| 2     | S10    | Production Hardening Cycle                | ⏳ Planned 2026-06-30 (2 weeks)     | NATS integration test, live DR restoration, live on-call drill, Redis-backed adaptive state if scale |
| 2     | S11    | Pen-test Findings Triage                  | ⏳ Triggered (~2026-07-25)          | Fix P0/P1 within 30 days of report; re-test                                                          |
| 2     | S12    | mTLS Mesh Runtime                         | ⏳ Q3 2026                          | Linkerd sidecar injection per existing canary plan; ADR-007 runtime                                  |

## Universal Definition of Done

Every story is "done" only when **all** of the following hold:

- [ ] All acceptance criteria met and verified with evidence (file:line, command output, or screenshot)
- [ ] Unit tests at ≥90% branch coverage for new code (≥85% for compliance-gateway per `docs/audit/coverage-gate-rationale.md`)
- [ ] Integration tests passing where applicable
- [ ] Linting + type checks pass with zero errors
- [ ] `node tools/scripts/validate-all.mjs` → 17/17 gates pass
- [ ] Documentation updated (ADR if architectural, runbook if operational, README if interface, audit doc if score-impacting)
- [ ] UAT scenarios executed and signed off by the named role
- [ ] Conventional commit on `main` with `Co-Authored-By` line if AI-assisted
- [ ] Audit signing key still configured in target environment; no fail-open regression

## Universal Definition of Ready

A story is "ready" to pull into a sprint only when:

- [ ] User story written in role/want/so-that form
- [ ] Acceptance criteria are testable (binary pass/fail)
- [ ] Dependencies identified and resolved or sequenced
- [ ] Estimated in story points (1, 2, 3, 5, 8)
- [ ] Owner assigned
- [ ] At least one UAT scenario drafted
- [ ] Test scenarios drafted (≥3 happy + ≥1 negative)
- [ ] Acceptance reviewer named and consulted

---

# Closed Sprints (Cycle 1)

Compressed retrospective form. Full per-sprint detail in commit history under each `feat(*)` commit.

## Sprint 1 — Audit-Signer Integration (Closed)

**Goal delivered:** Every consequential compliance event is cryptographically signed and hash-linked. Tampering is mathematically detectable; verification is offline + third-party.

**Stories closed:** SGN-001 (gateway emits signed records), SGN-002 (K8s runtime policy), SGN-003 (chain verification endpoint), SGN-004 (fail-closed in production), SGN-005 (bounded chain with checkpoint hash), SGN-006 (audit-signer promoted to workspace package), SGN-007 (NATS+WORM durable sink), SGN-008 (trust telemetry Grafana dashboard).

**Evidence:** [`docs/audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md) §Phase 2.

**Velocity:** 13 planned / 21 delivered (added durable-sink + sanitization work mid-sprint).

## Sprint 2 — Gateway Defense in Depth (Closed)

**Goal delivered:** `/v1/query` is hardened against prompt injection, abuse, and cost amplification. All untrusted input is schema-validated at the boundary.

**Stories closed:** DEF-001 (Zod schema on body), DEF-002 (delimited untrusted-context block in prompt), DEF-003 (per-principal token budget), DEF-004 (per-principal QPS limiter), DEF-005 (rename shadowed `runtimePolicy`), DEF-006 (cost metrics counter), DEF-007 (daily prompt-injection self-test suite).

**Evidence:** [`tools/compliance-gateway/src/schemas.mjs`](../../tools/compliance-gateway/src/schemas.mjs), [`tools/compliance-gateway/src/budget.mjs`](../../tools/compliance-gateway/src/budget.mjs), [`tools/eval-pipeline/injection-suite.mjs`](../../tools/eval-pipeline/injection-suite.mjs).

**Velocity:** 13 planned / 17 delivered.

## Sprint 3 — Operational Truth (Closed)

**Goal delivered:** Test/coverage claims match evidence; workspace boundary matches reality; one source of truth for the sprint plan.

**Stories closed:** OPS-001 (coverage configs in every tool), OPS-002 (workspace boundary cleanup — 11 packages registered), OPS-003 (smoke tests for compliance-data + eval-pipeline), OPS-004 (sprint plan consolidation), OPS-005 (Renovate config), OPS-006 (mise.toml tool versions).

**Velocity:** 8 planned / 12 delivered.

## Sprint 4 — Pen-test + SOC 2 Engagement Docs (Closed)

**Goal delivered:** External engagements are engagement-ready, awaiting leadership signature.

**Stories closed:** ENG-001 (pen-test RFP), ENG-002 (pen-test K8s overlay `infra/kubernetes/overlays/pen-test/`), ENG-003 (SOC 2 Type 1 engagement plan), ENG-004 (internal red-team pre-pass via injection suite).

**Velocity:** 5 planned / 5 delivered.

## Sprint 5 — Tenant Boundary + Capacity (Closed)

**Goal delivered:** Multi-tenant deployments stop commingling data. Documented capacity model with HPA.

**Stories closed:** TEN-001 (tenant-scoped principal + audit events), TEN-002 (per-tenant budget overrides), TEN-003 (per-tenant NATS subject routing), TEN-004 (HPA wired to in-flight gauge), TEN-005 (k6 mandatory gate), TEN-006 (4-hour soak scaffold), TEN-007 (tenant onboarding runbook), TEN-008 (per-tenant trust dashboard).

**Velocity:** 13 planned / 18 delivered.

## Sprint 6 — Moat Acceleration (Closed)

**Goal delivered:** Substrate productized; `@gtcx/audit-signer` live on npm; MCP server discoverable by AI agents.

**Stories closed:** MOAT-001 (`@gtcx/audit-signer` publish-ready), MOAT-002 (`@gtcx/audit-signer` live on npm), MOAT-003 (evidence-bundle endpoint), MOAT-004 (shadow-eval drift detector), MOAT-005 (compliance-gateway MCP server), MOAT-006 (morning-brief surface `/v1/brief`).

**Velocity:** 7 planned / 8 delivered.

## R2 — Residual Hygiene Cleanup (Closed)

**Closed:** HPA inflight gauge wired; `sanitizeAuditTarget` extracted; dev-cred fail-fast in `dr-test.sh` + CI; deep imports → package imports; adaptive policy + scheduler tests; audit-flush IRSA + runbook.

## R3 — Audit-Flush Substrate (Closed)

**Closed:** `tools/audit-flush/` package + Dockerfile + tests; `audit-flush-irsa` Terraform module wired into all 3 envs; SIGNAL scorecard v2; adaptive scheduler integration tests.

## R4 — Hygiene Sweep (Closed)

**Closed:** cwd-independent validators; stale `/adr/` deleted; doc-standard 0 violations; coverage gate threshold + rationale documented; validate-all.mjs ENOBUFS fix.

## R5 — Audit Canonicalization (Closed)

**Closed:** `gtcx-agentic/audit/` canonical docs reviewed and applied: `docs/audit/repo-overlay.md` created from `REPO_OVERLAY_TEMPLATE.md`; `docs/audit/full-audit-2026-05-22.md` persisted; `audit_type`/`target_repo`/`audit_date` frontmatter on every audit doc; dashboard parser bug flagged upstream.

---

# Forward Sprints (Cycle 2)

## Sprint 7 — External Engagement Activation

**Sprint window:** 2026-05-26 → 2026-06-01 (one week)
**Sprint goal:** Start the only clocks that gate S2 → S3. Production-ready the substrate by building the audit-flush image and wiring the prometheus-adapter.
**Capacity:** 8 story points
**Sprint owner:** Platform Engineering Lead

### [EXT-001] Send pen-test RFP

**Priority:** P0 | **Points:** 1 | **Assignee:** Security Lead

**User story:** As **the security lead**, I want **the pen-test RFP delivered to the shortlisted vendors** so that **the engagement clock starts and the S3 trust gate becomes addressable**.

**Acceptance criteria:**

- [ ] RFP at [`docs/audit/pen-test-rfp-2026.md`](../audit/pen-test-rfp-2026.md) sent to SensePost, Nclose, Bishop Fox (US fallback).
- [ ] NDAs sent to each vendor.
- [ ] Calendar invites for bid Q&A sessions placed (target 2026-06-05).
- [ ] Receipt confirmed by all three vendors within 72 hours.

**Test scenarios:** N/A (administrative).

**Dependencies:** Budget approval signed.

### [EXT-002] Send SOC 2 Type 1 outreach

**Priority:** P0 | **Points:** 1 | **Assignee:** Security Lead

**User story:** As **the security lead**, I want **the SOC 2 outreach delivered to the four shortlisted auditors** so that **we can compare bids and select before pen-test bids land**.

**Acceptance criteria:**

- [ ] Outreach template at [`docs/audit/soc2-engagement-2026.md`](../audit/soc2-engagement-2026.md) sent to Schellman, A-LIGN, BDO South Africa, Mazars.
- [ ] Standard NDA attached.
- [ ] Receipt confirmed by ≥3 of 4 firms within 72 hours.

**Test scenarios:** N/A.

**Dependencies:** Budget approval signed.

### [EXT-003] Build and push the audit-flush container image

**Priority:** P0 | **Points:** 3 | **Assignee:** Platform Engineering

**User story:** As **a platform operator**, I want **the audit-flush sidecar image built, signed, and pushed to ECR** so that **the Kubernetes manifest can pull a real image instead of `PLACEHOLDER_OVERRIDE_IN_OVERLAY`**.

**Acceptance criteria:**

- [ ] `docker build` against `tools/audit-flush/Dockerfile` succeeds.
- [ ] Image scanned by Trivy with zero high/critical CVEs.
- [ ] Image signed via Cosign keyless (matching `infra/kubernetes/base/policies/require-signed-images.yaml`).
- [ ] Image pushed to all three ECRs (testnet, staging, production).
- [ ] Kustomize overlays patched with the real image digest (testnet first).
- [ ] `kubectl rollout status deploy/audit-flush -n gtcx` reports `successfully rolled out` in testnet.

**Test scenarios:**

1. Deploy to testnet. Send one signed audit record from compliance-gateway. Verify NDJSON lands in WORM bucket within `AUDIT_FLUSH_INTERVAL_MS` (10s default).
2. Verify the NDJSON object's metadata includes `recordcount` and `ObjectLockMode=COMPLIANCE`.
3. Pull the NDJSON and verify with `node -e "import('@gtcx/audit-signer').then(m => console.log(m.verifyChain(m.fromNdjson(require('fs').readFileSync(process.argv[1], 'utf-8')))))" /tmp/chain.ndjson` → `{ valid: true }`.
4. Tamper one record in the NDJSON. Re-verify → `{ valid: false, firstInvalidIndex: <n> }`.
5. Kill the audit-flush pod. Confirm gateway keeps signing (records buffer on JetStream). Restart pod. Confirm buffered records flush.

**Dependencies:** EXT-005 (IRSA role applied via `terraform apply`).

### [EXT-004] Wire prometheus-adapter custom metric

**Priority:** P1 | **Points:** 2 | **Assignee:** Platform Engineering

**User story:** As **a platform operator**, I want **the HorizontalPodAutoscaler to scale compliance-gateway on the `compliance_gateway_inflight_requests` custom metric** so that **autoscaling reflects real per-pod work, not just CPU**.

**Acceptance criteria:**

- [ ] `prometheus-adapter` Helm chart installed in the `monitoring` namespace.
- [ ] `prometheus-adapter` configmap maps `compliance_gateway_inflight_requests` → `pods` metric.
- [ ] `kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/gtcx/pods/*/compliance_gateway_inflight_requests"` returns values for each gateway pod.
- [ ] HPA at `infra/kubernetes/base/services/compliance-gateway-hpa.yaml` reports `targets: ... <currentValue>/20` (not `<unknown>/20`).
- [ ] HPA decision log shows scale-up after sustained load.

**Test scenarios:**

1. Run `tools/load-tests/compliance-gateway-soak.js` against staging with `vus=30`. HPA scales 1→2 pods within 2 minutes.
2. Stop load. HPA scales 2→1 within 5 minutes (stabilizationWindowSeconds=300).
3. Custom metric query returns non-null for all running pods.

**Dependencies:** Prometheus + ServiceMonitor already scraping `/metrics` (existing).

### [EXT-005] Apply `audit-flush-irsa` Terraform in testnet first

**Priority:** P0 | **Points:** 1 | **Assignee:** DevOps

**User story:** As **DevOps**, I want **the `audit-flush-irsa` module applied via `terraform apply` in testnet-pilot** so that **the IAM role exists before the sidecar pod attempts to use it**.

**Acceptance criteria:**

- [ ] `terraform -chdir=infra/terraform/environments/testnet-pilot apply` succeeds.
- [ ] `terraform output audit_flush_role_arn` returns the role ARN.
- [ ] `aws iam get-role --role-name gtcx-testnet-audit-flush-irsa` returns the trust policy.
- [ ] Kustomize overlay patched with the role ARN (replaces `PLACEHOLDER_OVERRIDE_IN_OVERLAY`).

**Test scenarios:**

1. `kubectl describe sa audit-flush -n gtcx` shows the `eks.amazonaws.com/role-arn` annotation matches terraform output.
2. `aws sts assume-role-with-web-identity` (via the sidecar pod's projected token) succeeds.
3. `aws s3 put-object` from a debug pod assuming the role into the WORM bucket succeeds; the same role's `aws s3 get-object` returns AccessDenied (write-only verification).

**Dependencies:** None (module exists at `infra/terraform/modules/audit-flush-irsa/`).

### Sprint 7 UAT

| Scenario               | Steps                                                   | Expected                        | Verified By       | Status |
| ---------------------- | ------------------------------------------------------- | ------------------------------- | ----------------- | ------ |
| Pen-test RFP sent      | Check email outbox + vendor receipt                     | All 3 vendors confirmed receipt | Security Lead     | ☐      |
| SOC 2 outreach sent    | Check email outbox + auditor receipt                    | ≥3 of 4 firms confirmed receipt | Security Lead     | ☐      |
| Audit-flush pod ready  | `kubectl get pod -l app=audit-flush -n gtcx` in testnet | `READY 1/1`                     | DevOps            | ☐      |
| WORM object verifiable | Pull NDJSON from S3, run verifyChain                    | `{ valid: true }`               | Security Engineer | ☐      |
| HPA scales on inflight | k6 30 VUs → 2 pods in 2min                              | HPA event shows scale-up        | Platform Engineer | ☐      |

**UAT Sign-off:**

| Role                      | Name | Date | Status     |
| ------------------------- | ---- | ---- | ---------- |
| Security Lead             |      |      | ☐ Approved |
| Platform Engineering Lead |      |      | ☐ Approved |
| DevOps Lead               |      |      | ☐ Approved |

### Sprint 7 risks

| Risk                                                       | Impact | Probability | Mitigation                                                                   |
| ---------------------------------------------------------- | ------ | ----------- | ---------------------------------------------------------------------------- |
| Vendors quote outside budget envelope                      | High   | Medium      | RFP sets evaluation criteria; falling back to 1 vendor is acceptable         |
| Cosign signing rotation blocks image push                  | Medium | Low         | Existing `build-push-ecr.yml` pattern; copy for audit-flush                  |
| prometheus-adapter conflicts with existing metric pipeline | Medium | Low         | Deploy to staging first; rollback via Helm                                   |
| WORM bucket S3 PutObject permission denied                 | High   | Medium      | Apply IRSA first (EXT-005), validate from debug pod before deploying sidecar |

### Sprint 7 commit plan (atomic)

1. `feat(audit-flush): production image build pipeline`
2. `feat(infra): apply audit-flush-irsa in testnet-pilot`
3. `feat(infra): kustomize overlay patches for audit-flush image + role`
4. `feat(infra): prometheus-adapter custom metric registration`
5. `docs(audit): pen-test RFP send log` (records receipts as evidence)
6. `docs(audit): SOC 2 outreach send log`

---

## Sprint MOB-W1 — Mobile-Prod Cross-Repo Week 1

**Sprint window:** 2026-05-26 → 2026-05-30 (runs parallel to Sprint 7)
**Sprint goal:** Land the four staging-environment dependencies that gtcx-mobile's 30-day production rollout needs for W1 (W4 Zimbabwe go-live). Cross-repo coordination via #gtcx-mobile-prod Slack standup, daily 09:00 GMT.
**Capacity:** 8 story points
**Sprint owner:** Platform Engineering Lead

This thread is **parallel to Sprint 7**, not a replacement. EXT-003 (audit-flush container) inside Sprint 7 is itself a blocker for MOB-W1-002 deploy; the two sprints are sequenced through that one dependency.

### Unblock chain (cross-repo, recorded across both repos)

```
gtcx-infrastructure#49 (staging URL + TLS for TradePass identity service)
    ↓ unblocks
gtcx-protocols#60 (43 emitted DID documents resolvable at the URL)
    ↓ unblocks
gtcx-infrastructure#50 (verifier resolves X-GTCX-DID → public key via the deployed
                        TradePass identity service)
    ↓ unblocks
gtcx-mobile production rollout (W4 Zimbabwe go-live)
```

Cross-references:

- `docs/agile/execution-roadmap-2026-05-22.md` (this row)
- gtcx-infrastructure issues [#49](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/49), [#50](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/50), [#51](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/51), [#52](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/52), [#55](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/55) (gtcx-protocols #60 tracker)
- gtcx-protocols#60 comment recording the chain from their side: [link](https://github.com/gtcx-ecosystem/gtcx-protocols/issues/60#issuecomment-4528532180)

### [MOB-W1-001] Provision \*.staging.gtcx.trade + /health (gtcx-infrastructure#49)

**Priority:** P0 | **Points:** 2 | **Assignee:** Platform Engineering

**User story:** As **gtcx-mobile**, I want **a stable staging hostname with valid TLS** so that **the 30-day pilot can validate the signed-edge transport end-to-end against `https://geotag.staging.gtcx.trade`**.

**Acceptance criteria:**

- [ ] `https://geotag.staging.gtcx.trade/health` returns `{ status: 'ok', version: '<short-sha>' }` from any caller (no auth on `/health`).
- [ ] Publicly-trusted TLS cert (Let's Encrypt or ACM).
- [ ] SPKI fingerprint posted as a comment on #49 within 30 minutes of cert issuance.
- [ ] Reachable from EU + East Africa POPs (cohort coverage: ZW, GH, NA, BW, CD).

**Dependencies:** AWS credentials current; Route53 zone delegation in place (we own `gtcx.trade`).

**Unblocks:** gtcx-protocols#60 (so the 43 emitted DID documents can be served at the stable URL); MOB-W1-002 (verifier needs the audience).

### [MOB-W1-002] Deploy POST /audit/bundles verifier (gtcx-infrastructure#50)

**Priority:** P0 | **Points:** 3 | **Assignee:** Platform Engineering

**User story:** As **gtcx-mobile**, I want **server-side signature verification + chain validation of audit bundles** so that **field-captured events ingest cryptographically into the substrate**.

**Acceptance criteria:**

- [ ] Verifier handler shipped behind `AUDIT_BUNDLES_ENABLED=1` feature flag.
- [ ] Envelope verification per the 9-field canonical form (`gtcx-mobile/apps/mobile/gtcx/lib/auth-token.ts:166-215`).
- [ ] DID resolution via TradePass `/identity/${did}` once gtcx-protocols#60 deployment lands.
- [ ] Within-bundle `previousHash`/`eventHash` chain validation with partial-accept semantics (200 with partial `acceptedIds`).
- [ ] 409 `nonce-replayed` on `X-GTCX-Nonce` replay within 5-minute TTL.
- [ ] End-to-end test: mobile bundle ingest → signature verifies → bundle persists to WORM via audit-flush.

**Dependencies:**

- **MOB-W1-001** (staging hostname)
- **EXT-003** (Sprint 7) — audit-flush container image to ECR (without it, bundles ingest but don't reach WORM)
- **gtcx-infrastructure#55** — tracks gtcx-protocols#60 deployment readiness

**Stub branch already landed:** `feat/audit-bundles-verifier` — 7 commits, 92 unit tests, verifier + chain validator + nonce gate + mockable DID resolver. Production wiring (real TradePass URL) waits on gtcx-protocols#60.

### [MOB-W1-003] Deploy nonce store + replay-rejection (gtcx-infrastructure#51)

**Priority:** P0 | **Points:** 1 | **Assignee:** Platform Engineering

**User story:** As **gtcx-mobile**, I want **server-side replay rejection** so that **a stolen envelope replayed from a different device cannot smuggle audit events**.

**Acceptance criteria:**

- [ ] In-memory NonceGate with 5-min TTL (2-min `MAX_SIGNING_CONTEXT_AGE_MS` + 3-min skew buffer).
- [ ] Replayed nonce within TTL → 409 `nonce-replayed` p99 ≤ 200ms.
- [ ] Capacity envelope: 5 countries × 50 operators × 200 captures/day × 5-min retention ≈ 17K entries × 200 bytes ≈ 3.4 MB.

**Dependencies:** MOB-W1-002 (lands in the same PR — same handler).

**Status:** Implementation complete on `feat/audit-bundles-verifier`; awaiting end-to-end staging deploy with #50.

### [MOB-W1-004] Deploy POST /audit/query (gtcx-infrastructure#52)

**Priority:** P0 | **Points:** 2 | **Assignee:** Platform Engineering

**User story:** As **the web portal regulator**, I want **`/audit/query` to serve real audit events scoped by tenant** so that **the audit-review page renders live data instead of the demo fixture**.

**Acceptance criteria:**

- [ ] Endpoint accepts `QueryAuditRequest` per `gtcx-mobile/apps/web/portal/lib/audit-client.ts`.
- [ ] Bearer-only auth for W1 (signed-edge dual-auth deferred to Sprint 22+).
- [ ] `X-GTCX-Tenant-Id` lowercase ISO-2 country code → per-tenant namespace per ADR-015.
- [ ] `totalMatched` computed as `min(matched, limit + 1)` for scalability; `truncated` flag is the load-bearing indicator.
- [ ] `outcome` taxonomy stored as-received (mobile's 4-state enum coexists with our internal event types).

**Dependencies:** MOB-W1-002 (handler infrastructure); WORM bucket access path.

### MOB-W1 UAT

| #   | Scenario                                                             | Owner        | Status |
| --- | -------------------------------------------------------------------- | ------------ | ------ |
| 1   | Staging URL reachable from EU + EA POPs                              | Platform Eng | ☐      |
| 2   | SPKI fingerprint pinned in `apps/mobile/gtcx/CERT_PINS.md`           | gtcx-mobile  | ☐      |
| 3   | Real mobile-signed bundle ingests + verifies                         | Joint        | ☐      |
| 4   | Replayed nonce returns 409 within 200ms                              | Joint        | ☐      |
| 5   | Web portal `/audit-review` renders live data (DEMO DATA banner gone) | gtcx-mobile  | ☐      |

### MOB-W1 risks

| Risk                                                               | Severity | Likelihood | Mitigation                                                            |
| ------------------------------------------------------------------ | -------- | ---------- | --------------------------------------------------------------------- |
| gtcx-protocols#60 deployment slips → #50 production wiring blocked | High     | Medium     | Mock DID resolver landed in stub branch; switch to real on #60 close  |
| EXT-003 audit-flush image slips → #50 deploy blocked               | High     | Low        | EXT-003 is Sprint 7's P0; visible in same #gtcx-mobile-prod standup   |
| AWS creds expired or zone delegation missing → #49 cannot ship     | Medium   | Low        | Pre-check Monday; flag at standup if missing                          |
| @gtcx/sdk not published → schema duplication across consumers      | Medium   | High       | Coordinate with gtcx-protocols on publish ownership (ADR-021 pattern) |

### MOB-W1 commit plan

1. Branch `feat/audit-bundles-verifier` — 7 commits already landed (schemas, canonical, DID resolver, envelope verifier, chain validator, nonce gate, handler).
2. PR opens as draft post-Monday-standup ratification.
3. Production wiring lands as a follow-up commit when gtcx-protocols#60 deploys.
4. `/audit/query` (#52) lands as a separate PR after #50 review opens.

---

## Sprint 8 — Tenant Validation

**Sprint window:** 2026-06-02 → 2026-06-08
**Sprint goal:** Prove the tenant-onboarding runbook works end-to-end in ≤ 2 hours of platform-engineering time. Capture empirical evidence of the SLA we promise pilot customers.
**Capacity:** 5 story points
**Sprint owner:** Platform Engineering Lead

### [TEN-V-001] Onboard a synthetic second tenant

**Priority:** P0 | **Points:** 3 | **Assignee:** Platform Engineering

**User story:** As **the platform engineering lead**, I want **to run the tenant-onboarding runbook end-to-end against a synthetic tenant** so that **the 2-hour SLA in the runbook is grounded in evidence**.

**Acceptance criteria:**

- [ ] Synthetic tenant code allocated (e.g., `pilot-canary`).
- [ ] Two tokens minted per runbook step 2 (ops + approver).
- [ ] Budget override applied: 50 QPS / $100/day.
- [ ] First /v1/query from the new tenant succeeds with 200, includes `routing.provider`, and produces a signed audit record under `tenant=pilot-canary/` prefix in the WORM bucket.
- [ ] Per-tenant trust dashboard populated within 5 minutes of first traffic.
- [ ] Decommissioning step executed; tokens revoked; WORM history preserved (verify with `aws s3 ls`).
- [ ] Time-on-task captured per runbook section; total ≤ 2 hours.

**Test scenarios:**

1. Smoke `/v1/query` from `pilot-canary-ops` token returns 200.
2. Mutating call from `pilot-canary-ops` returns 403 (no `query:mutate` permission).
3. Mutating call from `pilot-canary-approver` with valid approval ticket returns 200.
4. Cross-tenant access attempt (`pilot` token reading `pilot-canary` data) returns nothing — no leakage.
5. Per-tenant cost metric appears in `compliance_gateway_cost_usd_total{tenantId="pilot-canary"}`.
6. Revoke succeeds; subsequent calls with revoked tokens return 401.

**Dependencies:** Sprint 7 EXT-003 + EXT-005 (audit-flush in testnet).

### [TEN-V-002] Update the tenant-onboarding runbook with empirical timings

**Priority:** P1 | **Points:** 1 | **Assignee:** Platform Engineering

**User story:** As **a future platform engineer**, I want **the runbook to reflect what TEN-V-001 actually took** so that **my time estimate matches reality**.

**Acceptance criteria:**

- [ ] Each runbook section in [`docs/operations/runbooks/tenant-onboarding.md`](../operations/runbooks/tenant-onboarding.md) has an "Observed time" line added.
- [ ] SLA statement updated if total exceeded 2 hours; otherwise confirmed as ≤ 2h.
- [ ] Any pain points discovered are captured as P2 tickets in `docs/agile/backlog.md`.

**Test scenarios:** Diff inspection.

**Dependencies:** TEN-V-001.

### [TEN-V-003] Tenant-isolation pen-test mini-pass

**Priority:** P1 | **Points:** 1 | **Assignee:** Security Engineer (internal)

**User story:** As **the security engineer**, I want **to attempt obvious cross-tenant access as the new tenant** so that **we surface boundary leaks before the external pen-test does**.

**Acceptance criteria:**

- [ ] Attempted: token replay across tenants → fails.
- [ ] Attempted: approval ticket forgery → fails.
- [ ] Attempted: SQL/path traversal via `jurisdiction` field → fails (Zod enum).
- [ ] Attempted: NATS subject subscription attempt from inside `pilot-canary` namespace to `gtcx.audit.compliance-gateway.pilot` → fails (NetworkPolicy + JetStream ACL).
- [ ] Results logged in a new doc `docs/audit/internal-red-team-2026-06.md` (created during S8, schema-compliant frontmatter).

**Test scenarios:** Each attempt above is the test.

**Dependencies:** TEN-V-001.

### Sprint 8 UAT

| Scenario               | Steps                                                            | Expected                                              | Verified By       | Status |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ----------------- | ------ |
| End-to-end onboard     | Run all runbook steps for `pilot-canary`                         | Total time ≤ 2h; first signed record in WORM ≤ 15 min | Platform Eng Lead | ☐      |
| Tenant trust dashboard | Open `audit-trust-tenant` dashboard, set `tenantId=pilot-canary` | Live data within 5 min of first traffic               | Operator          | ☐      |
| Cross-tenant isolation | Attempt cross-tenant reads from pilot-canary token               | All attempts fail                                     | Security Engineer | ☐      |
| Decommission           | Run revoke step                                                  | Tokens 401; WORM history preserved                    | Platform Eng Lead | ☐      |

### Sprint 8 risks

| Risk                                                  | Impact | Probability | Mitigation                                                          |
| ----------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------- |
| Onboarding exceeds 2h SLA                             | Medium | Medium      | Capture friction; treat as P2 backlog item, not a sprint failure    |
| Cross-tenant leak surfaces                            | High   | Low         | If found, escalate to P0 hotfix; block pen-test send until resolved |
| Tenant data accidentally written to wrong WORM prefix | High   | Low         | Add prefix-validation alert (cumulative work, not Sprint 8 scope)   |

---

## Sprint 9 — Distribution Edge

**Sprint window:** 2026-06-09 → 2026-06-22 (two weeks)
**Sprint goal:** Move from "we published primitives" to "external developers discover and adopt them." Build the surface that converts publication into distribution.
**Capacity:** 13 story points
**Sprint owner:** Platform Engineering Lead + GTM Partner

### [DIST-001] Public documentation site

**Priority:** P0 | **Points:** 5 | **Assignee:** Platform Engineering + Design

**User story:** As **a developer evaluating GTCX as a substrate**, I want **a single docs site that explains the published primitives** so that **I can decide whether to adopt them without cloning the repo**.

**Acceptance criteria:**

- [ ] Site live at `gtcx.io/compliance` (or agreed-on subdomain).
- [ ] Linked pages for `@gtcx/audit-signer`, `terraform-aws-compliance-db`, `compliance-gateway-mcp`.
- [ ] Each page includes: install command, quick-start, real-world install example, link to GitHub source.
- [ ] SIGNAL scorecard summary embedded with link to live JSON.
- [ ] No `Powered by AI` / `Built with` chrome — minimal, technical tone matching the substrate.
- [ ] Mobile-responsive (>50% of African dev traffic is mobile).
- [ ] WCAG AA contrast.

**Test scenarios:**

1. Lighthouse score ≥ 90 on Performance, Accessibility, Best Practices.
2. Mobile rendering on 360×800 viewport — no horizontal scroll.
3. Every code snippet copy-paste works on a clean Node 20 box.

**Dependencies:** None (can use existing static-site setup).

### [DIST-002] Terraform Registry listing for `terraform-aws-compliance-db`

**Priority:** P1 | **Points:** 3 | **Assignee:** DevOps

**User story:** As **a Terraform user**, I want **to find `terraform-aws-compliance-db` on the official Terraform Registry** so that **I can pin a version via standard `source = "..."` syntax**.

**Acceptance criteria:**

- [ ] Module passes the Terraform Registry validation suite.
- [ ] Module tagged `v0.1.0` on GitHub.
- [ ] Module visible at `registry.terraform.io/modules/...` within 24h of tagging.
- [ ] README has the example `module "compliance_db" { source = "..." }` snippet.

**Test scenarios:**

1. `terraform init` against a fresh project using the registry source succeeds.
2. `terraform plan` for a single jurisdiction works end-to-end.

**Dependencies:** None (module exists on GitHub).

### [DIST-003] `@gtcx/audit-signer` launch announcement

**Priority:** P1 | **Points:** 3 | **Assignee:** Platform Engineering Lead

**User story:** As **the platform engineering lead**, I want **the published `@gtcx/audit-signer` to reach the developer audience that cares about regulator-grade audit substrates** so that **distribution becomes a real path, not just a published artifact**.

**Acceptance criteria:**

- [ ] Blog post drafted (~1500 words). One post, three angles: (a) the problem (audit trails are not tamper-evident), (b) the design (Ed25519 + JCS + hash-linked chain, why each), (c) the substrate (npm + Terraform Registry + GitHub).
- [ ] Post reviewed by Security Lead for cryptographic accuracy.
- [ ] Post published on `gtcx.io` (or partner blog).
- [ ] Submitted to HN with a non-spammy title (drafted, not yet posted).
- [ ] LinkedIn post from CEO/CTO account (drafted, not yet posted).
- [ ] First-week metrics captured: npm downloads, blog views, HN points, GitHub stars on `terraform-aws-compliance-db`.

**Test scenarios:** N/A (administrative — but the metrics-captured AC is the empirical test).

**Dependencies:** DIST-001 (something for visitors to land on).

### [DIST-004] Tracking infrastructure for distribution metrics

**Priority:** P2 | **Points:** 2 | **Assignee:** Platform Engineering

**User story:** As **the platform engineering lead**, I want **a single dashboard showing npm downloads, GitHub stars/forks, blog views, and HN engagement** so that **we have empirical data on whether the distribution strategy is working**.

**Acceptance criteria:**

- [ ] Dashboard at `gtcx.io/internal/distribution` (auth-gated).
- [ ] Pulls npm download stats via `npm-stat-api`.
- [ ] Pulls GitHub stars + forks via GitHub API.
- [ ] Pulls blog page-view counts.
- [ ] Updated daily via GitHub Actions cron.
- [ ] Captures 30-day moving averages for each metric.

**Test scenarios:**

1. First day after DIST-003 launch, dashboard shows non-zero numbers.
2. Refresh works correctly across week boundaries.

**Dependencies:** DIST-001 + DIST-003.

### Sprint 9 UAT

| Scenario               | Steps                             | Expected                              | Verified By       | Status |
| ---------------------- | --------------------------------- | ------------------------------------- | ----------------- | ------ |
| Docs site live         | Visit `gtcx.io/compliance`        | Loads <2s, WCAG AA, mobile responsive | Design Lead       | ☐      |
| Terraform Registry     | Search "compliance-db"            | Listed in top 5 results               | DevOps Lead       | ☐      |
| Blog post live         | Visit blog URL                    | Renders, all anchor links work        | Platform Eng Lead | ☐      |
| Distribution dashboard | Open dashboard 7 days post-launch | Non-zero downloads + stars + views    | Platform Eng Lead | ☐      |

### Sprint 9 risks

| Risk                                            | Impact | Probability | Mitigation                                                                                                                                |
| ----------------------------------------------- | ------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Zero adoption signal after launch               | Medium | High        | Accept it as empirical evidence; revisit strategy in retrospective. Distribution effort is the bet; we already accepted it might not work |
| Cosign or Terraform Registry rejects the module | Medium | Low         | Pre-validate against their lints before submission                                                                                        |
| HN post gets flagged as spam                    | Low    | Medium      | Use organic title; don't ask for upvotes                                                                                                  |

---

## Sprint 10 — Production Hardening Cycle

**Sprint window:** 2026-06-30 → 2026-07-13 (two weeks, after pen-test kickoff but before report)
**Sprint goal:** Close the remaining "easy to defer" hardening items so that when the pen-test report lands, the team's bandwidth is fully available for triage rather than catching up on hardening.
**Capacity:** 10 story points
**Sprint owner:** Platform Engineering Lead

### [HARD-V-001] NATS integration test in `validate.sh --full`

**Priority:** P1 | **Points:** 3 | **Assignee:** Platform Engineering

**User story:** As **a CI engineer**, I want **the validate.sh --full gate to round-trip a record through a real JetStream broker** so that **the audit-flush sidecar's success path is gated, not just trusted**.

**Acceptance criteria:**

- [ ] `validate.sh --full` adds a `nats-integration` gate.
- [ ] Gate starts a NATS container via `docker compose -f tools/audit-flush/test/docker-compose.test.yml up -d`.
- [ ] Publishes one signed record on the configured subject.
- [ ] Verifies the audit-flush sidecar consumes it and would write to a mock S3 endpoint.
- [ ] Tears down the container.
- [ ] Gate passes deterministically (5 consecutive runs).

**Test scenarios:**

1. Healthy broker → gate passes.
2. Broker started slow → gate retries up to 30s.
3. Broker unreachable → gate fails with clear error.

**Dependencies:** None.

### [HARD-V-002] Live DR restoration evidence capture

**Priority:** P1 | **Points:** 3 | **Assignee:** SRE

**User story:** As **the SRE on-call**, I want **at least one live DR restoration captured in `docs/audit/score-evidence-ledger.json`** so that **the SOC 2 CC7.4 control is evidence-backed, not just runbook-backed**.

**Acceptance criteria:**

- [ ] Run `infra/scripts/dr-test.sh staging` end-to-end with `OUTPUT_DIR=infra/security/reports/dr-evidence/2026-07-<DD>`.
- [ ] Evidence JSON captured with non-null RTO + RPO.
- [ ] Evidence linked from `docs/audit/score-evidence-ledger.json` under metric I4 → "live restoration evidence".
- [ ] Master audit footer updated to note the live evidence.

**Test scenarios:**

1. Test marker inserted, backup taken, restore validates marker.
2. RTO ≤ 5 min on staging.
3. RPO captures correct timestamp delta.

**Dependencies:** Staging DR test environment available.

### [HARD-V-003] Live on-call drill (not simulated)

**Priority:** P2 | **Points:** 2 | **Assignee:** SRE

**User story:** As **the on-call rotation lead**, I want **one live drill where a synthetic incident pages the actual on-call engineer** so that **PagerDuty + Slack + escalation paths are end-to-end verified**.

**Acceptance criteria:**

- [ ] Synthetic incident triggered via Alertmanager `for: 5m, severity: critical`.
- [ ] On-call engineer's pager fires within 60s.
- [ ] Slack channel posts the alert within 30s.
- [ ] Engineer acknowledges within 5 minutes (SLA).
- [ ] Drill captured in `docs/devops/drills/drill-003-on-call-2026-07-<DD>.md`.
- [ ] Any gaps surfaced (e.g., on-call left rotation, Slack DM not routing) get backlog tickets.

**Test scenarios:** The drill itself is the test.

**Dependencies:** PagerDuty service configured.

### [HARD-V-004] Adaptive policy: Redis-backed shared state (conditional)

**Priority:** P3 | **Points:** 2 | **Assignee:** Platform Engineering

**User story:** As **the platform engineer**, I want **adaptive policy state shared across compliance-gateway pods via Redis** so that **at >10 pods the per-pod independence doesn't cause divergent degradation modes**.

**Acceptance criteria (CONDITIONAL — only triggered if scale warrants):**

- [ ] Trigger condition: `kubectl get pods -l app=compliance-gateway -n gtcx --no-headers | wc -l` exceeds 5 sustained.
- [ ] If triggered: shared Redis-backed counters for breach windows + mode.
- [ ] If triggered: integration test against `redis:7-alpine` container.
- [ ] If trigger condition not met: story closed with "deferred — scale not yet warranted" annotation.

**Test scenarios:** Only run if triggered.

**Dependencies:** Trigger condition.

### Sprint 10 UAT

| Scenario              | Steps                      | Expected                       | Verified By  | Status |
| --------------------- | -------------------------- | ------------------------------ | ------------ | ------ |
| NATS integration gate | Run `validate.sh --full`   | `nats-integration` gate passes | DevOps       | ☐      |
| Live DR evidence      | Open score-evidence-ledger | I4 entry has 2026-07 link      | SRE Lead     | ☐      |
| Live on-call drill    | Trigger synthetic incident | Pager fires + ack ≤ 5min       | On-call Lead | ☐      |

### Sprint 10 risks

| Risk                               | Impact | Probability | Mitigation                                                     |
| ---------------------------------- | ------ | ----------- | -------------------------------------------------------------- |
| NATS test flaky in CI              | Medium | Medium      | Retry with backoff; gate only at `--full` (not `quick`)        |
| On-call drill exposes routing gaps | Medium | Medium      | This is the value of the drill — capture gaps, not punish them |
| Pen-test report arrives mid-sprint | High   | Medium      | Drop S10 stories, shift to S11 immediately                     |

---

## Sprint 11 — Pen-test Findings Triage (Triggered)

**Sprint window:** Triggered by pen-test report delivery (target ~2026-07-25); 4-week SLA from report receipt to re-test.
**Sprint goal:** Every P0/P1 from the external pen-test fixed and re-tested within 30 days. P2/P3 backlogged with target dates.
**Capacity:** Determined by report severity distribution
**Sprint owner:** Platform Engineering Lead + Security Lead

### Process (templated, populated when report lands)

1. Within 24h of report: Security Lead writes a new doc `docs/audit/pen-test-2026-07-triage.md` (schema-compliant frontmatter) — every finding mapped to a Linear `SEC-<n>` ticket with owner + target date.
2. P0: fix within 7 days, hotfix branch.
3. P1: fix within 30 days, regular sprint cadence.
4. P2: backlog with target within 90 days.
5. P3: tracked, no hard SLA.
6. Re-test arranged with vendor within 7 days of all P0/P1 fixes shipped.
7. Re-test report appended to triage doc.
8. SIGNAL scorecard regenerated based on outcomes.
9. Master audit re-issued with `audit_date: <re-test date>`.

### Sprint 11 risks

| Risk                                                       | Impact | Probability | Mitigation                                                                                  |
| ---------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------- |
| Multiple P0s requiring deep refactors                      | High   | Medium      | Budget 3 weeks of bandwidth post-report; defer S9/S10 backlog if needed                     |
| Re-test surfaces new findings                              | Medium | Medium      | Loop expected; second re-test in scope                                                      |
| Finding implicates published artifact (@gtcx/audit-signer) | High   | Low         | Cryptography vetted internally; if real, ship v0.1.1 immediately + GitHub Security Advisory |

---

## Sprint 12 — mTLS Mesh Runtime (Q3 2026)

**Sprint window:** Q3 2026 (depends on Linkerd EKS 1.31 compatibility confirmation)
**Sprint goal:** Move ADR-007 from "configs ready" to "runtime active." Every pod-to-pod call inside the GTCX namespaces traverses Linkerd mTLS by default.
**Capacity:** 13 story points
**Sprint owner:** Platform Engineering Lead

This sprint is scaffolded; full story-level detail is deferred to sprint-zero in Q3 because the dependent infrastructure (Linkerd version, EKS upgrade) needs to be confirmed first. The high-level shape:

- **MESH-001:** Install Linkerd control plane in `staging` first per the canary plan at `infra/kubernetes/overlays/staging/linkerd/canary-rollout.yaml`.
- **MESH-002:** Annotate one service (`compliance-gateway`) for sidecar injection in staging.
- **MESH-003:** Validate mesh policies enforced (deny-by-default for unannotated namespaces).
- **MESH-004:** Roll out to remaining 15 services in staging per the existing canary phases.
- **MESH-005:** After 2 weeks of stable staging, repeat for production.
- **MESH-006:** Sidecar resource consumption captured in SLO budget.

Sprint 12 will be re-detailed when its dependencies are confirmed.

---

# Cross-Sprint Concerns

## Risk Register (consolidated)

| #    | Risk                                                        | Impact | Probability | Owner                | Mitigation                                                                                                                        | Status       |
| ---- | ----------------------------------------------------------- | ------ | ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| R-01 | Pen-test surfaces a P0 in `@gtcx/audit-signer` cryptography | High   | Low         | Security Lead        | Internal red-team done; cryptographic primitives are standard (Ed25519, SHA-256, JCS); if found, npm `v0.1.1` + GHSA the same day | Tracked      |
| R-02 | npm `@gtcx/audit-signer` distribution stagnates             | Medium | High        | GTM Partner          | Accept as empirical; revisit Sprint 9 in retrospective; substrate value compounds via use, not downloads alone                    | Open         |
| R-03 | Pen-test vendor selection delays > 4 weeks                  | High   | Medium      | Security Lead        | RFP sent to 3 vendors in parallel; accept second-tier vendor rather than wait for top-tier                                        | Active in S7 |
| R-04 | SOC 2 auditor engagement collides with pen-test window      | Medium | Medium      | Security Lead        | Sequence: SOC 2 auditor selected one week after pen-test vendor                                                                   | Sequenced    |
| R-05 | Audit-flush image build blocked by AWS account access       | High   | Low         | DevOps Lead          | DevOps has prod AWS creds; image build out-of-band per security review                                                            | Active in S7 |
| R-06 | prometheus-adapter conflicts with existing metric pipeline  | Medium | Low         | Platform Engineering | Deploy to staging first; rollback via Helm uninstall                                                                              | Active in S7 |
| R-07 | Tenant onboarding exceeds 2h SLA                            | Medium | Medium      | Platform Eng Lead    | Capture friction in S8 retro; iterate runbook; do not punish                                                                      | Active in S8 |
| R-08 | Cross-tenant isolation leak surfaces in S8                  | High   | Low         | Security Engineer    | Treat as P0; block S9 launch until resolved                                                                                       | Active in S8 |
| R-09 | Multi-pod adaptive policy divergence at scale               | Medium | Low         | Platform Engineering | HARD-V-004 ready; trigger condition documented                                                                                    | Conditional  |
| R-10 | Pen-test report arrives during Sprint 10                    | High   | Medium      | Platform Eng Lead    | Sprint 10 drops to S11; backlog preserved                                                                                         | Documented   |

## Dependency Graph

```
S7 (External Engagement) ──┬─→ S8 (Tenant Validation)
                            ├─→ S9 (Distribution Edge)
                            │
                            └─→ ~30 days external clock
                                    │
                                    ↓
                                S11 (Pen-test Triage) ───┬─→ Master audit refresh
                                                          └─→ SIGNAL v3

S8 (Tenant Validation) ────→ S9 (Distribution Edge)
                          └─→ Sales-enablement evidence

S9 (Distribution Edge) ────→ Empirical adoption signal
                          └─→ Inform Sprint 12+ priorities

S10 (Production Hardening) ─→ Independent of pen-test; can run parallel

S12 (mTLS Mesh Runtime) ────→ Depends on Linkerd EKS 1.31 confirmation (out of band)
```

## Velocity Tracking

| Sprint                     | Planned | Delivered |  Velocity | Notes                                                     |
| -------------------------- | ------: | --------: | --------: | --------------------------------------------------------- |
| S1 — Audit-Signer          |      13 |        21 |      1.6× | Added durable sink + sanitization mid-sprint              |
| S2 — Defense in Depth      |      13 |        17 |      1.3× | Added cost metrics + injection suite                      |
| S3 — Operational Truth     |       8 |        12 |      1.5× | Added Renovate + mise alongside cleanup                   |
| S4 — Pen-test/SOC 2 docs   |       5 |         5 |      1.0× | On target                                                 |
| S5 — Tenant + Capacity     |      13 |        18 |      1.4× | Added per-tenant trust dashboard + soak scaffold          |
| S6 — Moat Acceleration     |       7 |         8 |      1.1× | Plus actual npm publish                                   |
| R2 — Residuals             |       5 |         5 |      1.0× | On target                                                 |
| R3 — Audit-flush           |       5 |         7 |      1.4× | Container source genuinely new                            |
| R4 — Hygiene Sweep         |       3 |         4 |      1.3× | Validator bugs surfaced + fixed                           |
| R5 — Audit Canonical       |       3 |         3 |      1.0× | On target                                                 |
| **Total Cycle 1**          |  **75** |   **100** | **1.33×** | Story-point inflation explained by mid-sprint discoveries |
| S7 — External Engagement   |       8 |         — |         — | Planned                                                   |
| S8 — Tenant Validation     |       5 |         — |         — | Planned                                                   |
| S9 — Distribution Edge     |      13 |         — |         — | Planned                                                   |
| S10 — Production Hardening |      10 |         — |         — | Planned                                                   |
| S11 — Pen-test Triage      |       ? |         — |         — | Triggered                                                 |
| S12 — mTLS Runtime         |      13 |         — |         — | Q3                                                        |

**Honest read:** Cycle 1 ran 33% over planned scope because mid-sprint discoveries (durable sink, residual hygiene, validator bugs) genuinely needed to ship. Cycle 2 plans are tighter; the visible 5/13 sprint splits are deliberate buffer.

## Sprint Cadence

- **Sprint length:** 1 week unless explicitly noted (S9, S10 are 2 weeks).
- **Sprint planning:** Monday morning, 60 minutes, virtual.
- **Sprint review + retro:** Friday afternoon, 60 minutes, virtual.
- **Daily standup:** Async via Slack channel `#gtcx-infra-standup`; written-only, 3 questions (yesterday/today/blockers).
- **Sprint zero:** First Monday of each month, capacity planning for the month.

## Exit Criteria (Cycle 2 — Program Level)

Cycle 2 closes when **all** of the following are true:

- [ ] Pen-test engagement signed (S7).
- [ ] SOC 2 Type 1 auditor engaged (S7).
- [ ] Audit-flush container image live in testnet (S7).
- [ ] HPA scaling on custom metric, verified empirically (S7).
- [ ] Second tenant onboarded end-to-end within 2h SLA (S8).
- [ ] Internal red-team for tenant isolation completed (S8).
- [ ] Public docs site live (S9).
- [ ] `terraform-aws-compliance-db` on Terraform Registry (S9).
- [ ] Pen-test P0/P1 findings all closed and re-tested (S11).
- [ ] SIGNAL scorecard v3 reflects re-test evidence.
- [ ] Master audit re-issued post-pen-test.
- [ ] Distribution dashboard shows non-zero npm + GitHub + blog metrics.
- [ ] `validate-all.mjs` continues at 17/17 throughout.

## References

- Master audit: [`docs/audit/master-audit-2026-05-17.md`](../audit/master-audit-2026-05-17.md)
- Full audit (Round 4): [`docs/audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md)
- Repo audit overlay: [`docs/audit/repo-overlay.md`](../audit/repo-overlay.md)
- SIGNAL scorecard: [`docs/audit/signal-scorecard.json`](../audit/signal-scorecard.json)
- Score evidence ledger: [`docs/audit/score-evidence-ledger.json`](../audit/score-evidence-ledger.json)
- Coverage gate rationale: [`docs/audit/coverage-gate-rationale.md`](../audit/coverage-gate-rationale.md)
- Pen-test RFP: [`docs/audit/pen-test-rfp-2026.md`](../audit/pen-test-rfp-2026.md)
- SOC 2 engagement plan: [`docs/audit/soc2-engagement-2026.md`](../audit/soc2-engagement-2026.md)
- Tenant onboarding runbook: [`docs/operations/runbooks/tenant-onboarding.md`](../operations/runbooks/tenant-onboarding.md)
- Audit-flush deployment runbook: [`docs/operations/runbooks/audit-flush-deployment.md`](../operations/runbooks/audit-flush-deployment.md)
- Ecosystem audit framework: [`gtcx-agentic/audit/SCORING_FRAMEWORK.md`](../../../gtcx-agentic/audit/SCORING_FRAMEWORK.md)
