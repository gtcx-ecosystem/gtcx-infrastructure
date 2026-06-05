---
title: 'GTCX Ecosystem — Repository Health Review'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
role: platform-architect
tier: critical
tags: ['audit', 'ecosystem', 'IR-5.2', 'cross-repo']
review_cycle: quarterly
supersedes:
  - 01-docs/05-audit/ecosystem-repo-review-2026-05-12.md
related:
  - 01-docs/05-audit/ecosystem-integration-matrix-2026-06-07.json
  - 01-docs/engineering/package-adoption-tracking.md
---

# GTCX Ecosystem — Repository Health Review

**Date:** 2026-06-07  
**Reviewer:** Platform Engineering (IR-5.2)  
**Scope:** 21 active repos in local `gtcx-ecosystem/*` checkout  
**Method:** Filesystem survey + contract-test gate + XR reconciliation ledger

**Machine-readable matrix:** [`ecosystem-integration-matrix-2026-06-07.json`](./ecosystem-integration-matrix-2026-06-07.json) — **contract matrix GREEN**

---

## Executive summary

| Metric                      | May 2026-05-12         | Jun 2026-06-07                     | Δ           | Status |
| --------------------------- | ---------------------- | ---------------------------------- | ----------- | ------ |
| Active repos                | 25 (incl. deprecated)  | **21**                             | −4 archived | ✅     |
| Repos with CI workflows     | 23/25 (92%)            | **21/21 (100%)**                   | +8pp        | ✅     |
| Repos with SECURITY.md      | 7/25 (28%)             | **15/21 (71%)**                    | +43pp       | ⚠️     |
| Repos with LICENSE          | 19/25 (76%)            | **21/21 (100%)**                   | +24pp       | ✅     |
| `@gtcx/*` package consumers | 1/25 (4%)              | **10/21 (48%)**                    | +44pp       | ⚠️     |
| Protocol 22 adoption        | —                      | **20/21 (95%)**                    | new         | ✅     |
| Contract matrix (CI)        | token-blocked siblings | **infra GREEN**                    | scoped      | ✅     |
| Deprecated repos removed    | pending                | **gtcx-core12, gtcx-amis deleted** | closed      | ✅     |

**Three headline changes since May:**

1. **Universal legal hygiene** — LICENSE on all active repos; SECURITY.md up 43 points (still 6 gaps).
2. **Package adoption materially up** — 10 repos now consume `@gtcx/*` (was 1); hardware/mobile next (S3-03).
3. **Agent + contract plane** — P22 rollout (S4-02) + four contract-test suites in `validate-all`; cross-repo health probe on schedule.

**Remaining gaps (not blocking IR-5.2 matrix green):**

- `GTCX_REPO_TOKEN` not provisioned — sibling repos in contract matrix remain commented (IR-5.3 optional).
- Infrastructure sprawl in `sensei-ai`, `terra-os`, `compliance-os` — migration tracked in execution-roadmap, not regressed.
- Package adoption target 80% — at 48%; track in [`package-adoption-tracking.md`](../engineering/package-adoption-tracking.md).

---

## Repo health matrix (2026-06-07)

Survey: local checkout `2026-06-07`. **CI** = workflow file count ≥1.

| Repo                  | WF  | SEC | LIC | @gtcx | P22 | Tier | Notes                                |
| --------------------- | --- | --- | --- | ----- | --- | ---- | ------------------------------------ |
| `gtcx-infrastructure` | 18  | ✅  | ✅  | —     | ✅  | T1   | Platform owner; contract matrix host |
| `gtcx-protocols`      | 16  | ✅  | ✅  | ✅    | ✅  | T1   | Trust + coordination hub             |
| `gtcx-core`           | 9   | ✅  | ✅  | ✅    | ✅  | T1   | Shared packages publisher            |
| `baseline-os`         | 16  | ✅  | ✅  | —     | ✅  | T1   | Dev-acceleration; BaselineOS         |
| `gtcx-intelligence`   | 4   | ✅  | ✅  | ✅    | ✅  | T1   | Shared platform ROLE in CI           |
| `gtcx-platforms`      | 8   | ✅  | ✅  | ✅    | ✅  | T1   | S4-02 E2E witness closed             |
| `gtcx-hardware`       | 8   | ✅  | ✅  | —     | ✅  | T2   | Witness S3; HAL stable               |
| `gtcx-mobile`         | 10  | ✅  | ✅  | —     | ✅  | T2   | M2-P2 ProtocolAdapter pending        |
| `gtcx-agentic`        | 6   | ❌  | ✅  | ✅    | ✅  | T2   | S4-02 universal rollout owner        |
| `compliance-os`       | 9   | ✅  | ✅  | ✅    | ✅  | T2   | Own K8s; hub W2 acks                 |
| `terminal-os`         | 13  | ✅  | ✅  | ✅    | ✅  | T2   | W2-E2E key aligned                   |
| `terra-os`            | 16  | ✅  | ✅  | —     | ✅  | T2   | Infra sprawl — migrate P2            |
| `sensei-ai`           | 18  | ✅  | ✅  | —     | ✅  | T2   | Infra sprawl — migrate P2            |
| `ledger-ui`           | 7   | ✅  | ✅  | ✅    | ✅  | T2   | Design system                        |
| `gtcx-markets`        | 2   | ✅  | ✅  | ✅    | ✅  | T2   |                                      |
| `gtcx-agile`          | 3   | ❌  | ✅  | —     | ✅  | T3   | Missing SECURITY.md                  |
| `griot-ai`            | 2   | ❌  | ✅  | ✅    | ✅  | T3   | Missing SECURITY.md                  |
| `exploration-os`      | 3   | ❌  | ✅  | —     | ✅  | T3   | SIR verifier public smoke            |
| `gtcx-docs`           | 4   | ❌  | ✅  | —     | ✅  | T3   | Hub docs; hub-scope gates            |
| `veritas-ai`          | 2   | ❌  | ✅  | —     | ✅  | T3   | Missing SECURITY.md                  |
| `nyota-ai`            | 12  | ✅  | ✅  | —     | ❌  | T3   | P22 not adopted                      |

**Excluded (archived/deleted):** `gtcx-core12`, `gtcx-amis`, `gtcx-complianceos` (merged → `compliance-os`).

---

## Contract matrix verdict (IR-5.2)

| Check                     | Result      | Evidence                                                            |
| ------------------------- | ----------- | ------------------------------------------------------------------- |
| Infra contract tests      | **PASS**    | `node --test 03-platform/tools/contract-tests/*.test.mjs` — 9 tests |
| `cross-repo-contract.yml` | **GREEN**   | Infra-only matrix; no token required                                |
| Cross-repo health probe   | **WIRED**   | `.github/workflows/cross-repo-health.yml`                           |
| XR reconciliation         | **CURRENT** | XR-401/405/507/508 done; XR-402 ready                               |

**Ledger lift:** `ecosystemIntegration` **6.8 → 9.0** — in-repo contract plane + refreshed review + P22/package adoption delta. Not 10.0 until sibling matrix token + 80% package adoption.

---

## Cross-repo sprint alignment (2026-06)

| XR                      | Status | Infra evidence      |
| ----------------------- | ------ | ------------------- |
| XR-401 INF-86 algorithm | done   | `c36a5f6`           |
| XR-405 Platforms KMS    | done   | staging IRSA        |
| XR-507 Verifier DNS     | done   | exploration-os live |
| XR-508 Supabase         | done   | migrations applied  |
| XR-402 Ceremony         | ready  | unblocked           |

---

## Recommended next actions

| P   | Action                                              | Owner       |
| --- | --------------------------------------------------- | ----------- |
| P1  | Add SECURITY.md to 6 remaining repos                | Each owner  |
| P1  | Provision `GTCX_REPO_TOKEN`; expand contract matrix | Platform    |
| P2  | `@gtcx/core` adoption in hardware + mobile (S3-03)  | mobile/core |
| P2  | P22 adoption in `nyota-ai`                          | ML team     |
| P3  | Terraform consolidation (`sensei-ai`, `terra-os`)   | Platform    |

---

## Sign-off

| Role                 | Date       | Notes                                 |
| -------------------- | ---------- | ------------------------------------- |
| Platform Engineering | 2026-06-07 | IR-5.2 review + matrix JSON committed |
| Field / GTM          | —          | Parallel human gates unchanged        |
