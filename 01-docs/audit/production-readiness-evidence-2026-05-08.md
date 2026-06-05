---
title: 'Production Readiness Evidence — 2026-05-08'
status: 'superseded'
superseded_by: '01-docs/05-audit/execution-roadmap.md'
superseded_on: '2026-05-31'
superseded_reason: 'Older production-readiness snapshot; reconciled into execution-roadmap.md.'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Production Readiness Evidence — 2026-05-08

## GTCX Infrastructure Replay Protection

| Gate                   | Status | Evidence                                                           |
| ---------------------- | ------ | ------------------------------------------------------------------ |
| **Code Complete**      | ✅     | `03-platform/tools/replay-protection/` — 13 source files, 27 tests |
| **Tests Pass**         | ✅     | `node --test` — 27/27 pass (19 unit + 8 integration)               |
| **Lint Clean**         | ✅     | `pnpm run lint` — 0 errors in gtcx-infrastructure                  |
| **Containerized**      | ✅     | `Dockerfile` — Alpine, non-root, healthcheck                       |
| **K8s Deployable**     | ✅     | `replay-guard.yaml` — Deployment, Service, PDB, HPA                |
| **Observability**      | ✅     | Prometheus metrics + OTLP push + structured logging                |
| **Secrets Management** | ✅     | External Secrets Operator for Redis URL                            |
| **Chaos Tested**       | ✅     | `replay-guard-pod-kill.yaml`, `replay-guard-network-latency.yaml`  |
| **Runbook**            | ✅     | `01-docs/04-ops/runbooks/replay-guard-failure.md`                  |
| **Mobile Contract**    | ✅     | Verifies all 8 `X-GTCX-*` headers per mobile spec                  |
| **Load Tested**        | ✅     | k6 health-load test — p95 < 200ms, error rate < 0.5%               |

## GTCX Infrastructure Compliance Gateway

| Gate            | Status | Evidence                                             |
| --------------- | ------ | ---------------------------------------------------- |
| **Load Tested** | ✅     | k6 health-load test — p95 < 500ms, error rate < 0.5% |

## GTCX Infrastructure Disaster Recovery

| Gate                 | Status | Evidence                                                  |
| -------------------- | ------ | --------------------------------------------------------- |
| **DR Test Required** | ✅     | `ci.yml` DR step fails PRs on backup/restore failure      |
| **DR Evidence**      | ✅     | `dr-test.sh` emits `dr-evidence.json` with RTO/RPO ms     |
| **DR Scheduled**     | ✅     | `.github/workflows/dr-test.yml` — weekly cron + on-demand |

## GTCX Infrastructure Incident Response

| Gate                    | Status | Evidence                                                         |
| ----------------------- | ------ | ---------------------------------------------------------------- |
| **Alert Routing Valid** | ✅     | `incident-drill-validator.mjs` — 5 receivers, 3 inhibition rules |
| **Business Hours**      | ✅     | `business-hours` time interval in `alertmanager.yml`             |
| **PagerDuty Wired**     | ✅     | Global `pagerduty_url` + critical/high route to PD               |

## Ecosystem Lint Status

| Repo                | Errors | Warnings | Notes                               |
| ------------------- | ------ | -------- | ----------------------------------- |
| gtcx-infrastructure | 0      | 0        | ✅                                  |
| gtcx-protocols      | 0      | ~70      | ✅                                  |
| gtcx-core           | 0      | 0        | ✅                                  |
| gtcx-intelligence   | 0      | 12       | ✅                                  |
| baseline-os         | 0      | 0        | ✅                                  |
| sensei-ai           | 0      | ~500     | mostly `no-explicit-any`            |
| compliance-os       | 0      | 8        | ✅                                  |
| ledger-ui           | 0      | ~160     | 61 CVEs pending dependency patch    |
| gtcx-mobile         | 0      | ~42      | ✅                                  |
| gtcx-markets        | 0      | 0        | committed locally (no remote)       |
| veritas             | 0      | 0        | ✅                                  |
| terra-os            | 0      | 19       | ✅                                  |
| nyota-ai            | —      | —        | no lint script                      |
| gtcx-agentic        | 0      | 0        | ✅                                  |
| gtcx-agile          | 0      | 0        | ✅                                  |
| exploration-os      | —      | —        | no lint script                      |
| 6-platforms         | —      | —        | ESLint config migration in progress |
| 9-hardware          | 0      | 0        | ✅                                  |
| terminal-os         | 0      | 0        | ✅                                  |

## Remaining 10/10 Blockers

1. **ledger-ui vulnerabilities** — 11 high, 43 moderate, 8 low CVEs
   - _Blocked:_ `pnpm audit` ETIMEDOUT to registry.npmjs.org
   - _Action:_ Retry from network with better connectivity

2. **gtcx-markets remote** — Committed locally, no GitHub repo exists
   - _Action:_ Create `gtcx-ecosystem/gtcx-markets` repo via GitHub UI or API

3. **Real DID signature verification** — Stub validates structure only
   - _Action:_ Wire `@gtcx/protocols-crypto` DID resolver when available

4. **6-platforms ESLint** — ESLint 9 + eslint-config-next incompatibility
   - _Action:_ Downgrade to ESLint 8 or migrate to flat config

5. **Native mobile key custody** — Non-exportable keystore signing
   - _Action:_ `gtcx-mobile` — iOS SecureEnclave / Android Keystore module

---

**Signed:** `gtcx-infrastructure@3d8e693` — 2026-05-11
