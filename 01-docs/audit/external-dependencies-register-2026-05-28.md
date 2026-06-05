---
title: 'gtcx-infrastructure — External Dependencies Register'
status: 'superseded'
date: '2026-05-28'
superseded_by: '01-docs/05-audit/external-dependencies-register-2026-05-31.md'
superseded_on: '2026-05-31'
superseded_reason: 'Scoring baseline corrected from 10.0/8.8 → 6.8/6.2 (post-roadmap-session-2026-05-30.md); 3 net-new external deps added (EXT-INF-013 ZWCMP owner, EXT-INF-014 DPA, EXT-INF-015 SLA).'
owner: 'gtcx-infrastructure'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['audit', 'external', 'dependencies', '10-10', 'superseded']
review_cycle: 'weekly'
internal_readiness: 10.0
certified_composite: 8.8
---

> **SUPERSEDED 2026-05-31.** Historical snapshot. Current source of truth:
> [`external-dependencies-register-2026-05-31.md`](./external-dependencies-register-2026-05-31.md).
> The 10.0/8.8 scores below were the internal-attestation baseline at the time;
> the 2026-05-30 audit cluster rescored to 6.8/6.2 with the 10.0 figure
> rejected per Q3 of [`execution-roadmap.md`](./execution-roadmap.md).
>
> **Scoring (v2):** External deps affect **XC** only, not **IR**. Retired: `certified composite` — [`SCORING.md`](./SCORING.md).

# gtcx-infrastructure — External Dependencies Register

> **Purpose:** Itemize every dependency **outside repo control** that blocks **certified composite 10.0/10**.  
> **Internal engineering readiness:** **10.0/10** — see [internal-10-10-signoff-2026-05-28.md](./internal-10-10-signoff-2026-05-28.md).  
> **Certified composite (honest):** **8.8/10** — [latest.json](./latest.json), [master-audit-2026-05-28.md](./master-audit-2026-05-28.md).

---

## Scoring model

| Metric                  |    Score | Meaning                                                                                                                              |
| ----------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Internal readiness**  | **10.0** | All deterministic repo gates green; internal remediation (PagerDuty env vars, audit QPS, docs-standard, Kustomize, ADR-023) complete |
| **Certified composite** |  **8.8** | Weighted audit score pending live AWS evidence recurrence + third-party attestation                                                  |

---

## Summary

| Category                           |  Count |   Open | Complete / de-scoped |
| ---------------------------------- | -----: | -----: | -------------------: |
| Third-party assurance              |      2 |      2 |                    0 |
| AWS / cloud credentials & live ops |      5 |      5 |                    0 |
| DNS / TLS / GTM procurement        |      1 |      1 |                    0 |
| Cross-repo ecosystem proof         |      2 |      2 |                    0 |
| Time-based / recurring automation  |      2 |      1 | 1 (ADR-023 de-scope) |
| **Total**                          | **12** | **11** |                **1** |

---

## Itemized register

| ID              | Dependency                                                                                                       | Type                | Owner                 | Blocker for                                   | Status                                                                                         | Target ETA            | Evidence when complete                                                                                       | Score impact    |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| **EXT-INF-001** | SOC 2 Type I — auditor engagement + report                                                                       | Third-party         | security-lead         | Enterprise ≥9.5                               | **open** — kickoff pack ready                                                                  | 8–14 weeks            | [soc2-engagement-2026.md](./soc2-engagement-2026.md) + signed letter                                         | Enterprise −0.9 |
| **EXT-INF-002** | Penetration test — SOW, execution, retest (gateway, replay, WORM, K8s)                                           | Third-party         | security-lead         | Security ≥9.5                                 | **open** — RFP/scope ready                                                                     | 6–10 weeks post-SoW   | Report + [external-finding-register-template.md](./external-finding-register-template.md) zero critical/high | Security −1.1   |
| **EXT-INF-003** | AWS credentials (OIDC or break-glass) — upload release evidence to staging WORM on every `main` merge            | AWS / ops           | infrastructure-lead   | Enterprise 10.0 recurring evidence            | **open** — script exists, not wired to CI recurrence                                           | S49–S50               | S3 Object Lock metadata per merge in `worm-runtime-evidence-*.md`                                            | Enterprise −0.6 |
| **EXT-INF-004** | **INF-49** — staging public URL + TLS for protocol DID HTTP resolution (`api.staging.gtcx.trade` or agreed host) | DNS / GTM           | platform-lead         | Ecosystem 10.0; unblocks gtcx-protocols S47-8 | **open**                                                                                       | S50                   | DNS + cert + `200` on `/health` documented in protocols sprint                                               | Ecosystem −0.4  |
| **EXT-INF-005** | Runtime smoke — bearer token + staging reachability for `capture-runtime-smoke-evidence.mjs`                     | AWS / ops           | SRE                   | Enterprise + protocols trust                  | **open** — runbook + CronJob manifest exist                                                    | S50                   | `runtime-smoke-evidence-*.json`                                                                              | Enterprise −0.4 |
| **EXT-INF-006** | DR fire drill — live exercise with witness (RTO/RPO measured)                                                    | Operational         | SRE                   | Enterprise + Sovereign                        | **open**                                                                                       | S51–S52               | [dr-fire-drill-exercise.md](../operations/runbooks/dr-fire-drill-exercise.md) completed report               | Enterprise −0.3 |
| **EXT-INF-007** | Staging ALB authenticated health proof (prior ALB 403 without token)                                             | AWS / ops           | SRE                   | EXT-2026-002 closure                          | **open**                                                                                       | 14d                   | Smoke JSON + register update                                                                                 | Enterprise −0.2 |
| **EXT-INF-008** | `pnpm test:full` replay-protection integration — requires **Docker daemon** in CI/agent host                     | Environment         | platform-lead         | Local/CI parity claim                         | **conditional** — passes when Docker up                                                        | Always-on CI runner   | Documented in signoff; not a vendor blocker                                                                  | —               |
| **EXT-INF-009** | Testnet-pilot dedicated WORM bucket in AWS                                                                       | AWS / policy        | infrastructure-lead   | Was P1; **de-scoped**                         | **de-scoped** per [ADR-023](../architecture/decisions/ADR-023-testnet-pilot-worm-exception.md) | N/A if policy holds   | Staging-prefixed keys + ADR link                                                                             | —               |
| **EXT-INF-010** | Vendor/legal signature on SOC2 + pen-test SOWs                                                                   | Legal / procurement | security-lead         | Phase 3 start                                 | **open**                                                                                       | S52                   | Files under `01-docs/05-audit/vendor-outreach/`                                                              | Composite −0.5  |
| **EXT-INF-011** | SOC 2 Type I **report received** (not kickoff alone)                                                             | Third-party         | compliance-lead       | Certified 10.0                                | **open**                                                                                       | Month 6 horizon       | Type I report PDF                                                                                            | Enterprise −0.5 |
| **EXT-INF-012** | Independent master re-audit — all dimensions ≥9.5, no caps                                                       | Third-party / QA    | quality-evidence-lead | Protocol 16 certification                     | **open**                                                                                       | Post EXT-INF-001..007 | `master-audit-*-certified.md`                                                                                | Composite −1.2  |

---

## Initial external finding register (carried forward)

| Finding ID   | Maps to                               | Severity                 | Status            |
| ------------ | ------------------------------------- | ------------------------ | ----------------- |
| EXT-2026-001 | EXT-INF-009                           | high → **accepted-risk** | De-scoped ADR-023 |
| EXT-2026-002 | EXT-INF-007                           | medium                   | triaged           |
| EXT-2026-003 | EXT-INF-001, EXT-INF-002, EXT-INF-010 | medium                   | in-progress       |

Source: [external-assurance-kickoff-2026-05-27.md](./external-assurance-kickoff-2026-05-27.md).

---

## Resolved internal items (not in register)

| Item                                                           | Resolution                                           | Evidence                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| PagerDuty hardcoded key                                        | Env var substitution                                 | `04-ship/docker/observability/alertmanager.yml` `${PAGERDUTY_*}`               |
| Audit endpoint QPS                                             | `checkBudget` on `/audit/bundles` and `/audit/query` | `03-platform/tools/compliance-gateway/03-platform/src/server.mjs`              |
| Docs-standard failures                                         | `version-standards.md`, `vendor-outreach/README.md`  | `pnpm test` pass 2026-05-28                                                    |
| Production Kustomize / docs-site / replay lint / Terraform fmt | Green at HEAD                                        | [internal-10-10-signoff-2026-05-28.md](./internal-10-10-signoff-2026-05-28.md) |

---

## Repo-side materials ready

| Track                            | Artifact                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| External assurance kickoff       | [external-assurance-kickoff-2026-05-27.md](./external-assurance-kickoff-2026-05-27.md) |
| WORM staging proof (one-time)    | [worm-runtime-evidence-2026-05-27.md](./worm-runtime-evidence-2026-05-27.md)           |
| Release evidence generator       | `03-platform/tools/control-plane/generate-release-evidence.mjs`                        |
| WORM upload wrapper              | `03-platform/tools/control-plane/upload-release-evidence-to-worm.mjs`                  |
| Pen-test RFP / scope / shortlist | `01-docs/05-audit/pen-test-*.md`                                                       |
| SOC2 evidence inventory          | `01-docs/10-compliance/soc2-evidence-inventory-2026-05.md`                             |

---

## Certified 10.0 exit checklist (external only)

- [ ] EXT-INF-001 + EXT-INF-011 closed
- [ ] EXT-INF-002 closed (retest clean)
- [ ] EXT-INF-003 recurring on every `main` merge
- [ ] EXT-INF-004 live (INF-49)
- [ ] EXT-INF-005 + EXT-INF-007 closed with JSON evidence
- [ ] EXT-INF-006 drill report filed
- [ ] EXT-INF-012 independent audit at composite 10.0

---

## Review log

| Date       | Action                                                               |
| ---------- | -------------------------------------------------------------------- |
| 2026-05-28 | Initial register; ADR-023 closes EXT-2026-001; internal 10.0 signoff |
