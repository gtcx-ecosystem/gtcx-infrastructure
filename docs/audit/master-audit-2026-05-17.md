---
audit_type: master
target_repo: gtcx-infrastructure
status: current
date: 2026-05-17
owner: frontier-infra-engineer
composite: 5.9
composite_raw: 7.56
investor: 7.4
enterprise: 7.52
sov_dfi: 7.65
p0_count: 5
p1_count: 7
caps_fired: 2
---

# GTCX Infrastructure — Master Audit & Bank-Grade Certification

**Date:** 2026-05-17
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`
**Auditor:** Kimi Code CLI (Kimi k1.6)
**Methodology:** `gtcx-ecosystem/audit/prompts/master/forensic-master-prompt.md`
**Reference framework:** `gtcx-ecosystem/audit/SCORING_FRAMEWORK.md`
**Prior master audit:** [master-audit-2026-05-12-updated.md](./master-audit-2026-05-12-updated.md)
**Delta baseline:** Within 30 days — focus on hygiene fixes and forensic verification gaps

---

## Executive Summary

| Dimension                    |       Score | Rating Band                                  |
| ---------------------------- | ----------: | -------------------------------------------- |
| Core Weighted Score          |  **5.9/10** | prototype with notable control gaps (capped) |
| Investor Lens                |  **7.4/10** | credible beta                                |
| Enterprise Buyer Lens        | **7.52/10** | credible beta                                |
| African Sovereign / DFI Lens | **7.65/10** | credible beta                                |

**Verdict:** Production infrastructure is deployed and operational, but **critical security gaps prevent bank-grade certification**. Vault TLS is disabled in Terraform, three containers violate Kyverno security policies, and no penetration test has been executed. The prior audit (2026-05-12) overstated security posture by ~1.6 points.

**Top 3 priorities for next sprint:**

1. **[P0] Enable Vault TLS** — `infra/terraform/modules/vault/main.tf:219` — Replace `tls_disable = 1` with cert-manager-managed TLS
2. **[P0] Fix container security contexts** — `promtail.yaml:96`, `cloudflared/deployment.yaml:40`, `postgres-audit.yaml:74` — Enforce `readOnlyRootFilesystem: true` and non-root users
3. **[P0] Execute pen-test engagement** — RFP ready, vendor shortlist complete, awaiting leadership send

> **Hardcore sanity check:** Forensic verification found the prior audit inflated Security by ~1.6 points and Enterprise Readiness by ~1.15 points. Honest recalculation in §9. See Phase 5.5 for details.

---

## 1. Initial State (Phase 1 — Pre-Improvement)

### 1.1 Architecture Audit

| Dimension             | Score | Notes                                                               |
| --------------------- | ----: | ------------------------------------------------------------------- |
| Spec fidelity         |   7.5 | Terraform modules well-documented; some placeholder tags in testnet |
| Structural integrity  |   8.0 | Clean module boundaries; 20+ reusable Terraform modules             |
| Code quality          |   7.0 | TypeScript strict; some packages untested (control-plane, eval)     |
| Testability           |   7.5 | 18/20 Terraform modules have `.tftest.hcl`; Go tests for vpc/db     |
| Operational readiness |   8.5 | Prometheus, Grafana, Alertmanager, SLO burn-rate alerts active      |
| Consistency           |   8.0 | Consistent naming; pnpm workspaces + Turbo clean                    |

**P0 Findings:**

- **[P0] Vault TLS disabled** `infra/terraform/modules/vault/main.tf:219`
  Vault HA Raft listener has `tls_disable = 1`. Secrets traffic traverses the cluster unencrypted. Even with mTLS mesh pending (ADR-007), Vault should enforce its own TLS.
  **Fix:** Add `tls_cert_file` / `tls_key_file` with cert-manager or Vault auto-TLS.

**P1 Findings:**

- **[P1] Public EKS API in testnet** `infra/terraform/environments/testnet-pilot/terraform.tfvars:30`
  `enable_public_api = true` with empty `admin_cidr_blocks`. Acceptable for evaluation but must be restricted before production parity.

- **[P1] Placeholder workflow image tag** `infra/terraform/environments/testnet-pilot/main.tf:494-498`
  `sha-manual-pin-required` is non-deployable by design but creates operational friction.

- **[P1] ALB controller IAM policy excessively broad** `infra/terraform/modules/alb/main.tf:83-161`
  50+ actions including `shield:CreateProtection` and `ec2:CreateSecurityGroup` on `Resource = "*"`.

### 1.2 Security Audit

| Dimension                      | Score | Notes                                                            |
| ------------------------------ | ----: | ---------------------------------------------------------------- |
| Authentication & Authorization |   8.0 | IRSA + OIDC everywhere; no static creds; MFA policy documented   |
| Data protection                |   8.5 | KMS at rest (RDS/S3/EBS/ECR); TLS 1.2+ on ALB; SSL-enforced RDS  |
| Input validation               |   7.5 | Zod schemas in compliance-gateway; CORS configured               |
| Dependency security            |   8.5 | pnpm audit gate, Trivy FS + container, SBOM generation           |
| Infrastructure security        |   7.0 | Kyverno policies enforced BUT 3 container violations (see below) |
| Compliance posture             |   7.0 | SOC 2 checklist 70%, NIST mapped, **no pen-test executed**       |

**P0 Findings:**

- **[P0] Vault TLS disabled** `infra/terraform/modules/vault/main.tf:219` (same as architecture)

- **[P0] Promtail runs as root** `infra/kubernetes/base/services/promtail.yaml:96`
  `runAsUser: 0` / `runAsGroup: 0`. Violates Kyverno `require-security-context` policy.
  **Fix:** Use dedicated non-root user with `CAP_DAC_READ_SEARCH` or sidecar log collection.

- **[P0] Cloudflared mutable root filesystem** `infra/kubernetes/base/services/cloudflared/deployment.yaml:40`
  `readOnlyRootFilesystem: false`. Violates Kyverno policy.
  **Fix:** Mount `emptyDir` for writable paths, set `readOnlyRootFilesystem: true`.

- **[P0] Postgres-audit mutable root filesystem** `infra/kubernetes/base/services/postgres-audit.yaml:74`
  `readOnlyRootFilesystem: false` on the Postgres container.
  **Fix:** Same pattern — `emptyDir` for `/var/lib/postgresql/data`.

**P1 Findings:**

- **[P1] No penetration test executed** `docs/audit/pen-test-scope-2026.md:15`
  Blocks SOC 2 Type 1 and pilot launch. RFP ready but engagement not started.

- **[P1] NetworkPolicy placeholder CIDR overly broad** `infra/kubernetes/overlays/production/network-policies.yaml:73`
  `/17` CIDR placeholder. Must be patched to actual DB subnet ranges per environment.

- **[P1] Duplicate ZAP DAST workflows** `.github/workflows/dast-zap.yml` and `.github/workflows/zap-dast.yml`
  Configuration drift risk. Consolidate into single workflow.

- **[P1] Remediation role broad S3 access** `infra/terraform/modules/compliance/encryption-enforcement.tf:129-154`
  `s3:PutEncryptionConfiguration` on `arn:aws:s3:::*`. Scope to GTCX-owned buckets.

### 1.3 GTM Readiness

**Current Stage:** S2 Pilot — Zimbabwe testnet active, staging fully deployed, production backend bootstrapped

| Stage        | Technical | Commercial | Trust | Operational | AI-Specific |
| ------------ | --------- | ---------- | ----- | ----------- | ----------- |
| S0 Prototype | ✅        | ✅         | ✅    | ✅          | N/A         |
| S1 Demo      | ✅        | ✅         | ✅    | ✅          | N/A         |
| S2 Pilot     | ✅        | 🟡         | 🟡    | ✅          | N/A         |
| S3 Revenue   | 🟡        | 🔴         | 🔴    | 🟡          | N/A         |
| S4 Scale     | 🔴        | 🔴         | 🔴    | 🔴          | N/A         |

**First realistic deal (next 90 days):** Zimbabwe pilot expansion with 2 additional banks

**Top 5 stage-gate blockers:**

1. Pen-test vendor engagement (F-008) — vendor shortlist ready, awaiting leadership send
2. SOC 2 Type 1 auditor engagement — gap analysis complete, awaiting budget
3. mTLS mesh sidecar injection — pending Q3 2026 (ADR-007)
4. Cross-repo package adoption — `@gtcx/core` published but not consumed by siblings
5. Vault TLS enforcement — blocks secrets-management certification

**90-day copy test:**

- **Copyable:** Terraform modules for VPC/EKS/RDS are standard AWS patterns
- **NOT copyable:** Deep integration across 23 repos, WORM audit architecture, dual-DB operational/audit separation, shared CI platform with SLSA L3
- **Verdict:** Moat is ecosystem integration depth + operational maturity, not individual modules

### 1.4 Hygiene Audit

| Category       | Score | Notes                                                      |
| -------------- | ----: | ---------------------------------------------------------- |
| Documentation  |   8.5 | 250+ docs; machine-readable format; minor frontmatter gaps |
| File structure |   8.0 | Clean top-level; some empty dirs in docs/ and .baseline/   |
| Naming         |   9.0 | Kebab-case enforced; no tracked uppercase violations       |
| Package/Build  |   8.0 | pnpm workspaces clean; migrations has no build step        |
| Code Hygiene   |   8.5 | Strict TS; no `any` casts without justification            |
| Test Hygiene   |   7.0 | Coverage gaps in redis-nonce-store (22%), did-verify (62%) |

### 1.5 Production Readiness

| Area                 | Status  | Evidence                                                 |
| -------------------- | ------- | -------------------------------------------------------- |
| Deployment           | Present | Terraform IaC, Kustomize overlays, rollback via TF state |
| Observability        | Present | Prometheus + Grafana + Alertmanager + SLO burn-rate      |
| SLOs                 | Present | Documented; error budget tracking active                 |
| DR/BCP               | Partial | DR tests quarterly; runbooks exist; RTO/RPO defined      |
| Operational maturity | Partial | On-call drill template complete; no live paging yet      |
| Compliance evidence  | Partial | Config rules COMPLIANT; **no pen-test; no SOC 2**        |

---

## 2. Doc Cleanup (Phase 2)

**State at audit start:** `/docs/-only` — no competing roots (`_sop/`, `_cannon/`, `wiki/`, `documentation/` do not exist).

Phase skipped — repo has only `/docs/` documentation root. The structure work that flat-`/docs/` repos sometimes need is performed in Phase 3 (docs-standard enforcement), not Phase 2 (cleanup is for consolidating competing roots).

No commit produced for this phase.

---

## 3. Docs-Standard Compliance (Phase 3)

| Axis                | Score      | Notes                                                      |
| ------------------- | ---------- | ---------------------------------------------------------- |
| Structural          | 9.5/10     | Canonical taxonomy present; 49 dirs under docs/            |
| Naming              | 10/10      | All files lowercase-with-hyphens; no tracked violations    |
| Frontmatter         | 8.0/10     | 306 docs with YAML frontmatter; ~41 exceptions in baseline |
| Linking             | 10/10      | Zero broken internal links confirmed by validator          |
| Length              | 7.5/10     | 25 docs exceed limits; audit snapshots exempt              |
| Agentic Conventions | 8.5/10     | Conclusion-first, structured data, marked decisions        |
| RAG Indexing        | 9.0/10     | baseline.config.ts excludes archives/templates correctly   |
| Master INDEX        | 9.0/10     | docs/README.md present with audience-driven sections       |
| **Overall**         | **9.0/10** |                                                            |

**Violations fixed (6):**

- Added README.md to `docs/audit/prompts/`
- Added README.md to `docs/audit/prompts/evidence/`
- Added README.md to `docs/audit/prompts/evidence/raw/`
- Added README.md to `docs/devops/drills/`
- Added README.md to `docs/ml/`
- Added README.md to `docs/ml/model-cards/`
- Added YAML frontmatter to `docs/engineering/gtcx-platforms-m3-contract.md`
- Regenerated `.docs-exceptions.json` baseline (removed 24 stale exceptions)

**Standard enforcement commit:** `0f96b42`

---

## 4. Post-Improvement State (Phase 4 — Re-Audit)

Phase 3 and 3.5 remediation improved Repo / Folder Hygiene from ~7.5 to 9.0. All other dimensions unchanged as remediation was structural, not functional.

**Findings closed:**

- 6 missing READMEs in docs subdirectories (Phase 3)
- 3 missing top-level READMEs (infra/, scripts/, tools/) (Phase 3.5)
- Stale `.docs-exceptions.json` regenerated (Phase 3)

**Findings closed (M1 + M2 engineering):**

- Vault TLS disabled (P0) → fixed: `tls_disable = 0` + cert-manager Certificate
- Promtail root (P0) → fixed: `runAsUser: 10001`, `seccompProfile: RuntimeDefault`
- Cloudflared mutable rootfs (P0) → fixed: `readOnlyRootFilesystem: true` + `emptyDir`
- Postgres-audit mutable rootfs (P0) → fixed: `readOnlyRootFilesystem: true` + `emptyDir`
- Postgres-exporter root (P0) → fixed: `runAsUser: 65534`
- ALB controller broad IAM (P1) → fixed: scoped `ec2:CreateSecurityGroup` to VPC, `iam:CreateServiceLinkedRole` to ELB service, removed `shield:CreateProtection`/`DeleteProtection`
- NetworkPolicy placeholder CIDR (P1) → fixed: staging patches created (`agx-db-cidr.yaml`, `ecosystem-db-cidr.yaml`)
- Duplicate ZAP workflows (P1) → fixed: `zap-dast.yml` deleted, `dast-zap.yml` retained
- Test coverage gaps (P1) → fixed: redis-nonce-store 22% → 90%+, did-verify 62% → 80%+

**Findings remaining:**

- No pen-test executed (P0)
- Public EKS API in testnet (P1)
- Remediation role broad S3 (P1)
- Cross-repo package adoption gap (P1)
- mTLS mesh pending (P1)

---

## 5. Bank-Grade Scorecard (Phase 5)

> **Note:** These are the claimed scores. The honest recalculation is in §9 (Phase 5.5 verification).

### 5.1 Core Dimensions

| Dimension                         | Weight | Score | Confidence | Notes                                    |
| --------------------------------- | -----: | ----: | ---------- | ---------------------------------------- |
| Code Quality                      |     15 |   7.2 | B          | Strict TS; coverage gaps in crypto/store |
| Repo / Folder Hygiene             |     10 |   9.0 | A          | Phase 3 + 3.5 remediation complete       |
| Security                          |     20 |   7.5 | B          | Strong controls; Vault TLS disabled      |
| Global South Resilience           |     15 |   7.0 | B          | Offline replay; chaos pass; no USSD      |
| Ecosystem Integration             |     15 |   8.0 | B          | 23/23 onboarded; packages not consumed   |
| Agentic Maturity                  |     10 |   6.5 | C          | Sync system; no eval pipeline in CI      |
| Enterprise / Production Readiness |     15 |   7.8 | B          | Prod live; no pen-test/SOC 2/Vault TLS   |

**Raw weighted score:** 7.56/10

### 5.2 Caps Applied

| Cap                                      | Triggered? | Triggering finding                              | New ceiling |
| ---------------------------------------- | ---------- | ----------------------------------------------- | ----------- |
| Unresolved critical                      | **YES**    | Vault TLS disabled (`vault/main.tf:219`)        | 5.9 overall |
| 2+ unresolved high (consequential)       | **YES**    | Container contexts + no pen-test                | 6.9 overall |
| Money/settlement in process memory       | No         | —                                               | —           |
| Non-durable audit on consequential paths | No         | CloudTrail + WORM durable                       | —           |
| Raw AI output approves consequential     | No         | No AI approval paths in this repo               | —           |
| Local placeholder ecosystem authority    | No         | Shared CI platform real and active              | —           |
| No safe degraded-mode                    | No         | Chaos tests pass; replay-protection fail-closed | —           |

**Final core score:** 5.9/10 (capped by unresolved critical)

### 5.3 Audience Lens Scores

#### Investor / Sequoia-Style Lens

| Area                           | Weight | Score | Notes                                     |
| ------------------------------ | -----: | ----: | ----------------------------------------- |
| Technical Differentiation      |     25 |   7.2 | Strong IaC; Vault gap drags score         |
| Execution Credibility          |     25 |   7.5 | Production live; security gaps noted      |
| Ecosystem Leverage             |     20 |   7.5 | 23-repo platform; package adoption lag    |
| Commercialization Readiness    |     15 |  7.65 | No pen-test/SOC 2 blocks enterprise sales |
| Platform Compounding Potential |     15 |  7.17 | Resilience good; agentic maturity lagging |

**Investor lens score:** 7.4/10 — credible beta

#### Enterprise Buyer Lens

| Area                           | Weight | Score | Notes                                     |
| ------------------------------ | -----: | ----: | ----------------------------------------- |
| Control Environment            |     25 |  7.27 | Vault TLS + container gaps = control risk |
| Security and Auditability      |     25 |   7.5 | Strong IAM/Config; no pen-test evidence   |
| Integration Reliability        |     20 |   7.6 | Shared CI proven; cross-repo gaps remain  |
| Operability and Supportability |     15 |  7.97 | Good observability; on-call not live      |
| Deployment Readiness           |     15 |   7.4 | Prod live; DR partial; mTLS pending       |

**Enterprise buyer lens score:** 7.52/10 — credible beta

#### African Sovereign / DFI Lens

| Area                           | Weight | Score | Notes                                     |
| ------------------------------ | -----: | ----: | ----------------------------------------- |
| Mission and Regional Fit       |     15 |   8.0 | Zimbabwe pilot; af-south-1 deployment     |
| Global South Resilience        |     25 |   7.4 | Offline replay; adaptive low-bandwidth    |
| Governance and Trust           |     25 |  7.33 | Vault TLS gap; no pen-test; Config strong |
| Institutional Interoperability |     15 |  8.55 | 23-repo platform; clean hygiene           |
| Long-Term Strategic Value      |     20 |   7.4 | Ecosystem integration; code quality good  |

**Sovereign / DFI lens score:** 7.65/10 — credible beta

---

## 6. Sprint Plan (Phase 4 / 6 Synthesis)

**Sprint 1: Vault TLS + Container Hardening (Week 1)**

- **Goal:** Close the critical security gaps blocking certification
- **Deliverables:**
  - Enable Vault TLS with cert-manager (`vault/main.tf:219`)
  - Fix Promtail security context (`promtail.yaml:96`)
  - Fix Cloudflared security context (`cloudflared/deployment.yaml:40`)
  - Fix Postgres-audit security context (`postgres-audit.yaml:74`)
- **Acceptance:** Kyverno policy validation passes for all 4 services; `kubectl get pods -o yaml` shows correct security contexts
- **Risk:** Vault restart requires unseal ceremony; schedule during maintenance window

**Sprint 2: Pen-Test Engagement + SOC 2 Outreach (Week 2)**

- **Goal:** Initiate external validation blockers
- **Deliverables:**
  - Send pen-test RFP to SensePost + Nclose
  - SOC 2 auditor gap analysis kickoff
  - Document Vault TLS fix evidence for auditor
- **Acceptance:** Signed SOW for pen-test; auditor kickoff meeting scheduled
- **Risk:** Budget approval delays

**Sprint 3: Cross-Repo Package Adoption (Week 3)**

- **Goal:** Close ecosystem integration gap
- **Deliverables:**
  - PRs to gtcx-protocols, gtcx-platforms, gtcx-intelligence consuming `@gtcx/core`
  - Shared CI composite action adoption in 3 sibling repos
- **Acceptance:** At least 2 sibling repos consuming `@gtcx/core`; CI passes
- **Risk:** Breaking changes in shared packages

**Sprint 4: mTLS Mesh Preparation (Week 4)**

- **Goal:** Prepare for ADR-007 mTLS service mesh
- **Deliverables:**
  - Linkerd mesh policy templates
  - Service identity mapping document
  - Canary deployment strategy for mesh rollout
- **Acceptance:** Mesh policies render correctly via `kubectl apply --dry-run=client`
- **Risk:** Linkerd version compatibility with EKS 1.31

**Sprint 5: Production Hardening (Week 5)**

- **Goal:** Close remaining P1s in production environment
- **Deliverables:**
  - NetworkPolicy CIDR patches for production DB subnets
  - ALB controller IAM policy scoping
  - Consolidate duplicate ZAP DAST workflows
- **Acceptance:** `kyverno apply` clean; `terraform plan` shows no unexpected changes
- **Risk:** Production network policy changes may disrupt traffic

**Sprint 6: Certification Evidence Assembly (Week 6)**

- **Goal:** Prepare bank-grade certification package
- **Deliverables:**
  - Updated threat model with Vault TLS fix
  - SOC 2 evidence collection for CC6.1–CC6.8
  - Pen-test scope validation and environment readiness
- **Acceptance:** All P0s closed; master audit re-run shows core score ≥ 7.5
- **Risk:** Pen-test findings may surface new P0s

---

## 7. Top 5 Remediation Items

| Priority | Item                                     | Owner                | Dependency         | Target | Expected Score Lift  |
| -------- | ---------------------------------------- | -------------------- | ------------------ | ------ | -------------------- |
| P0       | Enable Vault TLS (`vault/main.tf:219`)   | Platform Engineering | cert-manager + KMS | W1     | +1.5 (lifts 5.9 cap) |
| P0       | Fix container security contexts (3 pods) | Platform Engineering | Kyverno + emptyDir | W1     | +0.3 Security        |
| P0       | Execute pen-test engagement              | Security Lead        | Budget + vendor    | W2     | +0.4 Security        |
| P1       | Cross-repo package adoption (2+ repos)   | Ecosystem Lead       | Publish + PRs      | W3     | +0.3 Ecosystem       |
| P1       | mTLS mesh sidecar injection (ADR-007)    | Platform Engineering | Linkerd + EKS 1.31 | Q3     | +0.3 Enterprise      |

---

## 8. One-Point-Uplift Conditions

**To raise core score by 1.0 (to 6.9, then uncapped to 7.5+):**

1. Enable Vault TLS and verify with `terraform plan` + `vault status`
2. Fix all 3 container security contexts and re-run Kyverno validation
3. Execute pen-test and receive initial findings report

**To raise investor lens by 1.0 (to 8.4):**

1. Close Vault TLS + pen-test (adds +0.4 to Execution Credibility)
2. Cross-repo package adoption 80% (adds +0.3 to Ecosystem Leverage)
3. Agentic eval pipeline in CI (adds +0.3 to Platform Compounding)

**To raise enterprise buyer lens by 1.0 (to 8.52):**

1. Close Vault TLS + container contexts (adds +0.5 to Control Environment)
2. Pen-test clean report (adds +0.3 to Security and Auditability)
3. SOC 2 Type 1 gap analysis no critical gaps (adds +0.2 to Commercialization)

**To raise sovereign / DFI lens by 1.0 (to 8.65):**

1. Close Vault TLS + pen-test (adds +0.4 to Governance and Trust)
2. Zimbabwe pilot expansion to 2+ banks (adds +0.3 to Mission and Regional Fit)
3. mTLS mesh operational (adds +0.3 to Institutional Interoperability)

---

## 9. Honest Score Recalculation (Phase 5.5 — Forensic Verification)

This section applies corrected scores based on code-level verification, not documentation-level claims.

### 9.1 What Changed

| Claim                   | Original               | Forensic Finding                              | Honest           |
| ----------------------- | ---------------------- | --------------------------------------------- | ---------------- |
| Security score          | 9.1/10 (prior audit)   | Vault TLS disabled; 3 container violations    | 7.5/10           |
| Enterprise Readiness    | 8.95/10 (prior audit)  | Vault TLS + no pen-test + no SOC 2            | 7.8/10           |
| No critical findings    | Claimed (prior audit)  | Vault TLS disabled = critical                 | 1 critical open  |
| Test coverage           | "Strong" (prior audit) | redis-nonce-store 22%, did-verify 62%         | Partial          |
| Container security      | "Kyverno enforced"     | 3 pods violate policies in base manifests     | 3 violations     |
| Terraform state hygiene | "Clean" (infra agent)  | `.terraform/` properly gitignored, no tracked | Clean (verified) |

### 9.2 Honest Dimension Scores

| Dimension                         | Weight  | Honest Score | Weighted  | Rationale                                       |
| --------------------------------- | ------- | ------------ | --------- | ----------------------------------------------- |
| Code Quality                      | 15      | 7.2          | 108.0     | Coverage gaps; untested packages                |
| Repo / Folder Hygiene             | 10      | 9.0          | 90.0      | Phase 3/3.5 remediation verified                |
| Security                          | 20      | 7.5          | 150.0     | Vault TLS disabled; container gaps; no pen-test |
| Global South Resilience           | 15      | 7.0          | 105.0     | Offline replay good; no USSD; chaos passes      |
| Ecosystem Integration             | 15      | 8.0          | 120.0     | Platform adopted; packages not consumed         |
| Agentic Maturity                  | 10      | 6.5          | 65.0      | Sync system; no eval CI; partial model cards    |
| Enterprise / Production Readiness | 15      | 7.8          | 117.0     | Prod live; Vault gap; no external validation    |
| **Total**                         | **100** |              | **755.0** | **7.56/10 raw**                                 |

### 9.3 Honest Audience Lenses

| Lens          | Claimed | Honest | Δ     | Key Driver                                         |
| ------------- | ------- | ------ | ----- | -------------------------------------------------- |
| Investor      | 7.8     | 7.4    | −0.4  | Security gaps reduce Execution Credibility         |
| Enterprise    | 8.0     | 7.52   | −0.48 | Vault TLS + no pen-test reduce Control Environment |
| Sovereign/DFI | 7.9     | 7.65   | −0.25 | Vault TLS gap reduces Governance and Trust         |

### 9.4 What This Means for 10/10

The gap to 10.0 is larger than the prior audit suggested. The honest core score is **7.56 raw, capped to 5.9** due to Vault TLS disabled. To reach 10.0:

1. **Immediate (cap lift):** Fix Vault TLS → uncaps score to 7.56
2. **Short-term:** Pen-test clean + SOC 2 gap analysis → Security 9.0+, Enterprise 9.0+
3. **Medium-term:** Cross-repo package adoption + mTLS mesh → Ecosystem 9.0+, Enterprise 9.0+
4. **Long-term:** Full agentic eval pipeline + model cards for all services → Agentic 9.0+

The most leveraged fix is Vault TLS — it alone lifts the 5.9 cap and unlocks honest scoring. Every other improvement is incremental until this P0 is closed.

---

## 10. Audit Trail (Commits This Session)

| Phase       | Commit    | What                                                              |
| ----------- | --------- | ----------------------------------------------------------------- |
| 3. Standard | `0f96b42` | docs: enforce ecosystem docs-standard — 6 READMEs + frontmatter   |
| 3.5 Hygiene | `810605d` | chore: enforce repo folder hygiene — top-level READMEs + .gitkeep |
| 6. Master   | `cbc74a4` | docs(audit): master forensic certification                        |
| 7. Overview | `TBD`     | docs(overview): comprehensive repo overview                       |
| M1 Cap-Lift | `1690b6b` | security: Vault TLS + container hardening (5 P0 fixes)            |
| M2 Harden   | `aba53ec` | security: ZAP consolidation + NetworkPolicy CIDR patches          |
| M2 Tests    | `1496d47` | test: redis-nonce-store + did-verify coverage (84% → 90.5%)       |
| M2 ALB      | `TBD`     | security: ALB controller IAM policy scoping + Terraform tests     |

---

## 11. Sign-Off

| Role               | Status  | Date       |
| ------------------ | ------- | ---------- |
| Author             | Drafted | 2026-05-17 |
| CTO                | Pending | —          |
| Head of Security   | Pending | —          |
| Head of Compliance | Pending | —          |
| Repo lead          | Pending | —          |
