# `04-ship/monitoring/`

Observability stack for GTCX Infrastructure.

## Components

| Component    | Purpose                         |
| ------------ | ------------------------------- |
| Prometheus   | Metrics collection and alerting |
| Alertmanager | Alert routing and suppression   |
| Grafana      | Dashboards and visualization    |
| Loki         | Log aggregation (planned)       |
| Jaeger       | Distributed tracing (planned)   |

## Alerts

Alert rules live in `alerts/`. Every alert must have a `runbook_url` annotation
linking to a runbook in `01-docs/04-ops/runbooks/alerts.md`.

## Dashboards

| Dashboard                    | File                                 | SIGNAL  |
| ---------------------------- | ------------------------------------ | ------- |
| LLM Ops (compliance-gateway) | `dashboards/llm-ops.json`            | INF-002 |
| GTCX SLO Overview            | `dashboards/gtcx-slo-dashboard.json` | —       |

## Agent note

Alert runbook anchors are validated by `03-platform/tools/03-platform/scripts/alert-anchors-check.mjs`.
Add new alerts via PR; validate with `node 03-platform/tools/03-platform/scripts/validate-all.mjs`.
