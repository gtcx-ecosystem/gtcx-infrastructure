---
title: 'SIGNAL Roadmap — gtcx-infrastructure'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
overall_signal: L2-low
target_signal: L4-low
phase: 1-sprint-3-done
---

# SIGNAL Roadmap

Canonical assessment: [`signal-assessment-2026-06-05.md`](./signal-assessment-2026-06-05.md)

## Sprint 1 progress (2026-06-05)

| Task                           | Status      | Evidence                                                                |
| ------------------------------ | ----------- | ----------------------------------------------------------------------- |
| SIGNAL-INF-007 trace pilot     | **partial** | `validate-trace-correlation.mjs` PASS; full OTel staging pending        |
| SIGNAL-INF-001 Human Lead      | **done**    | AGENTS.md @amanianai                                                    |
| SIGNAL-INF-011 agent:next-work | **done**    | `03-platform/scripts/lib/suggest-persona.mjs`, `agent-launch-focus.mjs` |
| SIGNAL-INF-006 taxonomy        | **done**    | `cross-repo-agent-log.md` columns                                       |
| SIGNAL-INF-012 topology        | **done**    | `01-docs/architecture/agent-topology-2026-q3.md`                        |
| SIGNAL-INF-003 PR checklist    | **done**    | `01-docs/04-ops/agent-pr-checklist.md`                                  |

## Sprint 2 progress (2026-06-05)

| Task                              | Status             | Evidence                                                             |
| --------------------------------- | ------------------ | -------------------------------------------------------------------- |
| SIGNAL-INF-002 LLM dashboard      | **done** (in-repo) | `04-ship/monitoring/dashboards/llm-ops.json`                         |
| SIGNAL-INF-008 staging monitoring | **partial**        | `overlays/staging/monitoring/` + runbook; cluster apply pending      |
| SIGNAL-INF-004 LangSmith/Helicone | **done** (shim)    | `03-platform/tools/compliance-gateway/03-platform/src/llm-trace.mjs` |
| SIGNAL-INF-007 OTel endpoint      | **partial**        | Jaeger OTLP env in metrics patch                                     |

**Next:** Operator `kubectl apply` per `staging-monitoring-apply.md`; live scrape verify; monthly cost-stats import.

**Sprint 1 recap:** INF-007 pilot, INF-001, INF-011, INF-006, INF-012, INF-003 — see above.

## Sprint 3 progress (2026-06-05)

| Task                                   | Status      | Evidence                                                                                  |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| SIGNAL-INF-014 prompt semver           | **done**    | `01-docs/05-audit/prompts/compliance-gateway@1.0.0/`; `prompt_version` on `query:success` |
| SIGNAL-INF-005 injection-suite CI      | **done**    | `.github/workflows/injection-suite-weekly.yml`; `run-injection-suite-witness.mjs`         |
| SIGNAL-INF-009 agent integration smoke | **done**    | `03-platform/tools/contract-tests/agent-integration.test.mjs`; CI job                     |
| SIGNAL-INF-008 staging apply           | **partial** | Manifests applied; pods pending (staging node CPU/memory)                                 |

**Overall SIGNAL after Sprint 3:** L2 mid/high (in-repo); L2 high in prod after staging monitoring apply + live scrape.
