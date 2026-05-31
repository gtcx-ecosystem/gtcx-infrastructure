---
title: 'Full Audit — gtcx-infrastructure (2026-05-31)'
status: current
date: '2026-05-31'
audit_type: full
target_repo: gtcx-infrastructure
audit_date: 2026-05-31
owner: gtcx-infrastructure
tier: critical
tags: ['audit', 'full-audit', 'gtm', 'security', 'hygiene', 'production-readiness', 'sprint-plan']
review_cycle: on-change
head: afce75a
provenance: 'Fresh six-phase audit at HEAD afce75a after Sprint 2 hardening (S2-01–S2-08, S2-14 closed). Internal only — not external attestation.'
internal_readiness: 7.3
certified_composite: 6.6
supersedes: docs/audit/full-audit-2026-05-22.md
---

# Full Audit — gtcx-infrastructure (2026-05-31)

**HEAD:** `afce75ac` (`afce75a`) — branch `docs/roadmap-update-2026-05-30`, 9 commits ahead of origin  
**Prior full audit:** [`full-audit-2026-05-22.md`](./full-audit-2026-05-22.md) (9.0 self-score; superseded by post-roadmap re-baseline 6.8/6.2)  
**Execution truth:** [`execution-roadmap.md`](./execution-roadmap.md) — Sprint 2 in progress; S2-09, S2-10, S2-11, S2-12, S2-13 open  
**Validation at audit time:** `node tools/scripts/validate-all.mjs` — **24/24 PASS**; `pnpm test` (quick) — **PASS**

## Evidence reviewed

- Global bars: `~/.claude/CLAUDE.md`, repo `CLAUDE.md`, `README.md`, `AGENTS.md`
- 20+ source paths: compliance-gateway server/auth/budget/evidence, replay middleware, KYC handler, audit-flush S3, fail-closed, budget-store, runbook-frontmatter-check, alertmanager template, deploy.sh, terraform database module, production kustomization, compliance-gateway-mcp, validate-all.mjs
- Machine scorecard: `docs/audit/latest.json` (stale head — updated in this session)
- Post-roadmap finding registry vs closure commits through `afce75a`

---

## PHASE 1: ARCHITECTURE AUDIT

| Dimension             | Rating                | Top Issue                                                                                                                                          |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec Fidelity         | **Strong (7.5/10)**   | `/audit/bundles` returns 503 until `TRADEPASS_BASE_URL` lands (`server.mjs:127-134`) — spec promises DID-bound bundles; production wiring deferred |
| Structural Integrity  | **Strong (8.0/10)**   | Clear `infra/` vs `tools/` split; 14 workspace packages; non-package `tools/policy` documented in `pnpm-workspace.yaml:21-35`                      |
| Code Quality          | **Strong (7.8/10)**   | Sprint 2 closed fail-open paths; remaining stub S3 still mutates `lastSuccessMs` (`s3-uploader.mjs:97`)                                            |
| Testability           | **Strong (8.2/10)**   | 94 `*.test.mjs` files; per-package coverage gates; adversarial fixtures for static validators (S1-04)                                              |
| Operational Readiness | **Adequate (7.0/10)** | Deploy/canary in Bash (`deploy.sh:48-49`); `gtcx-ctl` wraps scripts but production path still shell-first                                          |
| Consistency           | **Strong (7.6/10)**   | Conventional commits, turbo pipeline, agent-sync; frontmatter merge can still downgrade `tier` (S2-10)                                             |

### Issues (architecture)

| Severity | Category      | Title                                       | Evidence                                                                                       | Impact                                                                             | Fix                                                                               |
| -------- | ------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P1       | Spec Fidelity | Audit bundles feature-flagged off in prod   | `tools/compliance-gateway/src/server.mjs:122-134` — resolver null without `TRADEPASS_BASE_URL` | Pilot TradePass path cannot exercise bundle ingestion end-to-end                   | Wire resolver when protocols #55/#60 stable; keep 503 + signed refusal until then |
| P2       | Operational   | Stub S3 updates success timestamp           | `tools/audit-flush/src/s3-uploader.mjs:96-98`                                                  | Readiness/lag probes lie during dev stub                                           | S3-06: stop mutating `lastSuccessMs` on stub `send`                               |
| P2       | Operational   | Production kustomize tags are placeholders  | `infra/kubernetes/overlays/production/kustomization.yaml:43-50`                                | Direct `kubectl apply -k` without `deploy.sh` → ImagePullBackOff                   | Document-only risk if deploy.sh is mandatory; add CI gate blocking bare apply     |
| P3       | Structural    | Budget Redis backend opt-in, default memory | `tools/compliance-gateway/src/budget-store.mjs:11-18`                                          | Per-pod QPS multiplication until `GTCX_BUDGET_STORE_BACKEND=redis` in prod overlay | S2-02 wired code; Sprint 3: enforce redis backend in production ConfigMap         |
| P3       | Consistency   | Adaptive policy per-pod                     | Post-roadmap F-adaptive (carried)                                                              | Degraded fairness under HPA >10                                                    | Redis-backed policy store (deferred bank-grade item)                              |

**Architecture scorecard average: 7.7/10 internal** (up ~0.9 from 6.8 baseline after Sprint 2 closures).

---

## PHASE 2: SECURITY AUDIT

### Surface assessment

| Surface                       | State        | Evidence                                                                                                                            |
| ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Replay-guard traversal        | **Closed**   | `middleware.mjs:105-134` — `pathForExemption` rejects `%2e%2e`, backslash; fuzz tests in S1-01/S2-14                                |
| `/audit/bundles` tenant spoof | **Closed**   | `1b940d7` — DID-derived tenant; tests at `handler.test.mjs:135,267`                                                                 |
| Auth-failure visibility       | **Closed**   | `efcc01e` — `platform` tenant on failures                                                                                           |
| failClosed unwired            | **Closed**   | Wired: `s3-uploader.mjs:39`, `schemas.mjs:17`, `system-prompt.mjs:18`, `evidence-renderer.mjs:69`                                   |
| Budget store unwired          | **Closed**   | `6bfa2ad` — async `checkBudget`/`recordSpend`/`getSpend` via `budget-store.mjs`                                                     |
| Auth throttle OOM             | **Closed**   | `694c458` — bounded IP map + LRU                                                                                                    |
| XFF spoofing                  | **Closed**   | `c1dfadd` — `GTCX_TRUSTED_PROXY_CIDRS` gate                                                                                         |
| HTML evidence XSS/bidi        | **Closed**   | `a9eaa4c` — `EVIDENCE_HTML_CSP`, bidi strip in renderer                                                                             |
| KYC predictable salt          | **Closed**   | `afce75a` — `SCREENING_LOCAL_SALT` required ≥16 chars outside test (`handler.mjs:39-44`)                                            |
| Catalog self-vouching         | **Closed**   | `3729a29` — `PINNED_PUBLIC_KEY` in verify-catalog                                                                                   |
| Production unsigned audit     | **Closed**   | `server.mjs:86-99` — `process.exit(78)` when signer missing in production                                                           |
| Gate bypass regexes           | **Closed**   | F11–F14 + adversarial fixtures                                                                                                      |
| Alert routing silent fail     | **Partial**  | `docker-compose.infra.yml:151-153` — `CHANGE_ME_DEV` default for PagerDuty if env unset (F21/S2-09)                                 |
| Frontmatter tier downgrade    | **Open**     | `runbook-frontmatter-check.mjs:106-120` — second block wins; session-backfill put `tier: informational` over `critical` (F16/S2-10) |
| External pen-test             | **Not done** | S2-13 / EXT-INF-002 — SOW unsigned                                                                                                  |
| SOC 2 attestation             | **Not done** | Checklist ~92% mapped; no auditor engagement                                                                                        |

### Issues (security)

| Severity | Title                                                | Evidence                                                                                                     | Fix                                                                                                      |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| P1       | Alertmanager dev defaults can render to prod compose | `infra/docker/docker-compose.infra.yml:151` `PAGERDUTY_SERVICE_KEY:-CHANGE_ME_DEV`                           | S2-09: fail init container if keys are placeholder outside `NODE_ENV=development`; add validate-all gate |
| P2       | Frontmatter merge allows `tier:` downgrade           | `tools/scripts/runbook-frontmatter-check.mjs:117-120` — `merged = new Map(second)` with no tier rank compare | S2-10: refuse merge when `tierRank(second) < tierRank(first)`                                            |
| P2       | Stub S3 success signal                               | `s3-uploader.mjs:97`                                                                                         | S3-06                                                                                                    |
| P2       | MCP read-only but gateway token in env               | `compliance-gateway-mcp/src/server.mjs:35-36` — bearer in process env                                        | Document vault injection; optional short-lived token rotation runbook                                    |
| P3       | 16+ dependabot PRs aging                             | Post-roadmap F23                                                                                             | S2-11 Tier 1+2 merges (Q7 pin done for `@types/node`)                                                    |

### Compliance posture (honest)

| Framework        | Coverage                                                                  | Status                                     |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| SOC 2 Type I/II  | ~92% checklist mapped (`docs/gtm/regulatory/soc2-readiness-checklist.md`) | Plan ready; **no auditor**                 |
| NIST 800-53      | Mapped in security docs                                                   | No external attestation                    |
| FATF / retention | Dual DB + WORM modules                                                    | Strong IaC; pilot legal (EXT-INF-014) open |
| GDPR/POPIA       | KMS, TLS, retention floors                                                | **No DPIA artifact** in repo               |

**Security score: 7.2/10 internal** (up from 6.6; external review still caps certified view).

---

## PHASE 3: GTM READINESS

Stages assessed per command (S0→S6). **Stop rule:** two consecutive **Not Ready** at S4 and S5.

| Stage             | Verdict             | Evidence                                                                                                                           |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **S0 Prototype**  | **Ready**           | Testnet pilot live af-south-1 (`README.md:148-156`); local compose stack; gateway + MCP ship                                       |
| **S1 Alpha**      | **Ready**           | `@gtcx/audit-signer` on npm; 24/24 validate-all; compliance-gateway 174-test coverage gate                                         |
| **S2 Beta**       | **Partially Ready** | Hardening landed but pen-test unsigned (S2-13); no buyer-attested security letter                                                  |
| **S3 Pilot**      | **Partially Ready** | `pilot-success-criteria.md` complete; **GTCX owner TBD** (`pilot-success-criteria.md:27`, EXT-INF-013); DPA unsigned (EXT-INF-014) |
| **S4 Production** | **Not Ready**       | No production soak baseline (S3-03); DR drill evidence not committed (S3-02); multi-region deferred                                |
| **S5 Defense**    | **Not Ready**       | SOC 2 Type II observation not started; no indemnified SLA signed (EXT-INF-015)                                                     |

**Stopped after S4 + S5 Not Ready.**

### GTM outputs

- **Current stage:** **S3 Pilot (Partially Ready)** — infrastructure can host ZWCMP; commercial/legal gates block signature.
- **First realistic deal (90 days):** ZWCMP TradePass pilot — **conditional on EXT-INF-013 owner + EXT-INF-014 DPA by 2026-06-21** (execution-roadmap Sprint 3 headline S3-11).
- **Top 5 stage gate blockers**
  1. **EXT-INF-013** — Named GTCX pilot owner + first cadence call (`external-dependencies-register-2026-05-31.md:41`)
  2. **EXT-INF-002 / S2-13** — Pen-test SOW signature (leadership: human)
  3. **EXT-INF-014** — Zimbabwe DPA + pilot agreement PDF
  4. **TRADEPASS_BASE_URL** — Audit bundles + DID resolver production wiring (`server.mjs:127-131`)
  5. **S3-04** — Live runtime evidence bundle on WORM (release-bundle + smoke)

- **AI trust gaps:** Gateway is LLM-routed (`server.mjs` multi-provider); eval-pipeline exists but **no continuous red-team gate in CI** for gateway prompt changes; MCP is read-only (good) but depends on gateway auth posture.
- **90-day copy test:** Competitors can copy Terraform modules and HTTP shapes. **Cannot quickly copy:** signed audit chain + offline verifier + jurisdiction catalog with pinned trust anchor + sales-led regulator narrative already in GTM docs.

**GTM score contribution: 6.5/10 certified** (unchanged external ceiling until pen-test + pilot signature).

---

## PHASE 4: HYGIENE AUDIT

| Category          | Score /10 | Issues                                                                              |
| ----------------- | --------- | ----------------------------------------------------------------------------------- |
| Documentation     | 8.5       | 250+ docs; execution-roadmap current; `latest.json` head was stale until this audit |
| File Structure    | 8.5       | Clear `infra/` / `tools/` / `docs/`; ADR index present                              |
| Naming            | 8.0       | Conventional commits; roadmap filename normalized (F1 closed)                       |
| Package/Build     | 8.5       | pnpm 9.15 + turbo; Node 20.18.0 floor gate (`9829b8f`)                              |
| Code Hygiene      | 8.0       | No TODO debt in tools sources; empty-catch gate enforced                            |
| Test Hygiene      | 8.5       | Coverage gates on gateway, replay-protection; validate-all 24 gates                 |
| CI/CD             | 8.0       | `ci.yml` lint/typecheck/test/build; SHA-pinned actions gate                         |
| Dependency Health | 6.5       | Open dependabot PRs (F23); Q7 pin on `@types/node` done                             |
| Git Hygiene       | 7.5       | Branch ahead 9; clean worktree at audit time                                        |
| Monorepo          | 8.5       | Workspace boundaries explicit; exempt dirs documented                               |

### Checklist detail

| Check                  | Result             | Evidence                                              |
| ---------------------- | ------------------ | ----------------------------------------------------- |
| `pnpm agent:check`     | ✓ Pass             | Listed in `latest.json` gates                         |
| `pnpm format:check`    | ✓ Pass             | CI step                                               |
| Docs standard          | ✓ Pass             | validate-all Docs Standard gate                       |
| Docs links             | ✓ Pass             | `docs:check-links` in gates                           |
| Terraform fmt          | ✓ Pass (full mode) | validate.sh full                                      |
| Alert placeholder      | ✗ Fail             | `CHANGE_ME_DEV` default — S2-09                       |
| Frontmatter tier guard | ~ Partial          | Duplicate detection ✓; tier downgrade guard ✗ — S2-10 |

**Hygiene average: 8.0/10**

---

## PHASE 5: PRODUCTION READINESS

| Area              | Rating           | Evidence                                                                                                                                                |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployment        | **Mostly Ready** | `deploy.sh` canary 5% / 300s wait (`deploy.sh:48-49`); rollback flag; production requires ticket (`deployment-guard/gate.mjs:92`)                       |
| Monitoring        | **Mostly Ready** | S2-05 metrics on exceptions + evidence-bundle; 44 alerts with runbook_url anchors (S1-08); Alertmanager routing template complete but env defaults weak |
| Incident Response | **Mostly Ready** | 25+ runbooks; IRP v1 in GTM; alert inhibition rules (`alertmanager.yml.tpl:107-124`)                                                                    |
| Disaster Recovery | **Gaps**         | DR runbooks exist; **no committed quarterly drill artifact** (S3-02)                                                                                    |
| Capacity          | **Gaps**         | HPA on gateway; soak-test gate not wired (S3-03); load-tests under `tools/load-tests/` not in validate-all quick                                        |
| Dependencies      | **Mostly Ready** | failClosed on SDK loads; Redis budget fallback documented                                                                                               |

---

## PHASE 6: SPRINT PLAN (SYNTHESIS)

### 6.1 Intelligence synthesis

| #   | Finding                                                 | Source          | Severity    | Status                         |
| --- | ------------------------------------------------------- | --------------- | ----------- | ------------------------------ |
| 1   | Alertmanager `CHANGE_ME_DEV` leaks via compose defaults | P2 Security F21 | P1          | **open** → S2-09               |
| 2   | Frontmatter merge downgrades `tier: critical`           | P4 Hygiene F16  | P2          | **open** → S2-10               |
| 3   | Pen-test SOW unsigned                                   | GTM EXT-INF-002 | P0 external | **open** → S2-13 (human)       |
| 4   | ZWCMP owner unassigned                                  | GTM EXT-INF-013 | P0 GTM      | **open** → S1-09               |
| 5   | Dependabot PR backlog                                   | Hygiene F23     | P2          | **open** → S2-11               |
| 6   | SOC 2 owners not mapped to stories                      | S2-12           | P2          | **open**                       |
| 7   | Stub S3 `lastSuccessMs` lie                             | P5 Prod S3-06   | P2          | deferred Sprint 3              |
| 8   | `/audit/bundles` 503 without TradePass URL              | P1 Arch         | P1          | blocked on protocols           |
| 9   | Budget Redis not default in prod overlay                | P1 Arch         | P2          | config follow-up               |
| 10  | failClosed / replay / CSP / KYC / Node floor            | Sprint 2        | —           | **closed** `570ad49`–`afce75a` |
| 11  | validate-all 24/24                                      | Meta            | —           | **closed** at HEAD             |
| 12  | certified score capped without external review          | Meta            | P0          | **open** — pen-test            |

**Cross-cutting:** Sales-led motion (Q6) is correct for infra repo; engineering should not optimize developer-portal before EXT-INF-013/014 close.

**DX friction:** Two commit rule sets in user environment — use repo `AGENTS.md` + micro-commit for this repo.

**Operational blind spot:** Alert routing tested in template, not proven with real PagerDuty keys in staging.

**Performance cliff:** Memory budget backend under HPA until Redis backend enforced.

### 6.2 Innovation scan

**Refactoring**

- Finish `gtcx-ctl` as sole operator entry (reduce Bash duplication with deploy-guard).
- Contract tests package (S3-09) — cross-repo schema fixtures already stubbed in `tools/contract-tests/`.

**Moat (90-day copy test)**

- **Keeps:** Offline-verifiable audit chain + pinned catalog key + jurisdiction retention catalog — cite-able by regulators.
- **Weak:** Raw K8s/Terraform — commodity; moat is _evidence shape_ not YAML.
- **Build:** Published primitives with SLSA (S3-07) — makes compliance substrate citable in sandbox filings.

**AI-native**

- MCP morning-brief resource (`compliance-gateway-mcp/server.mjs:13-21`) — intelligence before prompt; extend to operator USSD brief, not chat sidebar.
- Eval-pipeline in CI on gateway prompt/schema changes — ambient red-team, not manual "Run AI".

### 6.3 Sprint architecture (6 × 1 week)

Aligns with existing `execution-roadmap.md` — fills S2-09/10/11/12/13 then Sprint 3.

---

## Sprint 1: Alert + metadata fail-closed (1 week)

**Layer mix:** Remediation 3 | Evolution 0 | Innovation 0

### Goals

Close F21 and F16 — no silent alert blackholes; no `tier` downgrade on doc merge.

### Tasks

| #   | Task                                                                       | Layer       | Files                                                                                           | Effort | Why It Matters                               |
| --- | -------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| 1   | Fail compose init when PagerDuty/Slack placeholders in non-dev             | Remediation | `infra/docker/docker-compose.infra.yml:150-157`, new `tools/scripts/alertmanager-env-check.mjs` | 0.5d   | Critical alerts must page, not no-op         |
| 2   | Wire alertmanager-env-check into validate-all                              | Remediation | `tools/scripts/validate-all.mjs:101` area                                                       | 0.25d  | Regression-proof                             |
| 3   | Tier rank guard in frontmatter merge                                       | Remediation | `tools/scripts/runbook-frontmatter-check.mjs:117-140`, `runbook-frontmatter-check.test.mjs`     | 0.5d   | DR/deployment runbooks stay `tier: critical` |
| 4   | Adversarial fixture: merge `tier: informational` over `critical` must fail | Remediation | `tools/scripts/runbook-frontmatter-check.test.mjs`                                              | 0.25d  | Proves S2-10                                 |

### Definition of Done

- `node tools/scripts/validate-all.mjs` 25/25 (new gate)
- Fixture proves tier downgrade rejected
- `execution-roadmap.md` S2-09 + S2-10 → done

### Commit Plan

1. `fix(observability): fail closed on alertmanager placeholder env`
2. `fix(docs): refuse tier downgrade in frontmatter merge`

### Sprint Value Statement

Operators trust alerts and doc tier metadata again — two silent-failure modes from the May session closed.

---

## Sprint 2: External assurance prep (1 week)

**Layer mix:** Remediation 1 | Evolution 1 | Innovation 0

### Goals

Sign pen-test SOW; map SOC 2 owners; merge safe dependabot Tier 1+2.

### Tasks

| #   | Task                                 | Layer       | Files                                                                                      | Effort | Why It Matters         |
| --- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------ | ------ | ---------------------- |
| 1   | Pen-test SOW signature + vendor slot | Remediation | `docs/gtm/regulatory/pentest-scope-rfp.md`, `external-dependencies-register-2026-05-31.md` | human  | Certified score unlock |
| 2   | SOC 2 owner column per TSC row       | Evolution   | `docs/gtm/regulatory/soc2-readiness-checklist.md`                                          | 1d     | S2-12                  |
| 3   | Merge Tier 1+2 dependabot PRs        | Remediation | `.github/dependabot.yml`, open PRs                                                         | 1d     | Supply-chain hygiene   |
| 4   | IRP v1 board sign-off prep pack      | Evolution   | `docs/gtm/regulatory/incident-response-plan-v1.md`                                         | 0.5d   | Regulator-facing       |

### Definition of Done

- EXT-INF-002 status → in-progress with signed SOW PDF path
- S2-11, S2-12, S2-13 marked done or blocked-with-owner in roadmap

### Commit Plan

1. `docs(gtm): map soc2 checklist owners`
2. `chore(deps): merge dependabot tier-1-2 batch`

### Sprint Value Statement

External reviewers get a stationary target and named control owners — required for certified composite >7.0.

---

## Sprint 3: Pilot legal + TradePass wire (1 week)

**Layer mix:** Remediation 2 | Evolution 0 | Innovation 1

### Goals

Unblock ZWCMP signature path; wire audit bundles when URL available.

### Tasks

| #   | Task                                              | Layer       | Files                                                                                     | Effort | Why It Matters         |
| --- | ------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- | ------ | ---------------------- |
| 1   | Record ZWCMP owner + cadence in register          | Remediation | `docs/audit/pilot-success-criteria.md:27`, `external-dependencies-register-2026-05-31.md` | human  | EXT-INF-013            |
| 2   | DPA + pilot agreement draft → sign                | Remediation | `docs/audit/vendor-outreach/zwcmp/`                                                       | legal  | S3-11 headline         |
| 3   | Set `TRADEPASS_BASE_URL` in testnet overlay       | Remediation | `infra/kubernetes/overlays/testnet/`, `server.mjs:132-134`                                | 1d     | End-to-end bundle path |
| 4   | Enforce `GTCX_BUDGET_STORE_BACKEND=redis` in prod | Remediation | production configmap / gateway deployment                                                 | 0.5d   | HPA-correct budgets    |

### Definition of Done

- EXT-INF-013/014 evidence links in register
- Bundle handler 200 on staging with real resolver

### Sprint Value Statement

Sales-led pilot can sign — infrastructure stops being the excuse.

---

## Sprint 4: Runtime evidence + DR (1 week)

**Layer mix:** Remediation 2 | Evolution 1 | Innovation 0

### Goals

S3-02, S3-03, S3-04 — prove ops, not claim ops.

### Tasks

| #   | Task                               | Layer       | Files                                                                                      | Effort | Why It Matters              |
| --- | ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------ | ------ | --------------------------- |
| 1   | Quarterly DR drill artifact        | Remediation | `infra/scripts/dr-test.sh`, `docs/audit/` new evidence md                                  | 1d     | Production readiness        |
| 2   | Soak baseline PR gate              | Evolution   | `tools/load-tests/`, `validate-all.mjs`                                                    | 1d     | Capacity truth              |
| 3   | Release bundle + WORM upload smoke | Remediation | `tools/control-plane/generate-release-evidence.mjs`, `upload-release-evidence-to-worm.mjs` | 1d     | Regulator-verifiable deploy |

### Definition of Done

- Committed DR report with RTO/RPO numbers
- Soak regression fails CI on >25% slip

---

## Sprint 5: Publish primitives + contract tests (1 week)

**Layer mix:** Remediation 1 | Evolution 1 | Innovation 2

### Goals

S3-07, S3-09 — citable substrate.

### Tasks

| #   | Task                                        | Layer       | Files                                                                      | Effort | Why It Matters             |
| --- | ------------------------------------------- | ----------- | -------------------------------------------------------------------------- | ------ | -------------------------- |
| 1   | Flip `private:false` + SLSA on audit-signer | Innovation  | `tools/audit-signer/package.json`, `.github/workflows/slsa-provenance.yml` | 1d     | Moat publication           |
| 2   | Contract tests in validate-all              | Evolution   | `tools/contract-tests/`                                                    | 1d     | Cross-repo drift detection |
| 3   | Fix stub S3 lastSuccessMs                   | Remediation | `tools/audit-flush/src/s3-uploader.mjs:97`                                 | 0.25d  | Honest probes              |

---

## Sprint 6: ZWCMP close + pen-test intake (1 week)

**Layer mix:** Remediation 1 | Evolution 0 | Innovation 1

### Goals

S3-11 signature; pen-test findings triage queue ready.

### Tasks

| #   | Task                                              | Layer       | Files                                    | Effort | Why It Matters |
| --- | ------------------------------------------------- | ----------- | ---------------------------------------- | ------ | -------------- |
| 1   | Pilot agreement + DPA signed PDFs committed       | Remediation | `docs/audit/vendor-outreach/zwcmp/`      | human  | Revenue        |
| 2   | Pen-test kickoff + scope includes closed S2 items | Remediation | EXT-INF-002                              | human  | Certified bump |
| 3   | terraform-aws-compliance-db v1.0.0 tag            | Innovation  | `infra/terraform/modules/compliance-db/` | 1d     | S3-12          |

---

### 6.4 Roadmap visualization

| Dimension               | Before (2026-05-30) | After Sprint 1 | After Sprint 2 | After Sprint 3 | After Sprint 6 |
| ----------------------- | ------------------- | -------------- | -------------- | -------------- | -------------- |
| Security                | 6.6                 | 7.0            | 7.4            | 7.5            | 7.8            |
| Operational readiness   | 6.5                 | 7.0            | 7.2            | 7.5            | 8.0            |
| GTM stage               | S2 partial          | S2 partial     | S2 partial     | S3 partial     | S3 ready       |
| Developer experience    | 7.0                 | 7.2            | 7.4            | 7.5            | 7.6            |
| Competitive moat        | 6.0                 | 6.2            | 6.5            | 7.0            | 7.5            |
| AI maturity             | 6.0                 | 6.2            | 6.3            | 6.5            | 7.0            |
| **Internal composite**  | **6.8**             | **7.0**        | **7.2**        | **7.4**        | **7.6**        |
| **Certified composite** | **6.2**             | **6.3**        | **6.6**        | **6.8**        | **7.2**        |

---

### 6.5 Meta-learning

- **What this codebase teaches:** Strong at encoding compliance _evidence_ in automation (gates, signed audit, pinned keys). Weak at proving _human_ and _legal_ dependencies are closed — those dominate certified score.
- **Constraining decisions:** Bash-first ops delayed `gtcx-ctl` primacy; sales-led GTM correctly deprioritizes developer-portal polish.
- **6-month radar:** SOC 2 observation start; HSM signing migration; multi-region only after S3-04 runtime evidence.
- **From scratch:** Single control plane binary + policy-as-data earlier; keep dual-DB and audit-signer — those are the moat.

---

## OUTPUT SUMMARY (Executive)

**Current State:** Sprint 2 engineering hardening is largely complete at `afce75a` (24/24 gates, major P0 security findings closed), but the repo is still **pilot-blocked on human/legal externals** and **uncertified without pen-test** — internal ~7.3/10, certified ~6.6/10.

**Target State:** After six 1-week sprints: alert/doc fail-closed, signed pen-test + SOC owners, ZWCMP DPA signed, runtime/DR evidence on disk, primitives published — **internal ~7.6, certified ~7.2**, GTM at **S3 ready**.

**Critical Path:**

1. **EXT-INF-013** — Name ZWCMP owner and schedule cadence (human).
2. **S2-09 + S2-10** — Alert env fail-closed + tier downgrade guard (next code commits).
3. **S2-13** — Pen-test SOW signature (human; gates certified composite).

**Timeline:** 6 weeks engineering + legal parallel; pilot signature realistic **2026-06-21** if EXT-INF-013 closes by **2026-06-07** (per execution-roadmap).

**Biggest Risk:** Treating green `validate-all` as production-ready — post-roadmap proved gate-green ≠ pilot-ready; **external review and owner assignment** remain the failure mode.

**Biggest Opportunity:** Publish audit-signer + compliance-db + offline verification story as **regulator-citable primitives** (S3-07) while sales closes ZWCMP — dual motion already chosen in Q6; engineering should not serial-block publication on pilot signature.

---

## Agent Context Attestation

- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context from execution-roadmap + HEAD evidence
- [x] Phase 3: validate-all + pnpm test run at audit time
- [x] Phase 4: Platform-architect frame
- [x] Phase 5: Fresh full-audit artifact written (no code changes)
