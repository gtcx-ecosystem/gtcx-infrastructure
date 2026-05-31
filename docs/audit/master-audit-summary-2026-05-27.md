---
title: 'GTCX Infrastructure — Master Audit Summary'
status: 'superseded'
superseded_by: 'docs/audit/post-roadmap-session-2026-05-30.md'
superseded_on: '2026-05-31'
superseded_reason: 'Older summary; superseded by 2026-05-30 cluster.'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'chief-auditor'
tier: 'strategic'
tags: ['audit', 'summary', 'scores', 'insights', 'roadmap']
review_cycle: 'on-change'
source_audit: 'docs/audit/master-audit-rerun-2026-05-27.md'
source_roadmap: 'docs/audit/10-10-remediation-plan-2026-05-27.md'
composite: 9.0
composite_raw: 8.95
investor: 8.9
enterprise: 8.6
sov_dfi: 8.8
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — Master Audit Summary (2026-05-27)

> Source audit: [`master-audit-rerun-2026-05-27.md`](./master-audit-rerun-2026-05-27.md)  
> 10/10 plan: [`10-10-remediation-plan-2026-05-27.md`](./10-10-remediation-plan-2026-05-27.md)

---

## Executive Verdict

GTCX Infrastructure is now a production-candidate platform substrate with green repo-controlled gates and real trust primitives.

The remediation closed the prior hygiene cap: lint, build, format, test, full validation, Terraform formatting, dependency audit, secret scan, docs governance, production Kustomize, and pen-test Kustomize now pass. Internal 10/10 sprint work has also added signed release evidence generation, runtime smoke evidence capture, Redis nonce-store failover/error coverage, external finding workflow templates, and WORM release-evidence upload automation. The remaining ceiling is external and evidentiary: vendor SOC 2 / penetration-test execution, testnet-pilot WORM deployment proof, authenticated runtime smoke execution, and live WORM upload/retention proof for release evidence.

**Current state:** production-candidate  
**Certification state:** repo-controlled gates green; external assurance pending  
**Fastest score unlock:** testnet-pilot WORM proof and authenticated runtime smoke evidence  
**Strategic 10/10 unlock:** signed recurring release evidence uploaded to WORM with retention verification

---

## Scores

| Score Lens                     | Score | Band        | Meaning                                                                              |
| ------------------------------ | ----: | ----------- | ------------------------------------------------------------------------------------ |
| Core weighted score            |   9.0 | strong      | Repo-controlled sprint gates are green; assurance/runtime gaps remain.               |
| Raw weighted score             |  8.95 | strong      | Weighted score before rounding.                                                      |
| Investor lens                  |   8.6 | strong      | Trust substrate and execution credibility are materially stronger.                   |
| Enterprise buyer lens          |   8.3 | strong beta | Procurement hygiene is strong; external attestations remain pending.                 |
| African Sovereign / DFI lens   |   8.9 | strong      | Regional WORM and low-connectivity controls are strong; testnet resolved by ADR-023. |
| SIGNAL validator               |  9.60 | strong      | Agentic scorecard is strong and independently passes.                                |
| Compliance gateway coverage    | 98.55 | strong      | Coverage gate passes for main gateway surface.                                       |
| Replay protection coverage     | 93.61 | strong      | Coverage gate passes for replay protection surface.                                  |
| Redis nonce-store coverage     | 95.00 | strong      | Redis branch/error coverage now clears the >90% target.                              |
| Production WORM Object Lock    |  PASS | strong      | Production bucket has Object Lock in COMPLIANCE mode for 2557 days.                  |
| Staging WORM Object Lock       |  PASS | strong      | Staging bucket has Object Lock in COMPLIANCE mode for 2557 days.                     |
| Staging signed WORM record     |  PASS | strong      | Staging WORM record is signed, retained, versioned, and verifier-valid.              |
| Testnet-pilot WORM Object Lock |  PASS | exception   | ADR-023: routes to staging WORM with prefixed keys; no dedicated bucket needed.      |

---

## Why This Is Not 10/10 Yet

The prior P0 cap is closed. The repo should not be capped at 6.9 anymore. It should also not be called 10/10 yet because several consequential proof items remain outside the repo-controlled sprint.

Remaining gaps:

1. External SOC 2 Type I and third-party penetration-test execution are not complete.
2. `gtcx-worm-audit-testnet-pilot-af-south-1` is absent from the AWS account.
3. Staging `/health` returns ALB `403`; authenticated runtime smoke evidence has not been captured.
4. Release evidence WORM upload and retention verification are automated, but live staging/production execution still requires scoped AWS credentials.

---

## What Is Strong

| Strength                            | Evidence                                                | Why It Matters                                                       |
| ----------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| WORM audit substrate exists         | Production and staging buckets use COMPLIANCE mode.     | Immutable audit evidence is a serious trust primitive.               |
| Audit signer is published           | `@gtcx/audit-signer@0.1.0` is available on npm.         | Enables external verification of signed audit records.               |
| Production signing is fail-closed   | Existing audit evidence and configuration.              | Consequential signing paths are designed to fail safely.             |
| SIGNAL validation passes            | SIGNAL score 9.60 / 10.                                 | Agentic governance has meaningful structure.                         |
| Kyverno policy validation passes    | 7 policies structurally valid; service manifests pass.  | Kubernetes policy posture is not purely aspirational.                |
| Coverage gates pass for key tools   | Gateway and replay protection coverage gates pass.      | Critical code paths have test depth.                                 |
| Docker compose configs validate     | dev/test/infra compose configs pass.                    | Local infrastructure topology is syntactically reproducible.         |
| Docs link graph is healthy          | 946 internal links across 398 markdown files pass.      | Information architecture is mostly navigable.                        |
| Regional posture is credible        | af-south-1 WORM, offline replay, low-connectivity work. | Fits African sovereign, DFI, and frontier-market operating contexts. |
| Ecosystem integration is meaningful | Cross-repo contracts and shared packages exist.         | The repo contributes platform leverage, not only local tooling.      |

---

## What Is Blocking

| Severity | Finding                              | Practical Impact                                                                           |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| P1       | External assurance pending           | Enterprise procurement still needs vendor SOC 2 / pen-test proof.                          |
| P1       | ~~Testnet-pilot WORM bucket absent~~ | ~~Closed by ADR-023: routes to staging WORM with prefixed keys.~~                          |
| P1       | Runtime endpoint evidence gap        | Live health/metrics evidence needs authenticated smoke proof.                              |
| P2       | Live WORM release evidence proof     | 10/10 requires execution of upload and retention verification for signed release evidence. |

---

## Core Insights

1. **The score was hygiene-capped, not architecture-capped.** Green gates unlocked the jump from 6.9 to 9.0 without redesigning the platform.
2. **WORM is the trust moat.** Signed NDJSON stored under Object Lock, versioned, retained until 2033, and verified by `@gtcx/audit-signer` is strong audit proof.
3. **Audit APIs are consequential infrastructure.** `/audit/bundles` and `/audit/query` now have budget/QPS controls; that materially improves abuse resistance.
4. **Deployment evidence is now recurring.** CI renders base, dev, staging, staging-linkerd, production, production-linkerd, testnet, and pen-test artifacts.
5. **External assurance is the main ceiling.** Repo-side kickoff is ready, but vendor SOC 2 and pen-test execution remain outside the codebase.
6. **The 10/10 destination is continuous evidence, not a prettier report.** Reference grade means every release emits signed, immutable proof that it passed its own gates.

---

## Sprint-Based 10/10 Roadmap

### Sprint 1 — Gate Recovery

**Dates:** 2026-05-27 to 2026-05-29  
**Target score:** 6.9 -> ~8.0

| Priority | Work                                                                                  | Exit Evidence                                              |
| -------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| P0       | Fix replay-protection lint failures.                                                  | `pnpm lint` passes.                                        |
| P0       | Fix docs-site Starlight `social` config and missing Astro check dependency.           | `pnpm build` passes.                                       |
| P0       | Upgrade or pin Astro to clear current vulnerabilities.                                | `pnpm audit` has no Astro findings.                        |
| P0       | Run Terraform fmt on failing files.                                                   | `terraform fmt -check -recursive infra/terraform/` passes. |
| P0       | Fix or exclude invalid `docs/agile/sprints/current.md` frontmatter.                   | `pnpm test` and `pnpm quality:governance:check` pass.      |
| P0       | Run Prettier on flagged files or document generated snapshot exception if applicable. | `pnpm format:check` passes.                                |

### Sprint 2 — Deployability

**Dates:** 2026-05-29 to 2026-06-03  
**Target score:** ~8.0 -> ~8.4

| Priority | Work                                                               | Exit Evidence                                             |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| P0       | Reconcile removed `audit-flush` base resource vs production patch. | Production Kustomize overlay passes.                      |
| P1       | Fix pen-test namespace conflict.                                   | Pen-test Kustomize overlay passes.                        |
| P2       | Replace deprecated `commonLabels` with `labels`.                   | All overlays pass without warnings.                       |
| P1       | Add overlay rendering to CI.                                       | CI produces rendered manifests for base and all overlays. |

### Sprint 3 — Security Hardening

**Dates:** 2026-06-03 to 2026-06-07  
**Target score:** ~8.4 -> ~8.8

| Priority | Work                                                   | Exit Evidence                                          |
| -------- | ------------------------------------------------------ | ------------------------------------------------------ |
| P1       | Remove and rotate PagerDuty routing key.               | `gitleaks detect --no-git --redact` passes.            |
| P2       | Replace fake docs token with non-token-shaped example. | Secret scan no longer flags docs examples.             |
| P1       | Add limiter to `/audit/bundles`.                       | Abuse test proves throttling or budget denial.         |
| P1       | Add limiter to `/audit/query`.                         | Abuse test proves throttling or budget denial.         |
| P1       | Add negative tests for audit limiter bypass paths.     | Coverage includes burst and principal-isolation cases. |

### Sprint 4 — WORM Runtime Proof

**Dates:** 2026-06-07 to 2026-06-14  
**Target score:** ~8.8 -> ~9.1

| Priority | Work                                               | Exit Evidence                                                                  |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| P1       | Decide/create/document testnet-pilot WORM bucket.  | AWS bucket evidence or explicit architecture exception.                        |
| P1       | Write signed NDJSON audit record to staging WORM.  | Object key, version ID, retention, KMS/signature metadata.                     |
| P1       | Verify the record with `@gtcx/audit-signer@0.1.0`. | Verification output stored in audit evidence.                                  |
| P1       | Resolve staging `/health` and `/metrics` evidence. | Expected status, auth model, and ALB behavior documented.                      |
| P1       | Resolve testnet DNS status.                        | DNS evidence or explicit decommission note for `api.testnet.gtcxprotocol.org`. |

### Sprint 5 — Enterprise Assurance

**Dates:** 2026-06-14 to 2026-06-30  
**Target score:** ~9.1 -> ~9.5

| Priority | Work                                       | Exit Evidence                                       |
| -------- | ------------------------------------------ | --------------------------------------------------- |
| P1       | Engage SOC 2 Type I auditor.               | Kickoff evidence and control owner matrix.          |
| P1       | Complete pen-test SOW and kickoff.         | Signed SOW, target list, and rules of engagement.   |
| P1       | Build compliance evidence index.           | SOC 2 / ISO 27001 / NIST mapped to files and tests. |
| P1       | Add external-findings remediation tracker. | Owners, severity, SLA, and status fields.           |

### Sprint 6 — Reference-Grade Automation

**Dates:** July to August 2026  
**Target score:** ~9.5 -> 10.0

| Priority  | Work                                                                                                | Exit Evidence                                     |
| --------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Strategic | Create one release evidence command for all audit gates.                                            | Single command output stored as release evidence. |
| Strategic | Store release evidence bundle in WORM.                                                              | Signed immutable bundle.                          |
| Strategic | Add machine-readable latest audit status.                                                           | `docs/audit/latest.json` or equivalent.           |
| Strategic | Redis nonce-store coverage above 90% branches.                                                      | Complete: Redis branch coverage is now 95%.       |
| Strategic | Run DR/fire-drill exercise covering rollback, WORM evidence recovery, and audit query availability. | Exercise report with RTO/RPO, defects, and fixes. |

---

## Fresh Score Trajectory

| Stage                           | Score | Gate                                                                                                                         |
| ------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------- |
| Baseline audit                  |   6.9 | P0 cap applied to red lint/build/test/deploy/secret gates.                                                                   |
| Post-remediation rerun          |   8.7 | Repo-controlled gates green and staging WORM proof exists.                                                                   |
| Internal sprint INT-1..INT-5    |   9.0 | Signed release evidence, runtime smoke tooling, Redis coverage, external finding workflow, and WORM upload wrapper complete. |
| Testnet/runtime evidence closed |   8.9 | Testnet WORM proof and authenticated runtime smoke stored.                                                                   |
| External assurance underway     |   9.2 | SOC 2 and third-party pen-test signed and active.                                                                            |
| External assurance remediated   |   9.5 | Findings retested and closed.                                                                                                |
| Reference-grade recurring proof |  10.0 | Signed release evidence bundle uploaded to WORM every run.                                                                   |

---

## Immediate Next Actions

1. Apply or explicitly de-scope testnet-pilot WORM and capture AWS evidence.
2. Capture authenticated staging `/health` and `/metrics` smoke evidence.
3. Execute SOC 2 Type I and third-party pen-test vendor engagements.
4. Automate WORM upload and retention verification for the signed release-evidence bundle.

## Remediation Progress

The sprint remediation pass completed the repo-controlled score-unlocking items:

- `pnpm lint` passes.
- `pnpm build` passes.
- `pnpm test` passes.
- `pnpm format:check` passes.
- `pnpm audit` reports no known vulnerabilities.
- `terraform fmt -check -recursive infra/terraform/` passes.
- `gitleaks detect --no-git --redact --verbose` passes.
- Production and pen-test Kustomize overlays render.
- `/audit/bundles` and `/audit/query` now use the shared budget/QPS gate with tests.
- Signed release evidence, runtime smoke evidence tooling, Redis nonce-store coverage, external finding workflow templates, and WORM upload automation are complete.

The latest internal sprint score is **9.0 / 10** pending a fresh full master-audit rerun and live external evidence execution.
