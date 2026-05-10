# [Service Name] -- Metrics and Dashboards

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Document ID**: [SVC]-METRICS-001
**Version**: 1.0
**Date**: [Month Year]
**Status**: Active

---

## Key Performance Indicators (KPIs)

### Engineering KPIs

| Metric                 | Target                            | Measurement                           | Dashboard                  |
| ---------------------- | --------------------------------- | ------------------------------------- | -------------------------- |
| API Uptime             | 99.9%                             | Synthetic monitoring (1-min interval) | Grafana - SLA              |
| REST API p95 Latency   | < 200ms (reads), < 500ms (writes) | Prometheus histogram                  | Grafana - API Performance  |
| GraphQL p95 Latency    | < 300ms                           | Prometheus histogram                  | Grafana - API Performance  |
| Scoring Engine Latency | < 500ms per facility              | Custom metric                         | Grafana - Scoring Pipeline |
| Error Rate             | < 0.1%                            | 5xx count / total requests            | Grafana - Error Budget     |
| Deployment Frequency   | 2+ per week                       | CI/CD pipeline metrics                | Grafana - DORA             |
| Change Failure Rate    | < 5%                              | Rollback count / deploy count         | Grafana - DORA             |
| Mean Time to Recovery  | < 30 minutes                      | Incident duration                     | PagerDuty                  |

### Product KPIs

| Metric                         | Target ([Quarter Year]) | Measurement                               | Dashboard          |
| ------------------------------ | ----------------------- | ----------------------------------------- | ------------------ |
| Active Organizations           | [target]                | Distinct org_id with API calls in 30 days | Grafana - Business |
| [Core Action] Created/Month    | [target]                | Count of [event].started events           | Grafana - Business |
| [Key Entity] Issued            | [target]                | Count of [entity].issued events           | Grafana - Business |
| [Key Entity] Verifications/Day | [target]                | Count of /v1/verify/\* requests           | Grafana - Business |
| API Consumers                  | [target]                | Distinct API keys with traffic            | Grafana - Business |
| Webhook Delivery Success       | 99.5%                   | Successful deliveries / total             | Grafana - Webhooks |
| GraphQL Adoption               | [target]%               | GraphQL requests / total requests         | Grafana - API Mix  |

### [Domain-Specific] Quality KPIs

| Metric                      | Target                   | Measurement                                       |
| --------------------------- | ------------------------ | ------------------------------------------------- |
| [Engine] Determinism        | 100%                     | Same input produces same output (regression test) |
| Score Variance (test suite) | 0.0                      | Standard deviation across 100 runs of same input  |
| [Profile] Coverage          | [target] active profiles | Count of loaded profiles                          |
| [Analysis] Accuracy         | Manual audit validation  | Quarterly human review                            |

---

## Grafana Dashboard Catalog

### 1. API Performance Dashboard

**Panels**:

- Request rate (req/s) by endpoint -- time series
- p50 / p95 / p99 latency by endpoint -- time series
- Error rate (4xx, 5xx) -- time series
- Active connections (HTTP + WebSocket) -- gauge
- Response size distribution -- histogram

### 2. Scoring Pipeline Dashboard

**Panels**:

- Scoring requests per minute -- time series
- Scoring latency (p50/p95/p99) -- time series
- Scoring by requirements profile -- pie chart
- Upstream service latency ([Service A], [Service B], [Service C]) -- time series
- Circuit breaker state per service -- status panel

### 3. Credential Lifecycle Dashboard

**Panels**:

- Credentials issued per day -- bar chart
- Active vs. expired vs. revoked credentials -- stacked area
- Verification requests per day -- time series
- QR code scans per day -- time series
- Credential expiry timeline (next 30 days) -- table

### 4. Webhook Delivery Dashboard

**Panels**:

- Webhook deliveries per hour -- time series
- Delivery success rate -- gauge
- Failed deliveries by error type -- pie chart
- Retry queue depth -- time series
- Average delivery latency -- time series

### 5. Business Metrics Dashboard

**Panels**:

- Active organizations (30-day rolling) -- single stat
- Assessments created per week -- bar chart
- Evidence uploads per week -- bar chart
- API consumer growth -- time series
- Revenue by tier -- stacked bar chart

---

## Alerting Rules

| Alert                    | Condition                                | Severity | Channel       |
| ------------------------ | ---------------------------------------- | -------- | ------------- |
| High Error Rate          | 5xx rate > 1% for 5 minutes              | Critical | PagerDuty     |
| Scoring Latency          | p95 > 2s for 5 minutes                   | Warning  | Slack         |
| API Latency              | p95 > 1s for 10 minutes                  | Warning  | Slack         |
| Circuit Breaker Open     | Any service breaker open > 2 minutes     | Warning  | PagerDuty     |
| Database Connection Pool | Available connections < 2 for 3 minutes  | Critical | PagerDuty     |
| Redis Connection Lost    | Redis unreachable for 1 minute           | Critical | PagerDuty     |
| NATS Consumer Lag        | Unprocessed messages > 500 for 5 minutes | Warning  | Slack         |
| Webhook DLQ Depth        | DLQ > 100 messages                       | Warning  | Slack         |
| Disk Space               | Pod disk > 80%                           | Warning  | Slack         |
| Certificate Expiry       | TLS cert expires in < 14 days            | Warning  | Email + Slack |

---

## Prometheus Metrics Catalog

### Custom Application Metrics

```
# Scoring
[svc]_scoring_duration_seconds{profile, tier}       -- histogram
[svc]_scoring_total{profile, tier, result}           -- counter
[svc]_scoring_upstream_duration_seconds{service}     -- histogram

# Assessments
[svc]_assessments_created_total{type, tier}          -- counter
[svc]_assessments_submitted_total{type, tier}        -- counter
[svc]_assessments_scored_total{result}               -- counter

# Credentials
[svc]_credentials_issued_total{type, tier}           -- counter
[svc]_credentials_verified_total{status}             -- counter
[svc]_credentials_revoked_total                      -- counter

# Webhooks
[svc]_webhook_deliveries_total{event, status}        -- counter
[svc]_webhook_delivery_duration_seconds{event}       -- histogram
[svc]_webhook_retry_queue_depth                      -- gauge

# Circuit Breakers
[svc]_circuit_breaker_state{service}                 -- gauge (0=closed, 1=open, 2=half-open)
[svc]_circuit_breaker_failures_total{service}        -- counter

# WebSocket
[svc]_websocket_connections_active                   -- gauge
[svc]_websocket_messages_sent_total{channel}         -- counter
```

---

## SLA Reporting

Monthly SLA reports are generated automatically and include:

- Uptime percentage (target: 99.9%)
- Total downtime minutes
- Incident count by severity
- p95 latency trends
- Error budget consumption
- Scoring determinism validation results

Reports are delivered to the Platform Operations team and shared with enterprise customers per contractual obligations.

---

**Document Status**: Active
**Review Cycle**: Monthly
**Owner**: [Service] SRE Team
