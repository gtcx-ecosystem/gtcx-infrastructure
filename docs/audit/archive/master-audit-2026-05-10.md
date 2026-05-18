---
title: 'GTCX Infrastructure — Master Audit & Bank-Grade Certification'
status: 'draft'
date: '2026-05-10'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
---

# GTCX Infrastructure — Master Audit & Bank-Grade Certification

**Date:** 2026-05-10
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`
**Auditor:** Codex (GPT-5)
**Methodology:** `gtcx-ecosystem/audit/forensic-master-prompt.md`
**Reference framework:** `gtcx-ecosystem/audit/SCORING_FRAMEWORK.md`
**Prior master audit:** None found
**Related prior audit baseline:** `docs/assessments/audit/2026-05-04-full-audit.md`

---

## Executive Summary

| Dimension                    |  Score | Rating Band                     |
| ---------------------------- | -----: | ------------------------------- |
| Core Weighted Score          | 5.9/10 | hardened prototype / early beta |
| Investor Lens                | 6.2/10 | hardened prototype / early beta |
| Enterprise Buyer Lens        | 5.9/10 | hardened prototype / early beta |
| African Sovereign / DFI Lens | 6.4/10 | hardened prototype / early beta |

**Verdict:** The repo demonstrates credible infrastructure engineering patterns: passing install/typecheck/test/build, meaningful replay-protection tests, Kubernetes and Terraform coverage, observability artifacts, and an append-only audit database design. It is not bank-grade today because an externally reachable AI gateway can invoke consequential protocol mutations without authentication, authorization, or approval gating (`tools/compliance-gateway/src/server.mjs:43`, `tools/compliance-gateway/src/tools.mjs:17`, `tools/compliance-gateway/src/tools.mjs:230`, `infra/kubernetes/base/services/cloudflared/config.yaml:9`).

**Top 3 priorities for next sprint:**

- Add authn/authz, read-only vs mutating tool separation, and approval gating to the compliance gateway before any protocol mutation path is exposed again (`tools/compliance-gateway/src/server.mjs:43`, `tools/compliance-gateway/src/tools.mjs:71`, `tools/compliance-gateway/src/tools.mjs:243`, `infra/kubernetes/base/services/cloudflared/config.yaml:9`).
- Fail closed when replay-guard loses Redis instead of silently degrading to process-local nonce state in production (`tools/replay-protection/src/server.mjs:54`).
- Replace declarative-only audit-constraint claims with live verification and CI evidence for audit DB immutability (`infra/scripts/migrate.sh:228`, `.github/workflows/ci.yml:90`).

---

## 1. Initial State (Phase 1 — Pre-Improvement)

### 1.1 Architecture Audit

| Dimension             |  Score | Notes                                                                                                                                                                                                                                                                                  |
| --------------------- | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec fidelity         | 5.8/10 | Repo docs were materially improved later, but initial state contained 165 broken internal references and 197 missing frontmatter blocks, creating high drift between intended navigation and actual source-of-truth behavior (`docs/audit/docs-standard-compliance-2026-05-10.md:27`). |
| Structural integrity  | 7.2/10 | Monorepo boundaries are legible across `infra/`, `tools/`, and `.github/`, and the main services have coherent separation.                                                                                                                                                             |
| Code quality          | 7.2/10 | Typecheck, tests, and build pass, but the compliance gateway concentrates unsafe authority in a thin HTTP wrapper (`tools/compliance-gateway/src/server.mjs:43`).                                                                                                                      |
| Testability           | 7.8/10 | Replay protection has strong integration and failure-mode coverage; infrastructure validation is scripted and reproducible.                                                                                                                                                            |
| Operational readiness | 7.0/10 | IaC, runbooks, and observability exist, but some critical evidence paths are partial or non-enforced in automation (`.github/workflows/ci.yml:76`, `infra/scripts/migrate.sh:228`).                                                                                                    |
| Consistency           | 5.9/10 | Documentation structure, naming, and link conventions were inconsistent before Phase 3 and materially improved afterward (`docs/audit/docs-standard-compliance-2026-05-10.md:25`).                                                                                                     |

**Critical findings**

**[P0] Agentic Control Failure — Public AI gateway can mutate consequential protocol state** `tools/compliance-gateway/src/server.mjs:43`  
The natural-language query endpoint accepts any POST body, builds a prompt, and hands the request to a tool-capable model without any authentication, authorization, role check, or mutation guard. The tool registry issues raw POSTs to protocol endpoints and includes mutating operations such as credential issuance/revocation and settlement creation/execution (`tools/compliance-gateway/src/tools.mjs:17`, `tools/compliance-gateway/src/tools.mjs:55`, `tools/compliance-gateway/src/tools.mjs:230`). The service is also published through `query.gtcx.trade` (`infra/kubernetes/base/services/cloudflared/config.yaml:9`).  
**Fix:** Require authenticated identity and scoped authorization at the HTTP boundary, split read-only and mutating tools, and enforce human or proof gating before any consequential tool call is executed.

**[P1] Replay Integrity Degradation — Production replay protection falls back to memory state** `tools/replay-protection/src/server.mjs:54`  
If `REDIS_URL` is absent or Redis is unavailable, the replay verifier logs a warning and continues with `MemoryNonceStore`, which weakens replay guarantees in multi-instance production deployments. That is explicitly dangerous for a consequential anti-replay control because nonce authority becomes process-local during outage or misconfiguration.  
**Fix:** Treat missing or unavailable Redis as a readiness failure in production and refuse traffic until durable nonce storage is restored.

**[P1] Audit Verification Gap — Migration script asserts audit constraints without checking them** `infra/scripts/migrate.sh:228`  
`setup_audit_constraints()` logs that audit immutability has been verified, but it performs no SQL check against actual privileges or table mutation behavior. The underlying schema is stronger than the script, but the operational evidence path is weaker than the repo claims.  
**Fix:** Query privilege metadata and execute a negative verification in CI or a dedicated audit-db check before marking the audit path verified.

### 1.2 Security Audit

| Dimension                      |  Score | Notes                                                                                                                                                                   |
| ------------------------------ | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication & Authorization | 3.2/10 | The compliance gateway has no auth boundary despite exposing consequential tool execution (`tools/compliance-gateway/src/server.mjs:43`).                               |
| Data protection                | 6.6/10 | Audit DB separation, secret references, and signed-request replay protection are positive, but AI gateway trust is under-governed.                                      |
| Input validation               | 6.8/10 | Basic JSON validation exists, but natural-language inputs can still induce mutating tool paths without explicit policy separation.                                      |
| Dependency security            | 7.6/10 | CI includes dependency audit, CodeQL, Trivy config scan, and Terraform validation (`.github/workflows/security-evidence.yml:223`, `.github/workflows/ci.yml:106`).      |
| Infrastructure security        | 7.8/10 | Kyverno policies, non-root security context requirements, and signed-image policy are in place (`infra/kubernetes/base/policies/require-security-context.yaml:1`).      |
| Compliance posture             | 6.1/10 | Strong policy and evidence surface, but release evidence remains intentionally partial in CI and third-party validation is not present (`.github/workflows/ci.yml:76`). |

### Security Issues to Fix

| #   | Severity | Issue                                                               | File                                         | Fix                                                                  |
| --- | -------- | ------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| S1  | P0       | Unauthenticated natural-language mutation path to protocol handlers | `tools/compliance-gateway/src/server.mjs:43` | Add authn/authz, mutating-tool segregation, and approval gating      |
| S2  | P1       | Replay verifier degrades to memory nonce state in production        | `tools/replay-protection/src/server.mjs:54`  | Fail closed on Redis loss in production                              |
| S3  | P1       | Audit immutability is asserted but not operationally verified       | `infra/scripts/migrate.sh:228`               | Add live privilege verification and CI evidence                      |
| S4  | P2       | `redis.d.ts` still carries an explicit `any` listener signature     | `tools/replay-protection/src/redis.d.ts:19`  | Replace `any[]` with a typed event payload map or narrower overloads |

### 1.3 GTM Readiness

| Axis        |  Score | Notes                                                                                                      |
| ----------- | -----: | ---------------------------------------------------------------------------------------------------------- |
| Technical   | 6.8/10 | Pilot-grade infra exists with runnable validation and control-plane tooling.                               |
| Commercial  | 6.0/10 | Strong sandbox/regulatory packaging, but not yet institutional-ready because critical control gaps remain. |
| Trust       | 4.8/10 | The AI mutation path undercuts the trust story for any regulated buyer.                                    |
| Operational | 6.7/10 | Runbooks, DR workflow, and observability are credible; evidence enforcement is still partial.              |
| AI-Specific | 4.2/10 | Cost-optimized routing exists, but agentic trust controls are not bank-grade.                              |

**Current GTM stage:** **S2 Pilot**  
The repo can support a single regulated pilot with hand-holding, especially for sandbox or controlled deployment contexts, but it is not ready for institutional production procurement while the AI gateway can execute mutating actions without controls.

**First realistic deal in the next 90 days:** a sandbox or pilot infrastructure package for a regulator-facing or central-bank-adjacent deployment in Southern or East Africa, where the replay-protection, DR, and evidence posture matter more than self-serve productization.

**Top 5 stage-gate blockers**

1. Unauthenticated AI mutation path to protocol actions (`tools/compliance-gateway/src/server.mjs:43`).
2. Replay integrity weakens under Redis outage or misconfiguration (`tools/replay-protection/src/server.mjs:54`).
3. Audit DB immutability is not live-verified in the migration or release path (`infra/scripts/migrate.sh:228`).
4. CI release evidence is intentionally partial, not a real institutional proof package (`.github/workflows/ci.yml:76`).
5. No third-party pen-test or comparable external validation is evidenced in-repo.

**AI trust gaps**

- No role-based or policy-based control between prompt intake and mutating tool execution.
- No explicit approval class separation for “assistive” versus “consequential” actions.
- No provenance or confidence threshold tied to action authorization; model output is treated as execution planning input immediately.

**Competitive reality (90-day copy test)**

- **Copyable in 90 days:** Terraform/Kubernetes scaffolding, compliance evidence docs, and generic multi-provider AI routing.
- **Harder to copy in 90 days:** the combination of Africa-specific regulatory packaging, replay-protection offline semantics, audit DB separation, and the accumulated ecosystem integration assumptions across protocols and infrastructure.
- **Verdict:** the moat is operational and ecosystem depth, not model routing. The current critical control gap undermines that moat because it turns differentiated infrastructure into an unsafe execution surface.

### 1.4 Hygiene Audit

| Category       |  Score |
| -------------- | -----: |
| Documentation  | 4.2/10 |
| File structure | 7.1/10 |
| Naming         | 6.3/10 |
| Package/Build  | 8.5/10 |
| Code Hygiene   | 7.4/10 |
| Test Hygiene   | 8.0/10 |

### 1.5 Production Readiness

| Area                 | Status  | Notes                                                                                                                              |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Deployment           | Present | Kubernetes overlays, rollout strategy, and deployment scripts are present.                                                         |
| Observability        | Present | Metrics, dashboards, and alert rules are defined.                                                                                  |
| SLOs                 | Present | Error budgets and monitoring runbooks exist.                                                                                       |
| DR/BCP               | Partial | DR workflow exists, but institutional evidence and restore validation remain incomplete.                                           |
| Operational maturity | Partial | Runbooks and automation are strong, but evidence and gating are not consistently enforced.                                         |
| Compliance evidence  | Partial | Automated evidence exists, but the release-evidence path is intentionally partial in CI and no third-party validation is captured. |

---

## 2. Doc Cleanup (Phase 2)

**State at audit start:** `/docs/`-only

- Phase skipped — repo had only `/docs/` as the documentation root. No `_sop/`, `_cannon/`, `wiki/`, or `documentation/` consolidation was required.
- Cleanup commit: none
- Cleanup record: skipped — no consolidation needed

---

## 3. Docs-Standard Compliance (Phase 3)

| Axis                |      Score | Notes                                                    |
| ------------------- | ---------: | -------------------------------------------------------- |
| Structural          |     7.8/10 | Approved repo-local deviations documented                |
| Naming              |    10.0/10 | Canonical naming restored                                |
| Frontmatter         |     9.8/10 | Substantive docs normalized                              |
| Linking             |     9.6/10 | Broken internal links repaired or neutralized            |
| Length              |     7.2/10 | Legacy long docs remain                                  |
| Agentic Conventions |     8.4/10 | Improved, with some long legacy docs still mixed-purpose |
| RAG Indexing        |     9.2/10 | Baseline excludes aligned                                |
| Master INDEX        |     9.1/10 | Master index retained and refreshed                      |
| **Overall**         | **8.9/10** | See detailed audit                                       |

- Standard enforcement commit: `37272bd`
- Detailed compliance: `docs/audit/docs-standard-compliance-2026-05-10.md`

---

## 4. Post-Improvement State (Phase 4 — Re-Audit)

### 4.1 Architecture Audit

| Dimension             |  Score | Delta |
| --------------------- | -----: | ----: |
| Spec fidelity         | 6.6/10 |  +0.8 |
| Structural integrity  | 7.2/10 |  +0.0 |
| Code quality          | 7.2/10 |  +0.0 |
| Testability           | 7.8/10 |  +0.0 |
| Operational readiness | 7.1/10 |  +0.1 |
| Consistency           | 7.4/10 |  +1.5 |

**Closed since Phase 1**

- Documentation frontmatter normalized across 197 substantive docs (`docs/audit/docs-standard-compliance-2026-05-10.md:27`).
- Naming violations removed via 14 `git mv` renames (`docs/audit/docs-standard-compliance-2026-05-10.md:28`).
- 165 broken internal references repaired or neutralized (`docs/audit/docs-standard-compliance-2026-05-10.md:29`).

**Remaining**

- P0 AI gateway control failure remains open (`tools/compliance-gateway/src/server.mjs:43`).
- Replay durability and audit verification gaps remain open (`tools/replay-protection/src/server.mjs:54`, `infra/scripts/migrate.sh:228`).

### 4.2 Security Audit

| Dimension                      |  Score | Delta |
| ------------------------------ | -----: | ----: |
| Authentication & Authorization | 3.2/10 |  +0.0 |
| Data protection                | 6.6/10 |  +0.0 |
| Input validation               | 6.8/10 |  +0.0 |
| Dependency security            | 7.6/10 |  +0.0 |
| Infrastructure security        | 7.8/10 |  +0.0 |
| Compliance posture             | 6.4/10 |  +0.3 |

### 4.3 GTM Readiness

The GTM stage remains **S2 Pilot**, but the narrative is cleaner post-standardization because regulatory and evidence docs are now substantially easier to navigate and cite. The blocker set is unchanged because the control gaps are in code and deployment behavior, not documentation.

### 4.4 Hygiene Audit

| Category       |  Score | Delta |
| -------------- | -----: | ----: |
| Documentation  | 8.7/10 |  +4.5 |
| File structure | 8.0/10 |  +0.9 |
| Naming         | 9.4/10 |  +3.1 |
| Package/Build  | 8.5/10 |  +0.0 |
| Code Hygiene   | 7.4/10 |  +0.0 |
| Test Hygiene   | 8.0/10 |  +0.0 |

### 4.5 Production Readiness

| Area                 | Status  | Notes                                                           |
| -------------------- | ------- | --------------------------------------------------------------- |
| Deployment           | Present | Unchanged                                                       |
| Observability        | Present | Unchanged                                                       |
| SLOs                 | Present | Unchanged                                                       |
| DR/BCP               | Partial | Evidence and restore proof still not complete                   |
| Operational maturity | Partial | Docs improved; release evidence and safety gating still partial |
| Compliance evidence  | Partial | Docs improved; external validation gap remains                  |

---

## 5. Bank-Grade Scorecard (Phase 5)

### 5.1 Core Dimensions

| Dimension                         | Weight | Score | Confidence | Notes                                                                                                  |
| --------------------------------- | -----: | ----: | ---------- | ------------------------------------------------------------------------------------------------------ |
| Code Quality                      |     15 |   7.2 | B          | Passing typecheck/tests/build, but critical authority is concentrated in a thin AI gateway wrapper     |
| Repo / Folder Hygiene             |     10 |   8.1 | B          | Materially improved by Phase 3; structural deviations remain justified but non-canonical               |
| Security                          |     20 |   4.5 | B          | Critical auth/approval failure on consequential AI path                                                |
| Global South Resilience           |     15 |   6.8 | B          | Strong replay/offline concepts and tests, but production durability weakens on Redis outage            |
| Ecosystem Integration             |     15 |   7.5 | B          | Real coupling to protocols, control-plane tooling, and infra artifacts                                 |
| Agentic Maturity                  |     10 |   4.0 | B          | Multi-provider routing exists, but no safe separation between assistive and consequential actions      |
| Enterprise / Production Readiness |     15 |   6.3 | B          | Credible deployment/observability/DR scaffolding, but evidence and fail-closed behavior are incomplete |

**Raw weighted score:** 6.3/10

### 5.2 Caps Applied

| Cap                                      | Triggered? | Triggering finding                                                                                                                                                                             | New ceiling               |
| ---------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Unresolved critical                      | Y          | Unauthenticated public AI gateway can invoke mutating protocol tools (`tools/compliance-gateway/src/server.mjs:43`, `infra/kubernetes/base/services/cloudflared/config.yaml:9`)                | 5.9 overall               |
| 2+ unresolved high (consequential)       | N          | —                                                                                                                                                                                              | 6.9 overall               |
| Money/settlement in process memory       | N          | —                                                                                                                                                                                              | 4.5 Enterprise            |
| Non-durable audit on consequential paths | N          | Audit DB design is durable; verification evidence is weaker but not absent                                                                                                                     | 5.0 Security/Enterprise   |
| Raw AI output approves consequential     | Y          | Gateway prompt can reach `pvp_executeSettlement` and other mutating tools without approval gating (`tools/compliance-gateway/src/server.mjs:84`, `tools/compliance-gateway/src/tools.mjs:243`) | 4.5 Agentic/Security      |
| Local placeholder ecosystem authority    | N          | —                                                                                                                                                                                              | 5.5 Ecosystem Integration |
| No safe degraded-mode                    | N          | Offline and low-connectivity semantics exist, though replay durability needs hardening                                                                                                         | 4.5 Resilience            |

**Final core score:** **5.9/10**

### 5.3 Audience Lens Scores

#### Investor / Sequoia-Style Lens

| Area                           | Weight | Score | Notes                                                                                                              |
| ------------------------------ | -----: | ----: | ------------------------------------------------------------------------------------------------------------------ |
| Technical Differentiation      |     25 |   6.2 | Replay/offline control design and regulatory packaging are differentiated, but model routing is not moat by itself |
| Execution Credibility          |     25 |   6.0 | Strong delivery surface, undercut by the critical AI control gap                                                   |
| Ecosystem Leverage             |     20 |   7.2 | Real cross-repo leverage with protocols and infra scaffolding                                                      |
| Commercialization Readiness    |     15 |   5.4 | Institutional readiness is blocked by the security defect                                                          |
| Platform Compounding Potential |     15 |   6.1 | Compounding value is present if trust controls are repaired                                                        |

**Investor lens score:** **6.2/10** — hardened prototype / early beta

#### Enterprise Buyer Lens

| Area                           | Weight | Score | Notes                                                           |
| ------------------------------ | -----: | ----: | --------------------------------------------------------------- |
| Control Environment            |     25 |   4.9 | Control environment is weakened by unauthenticated AI mutation  |
| Security and Auditability      |     25 |   4.5 | Critical finding is disqualifying for institutional trust       |
| Integration Reliability        |     20 |   7.4 | Protocol and infra integration story is credible                |
| Operability and Supportability |     15 |   7.1 | Docs, runbooks, and observability are good post-standardization |
| Deployment Readiness           |     15 |   6.5 | Deployability is credible; evidence posture still partial       |

**Enterprise buyer lens score:** **5.9/10** — hardened prototype / early beta

#### African Sovereign / DFI Lens

| Area                           | Weight | Score | Notes                                                                           |
| ------------------------------ | -----: | ----: | ------------------------------------------------------------------------------- |
| Mission and Regional Fit       |     15 |   7.0 | Africa-first regulatory, sandbox, and degraded-connectivity posture is explicit |
| Global South Resilience        |     25 |   6.6 | Low-connectivity semantics exist, but durability must fail closed               |
| Governance and Trust           |     25 |   4.9 | Governance surface is strong in docs, weak on the live AI execution path        |
| Institutional Interoperability |     15 |   7.8 | Strong ecosystem integration and operator-facing docs                           |
| Long-Term Strategic Value      |     20 |   7.0 | Strategic value is real if trust controls are repaired                          |

**Sovereign / DFI lens score:** **6.4/10** — hardened prototype / early beta

---

## 6. Sprint Plan (Phase 4 / 6 Synthesis)

### Sprint 1: Lock Down Consequential AI Paths

**Goal:** Remove the critical institutional blocker.  
**Deliverables:** Add authenticated identity, scoped authorization, and read-only/mutating tool separation to the compliance gateway; require approval/proof gating before any state-changing tool executes (`tools/compliance-gateway/src/server.mjs:43`, `tools/compliance-gateway/src/tools.mjs:243`).  
**Acceptance:** Unauthenticated requests cannot reach mutating tool calls; settlement and credential mutations require a non-LLM control gate.  
**Risk:** Depends on downstream protocol auth contracts and gateway product intent.

### Sprint 2: Make Replay Protection Fail Closed

**Goal:** Remove process-local authority from the replay control plane.  
**Deliverables:** Refuse readiness or startup in production when Redis is unavailable; add negative tests for degraded production mode (`tools/replay-protection/src/server.mjs:54`).  
**Acceptance:** Production replay verifier cannot serve traffic without durable nonce storage.  
**Risk:** Requires clear operating-mode split between dev/test and production.

### Sprint 3: Prove Audit Immutability Operationally

**Goal:** Turn audit immutability from a statement into executable evidence.  
**Deliverables:** Add live verification queries or negative privilege tests to `migrate.sh` and/or CI for the audit DB (`infra/scripts/migrate.sh:228`).  
**Acceptance:** Release or migration workflows fail if audit tables admit mutation privileges.  
**Risk:** Needs stable audit test fixture and DB role coverage in CI.

### Sprint 4: Upgrade Evidence and Release Gating

**Goal:** Make production evidence institutional, not aspirational.  
**Deliverables:** Remove or constrain partial release-evidence generation paths, and require a real smoke target for evidence bundles (`.github/workflows/ci.yml:72`, `.github/workflows/ci.yml:76`).  
**Acceptance:** Release evidence is complete, reproducible, and non-partial for the shipping path.  
**Risk:** Needs a stable staging or pre-prod environment for smoke checks.

### Sprint 5: Turn Docs Validation into a Real CI Gate

**Goal:** Prevent regression of the newly standardized docs surface.  
**Deliverables:** Replace the current stub `docs-links` job with a real broken-link/frontmatter/naming validator (`.github/workflows/ci.yml:90`).  
**Acceptance:** Broken internal links, missing frontmatter, and naming regressions fail CI.  
**Risk:** Must keep false positives low enough that teams trust the gate.

### Sprint 6: Externalize Trust

**Goal:** Convert internal confidence into institutional credibility.  
**Deliverables:** Commission a targeted pen-test or equivalent third-party review on the AI gateway, replay guard, and release/audit evidence paths.  
**Acceptance:** External findings are documented and triaged; no open criticals remain.  
**Risk:** Scheduling and budget, not engineering complexity.

---

## 7. Top 5 Remediation Items

| Priority | Item                                                                                                                                                                                                                                                         | Owner                  | Dependency                                   | Target   | Expected Score Lift           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | -------------------------------------------- | -------- | ----------------------------- |
| P0       | Add authn/authz, approval gating, and read-only/mutating tool segregation to the compliance gateway (`tools/compliance-gateway/src/server.mjs:43`, `tools/compliance-gateway/src/tools.mjs:243`, `infra/kubernetes/base/services/cloudflared/config.yaml:9`) | Security + Platform    | Protocol auth contract, gateway policy model | Sprint 1 | +1.4 core, +1.7 enterprise    |
| P1       | Fail closed when replay-guard loses Redis in production (`tools/replay-protection/src/server.mjs:54`)                                                                                                                                                        | Platform Security      | Redis HA posture, readiness policy           | Sprint 2 | +0.4 core, +0.6 sovereign     |
| P1       | Replace `setup_audit_constraints()` no-op with live immutability verification (`infra/scripts/migrate.sh:228`)                                                                                                                                               | Database Platform      | Audit DB test fixture                        | Sprint 3 | +0.3 core, +0.5 enterprise    |
| P2       | Turn partial release evidence into a required, complete proof path (`.github/workflows/ci.yml:76`)                                                                                                                                                           | DevOps                 | Stable smoke environment                     | Sprint 4 | +0.3 core, +0.5 investor      |
| P2       | Replace the stub docs link job with a real docs-standard CI gate (`.github/workflows/ci.yml:90`)                                                                                                                                                             | Developer Productivity | Docs validation script                       | Sprint 5 | +0.2 hygiene, +0.2 enterprise |

---

## 8. One-Point-Uplift Conditions

**To raise core score by 1.0:** close the compliance-gateway P0, make replay protection fail closed in production, and verify audit immutability in the runtime release path. Removing the critical cap is the primary lever.

**To raise investor lens by 1.0:** prove execution credibility by shipping a policy-gated gateway, complete release evidence, and preserve the differentiated Africa-specific resilience story without unsafe shortcuts.

**To raise enterprise buyer lens by 1.0:** remove the unauthenticated AI mutation path, fail closed on replay durability loss, and produce auditable release/restore evidence plus external security validation.

**To raise sovereign / DFI lens by 1.0:** pair the control fixes above with explicit degraded-mode evidence, restore-proof evidence, and stronger institutional trust artifacts around governance and audit behavior.

---

## 9. Audit Trail (Commits This Session)

| Phase       | Commit                          | What                                       |
| ----------- | ------------------------------- | ------------------------------------------ |
| 2. Cleanup  | —                               | Skipped — no consolidation needed          |
| 3. Standard | `37272bd`                       | docs: enforce ecosystem docs-standard      |
| 6. Master   | Pending in current working tree | docs(audit): master forensic certification |

---

## 10. Sign-Off

| Role               | Status  | Date       |
| ------------------ | ------- | ---------- |
| Author             | Drafted | 2026-05-10 |
| CTO                | Pending | —          |
| Head of Security   | Pending | —          |
| Head of Compliance | Pending | —          |
| Repo lead          | Pending | —          |
