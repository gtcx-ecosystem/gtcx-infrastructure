---
title: 'Internal 10/10 Sprint Plan'
status: 'superseded'
superseded_by: 'docs/audit/ir-10-10-roadmap.md'
superseded_on: '2026-06-01'
superseded_reason: 'INT-1–5 repo work complete; IR 10/10 plan split from XC and supersedes v1 10-10 docs.'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'quality-evidence-lead'
tier: 'strategic'
tags: ['audit', 'sprint-plan', '10-10', 'evidence']
review_cycle: 'weekly'
source_audit: 'docs/audit/master-audit-rerun-2026-05-27.md'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Internal 10/10 Sprint Plan - 2026-05-27

This plan covers internal, non-blocked work remaining after the 8.7 / 10 fresh audit rerun. Vendor assurance, AWS applies, and authenticated staging credentials remain external dependencies; this plan focuses on work that can be completed inside the repo.

## Sprint INT-1 - Recurring Signed Release Evidence

**Status:** complete  
**Target score path:** 8.7 -> 8.9 internal readiness  
**Goal:** one command emits a signed, verifier-valid, WORM-upload-ready release evidence bundle.

| Item                            | Status   | Evidence                                                                                 |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Extend release evidence schema  | Complete | `release-evidence.json` now includes gates, evidence pointers, and WORM target metadata. |
| Sign release evidence           | Complete | `release-evidence.ndjson` is generated with `@gtcx/audit-signer`.                        |
| Verify release evidence locally | Complete | `release-evidence-verification.json` stores verifier result.                             |
| Emit WORM upload manifest       | Complete | `worm-upload.json` records bucket/key, required KMS header, hash, and command.           |
| Add tests                       | Complete | `tools/control-plane/tests/generate-release-evidence.test.mjs`.                          |
| Add validation gate             | Complete | `infra/scripts/validate.sh` runs control-plane tests in quick and full validation.       |
| WORM upload wrapper             | Complete | `tools/control-plane/upload-release-evidence-to-worm.mjs` validates hash and uploads.    |

## Sprint INT-2 - Runtime Smoke Evidence Script

**Status:** complete  
**Target score path:** 8.9 -> 9.0 internal readiness  
**Goal:** provide a script that captures public and authenticated runtime smoke evidence without requiring code changes at execution time.

| Item                             | Status   | Exit Evidence                                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| Add runtime smoke capture script | Complete | Script supports public and bearer-auth modes.                                        |
| Emit JSON evidence               | Complete | Output includes endpoint, status, headers subset, latency, timestamp.                |
| Add docs/runbook                 | Complete | Operators can run against staging, testnet, or production.                           |
| Add dry-run/local test           | Complete | Local test proves output shape without live credentials.                             |
| In-cluster smoke probe           | Complete | `infra/kubernetes/overlays/staging/smoke-probe-cronjob.yaml` deploys inside cluster. |

## Sprint INT-3 - Redis Nonce-Store Coverage

**Status:** complete  
**Target score path:** 9.0 -> 9.1 internal readiness  
**Goal:** raise Redis nonce-store branch/error coverage above 90%.

| Item                        | Status   | Exit Evidence                                                                     |
| --------------------------- | -------- | --------------------------------------------------------------------------------- |
| Add Redis unavailable tests | Complete | Constructor/connect fallback is covered without requiring a live Redis instance.  |
| Add TTL/error-path tests    | Complete | `SET NX EX`, replay, command failure, default tenant, and client caching covered. |
| Add coverage note           | Complete | `redis.mjs` coverage: 99.21% statements, 95% branches.                            |
| Fix async handler path      | Complete | `processBundle` now awaits async nonce stores before accepting/rejecting bundles. |

## Sprint INT-4 - External Finding Workflow Hardening

**Status:** complete  
**Target score path:** 9.1 -> 9.2 internal readiness  
**Goal:** make the external SOC 2 / pen-test finding process executable before vendors start.

| Item                          | Status   | Exit Evidence                                                                                        |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| Add finding register template | Complete | [`external-finding-register-template.md`](./external-finding-register-template.md).                  |
| Add closure checklist         | Complete | [`external-finding-closure-checklist.md`](./external-finding-closure-checklist.md).                  |
| Link from kickoff pack        | Complete | [`external-assurance-kickoff-2026-05-27.md`](./external-assurance-kickoff-2026-05-27.md).            |
| Vendor readiness pack         | Complete | [`vendor-engagement-readiness-pack.md`](./vendor-engagement-readiness-pack.md) — single handoff doc. |

## Sprint INT-5 - WORM Upload Automation

**Status:** repo-side complete; execution blocked by AWS credentials and bucket decisions  
**Target score path:** 9.2 -> 10.0 with external proof  
**Goal:** turn WORM-upload-ready evidence into environment-gated upload and retention verification.

| Item                               | Status         | Exit Evidence                                                                           |
| ---------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| Add upload command wrapper         | Complete       | `upload-release-evidence-to-worm.mjs` validates manifest/hash and uploads with AWS CLI. |
| Add retention verification wrapper | Complete       | Captures upload response, object version, Object Lock mode, and retain-until date.      |
| Execute against staging/prod       | Needs creds    | AWS object metadata stored as evidence.                                                 |
| Execute or de-scope testnet-pilot  | Needs decision | Bucket proof or architecture exception.                                                 |

## Current Internal Recommendation

Repository-side INT-1 through INT-5 work is complete. Remaining 10/10 movement now requires external execution: AWS credentials for live WORM upload, `terraform apply` for testnet-pilot WORM bucket, in-cluster smoke probe deployment for authenticated staging evidence, and vendor SOC 2 / pen-test execution. All external gaps have executable runbooks and readiness packs prepared.
