---
title: 'GTCX Infrastructure — 10/10 Remediation Plan'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'quality-evidence-lead'
tier: 'strategic'
tags: ['roadmap', 'audit', 'remediation', '10-10']
review_cycle: 'weekly'
source_audit: 'docs/audit/master-audit-2026-05-27.md'
current_composite: 9.0
target_composite: 10.0
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — 10/10 Remediation Plan (2026-05-27)

> Source audit: [`docs/audit/master-audit-2026-05-27.md`](./master-audit-2026-05-27.md)  
> Current score after remediation + internal sprint: **9.0 / 10**, **8.95 / 10** raw  
> Baseline score before remediation: **6.9 / 10** capped, **7.25 / 10** raw  
> Target: **10.0 / 10** reference-grade infrastructure substrate  
> Primary insight: the architecture is stronger than the current release discipline. The fastest uplift comes from restoring deterministic gates, not redesigning the platform.

---

## 0. Remediation Progress

**Status as of 2026-05-27:** repo-controlled remediation and internal sprints INT-1 through INT-5 are complete. The checkout scores **9.0 / 10** with all deterministic gates green, Redis nonce-store coverage above target, signed release evidence generation and WORM upload wrapper ready, runtime smoke tooling implemented, and external finding workflow templates published. Independent SOC 2 / penetration-test execution, live AWS WORM upload, authenticated staging smoke, testnet-pilot WORM apply, and DR/fire-drill exercise remain external execution gaps.

| Area                             | Status   | Evidence                                                                                                                     |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Replay-protection lint           | Complete | `pnpm lint` passes with 0 errors.                                                                                            |
| Docs-site build                  | Complete | `pnpm build` passes after Astro/Starlight upgrade and content-config migration.                                              |
| Astro vulnerabilities            | Complete | `pnpm audit` reports no known vulnerabilities.                                                                               |
| Terraform fmt                    | Complete | `terraform fmt -check -recursive infra/terraform/` passes.                                                                   |
| Docs-standard sprint frontmatter | Complete | `pnpm quality:governance:check` and `pnpm test` pass.                                                                        |
| Prettier drift                   | Complete | `pnpm format:check` passes.                                                                                                  |
| PagerDuty routing key            | Complete | Hardcoded routing key replaced with `${PAGERDUTY_INTELLIGENCE_ROUTING_KEY}`; `gitleaks` passes.                              |
| Fake docs token examples         | Complete | Token-shaped examples replaced; `gitleaks` passes.                                                                           |
| Production Kustomize             | Complete | `kubectl kustomize infra/kubernetes/overlays/production/` passes.                                                            |
| Pen-test Kustomize               | Complete | `kubectl kustomize infra/kubernetes/overlays/pen-test/` passes.                                                              |
| `commonLabels` deprecation       | Complete | Kubernetes kustomizations now use `labels`; `rg "commonLabels:" infra/kubernetes` returns no matches.                        |
| Audit API rate limiting          | Complete | `/audit/bundles` and `/audit/query` use the shared budget/QPS gate; focused tests pass.                                      |
| Overlay rendering in CI          | Complete | CI now renders base, development, staging, staging-linkerd, production, production-linkerd, testnet, and pen-test artifacts. |
| WORM runtime proof               | Complete | Signed staging WORM record written and retained in COMPLIANCE mode; see `worm-runtime-evidence-2026-05-27.md`.               |
| External assurance readiness     | Complete | SOC 2, pen-test, owner matrix, and finding workflow are ready; vendor signatures remain external.                            |
| Reference-grade status JSON      | Complete | `docs/audit/latest.json` publishes current score, gate state, and evidence pointers after re-audit.                          |

---

## 1. Opportunity Map

| Opportunity                                     | Current Evidence                                                                                                                  | Why It Matters                                                                              | Score Path                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| Restore green release gates                     | Complete. `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm format:check`, and Terraform fmt are green.                               | Buyers and auditors read red CI as execution risk even when the architecture is strong.     | 6.9 -> ~8.0                    |
| Make every deployment overlay reproducible      | Complete. All overlays render in CI without errors or warnings.                                                                   | Infrastructure cannot be certified if the deploy artifact cannot be generated.              | 6.9 -> ~8.1                    |
| Remove hardcoded operational secret material    | Complete. `gitleaks` passes with no leaks found.                                                                                  | Secret hygiene is a procurement and incident-response gate.                                 | 6.9 -> ~7.6                    |
| Harden new audit APIs                           | Complete. `/audit/bundles` and `/audit/query` use the shared budget/QPS gate with tests.                                          | Audit infrastructure is consequential; ingestion/query paths need abuse controls.           | 7.2 security -> ~8.2           |
| Convert WORM from design proof to runtime proof | Complete. Staging WORM contains signed, verifier-valid records with COMPLIANCE retention until 2033-05-27.                        | Signed immutable evidence is the repo's strongest trust narrative.                          | 7.x -> 8.5+                    |
| Refresh executive entry points                  | Complete. Overview docs reference current scores and audits.                                                                      | Stakeholders start at overview docs; stale numbers undermine trust.                         | Hygiene + investor credibility |
| Externalize assurance                           | Ready. SOC 2 and pen-test kickoff packs, control owner matrix, and finding workflow are complete. Vendor execution pending.       | Internal controls cannot replace independent assurance for enterprise procurement.          | 8.x -> 9.x                     |
| Automate evidence recurrence                    | In progress. `generate-release-evidence.mjs` and `upload-release-evidence-to-worm.mjs` are repo-complete; live execution pending. | A repeatable evidence bundle is a differentiated "self-auditing infrastructure" capability. | 9.x -> 10                      |

---

## 2. Phase 0 — Restore Deterministic Gates

**Status:** Complete  
**Target score:** 6.9 -> 8.0  
**Actual date:** 2026-05-27  
**Owner:** Platform Engineering

| ID     | Action                                                                                                                                              | Evidence To Produce                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| G0-001 | Fix `tools/replay-protection/tests/*.test.mjs` lint failures: import order, unused variables, duplicate object key.                                 | `pnpm lint` passes with 0 errors.                                         |
| G0-002 | Fix docs-site build: convert Starlight `social` config to object shape and add the missing Astro check dependency.                                  | `pnpm build` passes.                                                      |
| G0-003 | Upgrade Astro to a patched version that clears GHSA-j687-52p2-xcff and GHSA-xr5h-phrj-8vxv.                                                         | `pnpm audit` has no Astro findings.                                       |
| G0-004 | Run Terraform fmt on `infra/terraform/environments/staging/main.tf` and `infra/terraform/modules/worm-audit/versions.tf`.                           | `terraform fmt -check -recursive infra/terraform/` passes.                |
| G0-005 | Resolve docs-standard failure in `docs/agile/sprints/current.md` by adding required frontmatter or excluding the scratch file from committed state. | `pnpm test` and `pnpm quality:governance:check` pass on a clean checkout. |
| G0-006 | Run Prettier on the 8 flagged files or deliberately exclude generated snapshots with documented rationale.                                          | `pnpm format:check` passes.                                               |

**Exit criteria:** install, typecheck, lint, test, build, format, audit, governance, Terraform fmt all pass on a clean checkout.

---

## 3. Phase 1 — Restore Deployability

**Status:** Complete  
**Target score:** 8.0 -> 8.4  
**Actual date:** 2026-05-27  
**Owner:** Infrastructure Lead

| ID     | Action                                                                                                                                                                 | Evidence To Produce                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| D1-001 | Reconcile `audit-flush`: either restore `services/audit-flush.yaml` with AMD64-compatible image support or remove production patches that target the removed resource. | `kubectl kustomize infra/kubernetes/overlays/production/` passes. |
| D1-002 | Fix pen-test namespace conflict by removing duplicate namespace material or converting the overlay to a clean namespace patch model.                                   | `kubectl kustomize infra/kubernetes/overlays/pen-test/` passes.   |
| D1-003 | Replace deprecated `commonLabels` with `labels` in Kustomize manifests.                                                                                                | All Kustomize overlays pass without deprecation warnings.         |
| D1-004 | Add production and pen-test overlay generation to CI if not already enforced.                                                                                          | CI artifact includes rendered manifests for each overlay.         |

**Exit criteria:** base, development, staging, testnet, production, and pen-test Kustomize overlays build without errors or deprecation warnings.

---

## 4. Phase 2 — Security And Abuse Resistance

**Status:** Complete  
**Target score:** 8.4 -> 8.8  
**Actual date:** 2026-05-27  
**Owner:** Security Lead

| ID     | Action                                                                                                                 | Evidence To Produce                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| S2-001 | Remove PagerDuty routing key from `infra/docker/observability/alertmanager.yml`; rotate it if it has ever been usable. | `gitleaks detect --no-git --redact` passes or only has documented false positives. |
| S2-002 | Replace fake docs token-shaped examples with non-token-shaped examples.                                                | Secret scan no longer flags docs examples.                                         |
| S2-003 | Add per-principal rate limiting or a dedicated limiter to `/audit/bundles`.                                            | Unit/integration test proves 429 or equivalent denial after threshold.             |
| S2-004 | Add per-principal rate limiting or a dedicated limiter to `/audit/query`.                                              | Unit/integration test proves 429 or equivalent denial after threshold.             |
| S2-005 | Add negative tests for limiter bypass, burst behavior, and authenticated principal isolation.                          | Coverage report includes audit endpoint abuse paths.                               |

**Exit criteria:** secret scan is clean, new audit endpoints have abuse controls, and tests prove enforcement.

---

## 5. Phase 3 — WORM Runtime Evidence

**Status:** Repo-side complete. Testnet-pilot WORM bucket pending `terraform apply`. Authenticated staging smoke pending in-cluster probe deploy.  
**Target score:** 8.8 -> 9.1  
**Target date:** 2026-06-07  
**Owner:** Compliance Platform

| ID     | Action                                                               | Evidence To Produce                                                                              |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| W3-001 | ~~Decide whether testnet-pilot requires WORM.~~                      | ~~Closed by ADR-023: testnet-pilot audit evidence routes to staging WORM with prefixed keys.~~   |
| W3-002 | Write one real signed NDJSON audit record to staging WORM.           | Object key, version ID, Object Lock retention, and KMS signature metadata.                       |
| W3-003 | Verify the record with `@gtcx/audit-signer@0.1.0`.                   | Verification command output stored in audit evidence.                                            |
| W3-004 | Confirm public or authenticated health evidence for staging runtime. | `/health` and `/metrics` evidence with expected status, auth model, and ALB behavior documented. |
| W3-005 | Resolve or document `api.testnet.gtcxprotocol.org` DNS status.       | DNS record evidence or explicit decommission note.                                               |

**Exit criteria:** WORM claims are backed by AWS object-lock evidence and at least one independently verified signed record.

---

## 6. Phase 4 — External Assurance

**Status:** Ready for vendor execution. SOC 2 and pen-test kickoff packs complete.  
**Target score:** 9.1 -> 9.5  
**Target date:** 2026-06-30  
**Owner:** Security / Compliance

| ID     | Action                                                                                            | Evidence To Produce                                           |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A4-001 | Engage SOC 2 Type I auditor and record kickoff evidence.                                          | Auditor name, engagement date, control owner matrix.          |
| A4-002 | Complete pen-test SOW and kickoff.                                                                | Signed SOW, scope, rules of engagement, target list.          |
| A4-003 | Map current infrastructure controls to SOC 2, ISO 27001, and NIST evidence in one evidence index. | `docs/compliance/` evidence matrix with file/test references. |
| A4-004 | Add remediation workflow for external findings.                                                   | Finding tracker with owners, severity, SLA, status.           |

**Exit criteria:** independent assurance is underway with concrete artifacts, not roadmap intent.

---

## 7. Phase 5 — Reference-Grade Automation

**Status:** Repo-side complete for INT-1 (release evidence), INT-2 (runtime smoke), INT-4 (finding workflow), INT-5 (WORM upload wrapper). Redis nonce-store coverage (R5-004) complete. Live execution and DR exercise remain.  
**Target score:** 9.5 -> 10.0  
**Target date:** 2026-08-15  
**Owner:** Platform / Agentic Systems

| ID     | Action                                                                                                                                                                                       | Evidence To Produce                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| R5-001 | Create one release evidence command that runs typecheck, lint, tests, build, docs links, policy validation, score ledger, SIGNAL, gitleaks, Kustomize, Terraform fmt, and WORM verification. | Single command output stored as release evidence.                   |
| R5-002 | Store release evidence in WORM with signed manifest.                                                                                                                                         | Immutable evidence bundle with signature verification.              |
| R5-003 | Add CI badge or machine-readable JSON summarizing current audit score, gate status, and latest evidence bundle.                                                                              | `docs/audit/latest.json` or equivalent.                             |
| R5-004 | Raise Redis nonce-store coverage above 90% branches.                                                                                                                                         | Complete: `redis.mjs` now shows 99.21% statements and 95% branches. |
| R5-005 | Run a DR/fire-drill exercise covering deploy rollback, WORM evidence recovery, and audit query availability.                                                                                 | Exercise report with timestamps, RTO/RPO, defects, fixes.           |

**Exit criteria:** the repo can regenerate its own audit evidence bundle continuously, and that bundle is immutable, signed, and reviewer-friendly.

**Internal progress:** `generate-release-evidence.mjs` now emits signed NDJSON, local verifier output, validation-gate metadata, evidence pointers, and a WORM upload manifest. `upload-release-evidence-to-worm.mjs` now validates that manifest, checks the signed NDJSON hash, uploads through AWS CLI, and captures Object Lock retention evidence. Remaining work is executing the wrapper against staging/production with scoped AWS credentials and deciding or creating the testnet-pilot WORM bucket.

Runtime smoke progress: `capture-runtime-smoke-evidence.mjs` now captures public or bearer-authenticated `/health` and `/metrics` evidence with token redaction. Remaining work is executing it against staging with a scoped smoke credential.

Redis nonce-store progress: Redis-backed nonce checks now have direct tests for `SET NX EX`, replay detection, default tenant keys, connection fallback, command failure, and client caching. `processBundle` now awaits async nonce stores, closing the real runtime path for Redis-backed replay protection.

External finding workflow progress: [`external-finding-register-template.md`](./external-finding-register-template.md) and [`external-finding-closure-checklist.md`](./external-finding-closure-checklist.md) now give SOC 2 and pen-test findings a concrete owner/SLA/status/retest workflow before vendors begin execution.

---

## 8. Strategic Insights

1. **The trust substrate is real.** WORM Object Lock in production/staging, published audit signer, SIGNAL validation, Kyverno validation, and coverage gates are strong foundations. The 6.9 was a hygiene cap, not an architecture verdict. The repo is now at 9.0 with all internal gates green.
2. **The fastest maturity unlock is boring reliability.** Passing lint/build/test/format/Terraform/Kustomize will create more score lift than new features.
3. **Audit endpoints are now consequential infrastructure.** They should be treated like payment, identity, or settlement APIs: bounded, observable, rate-limited, and abuse-tested.
4. **WORM can become the differentiator.** A signed, immutable, externally verifiable audit record is a stronger enterprise story than a generic compliance checklist.
5. **Overview freshness is part of trust.** Stale 5.9-era docs conflict with current evidence and make good work look weaker than it is.
6. **A self-auditing release pipeline is the 10/10 move.** The reference-grade version of this repo does not merely pass audits; it continuously emits signed, immutable evidence that it passed.

---

## 9. Score Trajectory

| Stage                      | Target Score | Gate                                                                                             |
| -------------------------- | -----------: | ------------------------------------------------------------------------------------------------ |
| Baseline (pre-remediation) |          6.9 | 2026-05-17 audit, high-finding cap applied.                                                      |
| Post-remediation rerun     |          8.7 | Deterministic CI and IaC gates green.                                                            |
| Post-sprint INT-1..INT-5   |          9.0 | Signed release evidence, runtime smoke, Redis coverage, WORM wrapper, finding workflow complete. |
| Phase 3 closed (live)      |          9.1 | Testnet WORM applied + authenticated staging smoke captured.                                     |
| Phase 4 closed (live)      |          9.5 | SOC 2 and pen-test assurance underway with artifacts.                                            |
| Phase 5 closed (live)      |         10.0 | Signed recurring release evidence bundle in WORM every run.                                      |
