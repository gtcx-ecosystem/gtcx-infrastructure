---
title: 'GTCX Infrastructure — Master Audit'
status: 'superseded'
superseded_by: '01-docs/05-audit/post-roadmap-session-2026-05-30.md'
superseded_on: '2026-05-31'
superseded_reason: 'Independent rescore on same day reported conflicting 6.5/6.1 vs post-roadmap 6.8/6.2; per Q3 reconciliation, post-roadmap is authoritative.'
date: '2026-05-30'
owner: 'gtcx-infrastructure'
role: 'quality-evidence-lead'
audit_type: master
target_repo: gtcx-infrastructure
audit_date: '2026-05-30'
internal_readiness: 6.5
composite: 6.1
p0_count: 3
p1_count: 8
p2_count: 5
---

# GTCX Infrastructure — Master Audit

**Date:** 2026-05-30  
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`  
**Auditor:** Codex  
**HEAD:** `dd46907`  
**Branch:** `01-docs/roadmap-update-2026-05-30`  
**Working tree:** Dirty — untracked `01-docs/05-audit/post-roadmap-session-2026-05-30.md`

## Agent Context Attestation

- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered
- [x] Phase 4: Persona & frame selected
- [x] Phase 5: Context attested

## Executive Summary

The repository is not release-green on 2026-05-30. The prior machine-readable audit pointer still claimed a 2026-05-28 internal 10.0 state, but current gates show regressions in docs-standard, typecheck, format, and agent synchronization.

Internal readiness is assessed at **6.5/10**. Certified composite is assessed at **6.1/10** because the repo has active P0 gate failures plus unresolved security and operational-control gaps that require remediation before external attestation.

**Remediation update 2026-05-31:** Phase 0 gate rescue is complete; S1-001 replay traversal and S1-002/S1-003 audit bundle tenant binding are closed. Current machine-readable status is tracked in [latest.json](./latest.json); the original 2026-05-30 findings below are retained as the source audit record.

## Verification Commands

| Command                         | Result | Evidence                                                                                            |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `pnpm test`                     | Fail   | Docs-standard rejects `01-docs/roadmap/ROADMAP-2026-07-13.md`; `01-docs/roadmap` lacks README/index |
| `pnpm quality:governance:check` | Fail   | Same docs-standard violations as `pnpm test`                                                        |
| `pnpm typecheck`                | Fail   | `03-platform/tools/replay-protection/03-platform/src/middleware.mjs:130` implicit `any` parameter   |
| `pnpm format:check`             | Fail   | 21 files differ from Prettier output                                                                |
| `pnpm agent:check`              | Fail   | `AGENTS.md` drift from generated agent docs                                                         |
| `pnpm lint`                     | Pass   | Turbo lint completed for configured packages                                                        |
| `pnpm docs:check-links`         | Pass   | 1048 links across 427 markdown files resolve                                                        |
| `pnpm build`                    | Pass   | Docs-site Astro build completed; no worktree diff produced                                          |

## Findings

### P0 — Release Blockers

**P0-001: `pnpm test` is red on docs-standard.**  
`01-docs/roadmap/ROADMAP-2026-07-13.md` violates lowercase filename policy, and `01-docs/roadmap/` has no `README.md` or `index.md`. This blocks the root quick validation gate.

**P0-002: Typecheck is red in replay-protection middleware.**  
`03-platform/tools/replay-protection/03-platform/src/middleware.mjs:130` defines `isExempt(path)` without a JSDoc type, triggering `TS7006` under `checkJs`.

**P0-003: Agent synchronization gate is red.**  
`pnpm agent:check` reports `AGENTS.md` drift. This breaks the repo's agent coordination contract until `pnpm agent:sync` output is reviewed and committed.

### P1 — Security / Control Gaps

**P1-001: Replay middleware exempts raw prefix paths before normalization.**  
`03-platform/tools/replay-protection/03-platform/src/middleware.mjs:130-143` treats any raw URL starting with `/_next/` as exempt. A path such as `/_next/../v1/query` satisfies the prefix check unless upstream normalization rejects it first. Normalize and reject traversal before exemption.

**P1-002: `/audit/bundles` budget and audit tenant context still trusts request headers.**  
`03-platform/tools/compliance-gateway/03-platform/src/audit-bundles/handler.mjs:71-74` uses `x-gtcx-tenant-id` for budget scope, and lines 126-133 write that same header into the signed ingest audit event. Tenant context should derive from resolved device identity or an authorization binding, not a caller-controlled header.

**P1-003: Auth-failure exceptions are invisible to tenant-scoped operator view.**  
`03-platform/tools/compliance-gateway/03-platform/src/server.mjs:231-237` signs auth failures with `payload.tenantId = 'unknown'`, while `03-platform/tools/compliance-gateway/03-platform/src/audit.mjs:438-446` filters exceptions by exact tenant. This drops auth-failure events from ordinary tenant exception views.

**P1-004: Auth-failure throttle is process-local and unbounded.**  
`03-platform/tools/compliance-gateway/03-platform/src/auth-failure-throttle.mjs:25-26` stores all source IP state in a module-level `Map` with no maximum size or eviction beyond per-IP window reset. Distributed brute-force can grow memory.

**P1-005: Source IP extraction trusts X-Forwarded-For unconditionally.**  
`03-platform/tools/compliance-gateway/03-platform/src/auth-failure-throttle.mjs:107-112` trusts the first XFF hop without a trusted-proxy boundary. Attackers that can inject or influence the header can evade per-IP throttling.

**P1-006: Catalog verification is self-vouching.**  
`03-platform/tools/compliance-data/03-platform/scripts/verify-catalog.mjs:60-64` builds the verification key from the signature file itself. Without a pinned trust anchor, replacing catalog, signature, and public key together can pass local verification.

**P1-007: Fail-closed helper is not wired into production paths.**  
`03-platform/tools/03-platform/scripts/fail-closed.mjs` exists and is tested, but code search found no production caller. Current fail-closed behavior remains implemented ad hoc per path.

**P1-008: Redis budget-store primitive is not wired into the hot path.**  
`03-platform/tools/compliance-gateway/03-platform/src/budget.mjs:22-28` explicitly documents that cross-pod budget enforcement requires a future async migration. Current rate/cost enforcement is per pod, so HPA replica count multiplies effective limits.

### P2 — Hygiene / Operational Gaps

**P2-001: Format drift across 21 files.**  
`prettier --list-different` reports 01-docs/audit snapshots, `01-docs/05-audit/post-roadmap-session-2026-05-30.md`, 01-docs/gitbook content, `01-docs/engineering/tech-stack/version-standards.md`, `01-docs/05-audit/agile/issues/README.md`, and root `README.md`.

**P2-002: Node runtime pin is inconsistent.**  
Root requires `node >=20.18.0`, but most workspace package manifests still allow `>=20.0.0`. CI workflows also use `node-version: '20'` instead of the repository floor.

**P2-003: Alertmanager has development defaults that can leak into non-dev runs.**  
`04-ship/docker/docker-compose.infra.yml:151-153` defaults PagerDuty and Slack destinations to development placeholders if env vars are unset. Keep this dev-only or fail closed for staging/production compose use.

**P2-004: Current audit source is untracked.**  
`01-docs/05-audit/post-roadmap-session-2026-05-30.md` is present but untracked. Either commit it as supporting evidence or discard it before release packaging.

**P2-005: `latest.json` was stale before this audit.**  
Before this update, `01-docs/05-audit/latest.json` still pointed to the 2026-05-28 internal 10.0 assessment, despite current red gates.

## Scorecard

| Dimension               | Score | Rationale                                                                |
| ----------------------- | ----: | ------------------------------------------------------------------------ |
| Code Quality            |   6.0 | Typecheck red; dead/wired-later primitives present                       |
| Repo / Folder Hygiene   |   6.0 | Docs-standard, format, and agent sync red                                |
| Security                |   6.0 | Replay exemption, tenant header trust, XFF trust, self-vouching verifier |
| Global South Resilience |   7.5 | Offline/replay tests pass, but production control gaps remain            |
| Ecosystem Integration   |   6.5 | INF-49 docs landed, but current gates block clean adoption               |
| Agentic Maturity        |   6.0 | Agent docs drift despite explicit coordination contract                  |
| Enterprise Readiness    |   5.5 | External assurance still pending; current repo gates are red             |

**Internal readiness:** 6.5/10  
**Certified composite:** 6.1/10

## Remediation Order

1. Restore green gates: rename roadmap file, add roadmap index, type `isExempt(path)`, run/review agent sync, and format drift.
2. Patch replay exemption normalization and add traversal regression tests.
3. Bind `/audit/bundles` tenant scope to authenticated/resolved device context, not request headers.
4. Make auth-failure visibility explicit: platform tenant, tenant fan-out, or separate security-operator view.
5. Add trusted-proxy handling plus bounded or Redis-backed auth-failure throttle state.
6. Pin catalog verifier trust anchor outside the signed catalog artifact.
7. Wire or remove `failClosed` and `budget-store`; primitives should not count as remediation until production callers exist.

## Related Artifacts

- [post-roadmap-session-2026-05-30.md](./post-roadmap-session-2026-05-30.md) — untracked supporting audit draft present in the working tree
- [master-audit-2026-05-28.md](./master-audit-2026-05-28.md) — prior green baseline now superseded
- [external-dependencies-register-2026-05-28.md](./external-dependencies-register-2026-05-28.md) — external assurance dependency register
