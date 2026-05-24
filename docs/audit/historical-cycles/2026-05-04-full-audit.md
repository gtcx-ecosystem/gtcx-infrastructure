---
title: 'GTCX Infrastructure — Full Codebase Audit'
status: 'current'
date: '2026-05-04'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
---

# GTCX Infrastructure — Full Codebase Audit

**Date:** 2026-05-04
**Repo:** gtcx-infrastructure
**Commit:** a92b7fc (pre-remediation baseline)

---

## PHASE 1: ARCHITECTURE AUDIT

### Scorecard

| Dimension             | Rating | Top Issue                                                                                              |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Spec Fidelity         | 7/10   | Policy docs describe controls not implemented in IaC (TLS enforcement, MFA, network policies)          |
| Structural Integrity  | 8/10   | Clean module boundaries; secrets module IRSA service account hardcoded (`secrets/intelligence.tf:201`) |
| Code Quality          | 7/10   | Good Terraform patterns; `deploy.sh:282` deployment name truncation is fragile                         |
| Testability           | 5/10   | No unit tests; validation relies entirely on CI `iac-validation` job                                   |
| Operational Readiness | 7/10   | Comprehensive observability stack; alert thresholds uncalibrated; SLO definitions incomplete           |
| Consistency           | 6/10   | 6+ docs reference old `docs/` paths; `.baseline/config.json` still references `4-infrastructure`       |

### Key Findings

**[Critical] [Spec Fidelity] — EKS Public API Endpoint Exposed**

- `infra/terraform/environments/zimbabwe-pilot/terraform.tfvars`: `enable_public_api = true` with `admin_cidr_blocks = []`
- Same in `testnet-pilot/terraform.tfvars`
- EKS precondition (`eks/main.tf:321`) only triggers at apply time, not plan
- Impact: Kubernetes API server is publicly reachable with zero IP restrictions
- **Status: REMEDIATED in Sprint 1** — `enable_public_api = false`

**[Critical] [Structural Integrity] — Secrets Management Has Three Sources of Truth**

- Kubernetes Secrets (placeholder literals in `kustomization.yaml:40-45`)
- AWS Secrets Manager (via `init-secrets.sh`)
- External Secrets Operator (via `secrets/intelligence.tf`)
- No single canonical path; operators must know which mechanism applies where
- **Status: PARTIALLY REMEDIATED in Sprint 1** — placeholder literals replaced with non-functional stubs, ESO documented as canonical path

**[High] [Code Quality] — Deploy Script Name Truncation**

- `infra/scripts/deploy.sh:282`: `deployment/gtcx-agx-${ENVIRONMENT:0:4}` truncates "production" to "prod", "development" to "deve"
- Will fail if actual K8s deployment names don't match this convention
- **Status: OPEN** — Sprint 2

**[High] [Consistency] — Repo Rename Incomplete**

- `.baseline/config.json:4` still references `4-infrastructure`
- 6+ doc files reference old `docs/` paths
- GitHub clone URLs in docs point to `github.com/gtcx/` instead of `github.com/gtcx-ecosystem/`
- **Status: OPEN** — Sprint 3

**[Medium] [Testability] — No Infrastructure Tests**

- Zero Terraform module tests (no Terratest, no `tftest`)
- Docker Compose validation is config-only (no integration tests)
- Kustomize build checks structure but not semantic correctness
- **Status: OPEN** — Sprint 5

**[Medium] [Operational Readiness] — SLO Definitions Missing Latency**

- `infra/monitoring/rules/slo-recording-rules.yml`: Availability SLOs only count HTTP status codes
- No latency SLO violations tracked (200-OK but >2s = success in current recording rules)
- **Status: OPEN** — Sprint 2

---

## PHASE 2: SECURITY AUDIT

### Authentication & Authorization

| Control               | Status              | Evidence                                                                              |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| AWS IAM — OIDC for CI | Implemented         | `ci/main.tf` — GitHub Actions OIDC, branch-restricted                                 |
| IRSA for pods         | Implemented         | `eks/main.tf` — OIDC provider created; `kyc-documents/irsa.tf` — role bindings        |
| NATS authentication   | **Not implemented** | `nats.conf` — no accounts, users, or TLS configured                                   |
| K8s RBAC              | Partially           | ServiceAccounts created, but no ClusterRole/RoleBinding manifests                     |
| MFA enforcement       | **Not implemented** | Policy claims MFA required (`access-control.md:19`); zero IaC enforcement             |
| Network policies      | Partially           | Monitoring namespace has policies (`monitoring.yaml:608-691`); app services have none |

**[Critical] NATS Event Bus Has No Authentication** — `infra/docker/nats/nats.conf`: Any pod in the cluster can publish to any subject. No TLS, no accounts, no authorization. Financial trade events flow through this bus.

- **Status: REMEDIATED in Sprint 1** — Account-based auth with per-service publish/subscribe permissions added

**[Critical] EKS Public API — No CIDR Restrictions** — Both pilot environments expose the Kubernetes API publicly with empty `admin_cidr_blocks`.

- **Status: REMEDIATED in Sprint 1** — `enable_public_api = false`

### Data Protection

| Control                | Status        | Evidence                                                                             |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------ |
| RDS encryption at rest | Implemented   | `database/main.tf:139` — `storage_encrypted = true` + KMS                            |
| S3 encryption          | Implemented   | All buckets use KMS (`backup/main.tf:28`, `kyc-documents/main.tf:45`)                |
| EKS secrets encryption | Implemented   | `eks/main.tf` — KMS key for etcd secrets                                             |
| ECR image encryption   | Implemented   | `ecr/main.tf:22` — KMS with auto-rotation                                            |
| TLS in transit         | **Partially** | DB parameter group enforces SSL (`database/main.tf`); ALB has no TLS minimum version |
| Audit DB isolation     | Implemented   | Separate RDS instance, extended retention, deletion protection always true           |

**[High] ALB Missing TLS Enforcement** — `alb/main.tf` creates ACM certificate but no listener policy enforcing TLS 1.2+. No WAF integration.

- **Status: OPEN** — Sprint 2

### Input Validation & Injection

**[Medium] SQL Injection Risk in migrate.sh** — `infra/scripts/migrate.sh:176-178`: Filename interpolated into SQL query. Even with quote escaping, special characters could break the query. Should use psql parameterized variables.

- **Status: OPEN** — Sprint 3

### Dependency Security

| Check                   | Status      | Evidence                                                                    |
| ----------------------- | ----------- | --------------------------------------------------------------------------- |
| Trivy filesystem scan   | Implemented | `.github/workflows/ci.yml:110-128`                                          |
| SBOM generation         | Implemented | CycloneDX via Trivy, 365-day artifact retention                             |
| Image scan on push      | Implemented | `ecr/main.tf` — `image_scanning_configuration`                              |
| Dependabot              | Configured  | `.github/dependabot.yml`                                                    |
| pnpm overrides for CVEs | Implemented | `package.json:44-49` — minimatch, flatted, picomatch, brace-expansion, yaml |

### Infrastructure Security

**[High] No CloudTrail, GuardDuty, or AWS Config** — Zero detective controls in Terraform. No automated compliance validation. No unauthorized access alerting.

- **Status: OPEN** — Sprint 2

**[High] Backup Lambda Timeout** — `backup/main.tf:114`: 60-second timeout for RDS snapshot export that takes 2-5 minutes. Exports will fail silently.

- **Status: REMEDIATED in Sprint 1** — timeout increased to 300s

**[Medium] Shared Terraform Lock Table** — Both `testnet-pilot` and `zimbabwe-pilot` use `gtcx-terraform-locks`. Concurrent operations will deadlock.

- **Status: REMEDIATED in Sprint 1** — per-environment lock tables

### Compliance Posture

| Framework     | Status      | Gap                                                                           |
| ------------- | ----------- | ----------------------------------------------------------------------------- |
| NIST 800-53   | Documented  | `docs/security/nist-800-53-mapping.md` exists; ~60% of controls mapped to IaC |
| SOC 2 Type II | Partially   | Encryption yes; access control and monitoring incomplete                      |
| FATF (KYC)    | Implemented | 5-year retention, KMS encryption, presigned URLs                              |
| GDPR          | Partially   | Data residency configured; no right-to-erasure or portability mechanism       |
| ISO 27001     | Documented  | Policies exist; no audit/review cycle in IaC                                  |

---

## PHASE 3: GTM READINESS

### Stage Assessment

| Stage            | Dimension   | Status    | Evidence                                                       |
| ---------------- | ----------- | --------- | -------------------------------------------------------------- |
| **S0 Prototype** | Technical   | Ready     | Working Docker Compose dev stack, 4 Dockerfiles, K8s manifests |
|                  | Commercial  | Ready     | Zimbabwe pilot target defined, af-south-1 region configured    |
|                  | Trust       | Partially | Security policies documented; gaps in enforcement              |
|                  | Operational | Ready     | Deploy scripts, migration tooling, seed data                   |
|                  | AI-Specific | N/A       | Infrastructure repo; AI services run on top                    |
| **S1 Alpha**     | Technical   | Ready     | Terraform modules for full AWS stack, Kustomize overlays       |
|                  | Commercial  | Partially | No customer-facing SLA definitions                             |
|                  | Trust       | Partially | Encryption strong; detective controls absent                   |
|                  | Operational | Partially | Alerting defined but thresholds uncalibrated                   |
|                  | AI-Specific | N/A       |                                                                |
| **S2 Beta**      | Technical   | Partially | Missing: Terratest, load testing, chaos testing                |
|                  | Commercial  | Not Ready | No pricing infrastructure, no usage metering                   |
|                  | Trust       | Not Ready | No SOC 2 audit scheduled, no penetration test                  |
|                  | Operational | Not Ready | No incident response automation, no runbook testing            |
|                  | AI-Specific | N/A       |                                                                |
| **S3 GA**        | All         | Not Ready | —                                                              |

**Current GTM Stage: S1 Alpha** — Infrastructure is architecturally sound for a controlled pilot with known users. Not ready for multi-tenant production.

**First Realistic Deal (Next 90 Days):** Zimbabwe pilot with ZWCMP — single-tenant deployment on af-south-1 with manual operations.

### Top 5 Stage Gate Blockers

1. **EKS public API exposure** — must be locked down before any pilot data flows (REMEDIATED)
2. **No detective controls** (CloudTrail, GuardDuty) — cannot detect breaches
3. **NATS has no auth** — event bus is wide open (REMEDIATED)
4. **Alert thresholds uncalibrated** — SLOs exist on paper, not measured
5. **Secrets management fragmented** — three sources of truth, manual initialization (PARTIALLY REMEDIATED)

### Competitive Reality (90-Day Copy Test)

The infrastructure itself is standard AWS architecture — VPC, EKS, RDS, ECR. Any competent DevOps team replicates this in 2-4 weeks. The defensibility lies in:

- **Dual-database architecture** (operational + append-only audit) — principled, but not unique
- **Zimbabwe-specific data residency** (af-south-1 deployment) — geographic specificity is harder to copy
- **FATF-compliant KYC document storage** — compliance domain knowledge embedded in IaC

**Honest assessment:** The infrastructure is a commodity. The moat is in the protocols and intelligence layers that run on top of it — unless we package the compliance-ready dual-database module as open-source infrastructure for African fintech (see Sprint 6, Phase 6).

---

## PHASE 4: HYGIENE AUDIT

| Category          | Score /10 | Issues                                                                                                                        |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Documentation     | 7         | 167 MD files, comprehensive coverage; 6+ stale path references to old `docs/` structure                                       |
| File Structure    | 6         | Clean `infra/` layout; 4.8MB `_delete/` directory needs removal; `edge-proxy/` is empty placeholder                           |
| Naming            | 8         | Consistent `gtcx-*` naming in K8s, Terraform, Docker; ADR numbering sequential                                                |
| Package/Build     | 9         | pnpm workspaces + Turborepo correctly configured; lint-staged + husky; CVE overrides current                                  |
| Code Hygiene      | 7         | Terraform modules well-structured; `deploy.sh` has fragile string parsing; `Dockerfile.protocols` uses `--no-frozen-lockfile` |
| Test Hygiene      | 3         | Zero tests. Validation is CI-only (terraform validate, kustomize build, docker compose config)                                |
| CI/CD             | 8         | Three-job pipeline (ci, iac-validation, security); OIDC auth; Trivy + SBOM; missing: runner version pinning                   |
| Dependency Health | 8         | Dependabot configured; CVE overrides in package.json; Trivy scanning; image tags partially pinned                             |
| Git Hygiene       | 8         | Conventional commits; CODEOWNERS; clean branch; husky pre-commit                                                              |
| Monorepo          | 7         | 4 pnpm workspaces defined but appear to have no build tasks; Turborepo configured with zero workspace tasks                   |

### Critical Hygiene Items

- `_delete/` directory — 4.8MB of archived/stale content. Should be removed entirely.
- `.baseline/config.json` — References old project root `4-infrastructure`
- `Dockerfile.protocols:34` — `--no-frozen-lockfile` breaks reproducibility
- Docker image tags — Monitoring stack pinned (`prometheus:v2.48.0`, `grafana:10.2.2`); application images used `:latest` in kustomization (REMEDIATED — now `v0.1.0`)
- `infra/edge-proxy/` — Empty directory with placeholder README
- `.gitignore` — Comprehensive, covers terraform state, node_modules, env files
- `SECURITY.md` — Vulnerability reporting policy present
- `CHANGELOG.md` — Unreleased section maintained

---

## PHASE 5: PRODUCTION READINESS

| Area                  | Rating       | Evidence                                                                                                                                                                                                                                                            |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deployment**        | Mostly Ready | Canary deployment in `deploy.sh`; rollback via `kubectl rollout undo`; approval-gated for production. **Gap:** No automated rollback on health check failure; deployment name truncation bug.                                                                       |
| **Monitoring**        | Mostly Ready | Prometheus + Loki + Jaeger + Grafana; SLO recording rules defined; alert routing stratified (critical -> PagerDuty, low -> Slack). **Gap:** Thresholds uncalibrated; SLOs missing latency dimension; Prometheus K8s service discovery not configured in dev config. |
| **Incident Response** | Gaps         | Policies documented (`incident-response.md`); MTTD <24h / MTTR <4h targets. **Gap:** No CloudWatch alarms for security events; no automated response; no escalation hierarchy in Alertmanager; no tested runbooks.                                                  |
| **Disaster Recovery** | Gaps         | Backup module exports snapshots to S3 monthly; Glacier after 90 days; 7-year retention. **Gap:** Lambda timeout too short (REMEDIATED); no documented RTO/RPO; `dr-test.sh` exists but no evidence of execution; no cross-region replication.                       |
| **Capacity**          | Mostly Ready | HPA defined for all services (CPU-based); PDB with minAvailable:1; node group autoscaling 1-5 nodes. **Gap:** No load testing evidence; no memory-based HPA; NATS single replica.                                                                                   |
| **Dependencies**      | Gaps         | External: AWS (EKS, RDS, ECR, S3, KMS, Secrets Manager). **Gap:** No circuit breakers; no health checks for external dependencies; NATS single point of failure.                                                                                                    |

---

## PHASE 6: SPRINT PLAN (SYNTHESIS)

### 6.1 Intelligence Synthesis

| #   | Finding                                                    | Source  | Severity | Status                   |
| --- | ---------------------------------------------------------- | ------- | -------- | ------------------------ |
| 1   | EKS public API exposed (empty CIDR blocks)                 | Phase 2 | Critical | **REMEDIATED**           |
| 2   | NATS event bus has no authentication or TLS                | Phase 2 | Critical | **REMEDIATED**           |
| 3   | Secrets management — 3 sources of truth                    | Phase 1 | Critical | **Partially remediated** |
| 4   | Docker images use `:latest` in kustomization               | Phase 1 | High     | **REMEDIATED**           |
| 5   | No detective controls (CloudTrail, GuardDuty)              | Phase 2 | High     | Open                     |
| 6   | ALB missing TLS 1.2+ enforcement                           | Phase 2 | High     | Open                     |
| 7   | Backup Lambda timeout 60s (needs 300s)                     | Phase 5 | High     | **REMEDIATED**           |
| 8   | Secrets IRSA service account namespace mismatch            | Phase 1 | High     | **REMEDIATED**           |
| 9   | deploy.sh deployment name truncation bug                   | Phase 1 | High     | Open                     |
| 10  | SLO recording rules missing latency dimension              | Phase 5 | High     | Open                     |
| 11  | Shared DynamoDB lock table across environments             | Phase 2 | Medium   | **REMEDIATED**           |
| 12  | Alert thresholds uncalibrated                              | Phase 5 | Medium   | Open                     |
| 13  | Dockerfile.protocols uses --no-frozen-lockfile             | Phase 4 | Medium   | Open                     |
| 14  | migrate.sh SQL injection risk                              | Phase 2 | Medium   | Open                     |
| 15  | `_delete/` directory — 4.8MB dead weight                   | Phase 4 | Medium   | Open                     |
| 16  | 6+ docs reference old `docs/` paths                        | Phase 4 | Medium   | Open                     |
| 17  | `.baseline/config.json` references old project name        | Phase 4 | Medium   | Open                     |
| 18  | No infrastructure tests (Terratest, etc.)                  | Phase 1 | Medium   | Open                     |
| 19  | NATS single replica (no HA)                                | Phase 5 | Medium   | Open                     |
| 20  | Monitoring NetworkPolicy hardcoded to production namespace | Phase 1 | Medium   | Open                     |
| 21  | Missing FK constraints on protocol tables                  | Phase 1 | Low      | Open                     |
| 22  | Loki 90-day retention may be insufficient for compliance   | Phase 5 | Low      | Open                     |
| 23  | Database master secret ARN not output from Terraform       | Phase 2 | Low      | Open                     |
| 24  | No WAF integration on ALB                                  | Phase 2 | Low      | Open                     |
| 25  | edge-proxy/ is empty placeholder                           | Phase 4 | Low      | Open                     |

### 6.2 Innovation Scan

**Refactoring opportunities:**

- Consolidate secrets management into a single path: AWS Secrets Manager -> External Secrets Operator -> K8s Secrets. Remove placeholder literals from kustomization.yaml entirely. (PARTIALLY DONE)
- Extract deploy.sh into a proper deployment controller (Go/TypeScript CLI) with structured logging, proper error types, and testable functions.

**Moat opportunities:**

- The dual-database architecture (operational + append-only audit) is principled but not codified as a reusable Terraform module other ecosystems could adopt. Packaging this as an open-source "compliance-ready database module" with built-in audit separation, FATF retention, and encryption would create distribution value.
- ZWCMP-specific compliance automation — pre-configured Terraform modules for African regulatory jurisdictions (af-south-1 data residency, FATF KYC, ZWCMP reporting) create geographic specificity that US/EU-focused competitors won't build.

**AI-native opportunities:**

- Infrastructure is the wrong layer for AI-native patterns — the moat here is reliability, not intelligence. However: an AI-powered incident response system that correlates Prometheus alerts + Loki logs + deployment events to auto-generate incident timelines would be genuinely useful and hard to replicate without domain-specific training data.

### 6.3 Sprint Architecture

---

#### Sprint 1: Lock Down (1 week) — COMPLETED 2026-05-04

Layer mix: Remediation: 6 | Evolution: 1 | Innovation: 0

**Tasks completed:**

| #   | Task                                                      | Files                                                                 | Status |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| 1.1 | Disable EKS public API in both pilot tfvars               | `zimbabwe-pilot/terraform.tfvars`, `testnet-pilot/terraform.tfvars`   | Done   |
| 1.2 | Add NATS account-based auth with per-service permissions  | `nats/nats.conf`, `docker-compose.dev.yml`, `.env.example`            | Done   |
| 1.3 | Pin Docker images to v0.1.0 floor (replace :latest)       | `kustomization.yaml`                                                  | Done   |
| 1.4 | Fix backup Lambda timeout 60s -> 300s                     | `backup/main.tf`                                                      | Done   |
| 1.5 | Parameterize secrets IRSA service account                 | `secrets/intelligence.tf`, `secrets/variables.tf`                     | Done   |
| 1.6 | Split DynamoDB lock table per environment                 | `zimbabwe-pilot/main.tf`, `testnet-pilot/main.tf`, `bootstrap-aws.sh` | Done   |
| 1.7 | Consolidate secrets to ESO path, remove fake postgres URL | `kustomization.yaml`                                                  | Done   |

---

#### Sprint 2: Detect & Respond (1 week)

Layer mix: Remediation: 3 | Evolution: 3 | Innovation: 0

**Goals:** Build detective controls and fix operational blind spots.

| #   | Task                                         | Layer       | Files                                                    | Effort |
| --- | -------------------------------------------- | ----------- | -------------------------------------------------------- | ------ |
| 2.1 | Add ALB TLS 1.2+ enforcement                 | Remediation | `infra/terraform/modules/alb/main.tf`                    | 2h     |
| 2.2 | Fix deploy.sh deployment name resolution     | Remediation | `infra/scripts/deploy.sh:282-283`                        | 1h     |
| 2.3 | Fix Dockerfile.protocols frozen lockfile     | Remediation | `infra/docker/Dockerfile.protocols:34`                   | 15m    |
| 2.4 | Add CloudTrail + GuardDuty Terraform module  | Evolution   | New `infra/terraform/modules/detective/main.tf`          | 4h     |
| 2.5 | Add latency dimension to SLO recording rules | Evolution   | `infra/monitoring/rules/slo-recording-rules.yml`         | 2h     |
| 2.6 | Move monitoring NetworkPolicies to overlays  | Evolution   | `infra/kubernetes/base/services/monitoring.yaml:608-691` | 2h     |

---

#### Sprint 3: Hygiene & Trust (1 week)

Layer mix: Remediation: 2 | Evolution: 4 | Innovation: 0

**Goals:** Clean up technical debt and establish operational trust.

| #   | Task                                       | Layer       | Files                                                                                              | Effort |
| --- | ------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------- | ------ |
| 3.1 | Delete `_delete/` directory                | Remediation | `_delete/` (4.8MB)                                                                                 | 15m    |
| 3.2 | Fix `.baseline/config.json` project root   | Remediation | `.baseline/config.json:4`                                                                          | 5m     |
| 3.3 | Update all `docs/` path references in docs | Evolution   | 6+ files in `docs/agents/`, `docs/devops/`                                                         | 2h     |
| 3.4 | Fix GitHub clone URLs in docs              | Evolution   | `docs/agents/onboarding/developer-quickstart.md`, `docs/devops/environments/environment-config.md` | 30m    |
| 3.5 | Add Alertmanager escalation policy         | Evolution   | `infra/docker/observability/alertmanager.yml`                                                      | 2h     |
| 3.6 | Add FK constraints to protocol tables      | Evolution   | `infra/docker/init-scripts/postgres/02-protocol-tables.sql`                                        | 2h     |
| 3.7 | Fix migrate.sh SQL injection risk          | Remediation | `infra/scripts/migrate.sh:176-178`                                                                 | 1h     |

---

#### Sprint 4: Resilience (1 week)

Layer mix: Remediation: 0 | Evolution: 4 | Innovation: 1

**Goals:** Harden for pilot production workloads.

| #   | Task                                                 | Layer      | Files                                                     | Effort |
| --- | ---------------------------------------------------- | ---------- | --------------------------------------------------------- | ------ |
| 4.1 | Scale NATS to 3 replicas in production overlay       | Evolution  | `infra/kubernetes/overlays/production/`, event-bus module | 3h     |
| 4.2 | Add Terraform outputs for database secret ARNs       | Evolution  | `infra/terraform/modules/database/main.tf`                | 30m    |
| 4.3 | Increase Loki retention to 365 days                  | Evolution  | `infra/docker/observability/loki.yml:70`                  | 15m    |
| 4.4 | Add Pod Security Standards to namespaces             | Evolution  | `infra/kubernetes/base/namespace.yaml`                    | 2h     |
| 4.5 | Create deployment controller CLI (replace deploy.sh) | Innovation | New `tools/scripts/deploy/` TypeScript project            | 8h     |

---

#### Sprint 5: Verify (1 week)

Layer mix: Remediation: 0 | Evolution: 2 | Innovation: 2

**Goals:** Add verification and testing infrastructure.

| #   | Task                                          | Layer      | Files                                                      | Effort |
| --- | --------------------------------------------- | ---------- | ---------------------------------------------------------- | ------ |
| 5.1 | Add Terratest for VPC and Database modules    | Innovation | New `vpc/vpc_test.go`, `database/database_test.go`         | 6h     |
| 5.2 | Add CI link checker for documentation         | Evolution  | `.github/workflows/ci.yml`                                 | 2h     |
| 5.3 | Calibrate alert thresholds from pilot traffic | Evolution  | `infra/monitoring/alerts/*.yml`, `slo-recording-rules.yml` | 4h     |
| 5.4 | Add VPC endpoints for S3/ECR/CloudWatch       | Innovation | `infra/terraform/modules/vpc/main.tf`                      | 3h     |

---

#### Sprint 6: Compliance & Moat (1 week)

Layer mix: Remediation: 0 | Evolution: 1 | Innovation: 3

**Goals:** Close compliance gaps and build geographic defensibility.

| #   | Task                                                 | Layer      | Files                                                   | Effort |
| --- | ---------------------------------------------------- | ---------- | ------------------------------------------------------- | ------ |
| 6.1 | Add AWS Config rules for compliance validation       | Innovation | New `infra/terraform/modules/compliance/main.tf`        | 4h     |
| 6.2 | Document and test DR procedure with actual RTO/RPO   | Innovation | `infra/scripts/dr-test.sh`, new DR runbook              | 4h     |
| 6.3 | Package dual-database module as reusable open-source | Innovation | Extract from `database/` + `backup/` + `kyc-documents/` | 4h     |
| 6.4 | Add WAF to ALB module                                | Evolution  | `infra/terraform/modules/alb/main.tf`                   | 3h     |

---

### 6.4 Roadmap Visualization

| Dimension             | Before | After S1 | After S2 | After S3 | After S4 | After S5 | After S6 |
| --------------------- | ------ | -------- | -------- | -------- | -------- | -------- | -------- |
| Security              | 5/10   | 7/10     | 8/10     | 8/10     | 9/10     | 9/10     | 9/10     |
| Operational Readiness | 6/10   | 6/10     | 7/10     | 8/10     | 9/10     | 9/10     | 10/10    |
| GTM Stage             | S1     | S1       | S1+      | S2       | S2       | S2+      | S3       |
| Developer Experience  | 6/10   | 6/10     | 7/10     | 8/10     | 8/10     | 9/10     | 9/10     |
| Competitive Moat      | 3/10   | 3/10     | 3/10     | 3/10     | 4/10     | 4/10     | 6/10     |
| AI Maturity           | N/A    | N/A      | N/A      | N/A      | N/A      | N/A      | N/A      |

### 6.5 Meta-Learning

**What this codebase teaches us:**
The infrastructure is built by someone who knows what production-grade looks like. The Terraform modules follow AWS Well-Architected principles. The dual-database architecture is principled. The security policies are comprehensive. The gap is not vision — it's completion. Policy documents describe a state the IaC hasn't reached yet.

**Decisions constraining growth:**

- Manual secrets initialization blocks automation
- Shell-script deployments can't be unit tested
- No infrastructure tests means every Terraform change is a trust exercise
- Single NATS replica means the event bus is the weakest link

**Strategic bets for the 6-month radar:**

- Package the dual-database + KYC compliance module as an open-source Terraform module for African financial infrastructure. This creates distribution (Defensible Software vertical 3) and positions GTCX as the compliance infrastructure layer for the region.
- Invest in automated compliance validation (AWS Config + custom rules) to build toward SOC 2 Type II. This is a trust moat (vertical 1) — competitors who skip this can't serve regulated customers.

**What would be different starting from scratch:**

- Secrets would be managed by a single system from day one (ESO + AWS Secrets Manager, nothing else)
- Infrastructure tests would exist before modules
- Deploy would be a typed CLI tool, not a shell script
- NATS would have auth and TLS configured in the first commit
- The `docs/` directory structure would never have existed — flat `docs/` from the start

---

## OUTPUT SUMMARY

**Current State:** Well-architected infrastructure with strong encryption and principled database separation, undermined by critical security gaps (public EKS API, unauthenticated NATS, fragmented secrets) and zero infrastructure tests.

**Target State:** Production-hardened, compliance-automated, fully tested infrastructure with geographic defensibility through reusable compliance modules — ready for multi-tenant GA.

**Critical Path:**

1. Lock down EKS API + NATS authentication (Sprint 1) — DONE
2. Add detective controls (Sprint 2) — cannot detect breaches without them
3. Consolidate secrets to single path (Sprint 1) — PARTIALLY DONE

**Timeline:** 6 one-week sprints. Sprint 1 complete. Sprints 2-3 are blocking for Zimbabwe pilot. Sprints 4-6 can overlap with pilot operations.

**Biggest Risk:** The gap between security policy documentation and actual IaC enforcement. Auditors will find this immediately. The policies claim zero-trust, MFA, TLS 1.2+ — the Terraform delivers about 60% of that.

**Biggest Opportunity:** Packaging the dual-database compliance module (operational + append-only audit, FATF retention, African data residency) as open-source infrastructure for regulated African fintech. Nobody else is building this. It creates distribution, trust, and geographic specificity that a US/EU competitor won't bother replicating. The infrastructure becomes the product.
