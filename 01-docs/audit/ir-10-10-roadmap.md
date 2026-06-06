---
title: 'IR 10/10 Roadmap — Internal Engineering Readiness'
status: current
date: '2026-06-01'
owner: gtcx-infrastructure
role: quality-evidence-lead
tier: strategic
tags: ['audit', 'roadmap', '10-10', 'IR', 'internal-engineering']
review_cycle: weekly
last_reconciled: '2026-06-07'
supersedes:
  - 01-docs/05-audit/10-10-roadmap-2026-05-17.md
  - 01-docs/05-audit/10-10-roadmap-2026-05-26.md
  - 01-docs/05-audit/10-10-remediation-plan-2026-05-27.md
  - 01-docs/05-audit/10-10-remediation-plan-2026-05-28.md
  - 01-docs/05-audit/10-10-remediation-plan-2026-05-30.md
  - 01-docs/05-audit/internal-10-10-sprint-plan-2026-05-27.md
  - 01-docs/05-audit/internal-10-10-signoff-2026-05-28.md
  - 01-docs/05-audit/remediation-plan-10-10-2026.md
sources:
  - 01-docs/05-audit/full-audit-2026-06-01.md
  - 01-docs/05-audit/execution-roadmap.md
  - 01-docs/05-audit/scoring-rubric.json
  - 01-docs/05-audit/score-evidence-ledger.json
  - 01-docs/05-audit/latest.json
related:
  - 01-docs/05-audit/SCORING.md
  - 01-docs/05-audit/execution-roadmap.md
  - 01-docs/05-audit/external-dependencies-register-2026-05-31.md
---

# IR 10/10 Roadmap — Internal Engineering Readiness

> **Canonical plan to raise IR from 7.6 → 10.0.**  
> **Not in scope here:** XC (legal, pilot owner, pen-test SOW) — see [`external-dependencies-register-2026-05-31.md`](./external-dependencies-register-2026-05-31.md).  
> **Story execution tracker:** [`execution-roadmap.md`](./execution-roadmap.md) (S1–S3 closed for agents; IR phases below extend it).

## 1. Reconciliation (read this first)

Older audit docs used overlapping scores (`9.0 core`, `7.6/7.6`, `6.8/6.2`, `certified composite`). **Authoritative today:**

| Question                         | Answer                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is “10/10” for engineering? | **IR = 10.0** — all seven internal dimensions at 10.0, no CI penalties ([`SCORING.md`](./SCORING.md) v2).                                                                  |
| What is NOT IR?                  | Pilot signatures, DPAs, pen-test vendors, live AWS uploads by operators → **XC** track only.                                                                               |
| Which roadmap wins?              | **This file** for IR dimension targets; **execution-roadmap** for story IDs and acceptance commands.                                                                       |
| Which audits win on facts?       | **Newest** full audit ([`full-audit-2026-06-01.md`](./full-audit-2026-06-01.md)) over May 2026 snapshots.                                                                  |
| How does IR change?              | Append to [`score-evidence-ledger.json`](./score-evidence-ledger.json) per dimension + update [`ci-snapshot.json`](./ci-snapshot.json); then `pnpm score:compute --write`. |

### Superseded documents (historical only)

| Document                                   | Why retired                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `10-10-roadmap-2026-05-*.md`               | Pre–rubric v2; mixed “composite” with engineering.                                       |
| `10-10-remediation-plan-2026-05-*.md`      | Conflicting baselines (6.8/6.2 vs 7.6); replaced by execution-roadmap then this IR plan. |
| `internal-10-10-sprint-plan-2026-05-27.md` | INT-1–5 repo work **done**; claimed “10.0 needs external” — now split as IR vs XC.       |
| `internal-10-10-signoff-2026-05-28.md`     | Self-attested internal 10.0 — rescored to IR 7.6 on 2026-06-01 reconciliation.           |

### Closed engineering window (2026-05-31)

Agent-executable **execution-roadmap Sprints 1–3** are closed (38/38 `validate-all`, S2/S3 hardening). That work lifted IR from the reconciled **6.8** ledger era to **7.6** — it does **not** by itself finish IR 10/10.

---

## 2. Current scorecard

**Headline:** **IR 7.9** (2026-06-07, lane-1 engineering audit @ `74343f9`)

| Dimension             | Weight | Ledger | Adjusted | Gap to 10.0 | Primary blocker                                         |
| --------------------- | ------ | ------ | -------- | ----------- | ------------------------------------------------------- |
| codeQuality           | 15%    | 8.2    | 8.2      | 1.8         | S4-04/05 gate regressions (fix in progress)             |
| repoHygiene           | 12%    | 8.5    | 8.5      | 1.5         | 12 missing READMEs (S4-06)                              |
| security              | 15%    | 8.6    | 8.6      | 1.4         | Pen-test external (XC); 50-gate validate-all green      |
| globalSouthResilience | 10%    | 7.2    | 7.2      | 2.8         | USSD soak done (IR-4.1); offline queue still flag       |
| ecosystemIntegration  | 10%    | 8.7    | 8.7      | 1.3         | IR-5.1/5.2 done; PRD-002 Tier B external                |
| agenticMaturity       | 13%    | 8.3    | 8.3      | 1.7         | SIGNAL L2-low; Human Lead TBD                           |
| enterpriseReadiness   | 25%    | 7.6    | 7.6      | 2.4         | Live DR witness; operator WORM recurrence (EXT-INF-003) |

**XC (separate):** 9.0 — do not plan here. EXT-INF register unchanged.

---

## 3. IR milestones

| Milestone | Target IR | Meaning                       | Exit criteria                                                                   |
| --------- | --------- | ----------------------------- | ------------------------------------------------------------------------------- |
| **M0**    | 7.6       | Today                         | Ledger + local 38 gates green; `main` CI red                                    |
| **M1**    | **8.0**   | CI truth                      | `main` `ci` green; repoHygiene penalties cleared; README honest                 |
| **M2**    | **8.5**   | Dependency + security surface | Tier 3 deps merged; AI SDK migration proven; security job green or scoped       |
| **M3**    | **9.0**   | Structural ops                | WORM-on-merge workflow in repo; deploy-guard path; DR/soak evidence gates fresh |
| **M4**    | **9.5**   | Ecosystem + scale evidence    | Contract-matrix green; USSD soak gate; load-test artifact on `main`             |
| **M5**    | **10.0**  | All dimensions 10.0           | Every ledger dimension has 10.0 entry with CI link + artifact                   |

Do not publish fake “IR 8.2 after sprint N” tables — run `pnpm score:compute` after ledger updates.

---

## 4. IR phases (forward work)

### IR-1 — Main CI truth → **M1 (8.0)** — **closed 2026-06-01**

| ID     | Work                                                                                       | Dimension   | Status |
| ------ | ------------------------------------------------------------------------------------------ | ----------- | ------ |
| IR-1.1 | Prettier-fix `01-docs/05-audit/distribution-snapshots/2026-06-01.json` + generator newline | repoHygiene | done   |
| IR-1.2 | `ci-snapshot.json` penalties cleared (local); verify Actions after push                    | repoHygiene | done   |
| IR-1.3 | README workflow badges (not static shields)                                                | repoHygiene | done   |
| IR-1.4 | Trivy action SHA comments (already pinned)                                                 | security    | done   |
| IR-1.5 | Ledger entry for IR-1 repo-hygiene evidence                                                | repoHygiene | done   |

**Acceptance:** `gh run list --workflow ci.yml --branch main` → latest `ci` **success** (confirm post-push).

**Active phase:** IR-2 (dependencies & supply chain).

---

### IR-2 — Dependencies & supply chain → **M2 (8.5)**

| ID     | Work                                                        | Dimension                    | Source                                                                                 |
| ------ | ----------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| IR-2.1 | Merge tier-3 dependabot (`pg`, `lint-staged`, actions pins) | codeQuality, security        | full-audit Sprint 3; S3-01                                                             |
| IR-2.2 | AI SDK v5→v6 branch + eval-pipeline regression              | codeQuality, agenticMaturity | full-audit #6; S3-01                                                                   |
| IR-2.3 | Fix `security` / CodeQL SARIF upload on `main`              | security                     | **done** — `upload: false` on analyze; `continue-on-error: true` on upload-sarif steps |
| IR-2.4 | Ledger: code-quality ≥8.5, security ≥9.2 with CI proof      | multiple                     | ledger                                                                                 |

---

### IR-3 — Production structure (in-repo) → **M3 (9.0)**

| ID     | Work                                                                        | Dimension                            | Source                          |
| ------ | --------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- |
| IR-3.1 | GitHub Actions: post-`ci` WORM upload workflow (OIDC, staging bucket)       | enterpriseReadiness                  | full-audit P1; S3-04 structural |
| IR-3.2 | `runtime-evidence-check` stays in validate-all; document operator live path | enterpriseReadiness                  | S3-04                           |
| IR-3.3 | Route `deploy.sh` through `deployment-guard` CLI                            | enterpriseReadiness                  | full-audit Sprint 5             |
| IR-3.4 | Expand `gtcx-ctl validate-environment` in CI                                | enterpriseReadiness, agenticMaturity | Sprint 5                        |
| IR-3.5 | DR fire-drill gate: refresh dated artifact quarterly                        | enterpriseReadiness                  | S3-02                           |

**Note:** Live WORM object in AWS closes **XC** EXT-INF-003 when operator runs upload — **IR-3.1** is the in-repo workflow (structural). Both can progress independently.

---

### IR-4 — Global South & distribution → **M4 partial**

| ID     | Work                                                      | Dimension             | Source                                         |
| ------ | --------------------------------------------------------- | --------------------- | ---------------------------------------------- |
| IR-4.1 | USSD path soak test in CI                                 | globalSouthResilience | **done** 2026-06-07 — k6 soak + baseline in CI |
| IR-4.2 | Offline verifier pack for ZWCMP (`verify-catalog` + docs) | globalSouthResilience | S1-10 moat; Sprint 6                           |
| IR-4.3 | Low-bandwidth middleware integration test in gateway CI   | globalSouthResilience | ledger history                                 |

---

### IR-5 — Ecosystem integration → **M4 (9.5)**

| ID     | Work                                                                                                 | Dimension            | Source                                       |
| ------ | ---------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------- |
| IR-5.1 | ~~`GTCX_REPO_TOKEN` for `cross-repo-contract.yml`~~ Narrowed to infra-only contracts (token pending) | ecosystemIntegration | full-audit Sprint 1 #3 — **done** 2026-06-04 |
| IR-5.2 | Re-run ecosystem-repo-review; ledger ≥9.0 with matrix green                                          | ecosystemIntegration | ledger 2026-05-12 peak was 8.3               |
| IR-5.3 | S3-12 registry tag (operator) — optional; not required for IR 10 if matrix green                     | ecosystemIntegration | execution-roadmap S3-12                      |

---

### IR-6 — Agentic & evidence plane → **M5 (10.0)**

| ID     | Work                                                                 | Dimension                            | Source                      |
| ------ | -------------------------------------------------------------------- | ------------------------------------ | --------------------------- |
| IR-6.1 | Single `evidence:release-bundle` UX (CI → artifact → ledger pointer) | agenticMaturity, enterpriseReadiness | full-audit §6.2 refactoring |
| IR-6.2 | Eval-pipeline gates wired to `pilot-success-criteria.md` metrics     | agenticMaturity                      | full-audit innovation       |
| IR-6.3 | Per-dimension ledger 10.0 entries with commit + CI URL               | all                                  | ledger rules                |
| IR-6.4 | Deprecate bash deploy authority (timeline in README)                 | enterpriseReadiness                  | full-audit #9               |

---

## 5. Story cross-reference

| IR phase | execution-roadmap             | full-audit (2026-06-01) |
| -------- | ----------------------------- | ----------------------- |
| IR-1     | _(new — post S3)_             | Sprint 1                |
| IR-2     | S3-01 (structural)            | Sprint 3                |
| IR-3     | S3-02, S3-04 (structural)     | Sprints 4–5             |
| IR-4     | _(USSD soak — new)_           | Sprint 6                |
| IR-5     | S3-09 done; matrix token open | Sprint 1 #3             |
| IR-6     | Meta evidence consolidation   | §6.2                    |

**XC-only (do not schedule on IR phases):** S1-09, S2-13, S3-08, S3-11, EXT-INF-013/014/002/003 live execution.

---

## 6. Ledger update protocol

1. Complete IR phase acceptance (commands in execution-roadmap or full-audit).
2. Append **one row per dimension** to `score-evidence-ledger.json` with `commit`, `ciRun`, `artifact`, `reason`.
3. Update `ci-snapshot.json` if `main` CI status changed.
4. Run:

```bash
node 03-platform/tools/scripts/validate-score-ledger.mjs
node 03-platform/tools/scripts/compute-audit-scores.mjs --write
```

5. Bump `last_reconciled` in this file and `execution-roadmap.md` if stories moved.

**Validator:** Scores claimed in audit markdown must exist in the ledger or CI fails.

---

## 7. Explicit non-goals (IR)

| Item                                    | Track      | Reason                     |
| --------------------------------------- | ---------- | -------------------------- |
| ZWCMP pilot owner / DPA                 | XC         | EXT-INF-013/014            |
| Pen-test SOW signature                  | XC         | EXT-INF-002                |
| SOC 2 Type II observation               | XC / defer | execution-roadmap deferred |
| ISO 27001, PCI, eu-west-1 active-active | defer      | execution-roadmap          |
| npm publish to registry                 | operator   | S3-07 structural done      |

---

## 8. Weekly reconciliation checklist

- [ ] `latest.json` `internalEngineeringReadiness` matches calculator
- [ ] No audit doc publishes `certified composite` as engineering score
- [ ] Open P0/P1 from newest full-audit mapped to IR-\* or XC register
- [ ] `execution-roadmap` story status matches git evidence
- [ ] `main` CI status reflected in `ci-snapshot.json`

---

_Next review: after IR-1 (`main` CI green)._
