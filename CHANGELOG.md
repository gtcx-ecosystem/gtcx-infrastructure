# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-22

The May-2026 cycle. Six original sprints (audit signer, defense in depth, operational truth, pen-test/SOC2 docs, tenant + capacity, moat acceleration) + five hygiene rounds + one internal-completion cycle (Cycle 2.5). The audit substrate moves from "claimed tamper-evident" to "externally verifiable by anyone with `npm install @gtcx/audit-signer`."

### Published

- **`@gtcx/audit-signer@0.1.0` to npm** — Ed25519-signed, hash-linked audit chain. Zero runtime dependencies. Third-party verifiable offline. 34 unit tests. MIT licensed.

### Added — Audit Substrate

- **Fail-closed audit signing in production** (`03-platform/tools/compliance-gateway/03-platform/src/audit.mjs`, `server.mjs`) — gateway exits EX_CONFIG 78 if `AUDIT_SIGNING_KEY_B64` is missing or invalid in production; `/health` reports 503 when signing is disabled.
- **NATS JetStream audit transport** with per-tenant subject routing (`gtcx.audit.<service>.<tenantId>`). See ADR-014 and ADR-015.
- **Audit-flush sidecar** (`03-platform/tools/audit-flush/`) — consumes JetStream subjects, verifies chain integrity, writes batched NDJSON to WORM S3. Quarantines tampered batches under `_quarantine/` prefix. Includes Dockerfile, IRSA module, deployment runbook, integration test against dockerized NATS broker.
- **Bounded in-memory chain** with checkpoint hash (`AUDIT_CHAIN_MAX_RECORDS` default 10K).
- **Audit chain verification endpoints** — `GET /v1/audit/chain`, `POST /v1/audit/verify`, `GET /v1/audit/evidence-bundle` (signed bundle export for external auditors).
- **Audit-flush IRSA Terraform module** (`04-ship/terraform/modules/audit-flush-irsa/`) wired into testnet-pilot, staging, production environments.
- **Kustomize overlay patches** for audit-flush in staging + production with per-env image, role ARN, bucket name.
- **Trust telemetry dashboards** (`04-ship/monitoring/dashboards/audit-trust.json`, `audit-trust-tenant.json`).

### Added — Multi-Tenancy + Capacity

- **Tenant-scoped principal + audit events** (`03-platform/tools/compliance-gateway/03-platform/src/auth.mjs`) with per-tenant budget overrides.
- **HorizontalPodAutoscaler** for compliance-gateway (1→8 pods) scaling on `compliance_gateway_inflight_requests` custom metric.
- **k6 soak test scaffold** (`03-platform/tools/load-tests/compliance-gateway-soak.js`) — 4-hour two-tenant scenarios; mandatory `validate.sh --full` gate.
- **Tenant onboarding runbook** (`01-docs/04-ops/runbooks/tenant-onboarding.md`) with 2-hour SLA.
- **Per-tenant trust dashboard** (`04-ship/monitoring/dashboards/audit-trust-tenant.json`).
- **Pen-test contained-blast-radius overlay** (`04-ship/kubernetes/overlays/pen-test/`).

### Added — Defense in Depth

- **Zod schema for `/v1/query`** (`03-platform/tools/compliance-gateway/03-platform/src/schemas.mjs`) — 4096-char query cap, jurisdiction enum from canonical catalog, 16KB context envelope.
- **Delimited untrusted-context block** in user message + system-prompt instruction to treat the block as data.
- **Per-principal token budget + QPS limiter** (`03-platform/tools/compliance-gateway/03-platform/src/budget.mjs`).
- **Prompt-injection red-team suite** (`03-platform/tools/eval-pipeline/injection-suite.mjs`) — 10 payloads.
- **`sanitizeAuditTarget`** (`03-platform/tools/compliance-gateway/03-platform/src/audit-target.mjs`) — strips query strings + fragments + caps at 200 chars before signing.
- **Audit signing key required via fail-fast** in `04-ship/03-platform/scripts/dr-test.sh` and CI workflow.

### Added — Adaptive Resilience

- **Adaptive policy tuner** (`03-platform/tools/compliance-gateway/03-platform/src/adaptive-policy.mjs`) — feedback-driven degradation mode based on observed latency + error rate. Emits signed `resilience.policy.adaptation` audit on every transition.
- **Pluggable adaptive policy store** (`03-platform/tools/compliance-gateway/03-platform/src/adaptive-policy-store.mjs`) — memory backend (default) + Redis backend (feature-flagged via `GTCX_ADAPTIVE_STORE_BACKEND=redis`) with race-safe transitions via WATCH/MULTI/EXEC.

### Added — Distribution

- **Public docs site source** (`01-docs/external/docs-site/`) — markdown source for `gtcx.trade/compliance` covering all three primitives.
- **Launch announcement blog post draft** (`01-docs/external/blog/audit-signer-launch-2026-05.md`).
- **Terraform Registry submission package** (`01-docs/external/terraform-registry-submission-2026.md`) for `terraform-aws-compliance-db`.
- **Distribution metrics scaffold** (`03-platform/tools/03-platform/scripts/distribution-snapshot.mjs`) with daily GitHub Actions cron.
- **`@gtcx/compliance-gateway-mcp`** — Model Context Protocol server for agent-discoverable read-only access (`03-platform/tools/compliance-gateway-mcp/`).

### Added — Compliance Documentation

- **GDPR Art. 35 / CCPA DPIA** (`01-docs/10-compliance/dpia-2026-05.md`).
- **SOC 2 Type 1 evidence inventory** (`01-docs/10-compliance/soc2-evidence-inventory-2026-05.md`) — per-control file:line mapping.
- **Pen-test RFP** (`01-docs/05-audit/pen-test-rfp-2026.md`) and SOC 2 engagement plan (`01-docs/05-audit/soc2-engagement-2026.md`) — engagement-ready.

### Added — Audit Methodology

- **Repo audit overlay** (`01-docs/05-audit/repo-overlay.md`) per `gtcx-agentic/audit/REPO_OVERLAY_TEMPLATE.md` codifying repo-specific stricter caps.
- **Full audit doc** (`01-docs/05-audit/full-audit-2026-05-22.md`) — Round-4 forensic re-audit.
- **SIGNAL scorecard v2** at 9.60/10 (`01-docs/05-audit/signal-scorecard.json`).
- **Coverage gate rationale** (`01-docs/05-audit/coverage-gate-rationale.md`).

### Added — ADRs

- ADR-014 — NATS JetStream as the Audit Record Transport
- ADR-015 — Per-Tenant JetStream Subject Routing
- ADR-016 — Fail-Closed Audit Signing in Production
- ADR-017 — Adaptive Policy Tuning with Signed Transitions

### Changed

- **Validators are cwd-independent.** `03-platform/tools/03-platform/scripts/docs-standard-validator.mjs` + `03-platform/tools/03-platform/scripts/docs-link-checker.mjs` + `03-platform/tools/03-platform/scripts/validate-all.mjs` resolve REPO_ROOT from script location instead of `process.cwd()`.
- **`validate-all.mjs` covers 10 packages** (up from 5); bumped execSync `maxBuffer` to 32MB to avoid ENOBUFS on large test output.
- **Coverage gate documented per-package.** `@gtcx/compliance-gateway` gates at branches=85/functions=85 (statements + lines remain 90) per `01-docs/05-audit/coverage-gate-rationale.md`; all other packages remain at 90 across all four metrics.
- **Workspace consumes `@gtcx/compliance-data` by package name** (replaces deep relative imports in `system-prompt.mjs` and `schemas.mjs`).
- **Pre-existing roadmap consolidated** into `01-docs/05-audit/agile/execution-roadmap-2026-05-22.md` with full Cycle 1 retro + Cycle 2 forward sprints + Cycle 2.5 internal completion.

### Fixed

- HPA `compliance_gateway_inflight_requests` gauge now emitted (was referenced by HPA but never set).
- `auth:failure` and `auth:success` audit events now write a sanitized `target` (strips query string + fragments + caps at 200 chars).

### Removed

- Stale `/adr/` directory (its README contradicted `01-docs/decisions/`).
- Dev-credential default-fallback values in `dr-test.sh` (`POSTGRES_PASSWORD:-gtcx_dev_password` and audit equivalent).

### Test totals

- 732 tests across 10 active workspace packages, all green
- 17/17 `validate-all.mjs` gates pass
- 782 internal links across 384 markdown files, all resolve
- SIGNAL CI gate: 9.60/10

## [Unreleased]

### Added

- Terraform native tests for 12/14 modules (.tftest.hcl)
- Intelligence namespace Prometheus scrape config and 8 alerting rules
- compliance-db module: reusable dual-database for African fintech (7 jurisdictions)
- Detective controls module: CloudTrail + GuardDuty + SNS
- Compliance module: AWS Config recorder + 7 managed rules
- WAFv2 in ALB module: OWASP Core Rule Set + SQLi + IP rate limiting
- VPC endpoints: S3, ECR API/DKR, CloudWatch Logs, STS
- cert-manager with NATS TLS (self-signed ClusterIssuer, auto-rotation)
- metrics-server for HPA autoscaling
- EBS CSI driver with IRSA
- build-push.sh: container image build and ECR push script
- K8s hardening: rolling update strategy, startup probes, seccompProfile, security contexts on all deployments
- SLO recording rules with per-service latency compliance ratios
- Alertmanager escalation (critical repeat_interval: 15m)
- NATS account-based authentication (5 accounts with scoped publish/subscribe)
- Foreign key constraints on protocol tables
- SQL injection fix in migrate.sh (parameterized queries)
- CI docs-links job checking for stale references
- CONTRIBUTING.md
- Testnet-pilot environment deployed to af-south-1

### Changed

- EKS cluster version 1.29 → 1.30
- Loki retention 90 days → 365 days
- Lambda backup timeout 60s → 300s
- Dockerfile.protocols: frozen-lockfile → no-frozen-lockfile (crypto-native workspace exclusion)
- Dockerfile.platforms: CMD JSON form → shell form (env var expansion)
- DynamoDB lock tables now per-environment
- NATS config: removed cluster block for single-node, added TLS block
- StorageClass gp3 → gp2 (EBS CSI compatibility)

### Removed

- edge-proxy placeholder module (empty, no implementation)
- Stale \_sop/ path references (27+ files updated to 01-docs/)

## [0.1.0] - 2026-03-20

### Added

- Terraform modules: VPC, Database, EKS, ECR, Secrets, Event-Bus
- K8s base manifests: API, Crypto, Protocols, Intelligence, NATS, Monitoring
- K8s overlays: development, staging, production, testnet
- Docker Compose: dev (20 services), infra (9 services), test (10 services)
- Database init scripts: 31 operational tables, 1 audit table
- Zimbabwe pilot environment (af-south-1)
- Monitoring: Prometheus, Grafana, Loki, Jaeger
- Security: network policies, pod security standards
- Deployment runbook, secrets management docs
- 11 Architecture Decision Records
