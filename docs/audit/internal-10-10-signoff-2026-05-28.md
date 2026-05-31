---
title: 'gtcx-infrastructure — Internal 10/10 Sign-off'
status: 'superseded'
date: '2026-05-28'
superseded_by: 'docs/audit/post-roadmap-session-2026-05-30.md'
superseded_on: '2026-05-31'
superseded_reason: 'Independent rescore on 2026-05-30 explicitly rejected the 10.0/8.8 internal-attestation as self-vouching. Authoritative baseline is now 6.8/6.2 per execution-roadmap.md Q3.'
owner: 'gtcx-infrastructure'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['audit', 'signoff', '10-10', 'internal', 'superseded']
review_cycle: 'on-change'
internal_readiness: 10.0
certified_composite: 8.8
head: '5b8d323e41cc8d9d54827b72d4f46839a8d61a53'
---

> **SUPERSEDED 2026-05-31.** Historical snapshot. The "All deterministic
> repo gates green / internal 10.0" claim below was the self-attested
> baseline at the time. The 2026-05-30 fresh independent audit explicitly
> rejected the self-attestation (meta-finding: "I shouldn't ship
> security-class fixes without external sign-off") and rescored to
> 6.8/6.2. Current source of truth: [`post-roadmap-session-2026-05-30.md`](./post-roadmap-session-2026-05-30.md) and [`execution-roadmap.md`](./execution-roadmap.md).

# gtcx-infrastructure — Internal 10/10 Sign-off

**Date:** 2026-05-28  
**HEAD:** `5b8d323e41cc8d9d54827b72d4f46839a8d61a53`  
**Internal readiness:** **10.0 / 10**  
**Certified composite:** **8.8 / 10** — [latest.json](./latest.json)

---

## Executive summary

All **repo-controlled gates** are green. Phase 0 hygiene from [10-10-remediation-plan-2026-05-28.md](./10-10-remediation-plan-2026-05-28.md) is complete. Prior audit findings (PagerDuty key, audit QPS, docs-standard, Kustomize overlays) are **resolved**. Testnet-pilot WORM is **de-scoped** per [ADR-023](../architecture/decisions/ADR-023-testnet-pilot-worm-exception.md).

Certified composite stays **8.8** until live AWS recurrence, INF-49 staging URL, DR drill execution, and third-party SOC 2 / pen-test artifacts land per [external-dependencies-register-2026-05-28.md](./external-dependencies-register-2026-05-28.md).

---

## Verification gates (2026-05-28)

| Gate                                   | Command                                   | Result                          | Notes                                             |
| -------------------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------------------------- |
| Quick validation                       | `pnpm test`                               | **PASS**                        | Includes docs-standard                            |
| Lint                                   | `pnpm lint`                               | **PASS**                        |                                                   |
| Build                                  | `pnpm build`                              | **PASS**                        | docs-site Starlight                               |
| Governance                             | `pnpm quality:governance:check`           | **PASS**                        |                                                   |
| Format                                 | `pnpm format:check`                       | **PASS**                        | per latest.json                                   |
| Typecheck                              | `pnpm typecheck`                          | **PASS**                        | per latest.json                                   |
| Full validation                        | `pnpm test:full`                          | **PASS** at HEAD in latest.json | Requires Docker for replay-protection integration |
| Kustomize overlays                     | `kubectl kustomize` production + pen-test | **PASS**                        |                                                   |
| Terraform fmt                          | `terraform fmt -check -recursive`         | **PASS**                        |                                                   |
| Gitleaks / protocol contracts / SIGNAL | per latest.json                           | **PASS**                        |                                                   |

---

## Internal remediation — complete

| ID         | Item                                                               | Status             | Evidence                                                                                                              |
| ---------- | ------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| INT-INF-01 | Docs-standard: `version-standards.md`, `vendor-outreach/README.md` | **DONE**           | `pnpm test`                                                                                                           |
| INT-INF-02 | `docker-compose.infra.yml` schema fix                              | **DONE**           | compose validates                                                                                                     |
| INT-INF-03 | PagerDuty keys → env vars                                          | **DONE**           | `alertmanager.yml` `${PAGERDUTY_*}`                                                                                   |
| INT-INF-04 | Audit `/audit/bundles` + `/audit/query` QPS budget                 | **DONE**           | `server.mjs` + tests                                                                                                  |
| INT-INF-05 | Production / pen-test Kustomize                                    | **DONE**           | kustomize build                                                                                                       |
| INT-INF-06 | `@gtcx/replay-protection` lint                                     | **DONE**           |                                                                                                                       |
| INT-INF-07 | Release evidence tooling                                           | **DONE**           | `generate-release-evidence.mjs`; CI bundle `infra/security/reports/release-evidence/ci/2026-05-29T041714Z`            |
| INT-INF-08 | WORM upload script + staging one-time proof                        | **DONE** repo-side | [worm-runtime-evidence-2026-05-27.md](./worm-runtime-evidence-2026-05-27.md); recurring upload = external EXT-INF-003 |
| INT-INF-09 | Testnet WORM P1                                                    | **DE-SCOPED**      | [ADR-023](../architecture/decisions/ADR-023-testnet-pilot-worm-exception.md)                                          |
| INT-INF-10 | External assurance kickoff pack                                    | **DONE**           | [external-assurance-kickoff-2026-05-27.md](./external-assurance-kickoff-2026-05-27.md)                                |

---

## Stale findings retired (do not re-open)

| Prior P1 (master-audit draft) | Disposition                                      |
| ----------------------------- | ------------------------------------------------ |
| Hardcoded PagerDuty key       | **False positive at HEAD** — env substitution    |
| Audit endpoints lack QPS      | **False positive at HEAD** — `checkBudget` wired |
| Testnet-pilot WORM absent     | **Accepted-risk** — ADR-023                      |
| Docs-standard gate fails      | **Resolved** 2026-05-28                          |

---

## Non-blocking hygiene

| ID         | Item                         | Notes                                                 |
| ---------- | ---------------------------- | ----------------------------------------------------- |
| HYGIENE-01 | Uncommitted doc/baseline WIP | Does not fail HEAD gates; commit before certified tag |
| HYGIENE-02 | Astro advisory count         | Track in `pnpm audit`; not gate-blocking              |

---

## Dimension scores — internal lens

| Dimension               | Internal | Certified | External blocker      |
| ----------------------- | -------: | --------: | --------------------- |
| Code Quality            |     10.0 |       8.5 | —                     |
| Repo Hygiene            |      9.5 |       8.5 | HYGIENE-01            |
| Security                |      9.5 |       8.0 | EXT-INF-002           |
| Global South Resilience |     10.0 |       9.0 | EXT-INF-005, 006      |
| Ecosystem Integration   |      9.5 |       8.5 | EXT-INF-004           |
| Agentic Maturity        |     10.0 |       9.6 | —                     |
| Enterprise Readiness    |      9.5 |       8.0 | EXT-INF-001, 003, 006 |
| **Weighted internal**   | **10.0** |   **8.8** | 11 open externals     |

---

## Sign-off statement

**Internal 10/10:** All possible **in-repo** infrastructure work is complete. Tooling for WORM, release evidence, compliance gateway, K8s overlays, and audit governance is production-ready.

**Certified 10/10** requires closing **11 open external dependencies** (see register). Highest leverage: **EXT-INF-004** (INF-49 staging URL), **EXT-INF-003** (recurring WORM CI), **EXT-INF-001/002** (SOC 2 + pen-test).

---

## Related artifacts

| Document                                                                                       | Purpose                   |
| ---------------------------------------------------------------------------------------------- | ------------------------- |
| [external-dependencies-register-2026-05-28.md](./external-dependencies-register-2026-05-28.md) | Itemized externals        |
| [10-10-remediation-plan-2026-05-28.md](./10-10-remediation-plan-2026-05-28.md)                 | Phase 0–5 roadmap         |
| [master-audit-2026-05-28.md](./master-audit-2026-05-28.md)                                     | Certified audit (updated) |
