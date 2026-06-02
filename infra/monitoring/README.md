---
title: 'Observability Stack'
status: current
date: '2026-06-02'
owner: devops
tags: ['monitoring', 'alerts', 'dashboards', 'prometheus', 'grafana']
---

# Observability Stack

This directory contains alerts, dashboards, and recording rules for the GTCX platform.

## Structure

| Path          | Purpose                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| `alerts/`     | Prometheus Alertmanager rule groups: SLO breaches, error-budget exhaustion, security events |
| `dashboards/` | Grafana dashboard JSON models: compliance gateway, protocols, infrastructure health         |
| `rules/`      | Prometheus recording rules: pre-aggregated latency percentiles, QPS by tenant               |

## Alert Tiers

| Severity   | Response                     | Example                                      |
| ---------- | ---------------------------- | -------------------------------------------- |
| `critical` | Page on-call immediately     | Audit sink down > 2 min, HSM signing failure |
| `high`     | Slack + ticket within 15 min | Compliance gateway 5xx rate > 1%             |
| `warning`  | Daily digest                 | Elevated replay-protection rejections        |

## Runbook Anchors

Every alert includes a `runbook_url` annotation pointing to `docs/operations/runbooks/`. The `alert-runbook-anchors-check` gate in `validate-all.mjs` verifies that all anchors resolve.

## Local Development

```bash
docker compose -f infra/docker/docker-compose.infra.yml up -d
# Grafana available at http://localhost:3000 (admin/admin)
```
