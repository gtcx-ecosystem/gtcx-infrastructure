---
status: current
date: '2026-06-02'
owner: gtcx-infrastructure
audit_type: master
target_repo: gtcx-infrastructure
audit_date: 2026-06-02
composite: 7.1
composite_raw: 7.1
investor: 7.0
enterprise: 7.0
sov_dfi: 6.9
p0_count: 3
p1_count: 5
caps_fired: 0
---

# Master Audit — gtcx-infrastructure (2026-06-02)

> **Methodology:** `gtcx-docs/03-platform/tools/audit/audit-framework/prompts/master/comprehensive-audit-prompt.md` (MAOP v1.0)
> **Auditor:** Kimi Code CLI
> **Scope:** Single repo (`gtcx-infrastructure`) — infra + tools + docs + CI/IaC
> **Head:** `4189077` (clean working tree)
> **Prior master audit:** `master-audit-2026-05-30.md`
> **Scoring:** Rubric v2 — IR (internal engineering) and XC (external/GTM) are independent tracks.

---

## Audit Metadata

- **Repo:** `gtcx-ecosystem/gtcx-infrastructure`
- **Scope:** Single repo only (infra + tools + docs + CI/IaC). No sibling repos.
- **Audit date:** 2026-06-02
- **Auditor:** Kimi Code CLI
- **Comparison baseline:**
  - Latest full audit: `01-docs/05-audit/full-audit-2026-06-01.md` (HEAD `6834b476`)
  - Machine status: `01-docs/05-audit/latest.json` (IR/XC split, rubric v2)
  - Prior master-audit cluster: `01-docs/05-audit/master-audit-2026-05-30.md` (superseded)
  - Prior same-day report: `01-docs/05-audit/master-audit-report-2026-06-02.md` (grade-tier assessment)

## Evidence Reviewed

- **Code paths:**
  - `03-platform/tools/compliance-gateway/src/server.mjs` (routing, health, audit endpoints, brotli error logging)
  - `03-platform/tools/compliance-gateway/src/auth.mjs` (Bearer auth, dev defaults, tenant isolation)
  - `03-platform/tools/replay-protection/src/middleware.mjs` (path normalization, traversal hardening)
  - `03-platform/tools/audit-flush/src/nats-consumer.mjs` (durability path, WORM upload)
  - `03-platform/tools/scripts/validate-all.mjs` (38-gate orchestrator)
  - `04-ship/terraform/modules/*/main.tf` (encryption, WAF, IAM, KMS)
- **Tests and gates:**
  - `pnpm install` — PASS
  - `pnpm typecheck` — PASS (3/15 packages; 12 untyped)
  - `pnpm lint` — PASS (2/15 packages; compliance-gateway has 34 hidden ESLint errors)
  - `pnpm build` — PASS (2/15 packages; 13 no-op)
  - `pnpm test` — PASS (quick script omits 9 packages)
  - `node 03-platform/tools/scripts/validate-all.mjs` — PASS (38/38)
- **Coverage forensics:**
  - Compliance-gateway: **87.77%** branches (statements 91.94%), down from claimed 91.87%
  - Replay-protection: **90.45%** branches — matches claim
- **Docs / runbooks:**
  - `01-docs/README.md` (master INDEX), `01-docs/05-audit/execution-roadmap.md`
  - `01-docs/04-ops/runbooks/inf-49-staging-dns.md`
  - Cross-repo trust layer: `01-docs/reference/architecture/trust-layers-and-did-resolution.md`
- **Runtime evidence (staging):**
  - `/health` → 200 (bare curl after WAF rule)
  - `/v1/dids/auth/gh/bog` → `did:gtcx:auth:gh:bog`
- **Docs-standard compliance:**
  - Structural: 8/10, Naming: 9/10, Frontmatter: 9/10, Linking: 8/10
  - Length: 9/10, Agentic: 7/10, RAG: 9/10, Master INDEX: 9/10
  - **Overall: 8.5/10**
- **Repo hygiene:**
  - Root: 9/10, README discipline: 7/10, Build artifacts: 8/10
  - Archives: 10/10, Naming: 9/10, File size: 9/10
  - IDE junk: 9/10, Empty dirs: 9/10
  - **Overall: 8.75/10**

---

## Findings

### Critical

- None observed in repo-controlled gates.

### High

- **[P0 external] EXT-INF-013: ZWCMP pilot owner + cadence call not assigned**
  Evidence: `01-docs/05-audit/external-dependencies-register-2026-05-31.md`, `01-docs/05-audit/agile/pilot-success-criteria.md:27`
  Risk: Single biggest GTM unblock. No code change — pure external coordination.
  Fix: Assign senior pilot-facing operator with African central-bank experience.

- **[P0 external] EXT-INF-014: DPA + pilot agreement unsigned**
  Evidence: `01-docs/05-audit/external-dependencies-register-2026-05-31.md`
  Risk: Legal blocker for ZWCMP pilot closure.
  Fix: Legal review and signature.

- **[P0 external] EXT-INF-002: Pen-test SOW signature pending**
  Evidence: `01-docs/05-audit/pen-test-intake-evidence-2026-05-31.md`
  Risk: Bet 1 external validation blocked.
  Fix: Sign SOW with SensePost or Nclose; target kickoff within 2 weeks.

### Medium

- **[P1] Compliance-gateway branch coverage dropped to 87.77% (stale claim of 91.87%)**
  Evidence: `03-platform/tools/compliance-gateway/src/server.mjs` 78.01% branches, `fail-closed.mjs` 80.76%.
  Fix: Add missing branch coverage for brotli fallback, auth throttle edge cases.

- **[P1] Hidden lint debt in compliance-gateway (34 ESLint errors not visible to `pnpm lint`)**
  Evidence: Manual `eslint` on untyped packages.
  Fix: Add `lint` script to compliance-gateway package.json; remediate errors.

- **[P1] No named CISO/vCISO appointed (target 2026-06-30)**
  Evidence: `01-docs/governance/ciso-role.md` does not exist.
  Risk: Bank-Grade B.4 blocker.
  Fix: Appoint named CISO, establish monthly board reporting.

- **[P1] PRD-002 staging audit API is not production-verifiable yet**
  Evidence: `04-ship/kubernetes/overlays/staging/ingress.yaml` routes `/audit` to compliance-gateway; DID resolver contract misalignment (TradePass `/identity/:did` vs protocols `/v1/tradepass/:did`).
  Fix: Tier A (route ≠404) then Tier B (signature verify end-to-end).

- **[P1] FSCA license / SARB notification not started**
  Evidence: Bank-grade audit prompt South Africa requirements table.
  Risk: Hard blocker for SA financial services operation.
  Fix: File SARB notification; begin FSCA Category I/II application.

### Low

- **[P2] Default audit sink is stdout (ephemeral) — durability depends on external sidecar**
  Evidence: `03-platform/tools/audit-flush/src/nats-consumer.mjs` is optional; sink fails softly.
  Risk: Non-durable default path. Production deployments use NATS JetStream → WORM, but the default is best-effort.
  Fix: Document the durability contract; fail closed if NATS is configured but unreachable.

- **[P2] "Offline queue" is a boolean flag (`isDelayedOfflineReplay`), not a durable queue implementation**
  Evidence: `03-platform/tools/replay-protection/src/verifier.mjs` — flag computed from `clockSkewMs > 300000`.
  Fix: Rename to `isDelayedReplay` or implement actual offline queue in mobile repo.

- **[P2] `pnpm typecheck` / `pnpm lint` / `pnpm build` cover <25% of workspace packages**
  Evidence: Turbo runs only packages with scripts defined; 12+ packages have no typecheck, 13 have no build.
  Fix: Add minimal typecheck/lint/build scripts to all packages, or document intentional exclusions.

- **[P2] 6 missing READMEs in top-level directories**
  Evidence: `.baseline/`, `.github/`, `04-ship/docker/`, `04-ship/kubernetes/`, `04-ship/monitoring/`, `04-ship/terraform/` lack READMEs.
  Fix: Add index READMEs per repo hygiene assessment.

---

## Core Scorecard

| Dimension                         | Weight | Score | Confidence | Notes                                                                                      |
| --------------------------------- | -----: | ----: | ---------- | ------------------------------------------------------------------------------------------ |
| Code Quality                      |     15 |   6.5 | B          | Gateway has hidden lint debt; typecheck/build cover <25% of packages; coverage stale       |
| Repo / Folder Hygiene             |     10 |   7.5 | B          | Docs-standard 8.5 + repo hygiene 8.75 averaged; 6 missing READMEs; validate-all passes     |
| Security                          |     20 |   8.2 | B          | Strong static validators + fail-closed patterns; FIPS gap at app level; pen-test external  |
| Global South Resilience           |     15 |   5.5 | B          | USSD solid; replay protection strong; "offline queue" is a flag; no durable queue in repo  |
| Ecosystem Integration             |     15 |   7.0 | B          | Proven cross-repo unblock (INF-49/#60); PRD-002 audit path incomplete                      |
| Agentic Maturity                  |     10 |   8.0 | B          | Strong gates + policy checks; agent safety docs in place; no raw AI on consequential paths |
| Enterprise / Production Readiness |     15 |   6.9 | B          | IaC mature; DR script structural; live RDS restore = operator; default audit sink = stdout |

### Core Weighted Score

- Raw weighted score: **7.1**
- Applied caps: **none**
  - Unresolved critical: N/A
  - 2+ unresolved high on consequential: N/A
  - Non-durable audit default path noted as P2; production path uses NATS → WORM
- Final core score: **7.1**

---

## Lens Scores

### Investor / Sequoia-Style

| Area                           | Weight | Score | Notes                                                        |
| ------------------------------ | -----: | ----: | ------------------------------------------------------------ |
| Technical Differentiation      |     25 |   7.0 | Strong governance validators; hidden lint debt drags         |
| Execution Credibility          |     25 |   7.3 | Recent staging unblock demonstrates velocity; coverage stale |
| Ecosystem Leverage             |     20 |   6.2 | Cross-repo enablement concrete; PRD-002 still open           |
| Commercialization Readiness    |     15 |   7.5 | External keys + PRD-002 still open; SOC2 pending             |
| Platform Compounding Potential |     15 |   6.8 | Central gates compound; resilience gap limits moat           |

- Final investor lens score: **7.0** — credible beta with execution credibility

### Enterprise Buyer

| Area                           | Weight | Score | Notes                                                                         |
| ------------------------------ | -----: | ----: | ----------------------------------------------------------------------------- |
| Control Environment            |     25 |   7.6 | Strong IaC + policy checks; staged evidence improving                         |
| Security and Auditability      |     25 |   7.5 | Audit-signer, WORM modules, validators; pen-test still external; FIPS gap     |
| Integration Reliability        |     20 |   6.7 | PRD-002 audit path + identity contract not yet "green"                        |
| Operability and Supportability |     15 |   6.5 | Runbooks exist; 6 missing READMEs; staging WAF tuned                          |
| Deployment Readiness           |     15 |   6.2 | Build gates strong; still some manual steps for staging/production ceremonies |

- Final enterprise buyer lens score: **7.0** — serious production candidate with known compliance gaps

### African Sovereign / DFI

| Area                           | Weight | Score | Notes                                                                |
| ------------------------------ | -----: | ----: | -------------------------------------------------------------------- |
| Mission and Regional Fit       |     15 |   7.5 | Clear Africa-first posture in infra choices (af-south-1)             |
| Global South Resilience        |     25 |   6.0 | Replay protection strong; "offline queue" is a flag; USSD functional |
| Governance and Trust           |     25 |   7.8 | Sovereign authority keys placeholder pending #86; strong docs        |
| Institutional Interoperability |     15 |   7.2 | Strong docs + runbooks; production key provenance still pending      |
| Long-Term Strategic Value      |     20 |   6.3 | Platform credible; needs production ceremony + FSCA engagement       |

- Final sovereign / DFI lens score: **6.9** — credible beta, regulator engagement needed

---

## Top Remediation Items

| Priority | Item                                                                     | Owner                | Dependency                        | Target     |
| -------- | ------------------------------------------------------------------------ | -------------------- | --------------------------------- | ---------- |
| P0       | Sign pen-test SOW (EXT-INF-002)                                          | Leadership           | SensePost/Nclose vendor selection | 2026-06-15 |
| P0       | Engage SOC 2 Type I auditor and produce gap analysis                     | CISO + Finance       | Auditor selection                 | 2026-06-30 |
| P1       | Add lint script to compliance-gateway; remediate 34 hidden ESLint errors | Platform Engineering | none                              | 2026-06-15 |
| P1       | Finish PRD-002 infra deploy: amd64 image + prove `/audit/bundles` ≠ 404  | Platform Lead        | ECR buildx amd64                  | this week  |
| P1       | Appoint named CISO/vCISO and establish monthly board reporting           | CEO / Board          | Recruitment                       | 2026-06-30 |

---

## One-Point-Uplift Conditions

- **Core (+1.0 to 8.1):** Add typecheck + lint scripts to all 15 workspace packages; bring compliance-gateway branch coverage back to ≥90%; close 6 missing READMEs.
- **Investor (+1.0 to 8.0):** Demonstrate PRD-002 audit route "Tier A" (route ≠404 + nonce gate) on staging in CI.
- **Enterprise (+1.0 to 8.0):** Publish a single, replayable runbook for PRD-002 with success criteria + evidence capture artifacts; sign pen-test SOW.
- **Sovereign/DFI (+1.0 to 7.9):** Complete infra #86 ceremony and protocols #61 rotation to `key_status: production` with dated evidence; file SARB notification.

---

## Final Summary

- **Core verdict:** IR **7.1/10** — credible beta with strong security posture and known engineering-coverage gaps. The hidden lint debt and narrow typecheck/build coverage are the biggest honest drags on the score.
- **Investor verdict:** **7.0/10** — execution credibility is real (staging unblocks, 38 gates green), but technical differentiation is diluted by monorepo hygiene gaps.
- **Enterprise verdict:** **7.0/10** — control environment is solid for a startup, but SOC 2 and pen-test are prerequisites for Fortune 500 conversations.
- **Sovereign/DFI verdict:** **6.9/10** — Africa-first posture and replay protection are genuine differentiators. FSCA/SARB engagement and production key ceremony are the path to 8.0+.

**Biggest Risk:** Confusing **IR** (engineering) with **XC** (legal/GTM) — demoralizes eng when outsiders have not signed.

**Biggest Opportunity:** **IR already unblocks velocity**; closing XC unlocks pilot revenue without requiring another "9.0 engineering" myth.
