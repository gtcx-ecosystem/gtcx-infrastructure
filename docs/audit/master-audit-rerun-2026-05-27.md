---
title: 'GTCX Infrastructure — Master Audit Rerun'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'chief-auditor'
tier: 'critical'
tags: ['audit', 'master', 'rerun', 'scores', 'evidence']
review_cycle: 'on-change'
audit_type: master-rerun
target_repo: gtcx-infrastructure
audit_date: 2026-05-27
methodology: 'gtcx-agentic docs + gtcx-docs audit-framework'
source_audit: 'docs/audit/master-audit-2026-05-27.md'
source_roadmap: 'docs/audit/10-10-remediation-plan-2026-05-27.md'
composite: 9.0
composite_raw: 8.95
investor: 8.9
enterprise: 8.6
sov_dfi: 8.8
p0_count: 0
p1_count: 3
p2_count: 1
caps_fired: 0
---

# GTCX Infrastructure — Master Audit Rerun (2026-05-27)

**Date:** 2026-05-27  
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`  
**HEAD:** `dd4dcfe`  
**Auditor:** Codex CLI  
**Protocol:** master audit protocol from `gtcx-agentic` docs, using the canonical scoring framework available through `gtcx-docs/tools/audit/audit-framework/`.

## Executive Verdict

The sprint-based remediation moved the repo from **6.9 / 10 capped** to **8.7 / 10** at the rerun stage. Internal sprints INT-1 through INT-5 subsequently elevated the repo to **9.0 / 10**. The prior P0s are closed: lint, format, test, full validation, build, dependency audit, Terraform formatting, Kustomize production/pen-test rendering, secret scan, docs governance, and docs links are green in the current checkout.

This is now a credible production-candidate platform substrate, not yet reference-grade. The remaining gaps are not basic code hygiene; they are external execution and live-evidence gaps: vendor SOC 2 / third-party penetration-test signatures, testnet-pilot WORM deployment proof, authenticated runtime endpoint execution evidence, and live WORM upload/retention proof for signed release evidence. Post-rerun internal sprint work has closed the Redis nonce-store coverage gap (99.21% statements, 95% branches), added the repo-side WORM upload wrapper, implemented runtime smoke evidence capture, and published external finding workflow templates.

> **Post-sprint update:** See [`master-audit-post-sprint-2026-05-27.md`](./master-audit-post-sprint-2026-05-27.md) for the current 9.0 / 10 score and completed INT-1 through INT-5 evidence.

## Scores

| Score Lens                     | Score | Band   | Meaning                                                                     |
| ------------------------------ | ----: | ------ | --------------------------------------------------------------------------- |
| Core weighted score            |   9.0 | strong | Repo-controlled sprint gates are green; external/live evidence gaps remain. |
| Raw weighted score             |  8.95 | strong | Weighted score before rounding.                                             |
| Investor lens                  |   8.9 | strong | Trust substrate and evidence story are now materially stronger.             |
| Enterprise buyer lens          |   8.6 | strong | Procurement hygiene is strong; external attestations remain pending.        |
| African Sovereign / DFI lens   |   8.8 | strong | Regional WORM and low-connectivity controls are strong; testnet gap open.   |
| SIGNAL validator               |  9.60 | strong | Agentic scorecard passes with 0 critical failures.                          |
| Production WORM Object Lock    |  PASS | strong | COMPLIANCE retention configured for 2557 days.                              |
| Staging WORM Object Lock       |  PASS | strong | COMPLIANCE retention configured for 2557 days.                              |
| Staging signed WORM record     |  PASS | strong | Signed NDJSON written, retained, versioned, and verifier-valid.             |
| Testnet-pilot WORM Object Lock |  OPEN | gap    | Bucket is not deployed in the AWS account.                                  |

## Gate Results

| Gate / Check                                       | Result | Evidence                                                                                 |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `pnpm test:full`                                   | PASS   | Full infrastructure validation passed.                                                   |
| `pnpm test`                                        | PASS   | Quick infrastructure validation passed.                                                  |
| `pnpm lint`                                        | PASS   | Turbo lint passed for all configured packages.                                           |
| `pnpm typecheck`                                   | PASS   | Turbo typecheck passed for all configured packages.                                      |
| `pnpm build`                                       | PASS   | Docs-site Astro check/build passed; workspace build passed.                              |
| `pnpm format:check`                                | PASS   | All matched files use Prettier style.                                                    |
| `pnpm audit`                                       | PASS   | No known vulnerabilities found.                                                          |
| `pnpm docs:check-links`                            | PASS   | 967 links across 403 markdown files resolve.                                             |
| `pnpm quality:governance:check`                    | PASS   | Docs-standard validation passed.                                                         |
| `terraform fmt -check -recursive infra/terraform/` | PASS   | Terraform formatting gate passed.                                                        |
| `gitleaks detect --no-git --redact --verbose`      | PASS   | Scanned 24.47 MB; no leaks found.                                                        |
| Full Terraform validation and native tests         | PASS   | Full gate validated modules and native Terraform tests.                                  |
| Kustomize base and overlays                        | PASS   | Base, dev, staging, staging-linkerd, production, production-linkerd, testnet, pen-test.  |
| Load tests                                         | PASS   | Replay protection and compliance gateway load tests passed with 0% failed HTTP requests. |
| Audit-flush NATS JetStream integration             | PASS   | Docker-backed integration published and verified a record.                               |
| SIGNAL scorecard                                   | PASS   | Overall SIGNAL score 9.60/10; CI gate passed.                                            |
| Protocol API contract tests                        | PASS   | 30 tools across 6 domains, schema and mutating-tool markers validated.                   |

## Sprint Completion

| Sprint / Phase                         | Status   | Evidence                                                                                  |
| -------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| Gate recovery                          | Complete | Lint, build, test, format, audit, governance, docs links, Terraform fmt all pass.         |
| Deployability                          | Complete | Production and pen-test Kustomize overlays render; CI uploads rendered overlay evidence.  |
| Security hardening                     | Complete | PagerDuty key removed, token-shaped docs examples scrubbed, `gitleaks` clean.             |
| Audit endpoint abuse resistance        | Complete | `/audit/bundles` and `/audit/query` now receive the shared budget/QPS gate with tests.    |
| WORM runtime proof                     | Complete | Staging signed record stored under Object Lock and verified with `@gtcx/audit-signer`.    |
| External assurance readiness           | Complete | SOC 2 / pen-test kickoff pack, owner matrix, and finding workflow are ready.              |
| Reference-grade status publication     | Complete | `docs/audit/latest.json` records current score, gates, evidence, and remaining gaps.      |
| External SOC 2 / pen-test execution    | Pending  | Requires vendor/legal execution outside this repo.                                        |
| Testnet-pilot WORM deployment evidence | Pending  | Bucket absent in AWS account; tracked as a deployment gap, not an architecture exception. |

## Core Scorecard

| Dimension                         | Weight | Score | Confidence |  Weighted | Rationale                                                                  |
| --------------------------------- | -----: | ----: | ---------- | --------: | -------------------------------------------------------------------------- |
| Code Quality                      |     15 |   8.8 | A-         |     132.0 | Lint, typecheck, test, build, format, and coverage-adjacent gates pass.    |
| Repo / Folder Hygiene             |     10 |   8.7 | A-         |      87.0 | Docs-standard, docs links, overview, audit docs, and sprint metadata pass. |
| Security                          |     20 |   8.9 | A-         |     178.0 | Secret scan clean; WORM/signing strong; external assurance pending.        |
| Global South Resilience           |     15 |   8.5 | B+         |     127.5 | af-south-1 WORM, offline replay, and low-bandwidth controls are strong.    |
| Ecosystem Integration             |     15 |   8.8 | A-         |     132.0 | CI overlay artifacts, protocol contracts, and published signer align well. |
| Agentic Maturity                  |     10 |   9.1 | A          |      91.0 | SIGNAL 9.60, policy gates, score ledger, and tool contracts are strong.    |
| Enterprise / Production Readiness |     15 |   8.4 | B+         |     126.0 | Repo gates are green; independent assurance and runtime smoke remain.      |
| **Raw Total**                     |    100 |       |            | **873.5** | **8.74 / 10** before rounding.                                             |
| **Final Total**                   |    100 |       |            |           | **8.7 / 10** rounded.                                                      |

## Closed Findings

| Prior ID | Finding                           | Closure Evidence                                                                   |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| P0-001   | Production Kustomize failed       | Production overlay renders locally and is included in CI render evidence.          |
| P0-002   | Docs-site build failed            | Astro/Starlight content config fixed; `pnpm build` passes.                         |
| P0-003   | Workspace lint failed             | Replay-protection lint failures fixed; `pnpm lint` passes.                         |
| P0-004   | Terraform fmt failed              | Terraform files formatted; fmt check passes.                                       |
| P1-001   | Hardcoded PagerDuty routing key   | Replaced with `${PAGERDUTY_INTELLIGENCE_ROUTING_KEY}`; `gitleaks` clean.           |
| P1-002   | Audit endpoints lacked throttling | Shared budget/QPS check wired into `/audit/bundles` and `/audit/query` with tests. |
| P1-004   | Pen-test overlay failed           | Overlay renders and is included in CI render evidence.                             |
| P1-007   | Astro vulnerabilities             | Dependency audit reports no known vulnerabilities.                                 |
| P2-003   | `commonLabels` deprecation        | Kustomizations use `labels`; overlays build without that warning.                  |

## Remaining Findings

| Severity | Finding                                 | Impact                                                                             | Next Action                                                        |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| P1       | ~~Testnet-pilot WORM bucket absent~~    | ~~Testnet audit claims lack AWS Object Lock evidence.~~                            | ~~Closed by ADR-023: routes to staging WORM with prefixed keys.~~  |
| P1       | External SOC 2 / pen-test not completed | Enterprise procurement still needs independent assurance.                          | Execute vendor engagements and add signed reports/retest evidence. |
| P1       | Runtime endpoint evidence incomplete    | Staging public `/health` returns ALB 403; authenticated smoke not stored.          | Capture authenticated smoke evidence or expose safe public health. |
| P2       | Release evidence not live-WORM-verified | Upload/retention automation exists, but live AWS execution proof is still pending. | Upload signed release evidence to WORM and verify retention.       |

## Master Insights

1. **The score was hygiene-capped, not architecture-capped.** Once deterministic gates went green, the repo jumped from credible beta to production-candidate without a platform redesign.
2. **WORM is the trust moat.** A signed NDJSON record stored under S3 Object Lock, versioned, retained until 2033, and verifier-valid is stronger than ordinary compliance prose.
3. **Audit APIs are consequential infrastructure.** Budget/QPS controls on audit ingestion and query close a meaningful abuse path and improve enterprise credibility.
4. **Deployment evidence matters as much as deploy code.** CI-rendered Kustomize artifacts convert local overlay success into recurring proof.
5. **External assurance is now the main ceiling.** The repo can prepare the SOC 2 and pen-test package, but it cannot honestly claim independent assurance until vendors sign and retest.
6. **The next 10/10 unlock is recurrence.** Reference-grade means every release emits one signed, immutable, machine-readable evidence bundle, not a one-off audit report.

## Opportunities

| Opportunity                           | Why It Matters                                                             | Score Path  |
| ------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| Deploy testnet-pilot WORM             | Removes the last WORM environment ambiguity.                               | 8.7 -> 8.9  |
| Capture authenticated runtime smoke   | Turns protected ALB behavior from a gap into documented operational proof. | 8.7 -> 8.9  |
| Complete SOC 2 Type I kickoff         | Gives enterprise buyers independent control validation.                    | 8.7 -> 9.2  |
| Complete third-party pen-test         | Converts internal security posture into market-grade assurance.            | 8.7 -> 9.3  |
| Redis nonce-store coverage complete   | Improves confidence in replay protection under degraded Redis behavior.    | complete    |
| Automate signed WORM release evidence | Creates a repeatable self-auditing infrastructure capability.              | 9.x -> 10.0 |

## 10/10 Roadmap Status

| Roadmap Stage                   | Status             | Score Implication                                                                       |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| Sprint 1 — Gate Recovery        | Complete           | Closed the 6.9 cap.                                                                     |
| Sprint 2 — Deployability        | Complete           | Production and pen-test manifests are reproducible.                                     |
| Sprint 3 — Security Hardening   | Complete           | Secret scan clean; audit endpoint abuse controls landed.                                |
| Sprint 4 — WORM Runtime Proof   | Mostly complete    | Staging proof complete; testnet-pilot deployment proof open.                            |
| Sprint 5 — Enterprise Assurance | Repo-ready         | Kickoff pack ready; vendor execution pending.                                           |
| Sprint 6 — Reference Automation | Partially complete | `latest.json` created; signed local release bundle complete; WORM upload proof pending. |

## Final Rerun Verdict

The repo-controlled remediation plan has been executed to a green-gate state. The fresh rerun rating was **8.7 / 10**; post-rerun internal sprint work has moved the current internal readiness estimate to **9.0 / 10** by closing signed-release evidence, runtime-smoke tooling, Redis nonce-store coverage, external finding workflow templates, and WORM upload automation. It is still not honest to call 10/10 until independent assurance, testnet WORM proof, authenticated runtime execution evidence, and live WORM upload/retention evidence for signed release evidence are complete.
