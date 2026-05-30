---
title: 'GTCX Ecosystem — Repository Health Review'
status: 'deprecated'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Ecosystem — Repository Health Review

**Date:** 2026-05-12
**Reviewer:** Platform Engineering
**Scope:** All 25 active repos in `gtcx-ecosystem/*`
**Method:** GitHub API survey of structure, CI, security hygiene, deployment patterns, and cross-repo dependencies

---

## Executive Summary

| Metric                                            | Count        | Threshold | Status |
| ------------------------------------------------- | ------------ | --------- | ------ |
| Total active repos                                | 25           | —         | —      |
| Repos with CI                                     | 23/25 (92%)  | 100%      | ⚠️     |
| Repos with LICENSE                                | 19/25 (76%)  | 100%      | 🔴     |
| Repos with SECURITY.md                            | 7/25 (28%)   | 100%      | 🔴     |
| Repos onboarded to shared platform (AWS_ROLE_ARN) | 23/23 (100%) | 100%      | ✅     |
| Repos with own Terraform/infra                    | 6/25 (24%)   | 0%        | 🔴     |
| Repos consuming `@gtcx/*` shared packages         | 1/25 (4%)    | 80%       | 🔴     |
| TypeScript monorepos with test+lint+build+format  | 11/12 (92%)  | 100%      | ✅     |

**Three critical findings:**

1. **Infrastructure sprawl**: 6 repos maintain independent Terraform + K8s (94+ `.tf` files, 312+ K8s manifests). This duplicates `gtcx-infrastructure`, creates drift, and multiplies blast radius.
2. **Shared platform adoption is 4%**: Only `gtcx-intelligence` uses the shared CI role and ECR registry. Every other repo has its own deployment pipeline.
3. **Package sharing is nearly zero**: Only `gtcx-protocols` consumes `@gtcx/*` packages. `gtcx-core` (shared crypto/types/protocols-schemas) is not being used by sibling repos.

---

## Repo-by-Repo Health Matrix

### Tier 1 — Production-Ready (Well-Structured, Needs Minor Gaps)

| Repo                  | Lang | CI  | Test | Lint | Build | Docker | K8s | SEC | LIC | Shared Platform | Notes                                         |
| --------------------- | ---- | --- | ---- | ---- | ----- | ------ | --- | --- | --- | --------------- | --------------------------------------------- |
| `gtcx-infrastructure` | HCL  | ✅  | ✅   | ✅   | ✅    | ✅     | ✅  | ✅  | ✅  | N/A (owner)     | Platform owner. Staging live.                 |
| `gtcx-protocols`      | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ✅  | ✅  | ❌              | Uses `@gtcx/protocols-crypto`. No K8s.        |
| `gtcx-core`           | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ✅  | ✅  | ❌              | Shared packages **not consumed** by siblings. |
| `baseline-os`         | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ✅  | ✅  | ❌              | Dev-acceleration platform. No K8s.            |
| `gtcx-intelligence`   | TS   | ✅  | ✅   | ✅   | ✅    | ❌     | ✅  | ✅  | ✅  | ✅              | **Only repo on shared platform.**             |
| `ledger-ui`           | TS   | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ✅  | ✅  | ❌              | Design system. No Docker/K8s.                 |
| `sensei-ai`           | TS   | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ✅  | ✅  | ❌              | No Docker/K8s.                                |

### Tier 2 — Structured but Missing Security/Legal Hygiene

| Repo             | Lang | CI  | Test | Lint | Build | Docker | K8s | SEC | LIC | Shared Platform | Notes                                                         |
| ---------------- | ---- | --- | ---- | ---- | ----- | ------ | --- | --- | --- | --------------- | ------------------------------------------------------------- |
| `gtcx-mobile`    | TS   | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ✅  | ✅  | ❌              | No Docker/K8s.                                                |
| `gtcx-hardware`  | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ❌  | ✅  | ❌              | **Own Terraform + K8s.** Missing SECURITY.md.                 |
| `gtcx-platforms` | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ❌  | ✅  | ❌              | **Own Terraform (22 files) + K8s (16).** Missing SECURITY.md. |
| `gtcx-agentic`   | TS   | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ❌  | ✅  | ❌              | Missing SECURITY.md.                                          |
| `terra-os`       | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ✅  | ✅  | ❌              | **Own Terraform (33 files) + K8s (60).**                      |
| `compliance-os`  | TS   | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ❌  | ✅  | ❌              | **Own Terraform + K8s (86).** Missing SECURITY.md.            |

### Tier 3 — Immature or High-Risk

| Repo                | Lang   | CI  | Test | Lint | Build | Docker | K8s | SEC | LIC | Shared Platform | Notes                                                                                      |
| ------------------- | ------ | --- | ---- | ---- | ----- | ------ | --- | --- | --- | --------------- | ------------------------------------------------------------------------------------------ |
| `terminal-os`       | TS     | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ❌  | ✅  | ❌              | No description. Missing SECURITY.md.                                                       |
| `griot-ai`          | TS     | ✅  | ✅   | ✅   | ✅    | ✅     | ❌  | ❌  | ❌  | ❌              | No description. **Missing LICENSE + SECURITY.md.**                                         |
| `gtcx-markets`      | TS     | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ❌  | ❌  | ❌              | **Missing LICENSE + SECURITY.md.**                                                         |
| `gtcx-agile`        | JS     | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ❌  | ❌  | ❌              | **Missing LICENSE + SECURITY.md.**                                                         |
| `veritas-ai`        | TS     | ❌  | ✅   | ✅   | ✅    | ❌     | ❌  | ❌  | ❌  | ❌              | **No CI. Missing LICENSE + SECURITY.md.**                                                  |
| `exploration-os`    | JS     | ✅  | ❌   | ✅   | ❌    | ❌     | ❌  | ❌  | ❌  | ❌              | No description. **No tests, no build, no LICENSE, no SECURITY.md.**                        |
| `nyota-ai`          | Python | ✅  | ❌   | ✅   | ✅    | ❌     | ❌  | ❌  | ✅  | ❌              | No description. **No tests, no SECURITY.md.**                                              |
| `gtcx-docs`         | JS     | ✅  | ❌   | ✅   | ❌    | ❌     | ❌  | ❌  | ✅  | ❌              | Docs hub. **No tests, no build, no typecheck, no SECURITY.md.**                            |
| `gtcx-complianceos` | TS     | ✅  | ✅   | ✅   | ✅    | ❌     | ❌  | ❌  | ✅  | ❌              | **Own K8s (5). Missing SECURITY.md.**                                                      |
| `gtcx-core12` ⛔    | Python | ❌  | ❌   | ❌   | ❌    | ❌     | ❌  | ❌  | ✅  | ❌              | **DEPRECATED** — functionality merged into `gtcx-core`. Archive pending.                   |
| `gtcx-amis` ⛔      | JS     | ❌  | ❌   | ❌   | ❌    | ❌     | ❌  | ❌  | ❌  | ❌              | **DEPRECATED** — AMANI specs migrated to `gtcx-infrastructure` templates. Archive pending. |

---

## Critical Finding 1: Infrastructure Sprawl

Six repos maintain independent infrastructure. This duplicates `gtcx-infrastructure`, violates the shared platform pattern, and creates security drift.

| Repo                | Terraform Files | K8s Manifests | Docker Files | Risk                                             |
| ------------------- | --------------- | ------------- | ------------ | ------------------------------------------------ |
| `sensei-ai`         | 36              | 120           | 43           | 🔴 **Critical** — effectively its own infra repo |
| `terra-os`          | 33              | 60            | 8            | 🔴 **Critical**                                  |
| `gtcx-platforms`    | 22              | 16            | 3            | 🟡 High                                          |
| `compliance-os`     | 3               | 86            | 15           | 🟡 High                                          |
| `gtcx-hardware`     | 3               | 30            | 3            | 🟡 High                                          |
| `gtcx-complianceos` | 0               | 5             | 0            | 🟢 Low                                           |
| **Total**           | **97**          | **317**       | **72**       |                                                  |

**Impact:**

- Multiple VPCs, IAM roles, and security groups = multiplied blast radius
- No centralized WAF/Flow Logs/NetworkPolicy governance
- Each repo manages its own secrets rotation (or doesn't)
- SOC 2 audit scope explodes — auditor must review 6 independent infra stacks

**Remediation:** Migrate all service repos to `gtcx-infrastructure` shared platform. Service repos should only maintain application K8s manifests (Deployment + Service + HPA), not infrastructure.

---

## Critical Finding 2: Shared Platform Adoption = 100% ✅

All 23 active repos now have `AWS_ROLE_ARN` and `ECR_REGISTRY` set. The shared platform pattern is fully adopted.

**Current state:**

- 23 repos have `AWS_ROLE_ARN` → `arn:aws:iam::348389439381:role/gtcx-staging-shared-deploy`
- 23 repos have `ECR_REGISTRY` → `348389439381.dkr.ecr.af-south-1.amazonaws.com`
- 2 deprecated repos (`gtcx-core12`, `gtcx-amis`) also have variables set but are archived

**Impact:**

- SLSA L3 compliance is now achievable across the ecosystem
- Centralized artifact signing, SBOM generation, and image verification can be enforced
- Supply-chain security (TruffleHog, Cosign, Kyverno policies) applies to all builds

**Remaining work:** Service repos must update their CI workflows to consume `vars.AWS_ROLE_ARN` and `vars.ECR_REGISTRY` instead of hardcoded credentials.

---

## Critical Finding 3: Package Sharing is Nearly Zero

Only `gtcx-protocols` consumes `@gtcx/*` shared packages. `gtcx-core` (crypto, types, schemas) — the designated shared library — is not referenced by any sibling repo.

**Current `@gtcx/*` usage:**

- `gtcx-protocols` → `@gtcx/protocols-crypto` (self-referential or internal workspace)
- All other repos → zero shared package consumption

**Impact:**

- Each repo re-implements crypto, types, and schema validation
- Security fixes (e.g., Ed25519 verification bug) must be patched in N repos instead of 1
- API contract drift — no shared schema means no guaranteed interoperability

**Remediation:**

1. Publish `gtcx-core` packages to the internal registry (GitHub Packages or ECR npm proxy)
2. Add `gtcx-core` as a dependency to all TypeScript service repos
3. Enforce via CI: PRs that re-implement crypto/types/protocols-schemas should fail with "use `@gtcx/core`"

---

## Recommended Priority Actions

### P0 — This Week (Blocks Security & Compliance)

| Action                                                 | Owner                                                 | Effort        |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------- |
| Add `SECURITY.md` to all 18 repos missing it           | Each repo owner                                       | 1 hr/repo     |
| Add `LICENSE` to 6 repos missing it                    | Each repo owner                                       | 15 min/repo   |
| ~~Batch-onboard all Tier 1/2 repos to shared CI role~~ | ✅ **DONE** — 23/23 active repos onboarded 2026-05-12 | —             |
| Freeze new independent Terraform in service repos      | Leadership                                            | 0 hr (policy) |

### P1 — This Month (Blocks SOC 2 & Pilot)

| Action                                                         | Owner                                                      | Effort    |
| -------------------------------------------------------------- | ---------------------------------------------------------- | --------- |
| Migrate `sensei-ai` Terraform to `gtcx-infrastructure`         | Platform Engineering                                       | 2 weeks   |
| Migrate `terra-os` Terraform to `gtcx-infrastructure`          | Platform Engineering                                       | 2 weeks   |
| Migrate `gtcx-platforms` Terraform to `gtcx-infrastructure`    | Platform Engineering                                       | 1 week    |
| Publish `gtcx-core` to GitHub Packages                         | Platform Engineering                                       | 3 days    |
| Add `@gtcx/core` dependency to all TS repos                    | Each repo owner                                            | 1 hr/repo |
| ~~Create package adoption guide~~                              | ✅ **DONE** — `docs/engineering/package-adoption-guide.md` | —         |
| ~~Deprecate `gtcx-core12` (Python) or merge into `gtcx-core`~~ | ✅ **DONE** — Deprecated 2026-05-12                        | —         |

### P2 — Next Quarter (Quality & Maintainability)

| Action                                                                                | Owner                                                                                     | Effort      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| ~~Archive or merge `exploration-os`, `gtcx-amis`, `veritas-ai` if unmaintained~~      | ✅ `gtcx-amis` deprecated 2026-05-12. `exploration-os`, `veritas-ai` remain under review. | —           |
| Add K8s manifests to all Tier 1 repos (using platform base)                           | Each repo owner                                                                           | 2 days/repo |
| Standardize CI across all repos (shared composite actions from `gtcx-infrastructure`) | Platform Engineering                                                                      | 2 weeks     |

---

## Appendix: Archived Repos

| Repo        | Archived   | Reason |
| ----------- | ---------- | ------ |
| `agx-demo1` | 2026-03-13 | Demo   |
| `sgx-demo`  | 2026-03-13 | Demo   |
