---
title: 'GTCX Infrastructure — 10/10 Remediation Plan'
status: 'superseded'
date: '2026-05-30'
superseded_by: 'docs/audit/execution-roadmap.md'
superseded_on: '2026-05-31'
superseded_reason: 'Three docs from 2026-05-30 reported different scores (post-roadmap-session = 6.8/6.2, master-audit = 6.5/6.1, this plan = 7.6/7.6). Per Q3 of execution-roadmap.md, the 7.6 baseline assumed Phase 0 gates green at HEAD while the tree was dirty. Authoritative reconciled baseline: 6.8/6.2.'
owner: 'gtcx-infrastructure'
role: 'quality-evidence-lead'
tier: 'strategic'
tags: ['roadmap', 'audit', 'remediation', '10-10', 'superseded']
review_cycle: 'weekly'
source_audit: 'docs/audit/master-audit-2026-05-30.md'
previous_plan: 'docs/audit/10-10-remediation-plan-2026-05-28.md'
current_composite: 7.6
internal_readiness: 7.6
target_composite: 10.0
---

> **SUPERSEDED 2026-06-01.** IR plan: [`ir-10-10-roadmap.md`](./ir-10-10-roadmap.md).
> Story tracker: [`execution-roadmap.md`](./execution-roadmap.md). The 7.6/7.6 baseline
> below was rejected during reconciliation (Q3) in favour of the
> independently-rescored 6.8/6.2 from
> [`post-roadmap-session-2026-05-30.md`](./post-roadmap-session-2026-05-30.md).
>
> **Scoring (v2, 2026-06-01):** Use **IR** + **XC** separately ([`SCORING.md`](./SCORING.md)).
> Retired: `certified composite` as engineering minus outsiders.

# GTCX Infrastructure — 10/10 Remediation Plan

**Source audit:** [master-audit-2026-05-30.md](./master-audit-2026-05-30.md)  
**Current state:** Phase 1 in progress, internal **7.6/10**, composite **7.6/10**  
**Target:** clean internal **10.0/10**, certified **10.0/10** after external assurance  
**Frame:** development  
**Persona:** developer

## Executive Summary

The 2026-05-30 master audit supersedes the prior 2026-05-28 perfect-score claim. Current release blockers are not strategic ambiguity; they are concrete gate failures plus security-control gaps that need to be closed in order.

The path back to the target state starts with deterministic green gates, then closes control-plane security gaps, then converts helper primitives into enforced production behavior, then refreshes live operational evidence and external assurance.

## Exit Criteria

| Gate                     | 10/10 requirement                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic repo gates | `pnpm test`, `pnpm test:full`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`, `pnpm docs:check-links`, `pnpm agent:check` all pass on clean checkout |
| Security findings        | Zero open P0/P1 in replay protection, tenant isolation, audit signing, throttling, catalog verification, WORM evidence                                                  |
| Runtime proof            | Fresh WORM upload, staging smoke, DR drill, and evidence-bundle verification artifacts committed or linked                                                              |
| External assurance       | Pen-test underway with no open critical/high after retest; SOC 2 Type I path formally started                                                                           |
| Ecosystem proof          | Downstream protocol and compliance consumers can verify audit-signer/catalog outputs against pinned contracts                                                           |
| Audit truth              | `latest.json`, master audit, and remediation plan agree on scores, gates, and unresolved dependencies                                                                   |

## Phase 0 — Gate Rescue (24 Hours)

**Target:** 6.1 → 7.2  
**Owner:** Platform Engineering

**Status 2026-05-31:** Gate rescue complete. `pnpm test`, `pnpm typecheck`, `pnpm format:check`, `pnpm agent:check`, `pnpm quality:governance:check`, `pnpm lint`, and `pnpm build` pass after the roadmap rename/index, replay middleware typing, agent sync, formatting pass, and incident-drill template default fix. Commit packaging remains open until the audit/report artifacts are committed.

| ID     | Finding | Action                                                                         | Evidence                                                |
| ------ | ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| G0-001 | P0-001  | Rename `docs/roadmap/ROADMAP-2026-07-13.md` to lowercase and update references | `pnpm quality:governance:check` passes                  |
| G0-002 | P0-001  | Add `docs/roadmap/README.md` or `index.md`                                     | `pnpm test` proceeds past docs-standard                 |
| G0-003 | P0-002  | Add JSDoc type to `isExempt(path)` in replay middleware                        | `pnpm typecheck` passes                                 |
| G0-004 | P0-003  | Run `pnpm agent:sync`, review generated changes, commit accepted sync          | `pnpm agent:check` passes                               |
| G0-005 | P2-001  | Format the 21 Prettier-drift files or intentionally scope exclusions           | `pnpm format:check` passes                              |
| G0-006 | P2-004  | Commit or remove `docs/audit/post-roadmap-session-2026-05-30.md`               | Open until current audit/report artifacts are committed |

**Exit:** all root deterministic gates pass except any intentionally external/live gates documented with reason.

## Phase 1 — Replay And Tenant Boundary Closure (Week 1)

**Target:** 7.2 → 8.2  
**Owner:** Security Engineer + Compliance Gateway Maintainer

**Status 2026-05-31:** In progress. S1-001 is closed with replay middleware normalization and traversal regression tests. S1-002/S1-003 are closed with signed-DID tenant binding for budget checks and `audit-bundle.received` signing. S1-004 remains open.

| ID     | Finding | Action                                                                                                                          | Evidence                                                                                  |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| S1-001 | P1-001  | Normalize URL path before exemption checks; reject `..`, encoded traversal, and mixed separator forms before calling `isExempt` | Complete: regression tests cover raw and encoded parent traversal under `/_next/`         |
| S1-002 | P1-002  | Replace `/audit/bundles` tenant header trust with resolved DID/device tenant binding                                            | Complete: spoofed `x-gtcx-tenant-id` cannot change budget tenant scope                    |
| S1-003 | P1-002  | Include resolved tenant in `audit-bundle.received` signed payload                                                               | Complete: signed event fixture verifies tenant source from signed DID                     |
| S1-004 | P1-003  | Define platform/security tenant model for auth failures; expose them through `/v1/exceptions` without leaking tenant data       | Tests show auth failures visible to security principal and scoped tenants remain isolated |

**Exit:** replay traversal, tenant spoofing, and auth-failure visibility have adversarial tests that fail before the fix and pass after it.

## Phase 2 — Throttle, Budget, And Trust Anchors (Week 2)

**Target:** 8.2 → 8.8  
**Owner:** Security Engineer + Runtime Maintainer

| ID     | Finding | Action                                                                                                                           | Evidence                                                                                     |
| ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| C2-001 | P1-004  | Replace unbounded auth throttle `Map` with bounded LRU or Redis-backed state                                                     | Unit test proves cap/eviction; integration test proves throttle survives multi-request burst |
| C2-002 | P1-005  | Trust `X-Forwarded-For` only from configured proxy CIDRs; otherwise use socket address                                           | Tests for spoofed XFF, trusted ALB XFF, missing header                                       |
| C2-003 | P1-006  | Pin catalog verifier public key through environment/config or checked-in trust-anchor file outside signed payload                | Key-swap attack test fails verification                                                      |
| C2-004 | P1-008  | Wire Redis `budget-store` into `checkBudget`, `recordSpend`, and `getSpend`, including async call sites                          | Multi-instance budget test proves caps do not multiply by replica count                      |
| C2-005 | P1-007  | Wire `failClosed` into at least audit-flush S3 import/upload and NATS publish, or remove the helper from the claimed control set | Production-mode tests prove dependency failure throws, not stubs                             |

**Exit:** no helper primitive is counted as remediation unless production callers exist and tests cover failure behavior.

## Phase 3 — Runtime Evidence And Operational Hardening (Weeks 2-4)

**Target:** 8.8 → 9.3  
**Owner:** SRE + Compliance Platform

| ID     | Gap                   | Action                                                                               | Evidence                                                             |
| ------ | --------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| O3-001 | Live evidence         | Run `pnpm evidence:release-bundle` on current main-equivalent HEAD                   | Release evidence JSON plus audit-signer verification output          |
| O3-002 | WORM recurrence       | Execute WORM upload wrapper against staging with Object Lock metadata captured       | Evidence doc with bucket/key/version/retention/SHA-256               |
| O3-003 | Staging smoke         | Run staging smoke probe and capture health, TLS, gateway, and evidence-bundle checks | Runtime smoke JSON committed or linked                               |
| O3-004 | DR proof              | Execute DR fire drill runbook with RTO/RPO measurements                              | DR drill report with owner sign-off                                  |
| O3-005 | Alertmanager defaults | Make PagerDuty/Slack dev fallbacks impossible in staging/production compose paths    | Config test or documented environment guard                          |
| O3-006 | Node floor            | Align workspace package engines and CI node versions to `>=20.18.0` / exact CI floor | `rg` check shows no package at `>=20.0.0`; CI uses pinned Node floor |

**Exit:** repo has fresh live evidence for release, WORM, smoke, and DR; operational defaults fail closed outside development.

## Phase 4 — Ecosystem Contract Proof (Weeks 3-6)

**Target:** 9.3 → 9.6  
**Owner:** Platform Architect

| ID     | Action                                                                                                                              | Evidence                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| X4-001 | Add contract tests for replay headers, audit-signer NDJSON, compliance catalog verification, and compliance-gateway tenant behavior | `tools/contract-tests` or equivalent CI job green                      |
| X4-002 | Publish/refresh downstream readiness matrix for `gtcx-protocols`, `compliance-os`, `gtcx-intelligence`, and platform runtimes       | Version matrix with package/endpoint pins                              |
| X4-003 | Confirm INF-49 staging DNS/TLS status and link current evidence                                                                     | Runbook or audit artifact with live endpoint proof or explicit blocker |
| X4-004 | Update `latest.json` and all audit docs after remediation, avoiding stale 10/10 claims                                              | Machine JSON and markdown scorecards agree                             |

**Exit:** downstream consumers have executable proof that the infra contracts they depend on are green.

## Phase 5 — External Assurance And Certification (Weeks 6-12)

**Target:** 9.6 → 10.0  
**Owner:** Security Lead + Leadership

| ID     | Action                                                                                                                                   | Evidence                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A5-001 | Execute independent pen-test covering compliance-gateway, replay-protection, audit-flush, catalog verification, WORM evidence, and CI/CD | Signed SOW, final report, retest report                     |
| A5-002 | Close all pen-test critical/high findings and document accepted residual medium risk                                                     | External finding register with closure evidence             |
| A5-003 | Start SOC 2 Type I or equivalent external controls review                                                                                | Engagement letter and control owner matrix                  |
| A5-004 | Run independent master audit after remediation                                                                                           | External or independent internal report with no open P0/P1  |
| A5-005 | Make recurring WORM release bundle mandatory on `main`                                                                                   | CI evidence artifact for successful recurring release proof |

**Exit:** certified composite can be raised to 10.0 only after external assurance artifacts exist and no audit cap fires.

## Score Trajectory

| Stage            | Target score | Unlock                                                        |
| ---------------- | -----------: | ------------------------------------------------------------- |
| Current audit    |          6.1 | Truth restored after stale 2026-05-28 green claim             |
| Phase 0 complete |          7.2 | Deterministic gates green                                     |
| S1-001 complete  |          7.3 | Replay traversal exemption closed                             |
| S1-003 complete  |          7.6 | Audit bundle tenant header trust closed                       |
| Phase 1 complete |          8.2 | Auth-failure visibility P1 closed                             |
| Phase 2 complete |          8.8 | Throttle, budget, trust-anchor, fail-closed controls enforced |
| Phase 3 complete |          9.3 | Live runtime evidence refreshed                               |
| Phase 4 complete |          9.6 | Ecosystem contracts proven                                    |
| Phase 5 complete |         10.0 | External assurance and recurring WORM release proof           |

## Immediate Sprint Backlog

| Priority | Task                                    | Owner                      | Target |
| -------- | --------------------------------------- | -------------------------- | ------ |
| P0       | G0-001 through G0-006                   | Platform Engineering       | Day 1  |
| P1       | S1-004 auth-failure exception model     | Security Engineer          | Day 4  |
| P1       | C2-001/C2-002 throttle hardening        | Runtime Maintainer         | Week 2 |
| P1       | C2-003 catalog trust anchor             | Compliance Data Maintainer | Week 2 |
| P1       | C2-004/C2-005 budget/fail-closed wiring | Runtime Maintainer         | Week 2 |

## Non-Negotiables

- Do not raise `latest.json` above release-blocked until deterministic gates are green.
- Do not count helper utilities as controls until production call sites use them.
- Do not certify tenant isolation while `/audit/bundles` accepts caller-controlled tenant scope.
- Do not claim catalog integrity while the verifier trusts a public key embedded in the same signature artifact it verifies.
- Do not claim certified 10/10 without external pen-test/SOC evidence or a documented equivalent.

## Related Artifacts

- [master-audit-2026-05-30.md](./master-audit-2026-05-30.md)
- [latest.json](./latest.json)
- [post-roadmap-session-2026-05-30.md](./post-roadmap-session-2026-05-30.md)
- [10-10-remediation-plan-2026-05-28.md](./10-10-remediation-plan-2026-05-28.md)
- [external-dependencies-register-2026-05-28.md](./external-dependencies-register-2026-05-28.md)
