---
title: 'Anomaly Detection Architecture — GTCX Compliance Gateway'
status: 'draft'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'backend']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Anomaly Detection Architecture — GTCX Compliance Gateway

## Purpose

Detect unusual query patterns, tool usage spikes, and auth anomalies in the compliance gateway before they become security incidents. Integrates with the SIGNAL scorecard (S3: Real-time anomaly detection).

## Scope

- Compliance gateway query stream (`03-platform/tools/compliance-gateway/03-platform/src/server.mjs`)
- Replay guard verification stream (`03-platform/tools/replay-protection/03-platform/src/server.mjs`)
- Audit event stream (`04-ship/03-platform/scripts/test-audit-immutability.sh`)

Out of scope: Protocol-level anomalies (handled by `gtcx-protocols`).

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Compliance     │────▶│  Metrics        │────▶│  Prometheus     │
│  Gateway        │     │  (counters)     │     │  (time-series)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│  Replay Guard   │────▶│  Metrics        │──────────────┘
└─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  Anomaly        │
                                              │  Detector       │
                                              │  (new service)  │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  PagerDuty      │
                                              │  + Slack        │
                                              └─────────────────┘
```

## Detection Rules

| Rule                           | Threshold               | Window  | Action        |
| ------------------------------ | ----------------------- | ------- | ------------- |
| Query rate spike               | >10× baseline           | 5 min   | Alert         |
| Mutating tool without approval | any occurrence          | instant | Block + Alert |
| Replay rejection rate          | >5% of traffic          | 1 min   | Alert         |
| Unknown DID frequency          | >3 new DIDs/min         | 1 min   | Alert         |
| Off-hours admin access         | outside 06:00–22:00 CAT | instant | Alert         |

## Implementation Plan

### Phase 1: Metrics Exposure (Week 1)

- Add Prometheus counters to compliance gateway for query types, auth outcomes, tool usage
- Add counters to replay guard for verification outcomes
- Export via `/metrics` endpoint (already exists on replay guard)

### Phase 2: Detector Service (Week 2–3)

- Node.js service polling Prometheus metrics
- Stateful windowing with sliding time buckets
- Configurable thresholds via environment variables

### Phase 3: Alerting Integration (Week 4)

- PagerDuty webhook on anomaly trigger
- Slack notification for non-critical anomalies
- Audit event for every triggered rule

### Phase 4: CI Gate (Week 5)

- Anomaly detector health check in CI
- Threshold calibration from production traffic baseline

## Acceptance Criteria

- [ ] `curl http://localhost:9090/metrics | grep gtcx_query_total` returns non-zero
- [ ] Detector triggers on synthetic anomaly within 30 seconds
- [ ] Zero false positives in 7-day observation period
- [ ] All alerts have traceable audit event IDs

## Risks

| Risk                                     | Mitigation                                          |
| ---------------------------------------- | --------------------------------------------------- |
| High false-positive rate                 | Start with high thresholds; calibrate from baseline |
| Metrics cardinality explosion            | Limit label values; aggregate by tool category      |
| Detector becomes single point of failure | Run 2 replicas; degrade gracefully on failure       |
