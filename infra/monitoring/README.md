# `infra/monitoring/`

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

Alert rules live in `prometheus-rules/`. Every alert must have a `runbook_url`
annotation linking to a runbook in `docs/operations/runbooks/`.

## Agent note

Alert runbook anchors are validated by `tools/scripts/alert-anchors-check.mjs`.
Add new alerts via PR; validate with `node tools/scripts/validate-all.mjs`.
