---
title: 'Full Audit — gtcx-infrastructure'
status: 'current'
date: '2026-06-01'
owner: 'gtcx-infrastructure'
head: '6834b47636101ce3a80066b111bc3b0afd806fb6'
rubricId: 'gtcx-infra-canonical-v2'
supersedes: '01-docs/05-audit/full-audit-2026-05-31.md'
sources:
  - 01-docs/05-audit/SCORING.md
  - 01-docs/05-audit/scoring-rubric.json
  - 01-docs/05-audit/AUDIT-RECONCILIATION.md
  - 01-docs/05-audit/latest.json
  - 01-docs/05-audit/execution-roadmap.md
  - 01-docs/05-audit/external-dependencies-register-2026-05-31.md
  - .github/workflows/ci.yml
  - 03-platform/tools/03-platform/scripts/validate-all.mjs
  - 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs
---

# Full Audit — gtcx-infrastructure (2026-06-01)

Post-merge assessment at `6834b476` (#85 on `main`). Six phases + sprint synthesis.

> **Scoring rule (v2):** **IR** = internal engineering only. **XC** = external/GTM blockers (separate track). IR is **not** reduced by unsigned DPAs or missing pilot owners. See `01-docs/05-audit/SCORING.md`.

## Canonical Scorecard

### Track 1 — Internal engineering (repo-controlled)

| Metric                                  | Score      | How computed                                             |
| --------------------------------------- | ---------- | -------------------------------------------------------- |
| **Internal Engineering Readiness (IR)** | **7.6/10** | Weighted sum of 7 in-repo dimensions + CI penalties only |

| Dimension             | Weight | Ledger base | After CI penalty |
| --------------------- | ------ | ----------- | ---------------- |
| codeQuality           | 15%    | 8.0         | **8.0**          |
| repoHygiene           | 12%    | 8.5         | **7.9**          |
| security              | 15%    | 8.9         | **8.9**          |
| globalSouthResilience | 10%    | 6.8         | **6.8**          |
| ecosystemIntegration  | 10%    | 6.8         | **6.8**          |
| agenticMaturity       | 13%    | 8.2         | **8.2**          |
| enterpriseReadiness   | 25%    | 6.9         | **6.9**          |

### Track 2 — External / GTM blockers (does NOT reduce IR)

| Metric                            | Score      | How computed                                                              |
| --------------------------------- | ---------- | ------------------------------------------------------------------------- |
| **External / GTM Clearance (XC)** | **9.0/10** | 10 − 1.0 open burden (EXT-INF-013, EXT-INF-014, EXT-INF-002, EXT-INF-003) |

| Category  | Open burden |
| --------- | ----------- |
| gtm       | 0.25        |
| legal     | 0.25        |
| assurance | 0.30        |
| operator  | 0.20        |

Register: `01-docs/05-audit/external-dependencies-register-2026-05-31.md`

Recompute: `node 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs --write`

**Retired:** `certifiedReadiness`, `CR = IR − gap`. **Supplementary:** SIGNAL ≈9.6 (`signal-scorecard.json`).

---

## PHASE 1: ARCHITECTURE AUDIT

### Scorecard

| Dimension             | Rating           | Top Issue                                                                                                                                                                                                                                        |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spec Fidelity         | **Strong**       | Execution roadmap and `validate-all.mjs` align; README CI badge claims "Passing" while `main` `ci` job failed on `format:check` (run `26743741600`).                                                                                             |
| Structural Integrity  | **Strong**       | Clear split: `04-ship/` (IaC/K8s/bash), `03-platform/tools/` (Node services), `01-docs/` (governance). `deployment-guard` extracts policy from `deploy.sh` but deploy path remains bash-primary.                                                 |
| Code Quality          | **Good**         | Compliance gateway production fail-closed (`server.mjs:86-99`); replay path normalization (`middleware.mjs:123-134`). Gateway coverage gates use 85% branches where broker integration is soft-loaded (`compliance-gateway/package.json:12-13`). |
| Testability           | **Good**         | `run-package-tests.mjs` fixes Linux glob drift; contract tests in `03-platform/tools/contract-tests/`. Redis/NATS paths use injectable stores or mocks.                                                                                          |
| Operational Readiness | **Mostly ready** | 38+ automated gates; release-evidence generation in CI (`ci.yml:91-112`). Structural DR/WORM gates in-repo; live recurrence = **XC** track (EXT-INF-003).                                                                                        |
| Consistency           | **Good**         | Node `>=20.18.0` enforced (`node-version-floor-check.mjs`, `ci.yml:23`). Minor drift: static README badges vs live Actions.                                                                                                                      |

### Issues

| Severity | Category     | Title                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**   | Ops/CI       | `[P1] Hygiene — main branch CI red on Prettier` — Evidence: Actions run `26743741600`, job `ci`, step `pnpm format:check`; file `01-docs/05-audit/distribution-snapshots/2026-06-01.json`. Impact: `main` does not match README "CI-Passing" badge. Fix: `pnpm format --write 01-docs/05-audit/distribution-snapshots/2026-06-01.json` + commit or add snapshot to `.prettierignore` with documented rationale. |
| **P2**   | Architecture | `[P2] Structural — Bash deploy surface remains authority` — Evidence: `README.md:23-25`, `04-ship/03-platform/scripts/deploy.sh:1-59`. Impact: policy logic split between bash and `03-platform/tools/deployment-guard/`. Fix: continue `gtcx-ctl` migration; gate deploy via `deployment-guard` CLI only.                                                                                                      |
| **P2**   | Consistency  | `[P2] Docs — README shields not wired to Actions` — Evidence: `README.md:3-6` static badges. Impact: institutional readers see false green. Fix: Shields.io workflow badge or remove static claims.                                                                                                                                                                                                             |
| **P3**   | Dead code    | `[P3] Consistency — SessionStore abstract throws uncovered` — Evidence: `ussd-handler` coverage report `session.mjs:20-21,29-30,37-38`. Impact: none functional. Fix: optional `/* c8 ignore */` on abstract stubs or trivial subclass test.                                                                                                                                                                    |

---

## PHASE 2: SECURITY AUDIT

### Authentication & Authorization

- **Production gateway auth** requires `COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON` (`auth.mjs:52-59`); dev defaults to read-only token (`auth.mjs:62-71`).
- **Audit bundle tenancy** bound to signed DID (roadmap S1-02; tests at `handler.test.mjs` per roadmap).
- **Replay guard** refuses middleware without `verifySignature` (`middleware.mjs:143-147`).

| Severity | Issue                           | Evidence                                                                                                                  | Fix                                                                                              |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **P2**   | Cross-repo contract checkout    | `cross-repo-contract.yml:39-40` uses `secrets.GTCX_REPO_TOKEN`; failures show "Repository not found" when secret missing. | Add org secret or scope workflow to infra-only contract tests until token exists.                |
| **P2**   | Trivy action pinned to `master` | `ci.yml:461`, `ci.yml:476` comment "pin: master".                                                                         | Pin immutable SHA; dependabot group already exists (#74).                                        |
| **P3**   | Dev auth default token          | `auth.mjs:3-4`, `DEFAULT_DEV_TOKEN`.                                                                                      | Document in orientation; ensure `NODE_ENV=production` never ships with defaults (already gated). |

### Data Protection

- Dual PostgreSQL: operational vs append-only audit (`CLAUDE.md`, `dr-test.sh:25-32`).
- DR script fails closed on missing credentials (`dr-test.sh:25-32`).
- Release evidence signed in CI dry-run (`runtime-evidence-check.mjs` in validate-all).

| Severity | Issue                         | Evidence                                                          | Fix                                                                                   |
| -------- | ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **P1**   | WORM recurrence not automated | EXT-INF-003 in `external-dependencies-register-2026-05-31.md:53`. | Wire `upload-release-evidence-to-worm.mjs` on `main` merge with OIDC role.            |
| **P2**   | AI provider keys in env       | `server.mjs:19-22`.                                               | Enforce secret manager refs in K8s overlays; validate via `validate-environment.mjs`. |

### Input Validation

- Replay path traversal hardened (`middleware.mjs:123-134`).
- KYC S3 key control-char rejection (S2-07).
- Trusted XFF CIDRs (S2-04).

### Dependency Security

- `audit-with-acceptance.mjs` in CI (`ci.yml:29-33`).
- Open dependabot PRs: **tier 4 AI SDK** (#69–73, #72, #76) — major version jumps.
- `@types/node` pinned via dependabot policy (Q7).

| Severity | Issue                              | Evidence                                 | Fix                                                            |
| -------- | ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **P1**   | AI SDK v5→v6 batch                 | PR #69 `ai` 5→6, #72–73 provider majors. | Dedicated migration sprint; do not merge via dependabot alone. |
| **P2**   | `pg`, `lint-staged`, action majors | #78, #81, #79, #75.                      | Merge one-at-a-time after `main` CI green.                     |

### Infrastructure Security

- Terraform modules: VPC, EKS private API, WAF, Config rules (`README.md:93-100`).
- Kyverno policies validated (`kyverno-policy-validator.mjs`).
- Mesh injection verified statically (`verify-mesh-injection.mjs`) — not runtime cluster proof.

### Compliance Posture

- SOC2 scaffolding + agent owners gate (`soc2-agent-owners-check.mjs`).
- Pen-test intake evidence present; **SOW signature open** (EXT-INF-002, S2-13).
- External / GTM clearance **XC 9.0** (1.0 burden open) — separate from IR; see EXT-INF register.

---

## PHASE 3: GTM READINESS

Stages (S0 prototype → S6 defense). Assessment uses `01-docs/08-gtm/overview.md`, `pilot-success-criteria.md`, execution roadmap.

| Stage                   | Technical                                 | Commercial              | Trust                       | Operational            | AI-Specific           | Verdict                                     |
| ----------------------- | ----------------------------------------- | ----------------------- | --------------------------- | ---------------------- | --------------------- | ------------------------------------------- |
| **S0 Prototype**        | Compose stack, local gateway              | N/A                     | Dev tokens only             | Manual                 | NL query demo         | **Ready**                                   |
| **S1 Lab**              | CI + validate-all 38 gates                | Sandbox docs exist      | Signed audit chain in tests | DR dry-run structural  | Eval pipeline in CI   | **Ready**                                   |
| **S2 Pilot-ready**      | Testnet overlay, replay guard prod policy | ZWCMP criteria written  | WORM one-time proof doc     | DR script + CI fixture | Gateway + MCP shipped | **Partially Ready** — EXT-INF-013 owner TBD |
| **S3 Controlled pilot** | Cloudflared tunnel gate (S3-10)           | Chamber of Mines target | Pen-test SOW unsigned       | `main` CI red (format) | Tier-4 deps open      | **Not Ready**                               |
| **S4 Production**       | EKS module, prod overlay                  | Sales-led motion (Q6)   | No Type II SOC2             | Bash deploy authority  | —                     | **Not Ready**                               |

**Stopped** at S3/S4 boundary (two consecutive Not Ready from S3 onward).

### Outputs

- **Current GTM stage:** **S2 — Pilot-ready (structural)** with **S3 blocked** on human/legal externalities.
- **First realistic deal (90 days):** ZWCMP 30-day pilot (`pilot-success-criteria.md:22-27`) — requires EXT-INF-013 owner, EXT-INF-014 DPA/signature, EXT-INF-002 pen-test SOW.
- **Top 5 stage gate blockers:**
  1. EXT-INF-013 — named pilot owner + cadence call
  2. EXT-INF-014 — DPA + pilot agreement
  3. EXT-INF-002 — pen-test SOW executed
  4. `main` CI trust (format + org checks)
  5. EXT-INF-003 — recurring WORM evidence on every merge
- **AI trust gaps:** Major AI SDK upgrades unmerged; eval pipeline passes but not tied to pilot acceptance metrics.
- **90-day copy test:** Compliance gateway + signed audit chain + replay guard are **copyable**; **moat** is regulator-grade evidence delivery, jurisdiction catalog, and operational proof in af-south-1 — not yet fully demonstrated live.

---

## PHASE 4: HYGIENE AUDIT

| Category          | Score /10 | Issues                                                                                        |
| ----------------- | --------- | --------------------------------------------------------------------------------------------- |
| Documentation     | **9**     | Roadmap, external register, trust model current; README badges stale                          |
| File Structure    | **9**     | `04-ship/` vs `03-platform/tools/` vs `01-docs/` clear; ADR and audit supersession pattern    |
| Naming            | **8**     | Conventional commits; some `gtcx-production` vs `gtcx` namespace variants in overlays         |
| Package/Build     | **8**     | pnpm workspaces + turbo; docs-site excluded from default CI build (`ci.yml:65`)               |
| Code Hygiene      | **8**     | `empty-catch-check`, ESLint on packages; abstract class coverage noise                        |
| Test Hygiene      | **8**     | c8 gates 90% (85% where documented); portable test runner                                     |
| CI/CD             | **7**     | PR #85 fixed Linux gates; `main` format failure; codeql/security/contract-matrix org failures |
| Dependency Health | **7**     | 12+ open dependabot PRs; tier-4 held correctly                                                |
| Git Hygiene       | **9**     | Husky + lint-staged; no tfstate in tree gate (`ci.yml:52-62`)                                 |
| Monorepo          | **9**     | `pnpm-workspace.yaml` documents intentional non-package dirs                                  |

Checklist (failures):

- ✗ **CI/CD** — `main` `ci` job failed `format:check` on `01-docs/05-audit/distribution-snapshots/2026-06-01.json` (run `26743741600`)
- ✗ **CI/CD** — `codeql`, `security`, `contract-matrix` jobs fail (org token / SARIF upload)
- ~ **Documentation** — README claims CI passing without workflow badge
- ✓ **Git** — Terraform artifact gate in CI
- ✓ **Test** — `validate-all.mjs` 38 gates after #85

---

## PHASE 5: PRODUCTION READINESS

| Area                  | Rating           | Evidence                                                                                                        |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Deployment**        | **Mostly Ready** | `deploy.sh` canary + rollback + `--approval-ticket` (`deploy.sh:15-16,48-49`); `deployment-guard` policy module |
| **Monitoring**        | **Mostly Ready** | Prometheus rules, alert runbook anchor gate; Alertmanager fail-closed (S2-09)                                   |
| **Incident Response** | **Gaps**         | IRP v1 agent-prep done; board sign-off = external; PagerDuty drill dry-run only                                 |
| **Disaster Recovery** | **Gaps**         | Structural DR evidence gate; live RDS restore = operator (S3-02); CI uses `dropdb`/`DR_SKIP_PROTOCOL_HEALTH`    |
| **Capacity**          | **Gaps**         | Soak baseline gate exists; no recent load-test artifact on `main` post-merge                                    |
| **Dependencies**      | **Mostly Ready** | Replay Redis fail-closed in production tests; budget-store Redis with memory fallback                           |

| Severity | Issue                                | Fix                                                                  |
| -------- | ------------------------------------ | -------------------------------------------------------------------- |
| **P1**   | No recurring WORM upload on merge    | GitHub Actions workflow post-`ci` success + OIDC to staging bucket   |
| **P2**   | Multi-region active-active deferred  | ADR + roadmap — acceptable for pilot; document RTO for single-region |
| **P2**   | `security` job SARIF upload failures | Fix `permissions` / CodeQL integration for Trivy SARIF               |

---

## PHASE 6: SPRINT PLAN (SYNTHESIS)

### 6.1 Intelligence Synthesis

| #   | Finding                                              | Source            | Severity    | Status                  |
| --- | ---------------------------------------------------- | ----------------- | ----------- | ----------------------- |
| 1   | `main` CI red — Prettier on distribution snapshot    | Phase 4 / Actions | P1          | **open**                |
| 2   | Org-level codeql/security/contract-matrix failures   | Phase 2 / Actions | P1          | **open**                |
| 3   | ZWCMP owner unsigned (EXT-INF-013)                   | GTM / roadmap     | P0 external | **open**                |
| 4   | DPA + pilot agreement (EXT-INF-014)                  | GTM               | P0 external | **open**                |
| 5   | Pen-test SOW (EXT-INF-002)                           | Security          | P0 external | **open**                |
| 6   | AI SDK v5→v6 dependabot batch                        | Security          | P1          | **open**                |
| 7   | WORM recurrence (EXT-INF-003)                        | Production        | P1          | **open**                |
| 8   | README static CI badges                              | Hygiene           | P2          | **open**                |
| 9   | Bash deploy authority vs gtcx-ctl                    | Architecture      | P2          | **open**                |
| 10  | Tier 3 dependabot backlog (#78, #81, actions)        | Hygiene           | P2          | **open**                |
| 11  | External blockers (XC burden 1.0) — not an IR defect | GTM / legal       | P0 ext      | **open** — see XC track |
| 12  | validate-all 38 gates green on PR (post-#85)         | Phase 1           | —           | **closed**              |

### 6.2 Innovation Scan

**Refactoring**

- Finish **gtcx-ctl** as sole deploy entry (`package.json:30`, `deploy.sh` deprecation path).
- Consolidate evidence pipelines: CI artifact → WORM → score ledger (single `evidence:release-bundle` operator UX).

**Moat (90-day copy test)**

- **Signed evidence bundle API** with jurisdiction-specific rendering + offline verifier — copyable code, hard-to-copy **trust graph** (catalog keys, pilot legal artifacts, live af-south-1 ops).
- **USSD + low-bandwidth** path for field operators — distribution advantage in Global South, not generic K8s.

**AI-native**

- Compliance gateway as **workflow intelligence** (brief generation, exception surfacing) — not sidebar chat; deepen eval-pipeline gates tied to pilot KPIs (`pilot-success-criteria.md` metrics).

### 6.3 Sprint Architecture (6 × 1 week)

## Sprint 1: Main CI truth (1 week)

Layer mix: Remediation 3 | Evolution 0 | Innovation 0

### Goals

Restore trustworthy `main` CI; fix org check blockers where repo-controlled.

### Tasks

| #   | Task                                                  | Layer       | Files                                                     | Effort | Why It Matters              |
| --- | ----------------------------------------------------- | ----------- | --------------------------------------------------------- | ------ | --------------------------- |
| 1   | Fix Prettier on distribution snapshot                 | Remediation | `01-docs/05-audit/distribution-snapshots/2026-06-01.json` | S      | Unblocks `ci` on every push |
| 2   | Add workflow badge or remove false README shields     | Remediation | `README.md:3-6`                                           | S      | Institutional trust in docs |
| 3   | Configure `GTCX_REPO_TOKEN` or narrow contract-matrix | Remediation | `.github/workflows/cross-repo-contract.yml`               | M      | Cross-repo evidence gate    |
| 4   | Pin Trivy action SHA                                  | Remediation | `.github/workflows/ci.yml:461,476`                        | S      | Supply-chain hygiene        |

### Definition of Done

- `gh run list --workflow ci.yml --branch main` shows `ci` **success**
- README does not claim green CI without evidence

### Commit Plan

- `fix(docs): format distribution snapshot for ci`
- `fix(ci): pin trivy action and document repo token for contract matrix`

### Sprint Value Statement

**Honest green `main`** — prerequisite for dependabot merges and auditor conversations.

---

## Sprint 2: External pilot unblock (1 week)

Layer mix: Remediation 1 | Evolution 0 | Innovation 0

### Goals

Close human gates for ZWCMP S3.

### Tasks

| #   | Task                                | Layer       | Files                                                              | Effort    | Why It Matters             |
| --- | ----------------------------------- | ----------- | ------------------------------------------------------------------ | --------- | -------------------------- |
| 1   | Assign EXT-INF-013 owner + calendar | Remediation | `01-docs/05-audit/pilot-success-criteria.md:27`, external register | S (human) | Unblocks all legal work    |
| 2   | Execute pen-test SOW signature      | Remediation | `01-docs/08-gtm/regulatory/pentest-scope-rfp.md`, EXT-INF-002      | M (human) | Bet 1 external validation  |
| 3   | Legal review SLA draft              | Remediation | `01-docs/10-compliance/verification-sla-draft.md`, EXT-INF-015     | M (human) | Pilot agreement dependency |

### Definition of Done

- EXT-INF-013/002 rows show `in-progress` with named owner and dates in register

### Sprint Value Statement

Moves GTM from **S2 structural** to **S3 negotiable**.

---

## Sprint 3: Dependency & AI SDK migration (1 week)

Layer mix: Remediation 2 | Evolution 1 | Innovation 0

### Goals

Clear tier 3 dependabot; controlled AI SDK upgrade.

### Tasks

| #   | Task                                    | Layer       | Files                                                           | Effort | Why It Matters              |
| --- | --------------------------------------- | ----------- | --------------------------------------------------------------- | ------ | --------------------------- |
| 1   | Merge `pg`, `lint-staged` PRs           | Remediation | `pnpm-lock.yaml`, consumer packages                             | S      | Low-risk deps               |
| 2   | AI SDK v5→v6 migration branch           | Evolution   | `03-platform/tools/compliance-gateway/`, `providers.mjs`, tests | L      | Closes #69–73 safely        |
| 3   | Re-run eval-pipeline + compliance tests | Remediation | `03-platform/tools/eval-pipeline/`, CI                          | M      | Proves NL layer still works |

### Definition of Done

- No open tier-4 dependabot PRs without migration commit
- `pnpm test` + gateway coverage gate pass

### Sprint Value Statement

**Secure dependency surface** without breaking the compliance gateway contract.

---

## Sprint 4: Live operational evidence (1 week)

Layer mix: Remediation 2 | Evolution 1 | Innovation 0

### Goals

Close S3-04 live gap and EXT-INF-003.

### Tasks

| #   | Task                                  | Layer       | Files                                                           | Effort  | Why It Matters                |
| --- | ------------------------------------- | ----------- | --------------------------------------------------------------- | ------- | ----------------------------- |
| 1   | Wire WORM upload on `main` merge      | Remediation | new workflow or `ci.yml`, `upload-release-evidence-to-worm.mjs` | M       | Recurring compliance evidence |
| 2   | Operator live DR against staging RDS  | Remediation | `04-ship/03-platform/scripts/dr-test.sh`, evidence dir          | L (ops) | S3-02 live half               |
| 3   | Staging smoke probe runbook execution | Evolution   | `01-docs/04-ops/runbooks/staging-smoke-probe.md`                | M       | Runtime proof                 |

### Definition of Done

- `worm-runtime-evidence-*.md` updated with recurring object metadata
- DR artifact with live restore timestamps

### Sprint Value Statement

**IR** `enterpriseReadiness` can move toward 8.0+ with in-repo WORM workflow + fresh DR/soak artifacts (XC unchanged).

---

## Sprint 5: Deploy control plane (1 week)

Layer mix: Remediation 1 | Evolution 2 | Innovation 0

### Goals

Reduce bash authority; harden production deploy path.

### Tasks

| #   | Task                                           | Layer       | Files                                                                                                             | Effort | Why It Matters        |
| --- | ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- | ------ | --------------------- |
| 1   | Route `deploy.sh` through deployment-guard CLI | Evolution   | `04-ship/03-platform/scripts/deploy.sh`, `03-platform/tools/deployment-guard/03-platform/src/cli/deploy-gate.mjs` | M      | Single policy brain   |
| 2   | Expand gtcx-ctl validate-environment in CI     | Evolution   | `03-platform/tools/control-plane/`, `ci.yml`                                                                      | M      | Pre-flight env checks |
| 3   | Document bash deprecation timeline             | Remediation | `README.md` operational constraints                                                                               | S      | Operator clarity      |

### Definition of Done

- Production deploy requires `deployment-guard` exit 0 before kubectl

### Sprint Value Statement

**Operational maturity** — fewer foot-guns in bash-only deploys.

---

## Sprint 6: Pilot moat — evidence delivery (1 week)

Layer mix: Remediation 0 | Evolution 1 | Innovation 2

### Goals

Ship pilot-differentiating evidence UX.

### Tasks

| #   | Task                                      | Layer      | Files                                                                            | Effort | Why It Matters            |
| --- | ----------------------------------------- | ---------- | -------------------------------------------------------------------------------- | ------ | ------------------------- |
| 1   | Pilot KPI dashboard from Prometheus rules | Innovation | `04-ship/kubernetes/base/monitoring/`, pilot criteria                            | M      | Measurable 30-day success |
| 2   | Offline verifier pack for ZWCMP           | Innovation | `03-platform/tools/compliance-data/03-platform/scripts/verify-catalog.mjs`, docs | M      | Regulator-facing moat     |
| 3   | USSD path soak test in CI                 | Innovation | `03-platform/tools/ussd-handler/`, load tests                                    | M      | Global South distribution |

### Definition of Done

- Pilot success criteria metrics visible in Grafana or exported report
- Verifier doc committed under `01-docs/05-audit/vendor-outreach/zwcmp/`

### Sprint Value Statement

**Defensible pilot** — proof operators and regulators can hold, not just code that runs in CI.

---

### 6.4 Score impact by track (qualitative — no projected tables)

| Milestone                     | Track  | Effect                                            |
| ----------------------------- | ------ | ------------------------------------------------- |
| Sprint 1: green `main` CI     | **IR** | `repoHygiene` +0.1 via ci-snapshot                |
| Close EXT-INF-013/014/002     | **XC** | +0.8 clearance (burden 1.0 → 0.2)                 |
| Close EXT-INF-003             | **XC** | +0.2 clearance                                    |
| AI SDK migration (controlled) | **IR** | Refresh `security` / `codeQuality` ledger entries |

Do not subtract external progress from IR. Update ledger or `externalBlockers[].status`, then `--write`.

### 6.5 Meta-Learning

- **Teaches:** Agent-led closure works when gates are **executable** (`validate-all.mjs`); human/legal items must stay in EXT-INF register, not sprint fiction.
- **Constraining decisions:** Bash-first ops slowed gtcx-ctl adoption; sales-led GTM correctly deprioritizes npm-publish-first motion.
- **6-month radar:** SOC2 Type II observation, ISO defer, HSM signing migration, eu-west-1 active-active.
- **From scratch:** Single control plane (Rust/Go or Node) + evidence plane day one; fewer parallel bash scripts.

---

## OUTPUT SUMMARY

**Current State:** **IR 7.6** — strong in-repo engineering (38 gates, sprint 2/3 closed) with **`main` CI format failure** (IR hygiene hit). **XC 9.0** — four external/GTM blockers open (not an engineering score drop).

**Target State:** **IR ~8.0+** (green CI, deps migrated). **XC 10.0** (EXT-INF register clear). Tracks move independently.

**Critical Path:**

1. **IR:** Fix `main` `format:check` (distribution snapshot)
2. **XC:** EXT-INF-013 pilot owner + EXT-INF-014 DPA
3. **XC:** EXT-INF-002 pen-test SOW

**Timeline:** IR fixes in days; XC parallel with leadership/legal (weeks). Do not wait for XC to ship engineering.

**Biggest Risk:** Confusing **IR** (engineering) with **XC** (legal/GTM) — demoralizes eng when outsiders have not signed.

**Biggest Opportunity:** **IR already unblocks velocity**; closing XC unlocks pilot revenue without requiring another “9.0 engineering” myth.

---

## Agent Context Attestation

- [x] Phase 1: Baseline loaded (`CLAUDE.md`, README, `package.json`)
- [x] Phase 2: Repo context (`execution-roadmap.md`, `latest.json`, CI workflows)
- [x] Phase 3: Current state (`main` @ `6834b476`, Actions run `26743741600`)
- [x] Phase 4: Persona — platform-architect / regulatory-audit frame
- [x] Phase 5: Full six-phase deliverable
