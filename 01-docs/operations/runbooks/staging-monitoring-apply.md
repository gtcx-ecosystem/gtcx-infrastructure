---
title: 'Staging monitoring apply (SIGNAL INF-008)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
---

# Staging monitoring apply

Deploy Prometheus + Grafana + Jaeger to staging and import the LLM ops dashboard.

## Prerequisites

- `kubectl` context: staging EKS
- Grafana admin secret `grafana-admin` in `gtcx-monitoring` (operator-created)

## Apply monitoring stack

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/monitoring/
kubectl -n gtcx-monitoring rollout status deployment/prometheus --timeout=120s
kubectl -n gtcx-monitoring rollout status deployment/grafana --timeout=120s
kubectl -n gtcx-monitoring rollout status deployment/jaeger --timeout=120s
```

## Apply compliance-gateway metrics patch

Included in staging overlay — re-apply staging workloads:

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/
kubectl -n gtcx-staging rollout status deployment/compliance-gateway-staging --timeout=120s
```

## Import LLM dashboard

```bash
# Port-forward Grafana
kubectl -n gtcx-monitoring port-forward svc/grafana 3000:3000

# Import 04-ship/monitoring/dashboards/llm-ops.json via UI or API
```

## Verify scrape

```bash
kubectl -n gtcx-monitoring port-forward svc/prometheus 9090:9090
# Open http://localhost:9090/targets — compliance-gateway pod should be UP
```

## Baseline cost-stats (monthly review)

From sibling `baseline-os` checkout:

```bash
baseline cost-stats --json > 01-docs/05-audit/evidence/baseline-cost-stats-latest.json
```

## Evidence

Write `01-docs/05-audit/evidence/signal-sprint2-monitoring-latest.json` after verify.
